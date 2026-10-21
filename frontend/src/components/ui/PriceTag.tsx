import { formatCDF, formatUSD } from '../../lib/format'

interface PriceTagProps {
  cdf: number
  rate: number
}

// Prix en FC en grand, équivalent en dollars en petit dessous.
export default function PriceTag({ cdf, rate }: PriceTagProps) {
  return (
    <div>
      <p className="text-lg font-bold text-brand-800">{formatCDF(cdf)}</p>
      <p className="text-xs text-slate-500">{formatUSD(cdf, rate)}</p>
    </div>
  )
}
