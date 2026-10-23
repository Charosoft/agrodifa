import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { errMsg } from '../../lib/errors'
import { formatCDF } from '../../lib/format'
import { KIND_LABELS, PAY_LABELS } from '../../lib/labels'
import { monthLabel } from '../../lib/period'
import { supabase } from '../../lib/supabase'
import type { Employee, EmployeePayment } from '../../types/database'

interface Props {
  employee: Employee
  onClose: () => void
  onChanged: () => void
}

export default function PaymentHistory({ employee, onClose, onChanged }: Props) {
  const { isOwner } = useAuth()
  const [rows, setRows] = useState<EmployeePayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('employee_payments')
      .select('*')
      .eq('employee_id', employee.id)
      .order('paid_at', { ascending: false })
      .limit(100)
    if (error) setError(errMsg(error))
    setRows((data as EmployeePayment[]) ?? [])
    setLoading(false)
  }, [employee.id])

  useEffect(() => {
    load()
  }, [load])

  async function remove(p: EmployeePayment) {
    if (!window.confirm(`Supprimer ce paiement de ${formatCDF(p.amount)} ? La dépense liée en comptabilité sera aussi supprimée.`)) return
    const { error } = await supabase.from('employee_payments').delete().eq('id', p.id)
    if (error) return setError(errMsg(error))
    load()
    onChanged()
  }

  return (
    <div className="rounded-xl border border-brand-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-brand-800">Paiements de {employee.full_name}</h2>
        <button onClick={onClose} className="text-sm font-semibold text-slate-600 hover:text-slate-800">Fermer</button>
      </div>
      {error && <p className="mt-2 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>}
      {loading && <p className="mt-3 text-slate-500">Chargement…</p>}
      {!loading && rows.length === 0 && <p className="mt-3 text-sm text-slate-500">Aucun paiement visible.</p>}

      <ul className="mt-3 divide-y divide-slate-100">
        {rows.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
            <div>
              <p className="font-medium text-slate-800">
                {KIND_LABELS[p.kind]} · {formatCDF(p.amount)}
              </p>
              <p className="text-xs text-slate-500">
                {p.period ? `${monthLabel(p.period)} · ` : ''}
                {PAY_LABELS[p.method]} · payé le {new Date(p.paid_at).toLocaleDateString('fr-FR')}
                {p.note ? ` · ${p.note}` : ''}
              </p>
            </div>
            {isOwner && (
              <button onClick={() => remove(p)} className="font-semibold text-accent-600 hover:text-accent-700">
                Supprimer
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}