import { useState } from 'react'
import { CATEGORIES } from '../../lib/accounting'
import { errMsg } from '../../lib/errors'
import { formatCDF } from '../../lib/format'
import { PAY_LABELS } from '../../lib/labels'
import { supabase } from '../../lib/supabase'
import type { PayMethod, TxType } from '../../types/database'

interface Props {
  onCancel: () => void
  onDone: () => void
}

const input = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:outline-none'

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function TransactionForm({ onCancel, onDone }: Props) {
  const [type, setType] = useState<TxType>('expense')
  const [category, setCategory] = useState(CATEGORIES.expense[0].value)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PayMethod>('cash')
  const [date, setDate] = useState(today())
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function changeType(t: TxType) {
    setType(t)
    setCategory(CATEGORIES[t][0].value)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const n = Number(amount)
    if (!Number.isFinite(n) || n <= 0) return setError('Entrez un montant supérieur à 0.')
    if (!date) return setError('Choisissez la date.')
    if (!description.trim()) return setError('Ajoutez une description (ex : « Sac de maïs au marché »).')
    const label = type === 'income' ? 'cette entrée' : 'cette dépense'
    if (!window.confirm(`Enregistrer ${label} de ${formatCDF(n)} ? Elle ne pourra être supprimée que par le propriétaire.`)) return

    setSaving(true)
    const { error } = await supabase.from('transactions').insert({
      type,
      category,
      amount: n,
      method,
      description: description.trim(),
      occurred_at: new Date(`${date}T12:00:00`).toISOString(),
    })
    setSaving(false)
    if (error) return setError(errMsg(error))
    onDone()
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-brand-200 bg-white p-4">
      <h2 className="font-semibold text-brand-800">Nouvelle opération</h2>
      {error && <p className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>}

      <div className="flex gap-2">
        {(['expense', 'income'] as TxType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => changeType(t)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
              type === t
                ? t === 'income'
                  ? 'border-leaf-700 bg-leaf-700 text-white'
                  : 'border-accent-600 bg-accent-600 text-white'
                : 'border-slate-300 bg-white text-slate-700'
            }`}
          >
            {t === 'income' ? 'Entrée d\'argent' : 'Dépense'}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Catégorie
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={input}>
            {CATEGORIES[type].map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Montant (FC)
          <input type="number" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} className={input} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Moyen de paiement
          <select value={method} onChange={(e) => setMethod(e.target.value as PayMethod)} className={input}>
            {(Object.keys(PAY_LABELS) as PayMethod[]).map((m) => (
              <option key={m} value={m}>{PAY_LABELS[m]}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Description *
        <input value={description} onChange={(e) => setDescription(e.target.value)} className={input} />
      </label>

      <div className="flex gap-3">
        <button disabled={saving} className="rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700">
          Annuler
        </button>
      </div>
    </form>
  )
}