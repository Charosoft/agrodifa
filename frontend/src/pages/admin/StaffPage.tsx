import { useCallback, useEffect, useState } from 'react'
import EmployeeForm from '../../components/staff/EmployeeForm'
import PaymentForm from '../../components/staff/PaymentForm'
import PaymentHistory from '../../components/staff/PaymentHistory'
import { useAuth } from '../../hooks/useAuth'
import { useUsdRate } from '../../hooks/useUsdRate'
import { errMsg } from '../../lib/errors'
import { formatCDF, formatUSD } from '../../lib/format'
import { currentMonth, monthLabel } from '../../lib/period'
import { supabase } from '../../lib/supabase'
import type { Employee, EmployeePayment } from '../../types/database'

type Mode =
  | { type: 'edit'; employee?: Employee }
  | { type: 'pay'; employee: Employee }
  | { type: 'history'; employee: Employee }
  | null

export default function StaffPage() {
  const { isOwner } = useAuth()
  const rate = useUsdRate()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payments, setPayments] = useState<EmployeePayment[]>([])
  const [month, setMonth] = useState(currentMonth())
  const [mode, setMode] = useState<Mode>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [emps, pays] = await Promise.all([
      supabase.from('employees').select('*').order('is_active', { ascending: false }).order('full_name'),
      supabase.from('employee_payments').select('*').eq('period', month),
    ])
    const err = emps.error ?? pays.error
    setError(err ? errMsg(err) : null)
    setEmployees((emps.data as Employee[]) ?? [])
    setPayments((pays.data as EmployeePayment[]) ?? [])
    setLoading(false)
  }, [month])

  useEffect(() => {
    load()
  }, [load])

  async function toggleActive(e: Employee) {
    const { error } = await supabase.from('employees').update({ is_active: !e.is_active }).eq('id', e.id)
    if (error) return setError(errMsg(error))
    load()
  }

  async function remove(e: Employee) {
    if (!window.confirm(`Supprimer ${e.full_name} ET tout son historique de paiements ? Préférez « Désactiver » pour garder la trace.`)) return
    const { error } = await supabase.from('employees').delete().eq('id', e.id)
    if (error) return setError(errMsg(error))
    load()
  }

  const paidFor = (id: string, kind?: 'salary') =>
    payments.filter((p) => p.employee_id === id && (!kind || p.kind === kind)).reduce((s, p) => s + p.amount, 0)

  const monthTotal = payments.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-800">Personnel</h1>
          <p className="text-sm text-slate-600">Employés, salaires, avances et primes.</p>
        </div>
        {mode === null && (
          <button onClick={() => setMode({ type: 'edit' })} className="rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800">
            + Nouvel employé
          </button>
        )}
      </div>

      {error && <p className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>}

      {mode?.type === 'edit' && (
        <EmployeeForm
          key={mode.employee?.id ?? 'new'}
          employee={mode.employee}
          onCancel={() => setMode(null)}
          onDone={() => {
            setMode(null)
            load()
          }}
        />
      )}
      {mode?.type === 'pay' && (
        <PaymentForm
          key={mode.employee.id}
          employee={mode.employee}
          defaultPeriod={month}
          onCancel={() => setMode(null)}
          onDone={() => {
            setMode(null)
            load()
          }}
        />
      )}
      {mode?.type === 'history' && (
        <PaymentHistory key={mode.employee.id} employee={mode.employee} onClose={() => setMode(null)} onChanged={load} />
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <label className="text-sm font-medium text-slate-700">
          Mois :{' '}
          <input
            type="month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className="ml-1 rounded-lg border border-slate-300 px-2 py-1"
          />
        </label>
        <p className="text-sm text-slate-600">
          Payé en {monthLabel(month)} : <strong className="text-brand-800">{formatCDF(monthTotal)}</strong>
        </p>
      </div>

      <div className="space-y-3">
        {loading && <p className="text-slate-500">Chargement…</p>}
        {!loading && employees.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
            Aucun employé enregistré.
          </p>
        )}

        {employees.map((e) => {
          const salaryPaid = paidFor(e.id, 'salary')
          const rest = e.base_salary - salaryPaid
          let badge = { text: 'Salaire non payé', cls: 'bg-accent-50 text-accent-700' }
          if (e.base_salary > 0 && rest <= 0) badge = { text: 'Salaire payé ✓', cls: 'bg-leaf-100 text-leaf-700' }
          else if (salaryPaid > 0) badge = { text: `Reste ${formatCDF(rest)}`, cls: 'bg-amber-100 text-amber-800' }
          const other = paidFor(e.id) - salaryPaid

          return (
            <div key={e.id} className={`rounded-xl border border-slate-200 bg-white p-4 ${e.is_active ? '' : 'opacity-60'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800">
                    {e.full_name}
                    {!e.is_active && <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">Inactif</span>}
                  </p>
                  <p className="text-sm text-slate-500">
                    {[e.job_title, e.phone].filter(Boolean).join(' · ') || '—'}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    Salaire : {formatCDF(e.base_salary)} <span className="text-xs text-slate-500">{formatUSD(e.base_salary, rate)}</span>
                  </p>
                </div>
                {e.is_active && (
                  <div className="text-right">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${badge.cls}`}>{badge.text}</span>
                    {other > 0 && <p className="mt-1 text-xs text-slate-500">Avances/primes : {formatCDF(other)}</p>}
                  </div>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold">
                {e.is_active && (
                  <button onClick={() => setMode({ type: 'pay', employee: e })} className="text-leaf-700 hover:text-leaf-800">Payer</button>
                )}
                <button onClick={() => setMode({ type: 'history', employee: e })} className="text-brand-700 hover:text-brand-900">Historique</button>
                <button onClick={() => setMode({ type: 'edit', employee: e })} className="text-brand-700 hover:text-brand-900">Modifier</button>
                <button onClick={() => toggleActive(e)} className="text-slate-600 hover:text-slate-800">{e.is_active ? 'Désactiver' : 'Réactiver'}</button>
                {isOwner && <button onClick={() => remove(e)} className="text-accent-600 hover:text-accent-700">Supprimer</button>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}