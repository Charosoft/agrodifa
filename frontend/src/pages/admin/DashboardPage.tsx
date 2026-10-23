import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BarChart from '../../components/dashboard/BarChart'
import StatCard from '../../components/dashboard/StatCard'
import { useAuth } from '../../hooks/useAuth'
import { useUsdRate } from '../../hooks/useUsdRate'
import { errMsg } from '../../lib/errors'
import { formatCDF, formatUSD } from '../../lib/format'
import { ADMIN_MODULES } from '../../lib/modules'
import { supabase } from '../../lib/supabase'
import type { DashboardStats } from '../../types/database'

const PERIODS = [7, 30, 90]

function dayLabel(day: string): string {
  return new Date(`${day}T00:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

// Statistiques réservées au propriétaire
function OwnerStats() {
  const rate = useUsdRate()
  const [days, setDays] = useState(30)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    supabase.rpc('dashboard_stats', { p_days: days }).then(({ data, error }) => {
      if (cancelled) return
      if (error) setError(errMsg(error))
      else {
        setError(null)
        setStats(data as DashboardStats)
      }
    })
    return () => {
      cancelled = true
    }
  }, [days])

  if (error) return <p className="mt-6 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>
  if (!stats) return <p className="mt-6 text-slate-500">Chargement des statistiques…</p>

  const maxProduct = Math.max(...stats.top_products.map((p) => p.revenue), 1)

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ventes aujourd'hui" value={formatCDF(stats.today_revenue)} sub={formatUSD(stats.today_revenue, rate)} />
        <StatCard label="Ventes du mois" value={formatCDF(stats.month_revenue)} sub={`${formatUSD(stats.month_revenue, rate)} · ${stats.month_orders} commande${stats.month_orders > 1 ? 's' : ''}`} tone="leaf" />
        <StatCard label="Commandes en attente" value={String(stats.pending_orders)} sub={`${stats.confirmed_orders} confirmée${stats.confirmed_orders > 1 ? 's' : ''} à livrer`} tone="accent" />
        <StatCard label="Messages non lus" value={String(stats.unread_messages)} />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">Période :</span>
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setDays(p)}
            className={`rounded-full border px-3 py-1 text-sm font-semibold ${
              days === p ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-brand-600'
            }`}
          >
            {p} jours
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-semibold text-brand-800">Ventes par jour (FC)</h2>
          <BarChart
            formatMax={formatCDF}
            data={stats.daily.map((d) => ({
              label: dayLabel(d.day),
              value: d.revenue,
              tooltip: `${dayLabel(d.day)} : ${formatCDF(d.revenue)}`,
            }))}
          />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-semibold text-brand-800">Commandes par jour</h2>
          <BarChart
            barClass="bg-accent-500 group-hover:bg-accent-700"
            formatMax={(n) => String(n)}
            data={stats.daily.map((d) => ({
              label: dayLabel(d.day),
              value: d.orders,
              tooltip: `${dayLabel(d.day)} : ${d.orders} commande${d.orders > 1 ? 's' : ''}`,
            }))}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-semibold text-brand-800">Produits les plus demandés ({days} jours)</h2>
          {stats.top_products.length === 0 ? (
            <p className="text-sm text-slate-500">Pas encore de ventes sur cette période.</p>
          ) : (
            <ul className="space-y-3">
              {stats.top_products.map((p) => (
                <li key={p.name}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{p.name}</span>
                    <span className="text-slate-500">{p.quantity} vendu{p.quantity > 1 ? 's' : ''} · {formatCDF(p.revenue)}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-brand-600" style={{ width: `${(p.revenue / maxProduct) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-semibold text-brand-800">Stock bas</h2>
          {stats.low_stock.length === 0 ? (
            <p className="text-sm text-leaf-700">Tout est bien approvisionné ✓</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {stats.low_stock.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium text-slate-700">{p.name}</span>
                  <span className={p.stock_quantity <= 0 ? 'font-bold text-accent-600' : 'text-slate-600'}>
                    {p.stock_quantity <= 0 ? 'Rupture' : `${p.stock_quantity} ${p.unit}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin/stock" className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:text-brand-900">
            Gérer le stock →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { profile, isOwner, hasModule } = useAuth()
  const available = ADMIN_MODULES.filter((m) => hasModule(m.module))

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-800">Bonjour {profile?.full_name || ''} 👋</h1>

      {isOwner ? (
        <OwnerStats />
      ) : (
        <p className="mt-1 text-slate-600">Voici les sections auxquelles vous avez accès.</p>
      )}

      {available.length === 0 ? (
        <p className="mt-6 rounded-lg bg-accent-50 p-4 text-accent-700">
          Aucun module ne vous a encore été attribué. Contactez le propriétaire.
        </p>
      ) : (
        <>
          {isOwner && <h2 className="mb-3 mt-8 font-semibold text-slate-700">Accès rapide</h2>}
          <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${isOwner ? '' : 'mt-6'}`}>
            {available.map((m) => (
              <Link key={m.module} to={m.path} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-600">
                <h2 className="font-semibold text-brand-800">{m.label}</h2>
                <p className="mt-1 text-sm text-slate-500">{m.description}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}