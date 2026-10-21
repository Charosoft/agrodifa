import { supabase } from './supabase'

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
}

// Appelle notre backend Express en envoyant le jeton de connexion.
export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token ?? ''}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    // le backend renvoie { error, details? } : on affiche le message le plus précis
    throw new Error(json.details?.[0]?.message ?? json.error ?? 'Erreur serveur')
  }
  return json as T
}