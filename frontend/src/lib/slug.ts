// "Poulet Fermier Bio" -> "poulet-fermier-bio"
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Ajoute 4 caractères aléatoires pour que deux produits du même nom n'aient pas le même slug
export function makeUniqueSlug(text: string): string {
  return `${slugify(text) || 'produit'}-${Math.random().toString(36).slice(2, 6)}`
}