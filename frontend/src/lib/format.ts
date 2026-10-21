// Tous les prix de la base sont en CDF. Le dollar est calculé à l'affichage.

export function formatCDF(amount: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(Math.round(amount))} FC`
}

export function formatUSD(amountCdf: number, rate: number): string {
  if (!rate || rate <= 0) return ''
  const usd = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(amountCdf / rate)
  return `≈ ${usd}`
}
