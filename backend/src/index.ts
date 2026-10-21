import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env'
import { errorHandler, notFound } from './middleware/errors'
import { healthRouter } from './routes/health'

const app = express()

app.use(helmet()) // en-têtes de sécurité
app.use(cors({ origin: env.corsOrigins })) // seuls nos sites peuvent appeler l'API
app.use(express.json({ limit: '1mb' }))

app.use('/api/health', healthRouter)
// Prochaine étape : app.use('/api/employees', employeesRouter) ...

app.use(notFound)
app.use(errorHandler)

app.listen(env.PORT, () => {
  console.log(`✅ API AGRODIFA sur le port ${env.PORT}`)
})
