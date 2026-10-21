import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !key) {
  throw new Error('Variables Supabase manquantes : copie .env.example vers .env.local et remplis-le.')
}

// Un seul client partagé dans toute l'application.
export const supabase = createClient(url, key)
