import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PriceTag from '../../components/ui/PriceTag'
import { useCart } from '../../hooks/useCart'
import { useUsdRate } from '../../hooks/useUsdRate'
import { PRODUCT_SELECT, sortedImages } from '../../lib/products'
import { supabase } from '../../lib/supabase'
import type { ProductWithImages } from '../../types/database'

export default function ProductPage() {
  const { slug } = useParams() // l'adresse /produits/poulet-bio-x4k2 donne slug = "poulet-bio-x4k2"
  const rate = useUsdRate()
  const { add } = useCart()

  const [product, setProduct] = useState<ProductWithImages | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(0)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('slug', slug ?? '')
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        const p = data as ProductWithImages | null
        setProduct(p)
        setLoading(false)
        if (p) document.title = `${p.name} | AGRODIFA`
      })
  }, [slug])

  if (loading) return <p className="mx-auto max-w-6xl px-4 py-12 text-slate-500">Chargement…</p>

  if (!product) {
    return (
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-brand-800">Produit introuvable</h1>
        <Link to="/produits" className="mt-4 inline-block font-semibold text-accent-600">← Retour aux produits</Link>
      </main>
    )
  }

  const images = sortedImages(product)
  const soldOut = product.stock_quantity <= 0

  function handleAdd() {
    if (!product) return
    add(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/produits" className="text-sm font-semibold text-brand-700 hover:text-brand-900">← Tous les produits</Link>

      <div className="mt-4 grid gap-8 md:grid-cols-2">
        {/* Galerie */}
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl bg-slate-100">
            {images[selected] ? (
              <img src={images[selected].url} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">Pas de photo</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelected(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${i === selected ? 'border-brand-700' : 'border-transparent'}`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Infos */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.is_organic && <span className="rounded-full bg-leaf-100 px-2 py-0.5 text-xs font-bold text-leaf-700">Bio</span>}
            {product.categories?.name && <span className="text-sm text-slate-500">{product.categories.name}</span>}
          </div>
          <h1 className="mt-2 text-3xl font-bold text-brand-800">{product.name}</h1>
          <div className="mt-3">
            <PriceTag cdf={product.price} rate={rate} />
            <p className="text-xs text-slate-500">prix par {product.unit}</p>
          </div>

          <p className={`mt-4 text-sm font-semibold ${soldOut ? 'text-accent-600' : 'text-leaf-700'}`}>
            {soldOut ? 'Rupture de stock' : `En stock : ${product.stock_quantity} ${product.unit}`}
          </p>

          {!soldOut && (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center rounded-lg border border-slate-300">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 font-bold text-slate-700" aria-label="Moins">−</button>
                <span className="w-10 text-center font-semibold">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(product.stock_quantity, q + 1))} className="px-3 py-2 font-bold text-slate-700" aria-label="Plus">+</button>
              </div>
              <button onClick={handleAdd} className="flex-1 rounded-lg bg-brand-700 px-5 py-3 font-semibold text-white hover:bg-brand-800">
                {added ? 'Ajouté au panier ✓' : 'Ajouter au panier'}
              </button>
            </div>
          )}

          {product.description && (
            <div className="mt-6">
              <h2 className="font-semibold text-brand-800">Description</h2>
              <p className="mt-1 whitespace-pre-line text-slate-600">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}