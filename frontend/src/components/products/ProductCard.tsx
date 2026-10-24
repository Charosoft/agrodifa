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
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-md">
      {/* Zone photo : toujours carrée. La photo est posée en absolu et recadrée, donc sa forme d'origine ne change rien. */}
      <Link to={`/produits/${product.slug}`} className="relative block aspect-square w-full overflow-hidden bg-slate-100">
        {img ? (
          <img src={img} alt={product.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">Pas de photo</div>
        )}
        {product.is_organic && (
          <span className="absolute left-2 top-2 rounded-full bg-leaf-600 px-2 py-0.5 text-xs font-bold text-white">Bio</span>
        )}
        {soldOut && (
          <span className="absolute right-2 top-2 rounded-full bg-accent-600 px-2 py-0.5 text-xs font-bold text-white">Rupture</span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        {/* Nom sur 2 lignes maximum, place réservée pour que tous les prix soient alignés */}
        <Link to={`/produits/${product.slug}`} className="line-clamp-2 min-h-12 font-semibold leading-6 text-slate-800 hover:text-brand-800">
          {product.name}
        </Link>
        <p className="truncate text-xs text-slate-500">{product.categories?.name ?? ''} · par {product.unit}</p>

        {/* mt-auto : prix et bouton collés en bas de la carte, au même niveau pour toutes */}
        <div className="mt-auto pt-2">
          <PriceTag cdf={product.price} rate={rate} />
          <button
            onClick={handleAdd}
            disabled={soldOut}
            className="mt-3 w-full rounded-lg bg-brand-700 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {soldOut ? 'Indisponible' : added ? 'Ajouté ✓' : 'Ajouter au panier'}
          </button>
        </div>
      </div>
    </div>
  )
}