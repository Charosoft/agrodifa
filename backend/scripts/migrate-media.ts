// Copie les anciens fichiers (photos et vidéos stockées chez Supabase) vers le disque d'Alwaysdata,
// vérifie que chaque copie est bien en ligne, PUIS seulement met à jour l'adresse en base.
// Les originaux chez Supabase ne sont JAMAIS supprimés par ce script.
//
//   Simulation (ne change rien) :
//     MEDIA_PUBLIC_URL=https://agrodifa.com/media npx tsx scripts/migrate-media.ts
//   Pour de vrai :
//     MEDIA_PUBLIC_URL=https://agrodifa.com/media npx tsx scripts/migrate-media.ts --apply

import { execFile } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { env } from '../src/config/env'
import { supabaseAdmin } from '../src/config/supabase'

const run = promisify(execFile)
const APPLY = process.argv.includes('--apply')

// Destination des fichiers : « utilisateur@serveur:dossier » (chemin relatif à ton dossier personnel sur Alwaysdata)
const TARGET = process.env.MEDIA_SSH_TARGET ?? 'agrodifa@ssh-agrodifa.alwaysdata.net:media'
const NEW_BASE = env.mediaPublicUrl
const SUPABASE_MARKER = '/storage/v1/object/public/product-images/'

if (!process.env.MEDIA_PUBLIC_URL) {
  console.error("❌ Indique l'adresse publique : MEDIA_PUBLIC_URL=https://agrodifa.com/media npx tsx scripts/migrate-media.ts")
  process.exit(1)
}

// Colonnes qui contiennent l'adresse d'un fichier, et dossier de destination
const TARGETS = [
  { table: 'adverts', column: 'image_url', folder: 'adverts' },
  { table: 'adverts', column: 'video_url', folder: 'adverts' },
  { table: 'product_images', column: 'url', folder: 'products' },
] as const

// Type réel du fichier d'après ses premiers octets
function detectExt(buf: Buffer): 'jpg' | 'mp4' | 'webm' | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg'
  if (buf.length > 12 && buf.toString('latin1', 4, 8) === 'ftyp') return 'mp4'
  if (buf.length > 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return 'webm'
  return null
}

const mo = (n: number) => `${(n / 1024 / 1024).toFixed(2)} Mo`

async function migrateOne(table: string, column: string, folder: string, id: string, oldUrl: string): Promise<'ok' | 'erreur'> {
  const label = `${table}.${column} ${id.slice(0, 8)}`
  try {
    // 1. Télécharger l'original chez Supabase
    const res = await fetch(oldUrl)
    if (!res.ok) throw new Error(`téléchargement impossible (${res.status})`)
    const data = Buffer.from(await res.arrayBuffer())
    const ext = detectExt(data)
    if (!ext) throw new Error('format inconnu (ni JPEG, ni MP4, ni WebM)')
    const name = `${randomUUID()}.${ext}`

    if (!APPLY) {
      console.log(`   à copier : ${label} (${mo(data.length)}) -> ${folder}/${name}`)
      return 'ok'
    }

    // 2. Envoyer sur Alwaysdata
    const temp = path.join(tmpdir(), name)
    await writeFile(temp, data)
    try {
      await run('scp', ['-q', temp, `${TARGET}/${folder}/${name}`])
    } finally {
      await unlink(temp).catch(() => undefined)
    }

    // 3. Vérifier que la copie est bien en ligne, avec la bonne taille
    const newUrl = `${NEW_BASE}/${folder}/${name}`
    const check = await fetch(newUrl, { method: 'HEAD' })
    if (!check.ok) throw new Error(`copie introuvable en ligne (${check.status}) : ${newUrl}`)
    const size = Number(check.headers.get('content-length') ?? data.length)
    if (size !== data.length) throw new Error(`taille différente (${size} au lieu de ${data.length})`)

    // 4. Seulement maintenant, changer l'adresse en base (si la ligne n'a pas bougé entre-temps)
    const { error } = await supabaseAdmin.from(table).update({ [column]: newUrl }).eq('id', id).eq(column, oldUrl)
    if (error) throw new Error(`mise à jour de la base refusée : ${error.message}`)

    console.log(`   ✅ ${label} (${mo(data.length)}) -> ${newUrl}`)
    return 'ok'
  } catch (err) {
    console.log(`   ❌ ${label} : ${(err as Error).message}`)
    return 'erreur'
  }
}

async function main() {
  console.log(APPLY ? '▶ COPIE RÉELLE' : '▶ SIMULATION (rien n\'est modifié ; ajoute --apply pour copier)')
  console.log(`  Destination : ${TARGET}   |   Adresse publique : ${NEW_BASE}\n`)

  let ok = 0
  let bad = 0
  let skipped = 0

  for (const { table, column, folder } of TARGETS) {
    const { data, error } = await supabaseAdmin.from(table).select(`id, ${column}`)
    if (error) {
      console.log(`❌ Lecture de ${table} impossible : ${error.message}`)
      bad++
      continue
    }
    const rows = ((data ?? []) as unknown as Record<string, string | null>[]).filter((r) => r[column])
    const old = rows.filter((r) => String(r[column]).includes(SUPABASE_MARKER))
    skipped += rows.length - old.length
    console.log(`${table}.${column} : ${old.length} ancien(s) fichier(s) à reprendre, ${rows.length - old.length} déjà sur le nouveau serveur`)

    for (const row of old) {
      const result = await migrateOne(table, column, folder, row.id as string, String(row[column]))
      if (result === 'ok') ok++
      else bad++
    }
  }

  console.log(`\nTerminé : ${ok} ${APPLY ? 'copié(s)' : 'à copier'}, ${bad} erreur(s), ${skipped} déjà à jour.`)
  if (APPLY) console.log('Les originaux chez Supabase n\'ont PAS été supprimés : vérifie le site, puis nettoie à la main si tu veux libérer de la place.')
  if (bad > 0) process.exit(2)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})