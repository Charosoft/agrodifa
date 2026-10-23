import { useCallback, useEffect, useMemo, useState } from 'react'
import MessagesPanel from '../../components/orders/MessagesPanel'
import OrderCard from '../../components/orders/OrderCard'
import { errMsg } from '../../lib/errors'
import { STATUS_LABELS } from '../../lib/labels'
import { supabase } from '../../lib/supabase'
import type { Order, OrderStatus } from '../../types/database'

type Tab = 'orders' | 'messages'
type Filter = 'all' | OrderStatus

const FILTERS: Filter[] = ['all', 'pending', 'confirmed', 'delivered', 'cancelled']

export default function OrdersPage() {
  const [tab, setTab] = useState<Tab>('orders')
  const [filter, setFilter] = useState<Filter>('pending')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(id, product_name, unit_price, quantity)')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) setError(errMsg(error))
    else setError(null)
    setOrders((data as Order[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length }
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1
    return c
  }, [orders])

  const visible = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  const tabClass = (active: boolean) =>
    `border-b-2 px-4 py-2 font-semibold ${active ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-brand-800">Commandes & ventes</h1>

      <div className="mt-4 flex border-b border-slate-200">
        <button onClick={() => setTab('orders')} className={tabClass(tab === 'orders')}>Commandes</button>
        <button onClick={() => setTab('messages')} className={tabClass(tab === 'messages')}>Messages</button>
      </div>

      {tab === 'messages' ? (
        <div className="mt-4">
          <MessagesPanel />
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
                  filter === f ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-brand-600'
                }`}
              >
                {f === 'all' ? 'Toutes' : STATUS_LABELS[f]} ({counts[f] ?? 0})
              </button>
            ))}
          </div>

          {error && <p className="mt-4 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>}

          <div className="mt-4 space-y-3">
            {loading && <p className="text-slate-500">Chargement…</p>}
            {!loading && visible.length === 0 && <p className="text-slate-500">Aucune commande dans cette catégorie.</p>}
            {visible.map((o) => (
              <OrderCard key={o.id} order={o} onChanged={load} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}