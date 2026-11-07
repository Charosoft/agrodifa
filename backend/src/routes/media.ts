import { randomUUID } from 'node:crypto'
import { mkdir, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import express, { Router, type RequestHandler } from 'express'
import { env } from '../config/env'
import { requireModule } from '../middleware/auth'
import { HttpError } from '../middleware/errors'

export const mediaRouter = Router()

// Dossiers autorisés, et module nécessaire pour y envoyer ou supprimer des fichiers
const FOLDERS = { adverts: 'advertising', products: 'stock' } as const
type Folder = keyof typeof FOLDERS

const MAX_IMAGE = 8 * 1024 * 1024 // le site réduit déjà les images : 8 Mo est très large
const MAX_VIDEO = 40 * 1024 * 1024

// Nom d'un fichier créé par nous : identifiant aléatoire + extension. Rien d'autre n'est accepté.
const FILE_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|mp4|webm)$/

// Reconnaît le vrai type du fichier d'après ses premiers octets.
// Le "Content-Type" envoyé par le navigateur peut mentir, pas le contenu.
function detectType(buf: Buffer): { ext: 'jpg' | 'mp4' | 'webm'; kind: 'image' | 'video' } | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: 'jpg', kind: 'image' }
  if (buf.length > 12 && buf.toString('latin1', 4, 8) === 'ftyp') return { ext: 'mp4', kind: 'video' }
  if (buf.length > 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return { ext: 'webm', kind: 'video' }
  return null
}

function folderOf(value: string): Folder {
  if (!(value in FOLDERS)) throw new HttpError(404, 'Dossier inconnu')
  return value as Folder
}

// Contrôle d'accès AVANT de lire le fichier : un inconnu ne peut pas nous faire télécharger 40 Mo
const guard: RequestHandler = (req, res, next) => {
  try {
    requireModule(FOLDERS[folderOf(String(req.params.folder))])(req, res, next)
  } catch (err) {
    next(err)
  }
}

const readBody = express.raw({ type: () => true, limit: MAX_VIDEO })
const parseBody: RequestHandler = (req, res, next) => {
  readBody(req, res, (err?: unknown) => {
    if (!err) return next()
    if ((err as { type?: string }).type === 'entity.too.large') return next(new HttpError(413, 'Fichier trop lourd (40 Mo maximum)'))
    next(err)
  })
}

// POST /api/media/adverts : envoie une image (JPEG) ou une vidéo (MP4, WebM) ; renvoie son adresse publique
mediaRouter.post('/:folder', guard, parseBody, async (req, res) => {
  const folder = folderOf(String(req.params.folder))
  const body: unknown = req.body
  if (!Buffer.isBuffer(body) || body.length === 0) throw new HttpError(400, 'Aucun fichier reçu')

  const type = detectType(body)
  if (!type) throw new HttpError(400, 'Format non accepté : JPEG, MP4 ou WebM seulement')
  if (type.kind === 'image' && body.length > MAX_IMAGE) throw new HttpError(413, 'Image trop lourde (8 Mo maximum)')

  const name = `${randomUUID()}.${type.ext}`
  const dir = path.join(env.MEDIA_DIR, folder)
  await mkdir(dir, { recursive: true })

  // On écrit d'abord sous un nom provisoire, puis on renomme : jamais de fichier à moitié écrit en ligne
  const temp = path.join(dir, `.${name}.tmp`)
  await writeFile(temp, body)
  await rename(temp, path.join(dir, name))

  res.status(201).json({ url: `${env.mediaPublicUrl}/${folder}/${name}` })
})

// DELETE /api/media/adverts/<nom-du-fichier>
mediaRouter.delete('/:folder/:file', guard, async (req, res) => {
  const folder = folderOf(String(req.params.folder))
  const file = String(req.params.file)
  if (!FILE_NAME.test(file)) throw new HttpError(400, 'Nom de fichier invalide')

  try {
    await unlink(path.join(env.MEDIA_DIR, folder, file))
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err // déjà absent : tant mieux
  }
  res.json({ ok: true })
})