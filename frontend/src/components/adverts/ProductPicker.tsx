import { useEffect, useState } from 'react'
import { errMsg } from '../../lib/errors'
import { formatCDF } from '../../lib/format'
import { mainImage, PRODUCT_SELECT } from '../../lib/products'
import { supabase } from '../../lib/supabase'
import type { ProductWithImages } from '../../types/database'

interface Props {
  advertisedLinks: string[] // liens des publicités existantes, pour signaler les produits déjà promus
  onPick: (product: ProductWithImages) => void
  onCancel: () => void
}

export default function ProductPicker({ advertisedLinks, onPick, onCancel }: Props) {
  const [products, setProducts] = useState<ProductWithImages[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('is_active', true)
      .order('name')
      .limit(200)
      .then(({ data, error }) => {
        if (error) setError(errMsg(error))
        setProducts((data as ProductWithImages[]) ?? [])
        setLoading(false)
      })
  }, [])

  const shown = products.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))

  return (
    <div className="rounded-xl border-2 border-brand-600 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-brand-800">Choisissez le produit à promouvoir</h2>
        <button onClick={onCancel} className="text-sm font-semibold text-slate-600 hover:text-slate-800">Annuler</button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher un produit…"
        className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:outline-none"
      />

      {error && <p className="mt-3 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>}
      {loading && <p className="mt-3 text-slate-500">Chargement…</p>}
      {!loading && shown.length === 0 && <p className="mt-3 text-sm text-slate-500">Aucun produit actif trouvé.</p>}

      <ul className="mt-3 max-h-80 divide-y divide-slate-100 overflow-y-auto">
        {shown.map((p) => {
          const img = mainImage(p)
          const already = advertisedLinks.includes(`/produits/${p.slug}`)
          return (
            <li key={p.id}>
              <button onClick={() => onPick(p)} className="flex w-full items-center gap-3 px-1 py-2 text-left hover:bg-brand-50">
                {img ? (
                  <img src={img} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] text-slate-400">Sans photo</span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-slate-800">{p.name}</span>
                  <span className="text-xs text-slate-500">{formatCDF(p.price)} · par {p.unit}</span>
                </span>
                {already && <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-800">Déjà en publicité</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}