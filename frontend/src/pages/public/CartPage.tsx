import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import PriceTag from '../../components/ui/PriceTag'
import { useCart } from '../../hooks/useCart'
import { useUsdRate } from '../../hooks/useUsdRate'
import { formatCDF } from '../../lib/format'
import { supabase } from '../../lib/supabase'

const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:outline-none'

export default function CartPage() {
  const { items, total, setQuantity, remove, clear, sync } = useCart()
  const rate = useUsdRate()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [trap, setTrap] = useState('') // champ piège invisible : seuls les robots le remplissent
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ number: number; phone: string } | null>(null)

  useEffect(() => {
    document.title = 'Mon panier | AGRODIFA'
  }, [])

  // À l'ouverture : on vérifie les vrais prix et stocks dans la base
  useEffect(() => {
    if (items.length === 0) return
    supabase
      .from('products')
      .select('id, name, price, stock_quantity, is_active')
      .in('id', items.map((i) => i.productId))
      .then(({ data, error }) => {
        if (!error && data) sync(data)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (trap) {
      // Un robot a rempli le champ caché : on fait semblant que tout s'est bien passé
      clear()
      setDone({ number: 0, phone })
      return
    }
    if (name.trim().length < 2) return setError('Entrez votre nom')
    if (!/^[+0-9 ()-]{8,20}$/.test(phone.trim())) return setError('Numéro de téléphone invalide')

    setSubmitting(true)
    // Le serveur recalcule les prix lui-même : on envoie seulement les produits et les quantités
    const { data, error } = await supabase.rpc('create_order', {
      p_name: name.trim(),
      p_phone: phone.trim(),
      p_address: address.trim() || null,
      p_note: note.trim() || null,
      p_items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
    })
    setSubmitting(false)

    if (error) return setError(error.message)
    clear()
    setDone({ number: Number(data), phone: phone.trim() })
  }

  // ----- Commande envoyée -----
  if (done) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-leaf-100 text-3xl text-leaf-700">✓</div>
        <h1 className="mt-4 text-2xl font-bold text-brand-800">Merci pour votre commande !</h1>
        {done.number > 0 && <p className="mt-1 text-lg font-semibold text-slate-700">Commande n° {done.number}</p>}
        <p className="mt-3 text-slate-600">
          Nous vous contacterons au <span className="font-semibold">{done.phone}</span> pour la confirmer.
        </p>
        <Link to="/produits" className="mt-6 inline-block rounded-lg bg-brand-700 px-5 py-2.5 font-semibold text-white hover:bg-brand-800">
          Continuer mes achats
        </Link>
      </main>
    )
  }

  // ----- Panier vide -----
  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-brand-800">Votre panier est vide</h1>
        <p className="mt-2 text-slate-600">Ajoutez des produits pour passer commande.</p>
        <Link to="/produits" className="mt-6 inline-block rounded-lg bg-brand-700 px-5 py-2.5 font-semibold text-white hover:bg-brand-800">
          Voir les produits
        </Link>
      </main>
    )
  }

  // ----- Panier + formulaire -----
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-brand-800">Mon panier</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-3">
          {items.map((i) => (
            <div key={i.productId} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <Link to={`/produits/${i.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {i.image && <img src={i.image} alt={i.name} className="h-full w-full object-cover" />}
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/produits/${i.slug}`} className="font-semibold text-slate-800 hover:text-brand-800">{i.name}</Link>
                <p className="text-sm text-slate-500">{formatCDF(i.price)} / {i.unit}</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center rounded-lg border border-slate-300">
                    <button onClick={() => setQuantity(i.productId, i.quantity - 1)} className="px-3 py-1 font-bold" aria-label="Moins">−</button>
                    <span className="w-8 text-center text-sm font-semibold">{i.quantity}</span>
                    <button onClick={() => setQuantity(i.productId, i.quantity + 1)} disabled={i.quantity >= i.max} className="px-3 py-1 font-bold disabled:text-slate-300" aria-label="Plus">+</button>
                  </div>
                  <button onClick={() => remove(i.productId)} className="text-sm font-semibold text-accent-600 hover:text-accent-700">Retirer</button>
                </div>
                {i.quantity >= i.max && <p className="mt-1 text-xs text-slate-500">Stock maximum atteint</p>}
              </div>
              <p className="font-bold text-brand-800">{formatCDF(i.price * i.quantity)}</p>
            </div>
          ))}

          <div className="flex items-center justify-between rounded-xl bg-brand-50 p-4">
            <span className="font-semibold text-brand-800">Total</span>
            <PriceTag cdf={total} rate={rate} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="h-fit rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
          <h2 className="font-semibold text-brand-800">Vos coordonnées</h2>
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Nom complet *</label>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Téléphone *</label>
              <input className={inputClass} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="tel" placeholder="+243 …" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Adresse de livraison</label>
              <input className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Message (facultatif)</label>
              <textarea className={inputClass} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            {/* Champ piège : invisible pour les humains */}
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
            </div>
          </div>

          {error && <p className="mt-3 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>}

          <button type="submit" disabled={submitting} className="mt-4 w-full rounded-lg bg-accent-600 py-3 font-semibold text-white hover:bg-accent-700 disabled:opacity-60">
            {submitting ? 'Envoi…' : 'Envoyer ma commande'}
          </button>
          <p className="mt-2 text-center text-xs text-slate-500">Le paiement se règle directement avec nous, à la confirmation.</p>
        </form>
      </div>
    </main>
  )
}