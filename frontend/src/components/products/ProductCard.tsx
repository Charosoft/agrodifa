import { useState } from 'react'
import { Link } from 'react-router-dom'
import PriceTag from '../ui/PriceTag'
import { useCart } from '../../hooks/useCart'
import { mainImage } from '../../lib/products'
import type { ProductWithImages } from '../../types/database'

interface Props {
  product: ProductWithImages
  rate: number // taux CDF/USD, chargé une seule fois par la page
}

export default function ProductCard({ product, rate }: Props) {
  const { add } = useCart()
  const [added, setAdded] = useState(false)
  const img = mainImage(product)
  const soldOut = product.stock_quantity <= 0

  function handleAdd() {
    add(product, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-md">
      <Link to={`/produits/${product.slug}`} className="relative block aspect-square bg-slate-100">
        {img ? (
          <img src={img} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">Pas de photo</div>
        )}
        {product.is_organic && (
          <span className="absolute left-2 top-2 rounded-full bg-leaf-600 px-2 py-0.5 text-xs font-bold text-white">Bio</span>
        )}
        {soldOut && (
          <span className="absolute right-2 top-2 rounded-full bg-accent-600 px-2 py-0.5 text-xs font-bold text-white">Rupture</span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <Link to={`/produits/${product.slug}`} className="font-semibold text-slate-800 hover:text-brand-800">
          {product.name}
        </Link>
        <p className="text-xs text-slate-500">{product.categories?.name ?? ''} · par {product.unit}</p>
        <div className="mt-2">
          <PriceTag cdf={product.price} rate={rate} />
        </div>
        <button
          onClick={handleAdd}
          disabled={soldOut}
          className="mt-3 rounded-lg bg-brand-700 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {soldOut ? 'Indisponible' : added ? 'Ajouté ✓' : 'Ajouter au panier'}
        </button>
      </div>
    </div>
  )
}