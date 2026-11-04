import { useCallback, useEffect, useState } from 'react'
import TransactionForm from '../../components/accounting/TransactionForm'
import StatCard from '../../components/dashboard/StatCard'
import { useAuth } from '../../hooks/useAuth'
import { useUsdRate } from '../../hooks/useUsdRate'
import { categoryLabel } from '../../lib/accounting'
import { errMsg } from '../../lib/errors'
import { formatCDF, formatUSD } from '../../lib/format'
import { PAY_LABELS } from '../../lib/labels'
import { currentMonth, monthLabel } from '../../lib/period'
import { supabase } from '../../lib/supabase'
import type { Transaction } from '../../types/database'

type Filter = 'all' | 'income' | 'expense'

// Début du mois et début du mois suivant, à l'heure de l'appareil
function monthRange(period: string): [string, string] {
  const [y, m] = period.split('-').map(Number)
  return [new Date(y, m - 1, 1).toISOString(), new Date(y, m, 1).toISOString()]
}

const NO_BENEFICIARY = 'Non renseigné'

export default function AccountingPage() {
  const { isOwner } = useAuth()
  const rate = useUsdRate()
  const [rows, setRows] = useState<Transaction[]>([])
  const [month, setMonth] = useState(currentMonth())
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [from, to] = monthRange(month)
    const { data, error } = await supabase
      .from('transactions')
      .select(
        'id, type, amount, category, method, description, order_id, employee_payment_id, beneficiary_employee_id, beneficiary_name, occurred_at, created_at, created_by, profiles(full_name)',
      )
      .gte('occurred_at', from)
      .lt('occurred_at', to)
      .order('occurred_at', { ascending: false })
      .limit(500)
    setError(error ? errMsg(error) : null)
    setRows((data as unknown as Transaction[]) ?? [])
    setLoading(false)
  }, [month])

  useEffect(() => {
    load()
  }, [load])

  async function remove(t: Transaction) {
    if (!window.confirm(`Supprimer cette opération de ${formatCDF(t.amount)} ? La suppression est conservée dans le journal d'audit.`)) return
    const { error } = await supabase.from('transactions').delete().eq('id', t.id)
    if (error) return setError(errMsg(error))
    load()
  }

  const income = rows.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0)
  const expense = rows.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
  const balance = income - expense

  // Dépenses du mois regroupées par motif, puis par bénéficiaire (de la plus grosse à la plus petite)
  const group = (key: (r: Transaction) => string) =>
    Object.entries(
      rows
        .filter((r) => r.type === 'expense')
        .reduce<Record<string, number>>((acc, r) => {
          const k = key(r)
          acc[k] = (acc[k] ?? 0) + r.amount
          return acc
        }, {}),
    ).sort((a, b) => b[1] - a[1])

  const byCategory = group((r) => r.category)
  const byBeneficiary = group((r) => r.beneficiary_name || NO_BENEFICIARY)
  const maxBeneficiary = byBeneficiary[0]?.[1] ?? 1

  const creatorName = (t: Transaction) => t.profiles?.full_name || (t.created_by ? 'Utilisateur' : 'Système')

  const q = search.trim().toLowerCase()
  const shown = rows
    .filter((r) => filter === 'all' || r.type === filter)
    .filter(
      (r) =>
        !q ||
        [r.description, r.beneficiary_name, categoryLabel(r.category), creatorName(r)].some((s) => (s ?? '').toLowerCase().includes(q)),
    )

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-800">Comptabilité</h1>
          <p className="text-sm text-slate-600">
            Chaque opération indique le bénéficiaire et qui l'a enregistrée. Les ventes livrées et les paiements du personnel s'ajoutent automatiquement.
          </p>
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)} className="rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800">
            + Nouvelle opération
          </button>
        )}
      </div>

      {error && <p className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>}

      {adding && (
        <TransactionForm
          onCancel={() => setAdding(false)}
          onDone={() => {
            setAdding(false)
            load()
          }}
        />
      )}

      <label className="block text-sm font-medium text-slate-700">
        Mois :{' '}
        <input
          type="month"
          value={month}
          onChange={(e) => e.target.value && setMonth(e.target.value)}
          className="ml-1 rounded-lg border border-slate-300 px-2 py-1"
        />
      </label>

      {!isOwner && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Vous voyez uniquement les opérations que vous avez enregistrées. Les totaux ci-dessous sont donc partiels.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Entrées" value={formatCDF(income)} sub={formatUSD(income, rate)} tone="leaf" />
        <StatCard label="Sorties" value={formatCDF(expense)} sub={formatUSD(expense, rate)} tone="accent" />
        <StatCard
          label={balance >= 0 ? 'Solde (bénéfice)' : 'Solde (perte)'}
          value={formatCDF(balance)}
          sub={`${formatUSD(balance, rate)} · ${monthLabel(month)}`}
          tone={balance >= 0 ? 'brand' : 'accent'}
        />
      </div>

      {byBeneficiary.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-1 font-semibold text-brand-800">Qui a reçu quoi ({monthLabel(month)})</h2>
          <p className="mb-3 text-xs text-slate-500">
            Total des dépenses par bénéficiaire. Motifs : {byCategory.map(([c, v]) => `${categoryLabel(c)} ${formatCDF(v)}`).join(' · ')}
          </p>
          <ul className="space-y-3">
            {byBeneficiary.map(([name, total]) => (
              <li key={name}>
                <div className="flex justify-between text-sm">
                  <span className={`font-medium ${name === NO_BENEFICIARY ? 'text-amber-700' : 'text-slate-700'}`}>{name}</span>
                  <span className="text-slate-500">{formatCDF(total)} · {Math.round((total / expense) * 100)} %</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-accent-500" style={{ width: `${(total / maxBeneficiary) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {([['all', 'Tout'], ['income', 'Entrées'], ['expense', 'Sorties']] as [Filter, string][]).map(([f, label]) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-sm font-semibold ${
              filter === f ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-brand-600'
            }`}
          >
            {label}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (bénéficiaire, motif, auteur…)"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-600 focus:outline-none"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        {loading && <p className="p-4 text-slate-500">Chargement…</p>}
        {!loading && shown.length === 0 && <p className="p-6 text-center text-slate-500">Aucune opération.</p>}

        <ul className="divide-y divide-slate-100">
          {shown.map((t) => {
            const auto = t.order_id !== null || t.employee_payment_id !== null
            return (
              <li key={t.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800">{t.description || categoryLabel(t.category)}</p>
                  <p className="text-xs text-slate-500">
                    {categoryLabel(t.category)} · {PAY_LABELS[t.method]} · {new Date(t.occurred_at).toLocaleDateString('fr-FR')}
                    {auto && ' · automatique'}
                  </p>
                  {t.type === 'expense' && (
                    <p className="mt-0.5 text-sm text-slate-700">
                      Bénéficiaire :{' '}
                      {t.beneficiary_name ? (
                        <strong>{t.beneficiary_name}</strong>
                      ) : (
                        <span className="font-semibold text-amber-700">{NO_BENEFICIARY}</span>
                      )}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    Enregistré par {creatorName(t)} le {new Date(t.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-bold ${t.type === 'income' ? 'text-leaf-700' : 'text-accent-600'}`}>
                    {t.type === 'income' ? '+' : '−'} {formatCDF(t.amount)}
                  </span>
                  {isOwner && !auto && (
                    <button onClick={() => remove(t)} className="text-sm font-semibold text-accent-600 hover:text-accent-700">
                      Supprimer
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}