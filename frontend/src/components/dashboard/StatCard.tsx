interface Props {
  label: string
  value: string
  sub?: string
  tone?: 'brand' | 'accent' | 'leaf'
}

const TONES = {
  brand: 'text-brand-800',
  accent: 'text-accent-600',
  leaf: 'text-leaf-700',
}

export default function StatCard({ label, value, sub, tone = 'brand' }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${TONES[tone]}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}