import { useState } from 'react'
import PriceTag from '../ui/PriceTag'
import { errMsg } from '../../lib/errors'
import { formatCDF } from '../../lib/format'
import { PAY_LABELS, STATUS_COLORS, STATUS_LABELS } from '../../lib/labels'
import { toWhatsapp } from '../../lib/phone'
import { supabase } from '../../lib/supabase'
import type { Order, OrderStatus, PayMethod } from '../../types/database'

interface Props {
  order: Order
  onChanged: () => void
}

export default function OrderCard({ order, onChanged }: Props) {
  const [open, setOpen] = useState(false)
  const [pay, setPay] = useState<PayMethod>('cash')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function change(status: OrderStatus) {
    if (status === 'cancelled' && !window.confirm(`Annuler la commande n° ${order.order_number} ?`)) return
    setBusy(true)
    setError(null)
    // À la livraison, on enregistre aussi le moyen de paiement
    const patch = status === 'delivered' ? { status, payment_method: pay } : { status }
    const { data, error } = await supabase.from('orders').update(patch).eq('id', order.id).select('id')
    setBusy(false)
    if (error) {
      return setError(
        error.message.includes('stock_quantity') ? 'Stock insuffisant pour confirmer cette commande' : errMsg(error),
      )
    }
    if (!data || data.length === 0) return setError('Action refusée')
    onChanged()
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-800">
            Commande n° {order.order_number}
            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[order.status]}`}>
              {STATUS_LABELS[order.status]}
            </span>
            {order.source === 'shop' && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Boutique</span>}
          </p>
          <p className="text-sm text-slate-500">{new Date(order.created_at).toLocaleString('fr-FR')}</p>
          <p className="mt-1 text-sm text-slate-700">
            {order.customer_name} ·{' '}
            <a href={`tel:${order.customer_phone}`} className="font-semibold text-brand-700">{order.customer_phone}</a> ·{' '}
            <a href={`https://wa.me/${toWhatsapp(order.customer_phone)}`} target="_blank" rel="noreferrer" className="font-semibold text-leaf-700">
              WhatsApp
            </a>
          </p>
        </div>
        <div className="text-right">
          <PriceTag cdf={order.total} rate={order.usd_rate_used ?? 0} />
          {order.payment_method && <p className="text-xs text-slate-500">Payé : {PAY_LABELS[order.payment_method]}</p>}
        </div>
      </div>

      <button onClick={() => setOpen(!open)} className="mt-3 text-sm font-semibold text-brand-700 hover:text-brand-900">
        {open ? 'Masquer le détail' : `Voir le détail (${order.order_items.length} produit${order.order_items.length > 1 ? 's' : ''})`}
      </button>

      {open && (
        <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
          <ul className="divide-y divide-slate-200">
            {order.order_items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 py-1.5">
                <span>{i.quantity} × {i.product_name}</span>
                <span className="text-slate-600">{formatCDF(i.unit_price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          {order.customer_address && <p className="mt-2 text-slate-600">📍 {order.customer_address}</p>}
          {order.note && <p className="mt-1 text-slate-600">💬 {order.note}</p>}
        </div>
      )}

      {(order.status === 'pending' || order.status === 'confirmed') && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
          {order.status === 'pending' && (
            <button onClick={() => change('confirmed')} disabled={busy} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
              Confirmer
            </button>
          )}
          {order.status === 'confirmed' && (
            <>
              <select value={pay} onChange={(e) => setPay(e.target.value as PayMethod)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
                {Object.entries(PAY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <button onClick={() => change('delivered')} disabled={busy} className="rounded-lg bg-leaf-600 px-4 py-2 text-sm font-semibold text-white hover:bg-leaf-700 disabled:opacity-60">
                Marquer livrée et payée
              </button>
            </>
          )}
          <button onClick={() => change('cancelled')} disabled={busy} className="text-sm font-semibold text-accent-600 hover:text-accent-700">
            Annuler
          </button>
        </div>
      )}

      {error && <p className="mt-3 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>}
    </div>
  )
}