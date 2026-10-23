import { createContext } from 'react'
import type { ProductWithImages } from '../types/database'

export interface CartItem {
  productId: string
  slug: string
  name: string
  unit: string
  price: number // en CDF, pour l'affichage seulement (le serveur recalcule au moment de la commande)
  image: string | null
  quantity: number
  max: number // stock disponible au moment de l'ajout
}

export interface FreshProduct {
  id: string
  name: string
  price: number
  stock_quantity: number
  is_active: boolean
}

export interface CartContextValue {
  items: CartItem[]
  count: number // nombre total d'articles
  total: number // total en CDF
  add: (product: ProductWithImages, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  remove: (productId: string) => void
  clear: () => void
    // Met le panier à jour avec les vrais prix et stocks de la base (retire ce qui n'est plus disponible)
  sync: (fresh: FreshProduct[]) => void
}

export const CartContext = createContext<CartContextValue | null>(null)