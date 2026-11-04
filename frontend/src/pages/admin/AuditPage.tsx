import { useCallback, useEffect, useState } from 'react'
import { errMsg } from '../../lib/errors'
import { supabase } from '../../lib/supabase'
import type { AuditEntry } from '../../types/database'

const TABLES: { value: string; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'transactions', label: 'Comptabilité' },
  { value: 'employee_payments', label: 'Paiements du personnel' },
  { value: 'employees', label: 'Fiches du personnel' },
  { value: 'orders', label: 'Commandes' },
]

const ACTIONS = {
  create: { label: 'Création', cls: 'bg-leaf-100 text-leaf-700' },
  update: { label: 'Modification', cls: 'bg-brand-100 text-brand-800' },
  delete: { label: 'Suppression', cls: 'bg-accent-50 text-accent-700' },
}

const tableLabel = (t: string) => TABLES.find((x) => x.value === t)?.label ?? t

// Réservé au propriétaire : qui a fait quoi, et quand. Personne ne peut modifier ce journal.
export default function AuditPage() {
  const [rows, setRows] = useState<AuditEntry[]>([])
  const [table, setTable] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    let query = supabase
      .from('audit_log')
      .select('id, at, actor_id, actor_name, action, table_name, record_id, summary')
      .order('id', { ascending: false })
      .limit(300)
    if (table !== 'all') query = query.eq('table_name', table)
    const { data, error } = await query
    setError(error ? errMsg(error) : null)
    setRows((data as AuditEntry[]) ?? [])
    setLoading(false)
  }, [table])

  useEffect(() => {
    load()
  }, [load])

  const q = search.trim().toLowerCase()
  const shown = rows.filter((r) => !q || `${r.summary} ${r.actor_name ?? ''}`.toLowerCase().includes(q))
  const who = (r: AuditEntry) => r.actor_name || (r.actor_id ? 'Utilisateur' : 'Système')

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">Journal d'audit</h1>
        <p className="text-sm text-slate-600">
        Ce journal ne peut pas être modifié ni effacé.
        </p>
      </div>

      {error && <p className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        {TABLES.map((t) => (
          <button
            key={t.value}
            onClick={() => setTable(t.value)}
            className={`rounded-full border px-3 py-1 text-sm font-semibold ${
              table === t.value ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-brand-600'
            }`}
          >
            {t.label}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (nom, montant…)"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-600 focus:outline-none"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        {loading && <p className="p-4 text-slate-500">Chargement…</p>}
        {!loading && shown.length === 0 && <p className="p-6 text-center text-slate-500">Aucun événement.</p>}
        <ul className="divide-y divide-slate-100">
          {shown.map((r) => (
            <li key={r.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className={`rounded-full px-2 py-0.5 font-semibold ${ACTIONS[r.action].cls}`}>{ACTIONS[r.action].label}</span>
                <span>{tableLabel(r.table_name)}</span>
                <span>· {new Date(r.at).toLocaleString('fr-FR')}</span>
                <span>· par <strong className="text-slate-700">{who(r)}</strong></span>
              </div>
              <p className="mt-1 text-sm text-slate-800">{r.summary}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}