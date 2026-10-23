import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { env } from './config/env'
import { errorHandler, notFound } from './middleware/errors'
import { healthRouter } from './routes/health'
import { usersRouter } from './routes/users'

const app = express()

// Render place un proxy devant l'API : on lui fait confiance pour lire la vraie adresse IP
app.set('trust proxy', 1)

app.use(helmet()) // en-têtes de sécurité
app.use(cors({ origin: env.corsOrigins })) // seuls nos sites peuvent appeler l'API
app.use(express.json({ limit: '1mb' }))

// Anti-abus : 100 requêtes par minute et par adresse IP (assez pour un usage normal)
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Trop de requêtes, réessayez dans une minute.' },
  }),
)

app.use('/api/health', healthRouter)
app.use('/api/users', usersRouter)

app.use(notFound)
app.use(errorHandler)

app.listen(env.PORT, () => {
  console.log(`✅ API AGRODIFA sur le port ${env.PORT}`)
})