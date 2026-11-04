import { useState } from 'react'
import { errMsg } from '../../lib/errors'
import { supabase } from '../../lib/supabase'
import type { Employee } from '../../types/database'

interface Props {
  employee?: Employee
  onCancel: () => void
  onDone: () => void
}

const input = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:outline-none'

export default function EmployeeForm({ employee, onCancel, onDone }: Props) {
  const [fullName, setFullName] = useState(employee?.full_name ?? '')
  const [jobTitle, setJobTitle] = useState(employee?.job_title ?? '')
  const [phone, setPhone] = useState(employee?.phone ?? '')
  const [address, setAddress] = useState(employee?.address ?? '')
  const [salary, setSalary] = useState(String(employee?.base_salary ?? ''))
  const [transport, setTransport] = useState(String(employee?.transport_fee ?? ''))
  const [hireDate, setHireDate] = useState(employee?.hire_date ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const base = Number(salary || 0)
    const fee = Number(transport || 0)
    if (!fullName.trim()) return setError('Le nom est obligatoire.')
    if (!Number.isFinite(base) || base < 0) return setError('Salaire invalide.')
    if (!Number.isFinite(fee) || fee < 0) return setError('Frais de transport invalides.')

    const row = {
      full_name: fullName.trim(),
      job_title: jobTitle.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      base_salary: base,
      transport_fee: fee,
      hire_date: hireDate || null,
    }
    setSaving(true)
    const { error } = employee
      ? await supabase.from('employees').update(row).eq('id', employee.id)
      : await supabase.from('employees').insert(row)
    setSaving(false)
    if (error) return setError(errMsg(error))
    onDone()
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-brand-200 bg-white p-4">
      <h2 className="font-semibold text-brand-800">{employee ? `Modifier ${employee.full_name}` : 'Nouvel employé'}</h2>
      {error && <p className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Nom complet *
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={input} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Poste
          <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Ex : Vendeur, Éleveur" className={input} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Téléphone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={input} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Date d'embauche
          <input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} className={input} />
        </label>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Adresse complète
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Avenue, numéro, quartier, commune, ville"
            className={input}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Salaire mensuel (FC)
          <input type="number" min="0" step="1" value={salary} onChange={(e) => setSalary(e.target.value)} className={input} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Frais de transport habituel (FC)
          <input type="number" min="0" step="1" value={transport} onChange={(e) => setTransport(e.target.value)} className={input} />
          <span className="mt-1 block text-xs text-slate-500">Selon la distance du domicile. Proposé automatiquement lors du paiement, modifiable.</span>
        </label>
      </div>

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