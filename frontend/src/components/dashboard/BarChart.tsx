export interface BarPoint {
  label: string
  value: number
  tooltip: string
}

interface Props {
  data: BarPoint[]
  barClass?: string
  formatMax: (n: number) => string
}

// Histogramme en simples <div> : hauteur de la barre = valeur / maximum
export default function BarChart({ data, barClass = 'bg-brand-600 group-hover:bg-brand-800', formatMax }: Props) {
  const max = Math.max(...data.map((d) => d.value), 0)
  const last = data.length - 1
  const middle = Math.floor(last / 2)

  return (
    <div>
      <div className="mb-1 text-xs text-slate-400">{max > 0 ? `max : ${formatMax(max)}` : 'Aucune donnée'}</div>
      <div className="flex h-44 items-end gap-0.5 border-b border-slate-200">
        {data.map((d) => (
          <div key={d.label} className="group flex h-full flex-1 items-end" title={d.tooltip}>
            <div
              className={`w-full rounded-t ${barClass}`}
              style={{ height: d.value > 0 ? `${Math.max((d.value / max) * 100, 3)}%` : '2px' }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-slate-400">
        <span>{data[0]?.label}</span>
        <span>{data[middle]?.label}</span>
        <span>{data[last]?.label}</span>
      </div>
    </div>
  )
}