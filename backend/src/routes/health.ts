import { Router } from 'express'

export const healthRouter = Router()

// GET /api/health : sert au "ping" qui empêche Render de s'endormir.
healthRouter.get('/', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})
