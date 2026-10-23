import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useUsdRate } from '../../hooks/useUsdRate'
import { errMsg } from '../../lib/errors'
import { formatUSD } from '../../lib/format'
import { makeUniqueSlug } from '../../lib/slug'
import { deleteProductImageFile, uploadProductImage } from '../../lib/storage'
import { supabase } from '../../lib/supabase'
import type { Category, ProductWithImages } from '../../types/database'

interface Props {
  product?: ProductWithImages // absent = création, présent = modification
  categories: Category[]
  onDone: () => void
  onCancel: () => void
}

const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:outline-none'

export default function ProductForm({ product, categories, onDone, onCancel }: Props) {
  const rate = useUsdRate()

  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product ? String(product.price) : '')
  const [unit, setUnit] = useState(product?.unit ?? 'unité')
  const [categoryId, setCategoryId] = useState(product?.category_id ?? '')
  const [lowStock, setLowStock] = useState(product ? String(product.low_stock_alert) : '5')
  const [initialStock, setInitialStock] = useState('')
  const [isOrganic, setIsOrganic] = useState(product?.is_organic ?? true)
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false)
  const [isActive, setIsActive] = useState(product?.is_active ?? true)

  // Photos déjà enregistrées (modification) et nouvelles photos choisies
  const [existing, setExisting] = useState(
    [...(product?.product_images ?? [])].sort((a, b) => a.position - b.position),
  )
  const [files, setFiles] = useState<File[]>([])
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews])

  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function removeExisting(img: { id: string; url: string }) {
    if (!window.confirm('Supprimer cette photo ?')) return
    const { error } = await supabase.from('product_images').delete().eq('id', img.id)
    if (error) return setError(errMsg(error))
    await deleteProductImageFile(img.url)
    setExisting((list) => list.filter((i) => i.id !== img.id))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const priceNum = Number(price)
      if (!name.trim()) throw new Error('Le nom est obligatoire')
      if (!(priceNum >= 0) || price === '') throw new Error('Prix invalide')

      const fields = {
        name: name.trim(),
        description: description.trim() || null,
        price: priceNum,
        unit: unit.trim() || 'unité',
        category_id: categoryId || null,
        low_stock_alert: Number(lowStock) || 0,
        is_organic: isOrganic,
        is_featured: isFeatured,
        is_active: isActive,
      }

      let productId: string
      if (product) {
        productId = product.id
        const { error } = await supabase.from('products').update(fields).eq('id', productId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert({ ...fields, slug: makeUniqueSlug(name) })
          .select('id')
          .single()
        if (error) throw error
        productId = data.id

        // Le stock initial passe par un mouvement : il apparaît dans l'historique
        const qty = Number(initialStock)
        if (qty > 0) {
          const { error: mvError } = await supabase
            .from('stock_movements')
            .insert({ product_id: productId, type: 'in', quantity: qty, note: 'Stock initial' })
          if (mvError) throw mvError
        }
      }

      // Envoi des nouvelles photos, une par une
      let position = existing.length
      for (const [i, file] of files.entries()) {
        setProgress(`Envoi de la photo ${i + 1} sur ${files.length}…`)
        const url = await uploadProductImage(productId, file)
        const { error } = await supabase.from('product_images').insert({ product_id: productId, url, position: position++ })
        if (error) throw error
      }

      onDone()
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setSaving(false)
      setProgress(null)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border-2 border-brand-600 bg-white p-4">
      <h2 className="text-lg font-semibold text-brand-800">{product ? 'Modifier le produit' : 'Nouveau produit'}</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Nom *</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Catégorie</label>
          <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">— Aucune —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Prix en FC *</label>
          <input className={inputClass} type="number" min="0" step="1" value={price} onChange={(e) => setPrice(e.target.value)} required />
          {price !== '' && <p className="mt-1 text-xs text-slate-500">{formatUSD(Number(price), rate)}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Unité de vente</label>
          <input className={inputClass} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg, sac, plateau, pièce…" />
        </div>
        {!product && (
          <div>
            <label className="text-sm font-medium text-slate-700">Stock initial</label>
            <input className={inputClass} type="number" min="0" step="any" value={initialStock} onChange={(e) => setInitialStock(e.target.value)} />
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-slate-700">Alerte stock bas (à partir de)</label>
          <input className={inputClass} type="number" min="0" step="any" value={lowStock} onChange={(e) => setLowStock(e.target.value)} />
        </div>
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-slate-700">Description</label>
        <textarea className={inputClass} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700">
        <label className="flex items-center gap-2"><input type="checkbox" checked={isOrganic} onChange={(e) => setIsOrganic(e.target.checked)} /> Produit bio</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} /> Mis en avant à l'accueil</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Visible sur le site</label>
      </div>

      {/* PHOTOS */}
      <div className="mt-6">
        <label className="text-sm font-medium text-slate-700">Photos</label>
        <div className="mt-2 flex flex-wrap gap-3">
          {existing.map((img) => (
            <div key={img.id} className="relative">
              <img src={img.url} alt="" className="h-24 w-24 rounded-lg border border-slate-200 object-cover" />
              <button
                type="button"
                onClick={() => removeExisting(img)}
                className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-accent-600 text-sm font-bold text-white"
                aria-label="Supprimer la photo"
              >
                ×
              </button>
            </div>
          ))}
          {previews.map((src, i) => (
            <div key={src} className="relative">
              <img src={src} alt="" className="h-24 w-24 rounded-lg border-2 border-dashed border-brand-500 object-cover" />
              <button
                type="button"
                onClick={() => setFiles((list) => list.filter((_, idx) => idx !== i))}
                className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-slate-700 text-sm font-bold text-white"
                aria-label="Retirer la photo"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            const picked = Array.from(e.target.files ?? []) // on lit les fichiers tout de suite
            e.target.value = '' // puis on vide l'input (permet de re-choisir le même fichier)
            setFiles((list) => [...list, ...picked])
        }}
          className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:font-semibold file:text-brand-800 hover:file:bg-brand-100"
        />
        <p className="mt-1 text-xs text-slate-500">Les photos en pointillés seront envoyées à l'enregistrement. La première est la photo principale.</p>
      </div>

      {error && <p className="mt-4 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>}

      <div className="mt-6 flex gap-3">
        <button type="submit" disabled={saving} className="rounded-lg bg-brand-700 px-5 py-2 font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
          {saving ? (progress ?? 'Enregistrement…') : 'Enregistrer'}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} className="rounded-lg border border-slate-300 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-50">
          Annuler
        </button>
      </div>
    </form>
  )
}