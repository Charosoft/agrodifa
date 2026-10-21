import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'

// Le propriétaire fixe ici le taux CDF/USD utilisé pour afficher les prix en dollars.
export default function SettingsPage() {
  const [rate, setRate] = useState('')
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('app_settings')
      .select('usd_rate, rate_updated_at')
      .single()
      .then(({ data }) => {
        if (data) {
          setRate(String(data.usd_rate))
          setUpdatedAt(data.rate_updated_at)
        }
      })
  }, [])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    const value = Number(rate)
    if (!value || value <= 0) {
      setMessage({ ok: false, text: 'Entrez un taux valide (nombre supérieur à 0).' })
      return
    }
    setSaving(true)
    setMessage(null)
    // .select() renvoie la ligne modifiée : si RLS refuse, on reçoit 0 ligne (et non une erreur).
    const { data, error } = await supabase.from('app_settings').update({ usd_rate: value }).eq('id', true).select()
    setSaving(false)
    if (error || !data || data.length === 0) {
      setMessage({ ok: false, text: 'Enregistrement refusé ou impossible.' })
      return
    }
    setUpdatedAt(data[0].rate_updated_at)
    setMessage({ ok: true, text: 'Taux enregistré.' })
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-brand-800">Paramètres</h1>

      <form onSubmit={handleSave} className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <label htmlFor="rate" className="block text-sm font-medium text-slate-700">
          Taux de change : 1 $ = … FC
        </label>
        <input
          id="rate"
          type="number"
          min="1"
          step="0.01"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:outline-none"
        />
        {updatedAt && (
          <p className="mt-1 text-xs text-slate-500">Dernière modification : {new Date(updatedAt).toLocaleString('fr-FR')}</p>
        )}
        {message && (
          <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${message.ok ? 'bg-leaf-100 text-leaf-700' : 'bg-accent-50 text-accent-700'}`}>
            {message.text}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}
