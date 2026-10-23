import { useCallback, useEffect, useState } from 'react'
import CategoryManager from '../../components/products/CategoryManager'
import ProductForm from '../../components/products/ProductForm'
import PriceTag from '../../components/ui/PriceTag'
import { useUsdRate } from '../../hooks/useUsdRate'
import { deleteProductImageFile } from '../../lib/storage'
import { errMsg } from '../../lib/errors'
import { supabase } from '../../lib/supabase'
import type { Category, ProductWithImages } from '../../types/database'
import StockPanel from '../../components/products/StockPanel'

export default function ProductsPage() {
  const rate = useUsdRate()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<ProductWithImages[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // null = formulaire fermé, 'new' = création, sinon le produit à modifier
  const [editing, setEditing] = useState<ProductWithImages | 'new' | null>(null)
  // Produit dont on gère le stock (on garde seulement son id, la liste rechargée donne les valeurs à jour)
  const [stockForId, setStockForId] = useState<string | null>(null)
  const stockProduct = products.find((p) => p.id === stockForId) ?? null

  const load = useCallback(async () => {
    const [cats, prods] = await Promise.all([
      supabase.from('categories').select('id, name, slug').order('name'),
      supabase
        .from('products')
        .select('*, product_images(id, url, position), categories(name)')
        .order('created_at', { ascending: false }),
    ])
    if (cats.error || prods.error) setError(errMsg(cats.error ?? prods.error))
    else setError(null)
    setCategories((cats.data as Category[]) ?? [])
    setProducts((prods.data as ProductWithImages[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function remove(p: ProductWithImages) {
    if (!window.confirm(`Supprimer définitivement « ${p.name} » ?`)) return
    const { error } = await supabase.from('products').delete().eq('id', p.id)
    if (error) return setError(errMsg(error))
    await Promise.all(p.product_images.map((i) => deleteProductImageFile(i.url)))
    load()
  }

  function mainImage(p: ProductWithImages): string | null {
    const sorted = [...p.product_images].sort((a, b) => a.position - b.position)
    return sorted[0]?.url ?? null
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-800">Produits & stock</h1>
        {editing === null && (
          <button onClick={() => setEditing('new')} className="rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800">
            + Nouveau produit
          </button>
        )}
      </div>

      {error && <p className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>}

      {editing !== null ? (
        <ProductForm
          key={editing === 'new' ? 'new' : editing.id}
          product={editing === 'new' ? undefined : editing}
          categories={categories}
          onCancel={() => setEditing(null)}
          onDone={() => {
            setEditing(null)
            load()
          }}
        />
        ) : stockProduct ? (
            <StockPanel product={stockProduct} onChanged={load} onClose={() => setStockForId(null)} />
        ) : (
            <CategoryManager categories={categories} onChange={load} />
      )}

      <div className="space-y-3">
        {loading && <p className="text-slate-500">Chargement…</p>}
        {!loading && products.length === 0 && <p className="text-slate-500">Aucun produit pour l'instant.</p>}

        {products.map((p) => {
          const img = mainImage(p)
          const low = p.stock_quantity <= p.low_stock_alert
          return (
            <div key={p.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-3">
              {img ? (
                <img src={img} alt={p.name} className="h-20 w-20 rounded-lg object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">Pas de photo</div>
              )}

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-800">{p.name}</p>
                <p className="text-sm text-slate-500">{p.categories?.name ?? 'Sans catégorie'} · par {p.unit}</p>
                <div className="mt-1 flex flex-wrap gap-1 text-xs font-semibold">
                  {p.is_organic && <span className="rounded-full bg-leaf-100 px-2 py-0.5 text-leaf-700">Bio</span>}
                  {p.is_featured && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-brand-800">Mis en avant</span>}
                  {!p.is_active && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-slate-600">Masqué</span>}
                  {low && <span className="rounded-full bg-accent-50 px-2 py-0.5 text-accent-700">Stock bas</span>}
                </div>
              </div>

              <PriceTag cdf={p.price} rate={rate} />
              <p className="w-20 text-center text-sm text-slate-600">
                <span className="block text-lg font-bold text-slate-800">{p.stock_quantity}</span>en stock
              </p>

              <div className="flex gap-3 text-sm font-semibold">
                <button onClick={() => { setStockForId(p.id)
                 window.scrollTo({ top: 0, behavior: 'smooth' })}}
                className="text-leaf-700 hover:text-leaf-600">Stock</button>
                <button onClick={() => setEditing(p)} className="text-brand-700 hover:text-brand-900">Modifier</button>
                <button onClick={() => remove(p)} className="text-accent-600 hover:text-accent-700">Supprimer</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}