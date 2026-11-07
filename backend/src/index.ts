import path from 'node:path'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { env } from './config/env'
import { errorHandler, notFound } from './middleware/errors'
import { healthRouter } from './routes/health'
import { mediaRouter } from './routes/media'
import { usersRouter } from './routes/users'

const app = express()

// Un proxy se trouve devant l'API : on lui fait confiance pour lire la vraie adresse IP
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

// Sur Alwaysdata, les fichiers de /media sont servis directement par le serveur web.
// Ce dossier ne sert qu'en local, pour voir les images pendant le développement.
app.use(
  '/media',
  express.static(path.resolve(env.MEDIA_DIR), {
    setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
  }),
)

app.use('/api/health', healthRouter)
app.use('/api/users', usersRouter)
app.use('/api/media', mediaRouter)

app.use(notFound)
app.use(errorHandler)

// Alwaysdata impose d'écouter sur l'adresse IP qu'il fournit (variable IP ou HOST).
// Sur Render ou en local, ces variables n'existent pas : on écoute alors partout, comme avant.
const host = process.env.IP ?? process.env.HOST
const onListen = () => console.log(`✅ API AGRODIFA sur le port ${env.PORT}${host ? ` (${host})` : ''}`)

if (host) app.listen(env.PORT, host, onListen)
else app.listen(env.PORT, onListen)