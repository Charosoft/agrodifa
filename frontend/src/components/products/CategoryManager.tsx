import { useState, type FormEvent } from 'react'
import { errMsg } from '../../lib/errors'
import { slugify } from '../../lib/slug'
import { supabase } from '../../lib/supabase'
import type { Category } from '../../types/database'

interface Props {
  categories: Category[]
  onChange: () => void
}

export default function CategoryManager({ categories, onChange }: Props) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function add(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const clean = name.trim()
    if (!clean) return
    const { error } = await supabase.from('categories').insert({ name: clean, slug: slugify(clean) })
    if (error) return setError(errMsg(error))
    setName('')
    onChange()
  }

  async function remove(c: Category) {
    if (!window.confirm(`Supprimer la catégorie « ${c.name} » ? Les produits resteront, sans catégorie.`)) return
    const { error } = await supabase.from('categories').delete().eq('id', c.id)
    if (error) return setError(errMsg(error))
    onChange()
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="font-semibold text-brand-800">Catégories</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {categories.length === 0 && <p className="text-sm text-slate-500">Aucune catégorie pour l'instant.</p>}
        {categories.map((c) => (
          <span key={c.id} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-800">
            {c.name}
            <button type="button" onClick={() => remove(c)} className="text-accent-600 hover:text-accent-700" aria-label={`Supprimer ${c.name}`}>
              ×
            </button>
          </span>
        ))}
      </div>
      <form onSubmit={add} className="mt-3 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nouvelle catégorie (ex : Volaille)"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
        />
        <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
          Ajouter
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-accent-700">{error}</p>}
    </div>
  )
}