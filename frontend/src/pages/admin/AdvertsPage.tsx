import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AdvertForm from '../../components/adverts/AdvertForm'
import ProductPicker from '../../components/adverts/ProductPicker'
import { errMsg } from '../../lib/errors'
import { PRODUCT_SELECT } from '../../lib/products'
import { deleteProductImageFile } from '../../lib/storage'
import { supabase } from '../../lib/supabase'
import type { Advert, Category, ProductWithImages } from '../../types/database'

export default function AdvertsPage() {
  const [adverts, setAdverts] = useState<Advert[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Advert | 'new' | null>(null)
  const [picking, setPicking] = useState(false) // choix d'un produit en cours
  const [fromProduct, setFromProduct] = useState<ProductWithImages | undefined>(undefined)
  const [searchParams, setSearchParams] = useSearchParams()
  const productId = searchParams.get('produit') // lien « Promouvoir » depuis la page Produits

  const load = useCallback(async () => {
    const [ads, cats] = await Promise.all([
      supabase.from('adverts').select('*').eq('kind', 'carousel').order('position'),
      supabase.from('categories').select('id, name, slug').order('name'),
    ])
    if (ads.error) setError(errMsg(ads.error))
    else setError(null)
    setAdverts((ads.data as Advert[]) ?? [])
    setCategories((cats.data as Category[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!productId) return
    supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('id', productId)
      .single()
      .then(({ data, error }) => {
        setSearchParams({}, { replace: true })
        if (error || !data) return setError('Produit introuvable.')
        setFromProduct(data as ProductWithImages)
        setEditing('new')
      })
  }, [productId, setSearchParams])

  function closeForm() {
    setEditing(null)
    setFromProduct(undefined)
  }

  async function toggleActive(a: Advert) {
    const { error } = await supabase.from('adverts').update({ is_active: !a.is_active }).eq('id', a.id)
    if (error) return setError(errMsg(error))
    load()
  }

  // Déplace une publicité puis renumérote toute la liste (0, 1, 2…) pour éviter les égalités
  async function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= adverts.length) return
    const reordered = [...adverts]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    const results = await Promise.all(
      reordered.map((a, i) => supabase.from('adverts').update({ position: i }).eq('id', a.id)),
    )
    const failed = results.find((r) => r.error)
    if (failed?.error) setError(errMsg(failed.error))
    load()
  }

  async function remove(a: Advert) {
    if (!window.confirm(`Supprimer la publicité « ${a.title} » ?`)) return
    const { error } = await supabase.from('adverts').delete().eq('id', a.id)
    if (error) return setError(errMsg(error))
    await deleteProductImageFile(a.image_url)
    load()
  }

  const nextPosition = adverts.length === 0 ? 0 : Math.max(...adverts.map((a) => a.position)) + 1

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-800">Publicité</h1>
          <p className="text-sm text-slate-600">Les images défilent sur l'accueil, dans l'ordre ci-dessous.</p>
        </div>
        {editing === null && !picking && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setPicking(true)} className="rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800">
              + À partir d'un produit
            </button>
            <button onClick={() => setEditing('new')} className="rounded-lg border border-brand-700 px-4 py-2 font-semibold text-brand-700 hover:bg-brand-50">
              + Publicité libre
            </button>
          </div>
        )}
      </div>

      {error && <p className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>}

      {picking && (
        <ProductPicker
          advertisedLinks={adverts.map((a) => a.link ?? '')}
          onCancel={() => setPicking(false)}
          onPick={(p) => {
            setPicking(false)
            setFromProduct(p)
            setEditing('new')
          }}
        />
      )}

      {editing !== null && (
        <AdvertForm
          key={editing === 'new' ? `new-${fromProduct?.id ?? 'free'}` : editing.id}
          advert={editing === 'new' ? undefined : editing}
          fromProduct={editing === 'new' ? fromProduct : undefined}
          categories={categories}
          nextPosition={nextPosition}
          onCancel={closeForm}
          onDone={() => {
            closeForm()
            load()
          }}
        />
      )}

      <div className="space-y-3">
        {loading && <p className="text-slate-500">Chargement…</p>}
        {!loading && adverts.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
            Aucune publicité. L'accueil affiche pour l'instant la bannière par défaut avec le slogan.
          </p>
        )}

        {adverts.map((a, i) => (
          <div key={a.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-3">
            <img src={a.image_url} alt={a.title} className="h-20 w-36 rounded-lg object-cover" />

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-800">{a.title}</p>
              {a.subtitle && <p className="text-sm text-slate-500">{a.subtitle}</p>}
              <p className="text-xs text-slate-400">Lien : {a.link ?? '—'}</p>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${a.is_active ? 'bg-leaf-100 text-leaf-700' : 'bg-slate-200 text-slate-600'}`}>
                {a.is_active ? 'Affichée' : 'Masquée'}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="h-8 w-8 rounded-lg border border-slate-300 font-bold disabled:opacity-30" aria-label="Monter">↑</button>
              <button onClick={() => move(i, 1)} disabled={i === adverts.length - 1} className="h-8 w-8 rounded-lg border border-slate-300 font-bold disabled:opacity-30" aria-label="Descendre">↓</button>
            </div>

            <div className="flex gap-3 text-sm font-semibold">
              <button onClick={() => toggleActive(a)} className="text-slate-600 hover:text-slate-800">{a.is_active ? 'Masquer' : 'Afficher'}</button>
              <button onClick={() => setEditing(a)} className="text-brand-700 hover:text-brand-900">Modifier</button>
              <button onClick={() => remove(a)} className="text-accent-600 hover:text-accent-700">Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}