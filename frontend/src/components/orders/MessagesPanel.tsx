import { useCallback, useEffect, useState } from 'react'
import { errMsg } from '../../lib/errors'
import { toWhatsapp } from '../../lib/phone'
import { supabase } from '../../lib/supabase'
import type { ContactMessage } from '../../types/database'

export default function MessagesPanel() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(200)
    if (error) setError(errMsg(error))
    setMessages((data as ContactMessage[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function toggleRead(m: ContactMessage) {
    const { error } = await supabase.from('messages').update({ is_read: !m.is_read }).eq('id', m.id)
    if (error) return setError(errMsg(error))
    load()
  }

  async function remove(m: ContactMessage) {
    if (!window.confirm('Supprimer ce message ?')) return
    const { error } = await supabase.from('messages').delete().eq('id', m.id)
    if (error) return setError(errMsg(error))
    load()
  }

  if (loading) return <p className="text-slate-500">Chargement…</p>

  return (
    <div className="space-y-3">
      {error && <p className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>}
      {messages.length === 0 && <p className="text-slate-500">Aucun message pour l'instant.</p>}
      {messages.map((m) => (
        <div key={m.id} className={`rounded-xl border p-4 ${m.is_read ? 'border-slate-200 bg-white' : 'border-brand-500 bg-brand-50'}`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="font-semibold text-slate-800">
              {m.name}
              {!m.is_read && <span className="ml-2 rounded-full bg-accent-600 px-2 py-0.5 text-xs font-bold text-white">Nouveau</span>}
            </p>
            <p className="text-xs text-slate-500">{new Date(m.created_at).toLocaleString('fr-FR')}</p>
          </div>
          <p className="mt-2 whitespace-pre-line text-slate-700">{m.content}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold">
            {m.phone && <a href={`tel:${m.phone}`} className="text-brand-700">📞 {m.phone}</a>}
            {m.phone && (
              <a href={`https://wa.me/${toWhatsapp(m.phone)}`} target="_blank" rel="noreferrer" className="text-leaf-700">WhatsApp</a>
            )}
            {m.email && <a href={`mailto:${m.email}`} className="text-brand-700">✉️ {m.email}</a>}
            <button onClick={() => toggleRead(m)} className="text-slate-600 hover:text-slate-800">
              {m.is_read ? 'Marquer non lu' : 'Marquer lu'}
            </button>
            <button onClick={() => remove(m)} className="text-accent-600 hover:text-accent-700">Supprimer</button>
          </div>
        </div>
      ))}
    </div>
  )
}