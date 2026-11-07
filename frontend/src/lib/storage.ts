import { supabase } from './supabase'

// Les anciens fichiers sont dans ce "bucket" de Supabase ; les nouveaux sont sur notre serveur
const BUCKET = 'product-images'
const MAX_VIDEO = 40 * 1024 * 1024 // limite de notre serveur de fichiers
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000'

// Réduit l'image avant l'envoi : plus rapide et moins de données pour tout le monde.
async function compressImage(file: File, maxSize: number, quality: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff' // fond blanc pour les PNG transparents
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Compression impossible'))), 'image/jpeg', quality),
  )
}

// Vérifie une image et la réduit (JPEG)
async function prepareImage(file: File, maxSize: number, quality: number): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error(`"${file.name}" n'est pas une image`)
  if (file.size > 15 * 1024 * 1024) throw new Error(`"${file.name}" est trop lourde (15 Mo maximum)`)
  return compressImage(file, maxSize, quality)
}

// ---------- Envoi vers NOTRE serveur (disque d'Alwaysdata) ----------

async function serverRequest(path: string, init: RequestInit): Promise<Response> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Session expirée : reconnectez-vous')
  try {
    return await fetch(`${API_URL}${path}`, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` } })
  } catch {
    throw new Error('Le serveur de fichiers est injoignable. Vérifiez la connexion et réessayez.')
  }
}

async function uploadToServer(folder: 'adverts' | 'products', body: Blob, contentType: string): Promise<string> {
  const res = await serverRequest(`/api/media/${folder}`, { method: 'POST', headers: { 'Content-Type': contentType }, body })
  const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
  if (!res.ok || !json.url) throw new Error(json.error ?? `Envoi impossible (erreur ${res.status})`)
  return json.url
}

// Image de publicité pour le carrousel plein écran (2000 px max)
export async function uploadAdvertImage(file: File): Promise<string> {
  const blob = await prepareImage(file, 2000, 0.85)
  return uploadToServer('adverts', blob, 'image/jpeg')
}

// Vidéo de publicité (MP4 ou WebM), envoyée telle quelle
export async function uploadAdvertVideo(file: File): Promise<string> {
  if (!file.type.startsWith('video/')) throw new Error(`"${file.name}" n'est pas une vidéo`)
  if (file.size > MAX_VIDEO) throw new Error(`"${file.name}" dépasse 40 Mo : compressez la vidéo avant de l'envoyer`)
  return uploadToServer('adverts', file, file.type)
}

// Photo de produit (1200 px max), envoyée sur notre serveur comme les publicités
export async function uploadProductImage(_productId: string, file: File): Promise<string> {
  const blob = await prepareImage(file, 1200, 0.82)
  return uploadToServer('products', blob, 'image/jpeg')
}

// Extrait une image de la vidéo (utilisée comme couverture pendant le chargement)
export function captureVideoFrame(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    const finish = (fn: () => void) => {
      URL.revokeObjectURL(url)
      fn()
    }
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.onloadeddata = () => {
      video.currentTime = Math.min(0.5, (video.duration || 1) / 2)
    }
    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')!.drawImage(video, 0, 0)
      canvas.toBlob(
        (b) => finish(() => (b ? resolve(new File([b], 'couverture.jpg', { type: 'image/jpeg' })) : reject(new Error('Image de la vidéo impossible')))),
        'image/jpeg',
        0.85,
      )
    }
    video.onerror = () => finish(() => reject(new Error('Lecture de la vidéo impossible : essayez un fichier MP4 ou WebM')))
    video.src = url
  })
}

// Supprime un fichier à partir de son adresse publique.
// Les anciens fichiers sont chez Supabase, les nouveaux sur notre serveur : on reconnaît les deux.
export async function deleteProductImageFile(url: string): Promise<void> {
  const supabasePath = url.split(`/${BUCKET}/`)[1]
  if (supabasePath) {
    await supabase.storage.from(BUCKET).remove([supabasePath])
    return
  }
  const own = url.match(/\/media\/(adverts|products)\/([^/?#]+)$/)
  if (own) {
    // Si la suppression échoue, le fichier reste en place : sans gravité, on ne bloque pas l'utilisateur
    await serverRequest(`/api/media/${own[1]}/${own[2]}`, { method: 'DELETE' }).catch(() => undefined)
  }
}