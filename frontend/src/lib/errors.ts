// Les erreurs Supabase sont des objets { message }, pas toujours de vraies "Error".
export function errMsg(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message)
  return 'Une erreur est survenue'
}