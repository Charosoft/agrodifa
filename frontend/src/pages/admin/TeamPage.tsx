import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../../lib/api'
import { ADMIN_MODULES } from '../../lib/modules'
import type { AppModule, TeamUser } from '../../types/database'


export default function TeamPage() {
  const [users, setUsers] = useState<TeamUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Formulaire de création
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selected, setSelected] = useState<AppModule[]>([])
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    try {
      setUsers(await api<TeamUser[]>('/api/users'))
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function toggle(list: AppModule[], m: AppModule): AppModule[] {
    return list.includes(m) ? list.filter((x) => x !== m) : [...list, m]
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      await api('/api/users', {
        method: 'POST',
        body: { full_name: fullName, email, password, modules: selected },
      })
      setFullName('')
      setEmail('')
      setPassword('')
      setSelected([])
      await load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setCreating(false)
    }
  }

  async function update(id: string, body: { modules?: AppModule[]; is_active?: boolean }) {
    try {
      await api(`/api/users/${id}`, { method: 'PATCH', body })
      await load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:outline-none'

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-brand-800">Équipe & accès</h1>
      <p className="mt-1 text-slate-600">Créez des comptes et choisissez ce que chaque employé peut voir.</p>

      {error && <p className="mt-4 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>}

      {/* Création */}
      <form onSubmit={handleCreate} className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-brand-800">Nouvel employé</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <input className={inputClass} placeholder="Nom complet" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <input className={inputClass} type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={inputClass} type="password" placeholder="Mot de passe (8 car. min.)" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {ADMIN_MODULES.map((m) => (
            <label key={m.module} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={selected.includes(m.module)} onChange={() => setSelected(toggle(selected, m.module))} />
              {m.label}
            </label>
          ))}
        </div>
        <button type="submit" disabled={creating} className="mt-4 rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
          {creating ? 'Création…' : 'Créer le compte'}
        </button>
      </form>

      {/* Liste */}
      <div className="mt-6 space-y-3">
        {loading && <p className="text-slate-500">Chargement…</p>}
        {users.map((u) => (
          <div key={u.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-800">
                  {u.full_name || '(sans nom)'}
                  <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-800">
                    {u.role === 'owner' ? 'Propriétaire' : 'Employé'}
                  </span>
                  {!u.is_active && <span className="ml-2 rounded-full bg-accent-50 px-2 py-0.5 text-xs font-semibold text-accent-700">Désactivé</span>}
                </p>
                <p className="text-sm text-slate-500">{u.email}</p>
              </div>
              {u.role !== 'owner' && (
                <button onClick={() => update(u.id, { is_active: !u.is_active })} className="text-sm font-semibold text-accent-600 hover:text-accent-700">
                  {u.is_active ? 'Désactiver' : 'Réactiver'}
                </button>
              )}
            </div>

            {u.role === 'owner' ? (
              <p className="mt-2 text-sm text-slate-500">Accès à tous les modules.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                {ADMIN_MODULES.map((m) => (
                  <label key={m.module} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={u.modules.includes(m.module)}
                      onChange={() => update(u.id, { modules: toggle(u.modules, m.module) })}
                    />
                    {m.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}