import { useEffect, useState, type FormEvent } from 'react'
import { errMsg } from '../../lib/errors'
import { deleteProductImageFile, uploadAdvertImage } from '../../lib/storage'
import { supabase } from '../../lib/supabase'
import { mainImage } from '../../lib/products'
import type { Advert, Category, ProductWithImages } from '../../types/database'

interface Props {
  advert?: Advert // absent = création
  fromProduct?: ProductWithImages // création préremplie à partir d'un produit
  categories: Category[]
  nextPosition: number
  onDone: () => void
  onCancel: () => void
}

const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:outline-none'
const CUSTOM = '__custom'

export default function AdvertForm({ advert, fromProduct, categories, nextPosition, onDone, onCancel }: Props) {
  // Destinations proposées pour le bouton de la bannière
  const productLink = fromProduct ? `/produits/${fromProduct.slug}` : null
  const presets = [
    ...(fromProduct && productLink ? [{ label: `Fiche produit : ${fromProduct.name}`, value: productLink }] : []),
    { label: 'Catalogue complet', value: '/produits' },
    ...categories.map((c) => ({ label: `Catégorie : ${c.name}`, value: `/produits?cat=${c.slug}` })),
    { label: 'Page contact', value: '/contact' },
  ]
  const startLink = advert ? advert.link : productLink
  const initialChoice = !startLink ? '/produits' : presets.some((p) => p.value === startLink) ? startLink : CUSTOM
  // Le prix n'est pas écrit dans le texte : il changerait un jour et la bannière afficherait un prix faux.
  const productSubtitle = fromProduct ? (fromProduct.description?.trim().slice(0, 140) || (fromProduct.is_organic ? 'Produit bio' : '')) : ''
  const productImage = fromProduct ? mainImage(fromProduct) : null

  const [title, setTitle] = useState(advert?.title ?? fromProduct?.name ?? '')
  const [subtitle, setSubtitle] = useState(advert?.subtitle ?? productSubtitle)
  const [linkChoice, setLinkChoice] = useState(initialChoice)
  const [customLink, setCustomLink] = useState(initialChoice === CUSTOM ? (startLink ?? '') : '')
  const [isActive, setIsActive] = useState(advert?.is_active ?? true)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loadingImage, setLoadingImage] = useState(Boolean(productImage))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!file) return setPreview(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Création à partir d'un produit : on reprend sa photo (copie indépendante, supprimer la publicité ne touche pas au produit)
  useEffect(() => {
    if (!productImage) return
    let cancelled = false
    fetch(productImage)
      .then((r) => {
        if (!r.ok) throw new Error('photo introuvable')
        return r.blob()
      })
      .then((blob) => {
        if (!cancelled) setFile(new File([blob], 'produit.jpg', { type: blob.type || 'image/jpeg' }))
      })
      .catch(() => {
        if (!cancelled) setError('Impossible de reprendre la photo du produit : choisissez une image ci-dessous.')
      })
      .finally(() => {
        if (!cancelled) setLoadingImage(false)
      })
    return () => {
      cancelled = true
    }
  }, [productImage])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    let uploadedUrl: string | null = null
    try {
      if (!title.trim()) throw new Error('Le titre est obligatoire')
      if (!file && !advert) throw new Error('Ajoutez une image')

      const link = linkChoice === CUSTOM ? customLink.trim() : linkChoice
      if (link && !link.startsWith('/')) throw new Error("L'adresse du lien doit commencer par /  (exemple : /produits)")

      if (file) uploadedUrl = await uploadAdvertImage(file)

      const fields = {
        kind: 'carousel' as const,
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        link: link || null,
        image_url: uploadedUrl ?? advert!.image_url,
        is_active: isActive,
      }

      if (advert) {
        const { error } = await supabase.from('adverts').update(fields).eq('id', advert.id)
        if (error) throw error
        if (uploadedUrl) await deleteProductImageFile(advert.image_url) // on retire l'ancienne image
      } else {
        const { error } = await supabase.from('adverts').insert({ ...fields, position: nextPosition })
        if (error) throw error
      }
      onDone()
    } catch (err) {
      if (uploadedUrl) await deleteProductImageFile(uploadedUrl) // l'enregistrement a échoué : on ne garde pas le fichier
      setError(errMsg(err))
    } finally {
      setSaving(false)
    }
  }

  const shownImage = preview ?? advert?.image_url ?? null

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border-2 border-brand-600 bg-white p-4">
      <h2 className="text-lg font-semibold text-brand-800">{advert ? 'Modifier la publicité' : fromProduct ? `Publicité pour « ${fromProduct.name} »` : 'Nouvelle publicité'}</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Titre *</label>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={80} placeholder="Poulets bio frais" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Texte sous le titre</label>
          <input className={inputClass} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} maxLength={140} placeholder="Livraison cette semaine" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Le bouton mène vers</label>
          <select className={inputClass} value={linkChoice} onChange={(e) => setLinkChoice(e.target.value)}>
            {presets.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
            <option value={CUSTOM}>Autre adresse…</option>
          </select>
          {linkChoice === CUSTOM && (
            <input className={`${inputClass} mt-2`} value={customLink} onChange={(e) => setCustomLink(e.target.value)} placeholder="/produits/nom-du-produit" />
          )}
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Affichée sur l'accueil
        </label>
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-slate-700">Image {advert ? '(laisser vide pour garder l\'actuelle)' : '*'}</label>
        {shownImage && (
          <img src={shownImage} alt="" className="mt-2 h-40 w-full rounded-lg border border-slate-200 object-cover" />
        )}
        {loadingImage && <p className="mt-2 text-sm text-slate-500">Chargement de la photo du produit…</p>}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:font-semibold file:text-brand-800 hover:file:bg-brand-100"
        />
        {fromProduct && productImage && (
          <p className="mt-1 text-xs text-slate-500">Photo reprise du produit. Pour un meilleur rendu, vous pouvez choisir une image horizontale à la place.</p>
        )}
        <p className="mt-1 text-xs text-slate-500">Conseil : image horizontale (environ 1600 × 600). Le texte s'affiche à gauche, gardez cette zone peu chargée.</p>
      </div>

      {error && <p className="mt-4 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>}

      <div className="mt-6 flex gap-3">
        <button type="submit" disabled={saving || loadingImage} className="rounded-lg bg-brand-700 px-5 py-2 font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} className="rounded-lg border border-slate-300 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-50">
          Annuler
        </button>
      </div>
    </form>
  )
}