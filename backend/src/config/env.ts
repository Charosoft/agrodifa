import 'dotenv/config'
import { z } from 'zod'

// On vérifie les variables d'environnement AU DÉMARRAGE :
// mieux vaut un message clair tout de suite qu'un bug mystérieux plus tard.
const schema = z.object({
  PORT: z.coerce.number().default(4000),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  CORS_ORIGINS: z.string().default(''),
})

const result = schema.safeParse(process.env)

if (!result.success) {
  console.error('❌ Variables d\'environnement invalides :')
  for (const issue of result.error.issues) {
    console.error(`  - ${issue.path.join('.')} : ${issue.message}`)
  }
  process.exit(1)
}

export const env = {
  ...result.data,
  corsOrigins: result.data.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
}
