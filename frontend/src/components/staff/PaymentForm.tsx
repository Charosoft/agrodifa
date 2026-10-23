import { useState } from 'react'
import { errMsg } from '../../lib/errors'
import { formatCDF } from '../../lib/format'
import { KIND_LABELS, PAY_LABELS } from '../../lib/labels'
import { supabase } from '../../lib/supabase'
import type { Employee, PayMethod, PaymentKind } from '../../types/database'

interface Props {
  employee: Employee
  defaultPeriod: string
  onCancel: () => void
  onDone: () => void
}

const input = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:outline-none'

export default function PaymentForm({ employee, defaultPeriod, onCancel, onDone }: Props) {
  const [kind, setKind] = useState<PaymentKind>('salary')
  const [amount, setAmount] = useState(employee.base_salary > 0 ? String(employee.base_salary) : '')
  const [method, setMethod] = useState<PayMethod>('cash')
  const [period, setPeriod] = useState(defaultPeriod)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function changeKind(k: PaymentKind) {
    setKind(k)
    setAmount(k === 'salary' && employee.base_salary > 0 ? String(employee.base_salary) : '')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const n = Number(amount)
    if (!Number.isFinite(n) || n <= 0) return setError('Entrez un montant supérieur à 0.')
    if (!period) return setError('Choisissez le mois concerné.')
    if (!window.confirm(`Enregistrer ${KIND_LABELS[kind].toLowerCase()} de ${formatCDF(n)} pour ${employee.full_name} ?`)) return

    setSaving(true)
    const { error } = await supabase.from('employee_payments').insert({
      employee_id: employee.id,
      kind,
      amount: n,
      method,
      period,
      note: note.trim() || null,
    })
    setSaving(false)
    if (error) return setError(errMsg(error))
    onDone()
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-brand-200 bg-white p-4">
      <h2 className="font-semibold text-brand-800">Paiement pour {employee.full_name}</h2>
      <p className="text-xs text-slate-500">Une dépense « salaire » sera ajoutée automatiquement à la comptabilité.</p>
      {error && <p className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Type
          <select value={kind} onChange={(e) => changeKind(e.target.value as PaymentKind)} className={input}>
            {(Object.keys(KIND_LABELS) as PaymentKind[]).map((k) => (
              <option key={k} value={k}>{KIND_LABELS[k]}</option>
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
          Mois concerné
          <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className={input} />
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Note (facultatif)
        <input value={note} onChange={(e) => setNote(e.target.value)} className={input} />
      </label>

      <div className="flex gap-3">
        <button disabled={saving} className="rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
          {saving ? 'Enregistrement…' : 'Enregistrer le paiement'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700">
          Annuler
        </button>
      </div>
    </form>
  )
}