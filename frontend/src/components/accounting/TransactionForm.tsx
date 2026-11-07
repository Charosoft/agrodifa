import { useEffect, useState } from 'react'
import { CATEGORIES, STAFF_MOTIFS, friendlyPaymentError } from '../../lib/accounting'
import { errMsg } from '../../lib/errors'
import { formatCDF } from '../../lib/format'
import { useUsdRate } from '../../hooks/useUsdRate'
import { KIND_LABELS, PAY_LABELS } from '../../lib/labels'
import { currentMonth, monthLabel } from '../../lib/period'
import { supabase } from '../../lib/supabase'
import type { Employee, PayMethod, PaymentKind, TxType } from '../../types/database'

type Person = Pick<Employee, 'id' | 'full_name' | 'base_salary' | 'transport_fee'>
type Currency = 'CDF' | 'USD'

interface Props {
  onCancel: () => void
  onDone: () => void
}

const OTHER = '__other'
const input = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:outline-none'

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Montant proposé automatiquement selon le motif et la personne (toujours modifiable)
function suggestedAmount(kind: PaymentKind | undefined, p: Person | undefined): string {
  if (!kind || !p) return ''
  const v = kind === 'salary' ? p.base_salary : kind === 'transport' ? p.transport_fee : 0
  return v > 0 ? String(v) : ''
}

export default function TransactionForm({ onCancel, onDone }: Props) {
  const rate = useUsdRate() // taux du propriétaire : 1 $ = X FC
  const [type, setType] = useState<TxType>('expense')
  const [category, setCategory] = useState(CATEGORIES.expense[0].value)
  const [people, setPeople] = useState<Person[]>([])
  const [who, setWho] = useState('') // id d'un employé, OTHER, ou vide
  const [otherName, setOtherName] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>('CDF')
  const [method, setMethod] = useState<PayMethod>('cash')
  const [date, setDate] = useState(today())
  const [period, setPeriod] = useState(currentMonth())
  const [description, setDescription] = useState('')
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const staffKind = type === 'expense' ? STAFF_MOTIFS[category] : undefined
  const person = people.find((p) => p.id === who)
  // Les paiements du personnel restent en FC ; les autres opérations peuvent être payées en dollars
  const usd = currency === 'USD' && !staffKind
  const salaryBlocked = staffKind === 'salary' && person !== undefined && paidIds.has(person.id)

  // Liste du personnel actif, pour choisir le bénéficiaire
  useEffect(() => {
    supabase
      .from('employees')
      .select('id, full_name, base_salary, transport_fee')
      .eq('is_active', true)
      .order('full_name')
      .then(({ data }) => setPeople((data as Person[]) ?? []))
  }, [])

  // Quels salaires sont déjà payés pour ce mois ?
  useEffect(() => {
    if (staffKind !== 'salary') return
    let cancelled = false
    supabase.rpc('salary_paid_ids', { p_period: period }).then(({ data }) => {
      if (!cancelled) setPaidIds(new Set((data as string[] | null) ?? []))
    })
    return () => {
      cancelled = true
    }
  }, [staffKind, period])

  function changeType(t: TxType) {
    setType(t)
    setCategory(CATEGORIES[t][0].value)
    setWho('')
    setAmount('')
  }

  function changeCategory(c: string) {
    setCategory(c)
    const kind = STAFF_MOTIFS[c]
    if (kind) {
      setCurrency('CDF')
      if (who === OTHER) setWho('')
      if (person) setAmount(suggestedAmount(kind, person))
    }
  }

  function changePerson(id: string) {
    setWho(id)
    if (staffKind) setAmount(suggestedAmount(staffKind, people.find((p) => p.id === id)))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const n = Number(amount)
    if (!Number.isFinite(n) || n <= 0) return setError('Entrez un montant supérieur à 0.')
    if (usd && !(rate > 0)) return setError('Le taux du dollar n\'est pas défini : le propriétaire doit le renseigner dans Paramètres.')
    if (!date) return setError('Choisissez la date.')

    let beneficiaryName = ''
    if (type === 'expense') {
      if (!who) return setError('Choisissez le bénéficiaire : qui reçoit cet argent ?')
      if (who === OTHER) {
        beneficiaryName = otherName.trim()
        if (!beneficiaryName) return setError('Écrivez le nom du bénéficiaire.')
      } else {
        beneficiaryName = person?.full_name ?? ''
      }
    }
    if (staffKind && !period) return setError('Choisissez le mois concerné.')
    if (salaryBlocked) return setError(`Le salaire de ${monthLabel(period)} est déjà payé pour ${person?.full_name}.`)
    if (!staffKind && !description.trim()) return setError('Ajoutez une description (ex : « Sac de maïs au marché »).')

    const what = staffKind ? KIND_LABELS[staffKind].toLowerCase() : type === 'income' ? 'cette entrée' : 'cette dépense'
    const to = beneficiaryName ? ` pour ${beneficiaryName}` : ''
    const shown = usd ? `${n.toLocaleString('fr-FR')} $ (≈ ${formatCDF(Math.round(n * rate))} au taux de ${rate.toLocaleString('fr-FR')} FC)` : formatCDF(n)
    if (!window.confirm(`Enregistrer ${what} de ${shown}${to} ? Elle ne pourra être supprimée que par le propriétaire.`)) return

    setSaving(true)
    const paidAt = new Date(`${date}T12:00:00`).toISOString()
    let failure: unknown = null

    if (staffKind && person) {
      // Paiement du personnel : la dépense en comptabilité est créée automatiquement avec le bénéficiaire
      const { error } = await supabase.from('employee_payments').insert({
        employee_id: person.id,
        kind: staffKind,
        amount: n,
        method,
        period,
        note: description.trim() || null,
        paid_at: paidAt,
      })
      if (error) failure = friendlyPaymentError(error, person.full_name, period)
    } else {
      const { error } = await supabase.from('transactions').insert({
        type,
        category,
        // La base refait elle-même le calcul en FC avec le taux officiel : ce montant n'est qu'une indication
        amount: usd ? Math.round(n * rate) : n,
        currency: usd ? 'USD' : 'CDF',
        original_amount: n,
        method,
        description: description.trim(),
        occurred_at: paidAt,
        beneficiary_employee_id: person?.id ?? null,
        beneficiary_name: beneficiaryName || null,
      })
      if (error) failure = errMsg(error)
    }

    setSaving(false)
    if (failure) return setError(String(failure))
    onDone()
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-brand-200 bg-white p-4">
      <h2 className="font-semibold text-brand-800">Nouvelle opération</h2>
      {error && <p className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>}

      <div className="flex gap-2">
        {(['expense', 'income'] as TxType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => changeType(t)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
              type === t
                ? t === 'income'
                  ? 'border-leaf-700 bg-leaf-700 text-white'
                  : 'border-accent-600 bg-accent-600 text-white'
                : 'border-slate-300 bg-white text-slate-700'
            }`}
          >
            {t === 'income' ? 'Entrée d\'argent' : 'Dépense'}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Motif
          <select value={category} onChange={(e) => changeCategory(e.target.value)} className={input}>
            {CATEGORIES[type].map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>

        {type === 'expense' && (
          <label className="block text-sm font-medium text-slate-700">
            Bénéficiaire *
            <select value={who} onChange={(e) => changePerson(e.target.value)} className={input}>
              <option value="">— Choisir —</option>
              <optgroup label="Personnel">
                {people.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </optgroup>
              {!staffKind && <option value={OTHER}>Autre (fournisseur, tiers…)</option>}
            </select>
          </label>
        )}

        {who === OTHER && !staffKind && (
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Nom du bénéficiaire *
            <input value={otherName} onChange={(e) => setOtherName(e.target.value)} placeholder="Ex : Fournisseur Kabamba" className={input} />
          </label>
        )}

        {!staffKind && (
          <label className="block text-sm font-medium text-slate-700">
            Devise de paiement
            <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className={input}>
              <option value="CDF">Franc congolais (FC)</option>
              <option value="USD">Dollar américain ($)</option>
            </select>
          </label>
        )}

        <label className="block text-sm font-medium text-slate-700">
          Montant ({usd ? '$' : 'FC'})
          <input
            type="number"
            min={usd ? '0.01' : '1'}
            step={usd ? '0.01' : '1'}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={input}
          />
          {usd && (
            <span className="mt-1 block text-xs text-slate-600">
              {rate > 0
                ? `Taux : 1 $ = ${rate.toLocaleString('fr-FR')} FC${Number(amount) > 0 ? ` → ${formatCDF(Math.round(Number(amount) * rate))} en comptabilité` : ''}`
                : 'Taux du dollar non défini (Paramètres)'}
            </span>
          )}
          {staffKind && person && suggestedAmount(staffKind, person) && (
            <span className="mt-1 block text-xs text-slate-500">
              Montant habituel de {person.full_name} : {formatCDF(Number(suggestedAmount(staffKind, person)))} (modifiable)
            </span>
          )}
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Moyen de paiement
          <select value={method} onChange={(e) => setMethod(e.target.value as PayMethod)} className={input}>
            {(Object.keys(PAY_LABELS) as PayMethod[]).map((m) => (
              <option key={m} value={m}>{PAY_LABELS[m]}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
        </label>

        {staffKind && (
          <label className="block text-sm font-medium text-slate-700">
            Mois concerné
            <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className={input} />
          </label>
        )}
      </div>

      {salaryBlocked && (
        <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
          Le salaire de {monthLabel(period)} est déjà payé pour {person?.full_name}. Il ne peut pas être enregistré une deuxième fois.
        </p>
      )}

      <label className="block text-sm font-medium text-slate-700">
        {staffKind ? 'Note (facultatif)' : 'Description *'}
        <input value={description} onChange={(e) => setDescription(e.target.value)} className={input} />
      </label>

      {staffKind && (
        <p className="text-xs text-slate-500">
          Ce paiement apparaît aussi dans la fiche de l'employé (Personnel), avec son historique.
        </p>
      )}

      <div className="flex gap-3">
        <button disabled={saving || salaryBlocked} className="rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700">
          Annuler
        </button>
      </div>
    </form>
  )
}