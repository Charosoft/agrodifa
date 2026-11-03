import { supabase } from './supabase'

const BUCKET = 'product-images'
const MAX_VIDEO = 40 * 1024 * 1024 // l'offre gratuite de Supabase accepte environ 50 Mo par fichier

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

// Vérifie, compresse et envoie une image ; renvoie son adresse publique.
async function uploadImage(path: string, file: File, maxSize: number, quality: number): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error(`"${file.name}" n'est pas une image`)
  if (file.size > 15 * 1024 * 1024) throw new Error(`"${file.name}" est trop lourde (15 Mo maximum)`)

  const blob = await compressImage(file, maxSize, quality)
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' })
  if (error) throw new Error(error.message)

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

// Photo d'un produit (1200 px max)
export function uploadProductImage(productId: string, file: File): Promise<string> {
  return uploadImage(`products/${productId}/${crypto.randomUUID()}.jpg`, file, 1200, 0.82)
}

// Image de publicité pour le carrousel plein écran (2000 px max)
export function uploadAdvertImage(file: File): Promise<string> {
  return uploadImage(`adverts/${crypto.randomUUID()}.jpg`, file, 2000, 0.85)
}

// Vidéo de publicité (MP4 ou WebM), envoyée telle quelle
export async function uploadAdvertVideo(file: File): Promise<string> {
  if (!file.type.startsWith('video/')) throw new Error(`"${file.name}" n'est pas une vidéo`)
  if (file.size > MAX_VIDEO) throw new Error(`"${file.name}" dépasse 40 Mo : compressez la vidéo avant de l'envoyer`)

  const ext = file.type === 'video/webm' ? 'webm' : 'mp4'
  const path = `adverts/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type })
  if (error) throw new Error(error.message)

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
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

// Supprime un fichier du stockage à partir de son adresse publique (produits ou publicités).
export async function deleteProductImageFile(url: string): Promise<void> {
  const path = url.split(`/${BUCKET}/`)[1]
  if (path) await supabase.storage.from(BUCKET).remove([path])
}