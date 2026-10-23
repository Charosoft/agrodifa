import { useEffect, useState, type ReactNode } from 'react'
import { mainImage } from '../lib/products'
import { CartContext, type CartContextValue, type CartItem } from './cart-context'

const KEY = 'agrodifa_cart'

export default function CartProvider({ children }: { children: ReactNode }) {
  // Le panier est relu depuis le navigateur au chargement : il survit à un rechargement de la page.
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? '[]') as CartItem[]
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items))
  }, [items])

  const value: CartContextValue = {
    items,
    count: items.reduce((n, i) => n + i.quantity, 0),
    total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),

    add: (product, quantity = 1) =>
      setItems((list) => {
        const found = list.find((i) => i.productId === product.id)
        if (found) {
          const next = Math.min(found.quantity + quantity, product.stock_quantity)
          return list.map((i) => (i.productId === product.id ? { ...i, quantity: next, max: product.stock_quantity, price: product.price } : i))
        }
        return [
          ...list,
          {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            unit: product.unit,
            price: product.price,
            image: mainImage(product),
            quantity: Math.min(quantity, product.stock_quantity),
            max: product.stock_quantity,
          },
        ]
      }),

    setQuantity: (productId, quantity) =>
      setItems((list) =>
        list.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.max)) } : i)),
      ),

    remove: (productId) => setItems((list) => list.filter((i) => i.productId !== productId)),
    clear: () => setItems([]),
    sync: (fresh) =>  setItems((list) => list.flatMap((i) => {
          const p = fresh.find((f) => f.id === i.productId)
          if (!p || !p.is_active || p.stock_quantity <= 0) return [] // produit retiré ou en rupture
          return [{ ...i, name: p.name, price: p.price, max: p.stock_quantity, quantity: Math.min(i.quantity, p.stock_quantity) }]
        }),
      ),
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}