import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { errMsg } from '../../lib/errors'
import { supabase } from '../../lib/supabase'
import type { ProductWithImages } from '../../types/database'

type MovementType = 'in' | 'out' | 'loss'

interface Movement {
  id: string
  type: MovementType
  quantity: number
  note: string | null
  created_at: string
  profiles: { full_name: string } | null
}

interface Props {
  product: ProductWithImages
  onChanged: () => void // pour recharger la liste (le stock a changé)
  onClose: () => void
}

const LABELS: Record<MovementType, string> = { in: 'Entrée', out: 'Sortie', loss: 'Perte' }
const COLORS: Record<MovementType, string> = {
  in: 'bg-leaf-100 text-leaf-700',
  out: 'bg-brand-50 text-brand-800',
  loss: 'bg-accent-50 text-accent-700',
}

export default function StockPanel({ product, onChanged, onClose }: Props) {
  const [type, setType] = useState<MovementType>('in')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [history, setHistory] = useState<Movement[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadHistory = useCallback(async () => {
    const { data } = await supabase
      .from('stock_movements')
      .select('id, type, quantity, note, created_at, profiles(full_name)')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setHistory((data as unknown as Movement[]) ?? [])
  }, [product.id])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const qty = Number(quantity)
    if (!(qty > 0)) return setError('Entrez une quantité supérieure à 0')
    if (type !== 'in' && qty > product.stock_quantity) {
      return setError(`Stock insuffisant : il reste seulement ${product.stock_quantity} ${product.unit}`)
    }

    setSaving(true)
    // Le stock du produit est mis à jour automatiquement par la base (trigger SQL)
    const { error } = await supabase
      .from('stock_movements')
      .insert({ product_id: product.id, type, quantity: qty, note: note.trim() || null })
    setSaving(false)
    if (error) return setError(errMsg(error))

    setQuantity('')
    setNote('')
    await loadHistory()
    onChanged()
  }

  const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:outline-none'

  return (
    <div className="rounded-xl border-2 border-brand-600 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-brand-800">Stock : {product.name}</h2>
          <p className="text-sm text-slate-600">
            En stock : <span className="text-lg font-bold text-slate-800">{product.stock_quantity}</span> {product.unit}
          </p>
        </div>
        <button onClick={onClose} className="text-sm font-semibold text-slate-600 hover:text-slate-800">
          Fermer
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-4">
        <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as MovementType)}>
          <option value="in">Entrée (réapprovisionnement)</option>
          <option value="out">Sortie (vente directe, don…)</option>
          <option value="loss">Perte (casse, péremption, mortalité)</option>
        </select>
        <input className={inputClass} type="number" min="0" step="any" placeholder="Quantité" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <input className={inputClass} placeholder="Note (facultatif)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button type="submit" disabled={saving} className="rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>

      {error && <p className="mt-3 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>}

      <h3 className="mt-6 font-semibold text-slate-700">Derniers mouvements</h3>
      {history.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Aucun mouvement enregistré.</p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100">
          {history.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${COLORS[m.type]}`}>{LABELS[m.type]}</span>
              <span className="font-semibold text-slate-800">
                {m.type === 'in' ? '+' : '−'}
                {m.quantity}
              </span>
              <span className="text-slate-600">{m.note}</span>
              <span className="ml-auto text-xs text-slate-400">
                {m.profiles?.full_name ? `${m.profiles.full_name} · ` : ''}
                {new Date(m.created_at).toLocaleString('fr-FR')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}