import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'

// Erreur HTTP "maison" : throw new HttpError(404, 'Introuvable')
export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Route introuvable' })
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Données invalides',
      details: err.issues.map((i) => ({ champ: i.path.join('.'), message: i.message })),
    })
    return
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message })
    return
  }
  console.error(err)
  res.status(500).json({ error: 'Erreur interne du serveur' })
}
