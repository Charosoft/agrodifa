import { useContext } from 'react'
import { CartContext } from '../context/cart-context'

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart doit être utilisé à l\'intérieur de <CartProvider>')
  return ctx
}