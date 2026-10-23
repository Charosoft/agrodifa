import type { ProductWithImages } from '../types/database'

// Requête standard : un produit avec ses photos et sa catégorie
export const PRODUCT_SELECT = '*, product_images(id, url, position), categories(name)'

export function sortedImages(p: ProductWithImages) {
  return [...p.product_images].sort((a, b) => a.position - b.position)
}

export function mainImage(p: ProductWithImages): string | null {
  return sortedImages(p)[0]?.url ?? null
}