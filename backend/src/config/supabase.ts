import { createClient } from '@supabase/supabase-js'
import { env } from './env'

// Client ADMIN (clé service_role) : contourne RLS.
// À n'utiliser que dans des routes qu'on a protégées nous-mêmes.
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
