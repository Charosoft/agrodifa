import { useEffect, useState, type FormEvent } from 'react'
import { errMsg } from '../../lib/errors'
import { SITE } from '../../lib/site'
import { supabase } from '../../lib/supabase'

const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:outline-none'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [content, setContent] = useState('')
  const [trap, setTrap] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Contact | AGRODIFA'
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (trap) return setSent(true) // robot : on fait semblant
    setSending(true)
    // Pas de .select() ici : le visiteur peut écrire un message mais pas le relire (RLS)
    const { error } = await supabase.from('messages').insert({
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      content: content.trim(),
    })
    setSending(false)
    if (error) return setError(errMsg(error))
    setSent(true)
  }

  const whatsappUrl = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent('Bonjour AGRODIFA, ')}`

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-brand-800">Contactez-nous</h1>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-xl bg-brand-50 p-4">
            <p className="font-semibold text-brand-800">{SITE.name}</p>
            <p className="mt-2 text-sm text-slate-700">📞 {SITE.phone}</p>
            <p className="text-sm text-slate-700">✉️ {SITE.email}</p>
            <p className="text-sm text-slate-700">📍 {SITE.address}</p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="block rounded-lg bg-leaf-600 py-3 text-center font-semibold text-white hover:bg-leaf-700"
          >
            Écrire sur WhatsApp
          </a>
        </div>

        {sent ? (
          <div className="rounded-xl border border-leaf-600 bg-leaf-100 p-6 text-center">
            <p className="text-lg font-bold text-leaf-700">Message envoyé ✓</p>
            <p className="mt-1 text-sm text-slate-700">Merci, nous vous répondrons très vite.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Nom *</label>
                <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Téléphone</label>
                  <input className={inputClass} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={150} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Message *</label>
                <textarea className={inputClass} rows={5} value={content} onChange={(e) => setContent(e.target.value)} required maxLength={2000} />
              </div>
              <div className="absolute -left-[9999px]" aria-hidden="true">
                <input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
              </div>
            </div>
            {error && <p className="mt-3 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>}
            <button type="submit" disabled={sending} className="mt-4 w-full rounded-lg bg-brand-700 py-2.5 font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
              {sending ? 'Envoi…' : 'Envoyer le message'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}