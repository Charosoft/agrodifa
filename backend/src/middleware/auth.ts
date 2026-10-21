import type { RequestHandler } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { HttpError } from './errors'

// Vérifie que l'appelant est connecté ET est le propriétaire.
// Le navigateur envoie son "jeton" dans l'en-tête : Authorization: Bearer <jeton>
export const requireOwner: RequestHandler = async (req, res, next) => {
  try {
    const header = req.headers.authorization ?? ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    if (!token) throw new HttpError(401, 'Non connecté')

    // Supabase vérifie lui-même que le jeton est authentique et non expiré
    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !data.user) throw new HttpError(401, 'Session invalide')

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, is_active')
      .eq('id', data.user.id)
      .single()

    if (!profile || !profile.is_active || profile.role !== 'owner') {
      throw new HttpError(403, 'Réservé au propriétaire')
    }

    res.locals.userId = data.user.id
    next()
  } catch (err) {
    next(err)
  }
}