// Types TypeScript qui reflètent les tables Supabase (version simplifiée).
// Plus tard on pourra les générer automatiquement avec la CLI Supabase.

export interface Category {
  id: string
  name: string
  slug: string
}

export interface Product {
  id: string
  category_id: string | null
  name: string
  slug: string
  description: string | null
  price: number // en CDF
  unit: string
  stock_quantity: number
  low_stock_alert: number
  is_organic: boolean
  is_featured: boolean
  is_active: boolean
  created_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  position: number
}

export interface Advert {
  id: string
  kind: 'carousel' | 'promo'
  title: string
  subtitle: string | null
  image_url: string
  link: string | null
  position: number
  is_active: boolean
}

export interface AppSettings {
  usd_rate: number // 1 USD = usd_rate CDF
  rate_updated_at: string
}
