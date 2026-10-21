import { Router } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { requireOwner } from '../middleware/auth'
import { HttpError } from '../middleware/errors'
import { createUserSchema, idSchema, updateUserSchema } from '../schemas/users'

export const usersRouter = Router()

// Toutes les routes de ce fichier sont réservées au propriétaire
usersRouter.use(requireOwner)

// GET /api/users : liste des comptes avec leurs modules
usersRouter.get('/', async (_req, res) => {
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, role, is_active, created_at')
    .order('created_at')
  if (error) throw new HttpError(500, error.message)

  const { data: mods, error: modsError } = await supabaseAdmin.from('user_modules').select('user_id, module')
  if (modsError) throw new HttpError(500, modsError.message)

  // Les emails sont dans le système d'authentification, pas dans profiles
  const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const emails = new Map((authData?.users ?? []).map((u) => [u.id, u.email ?? null]))

  res.json(
    profiles.map((p) => ({
      ...p,
      email: emails.get(p.id) ?? null,
      modules: mods.filter((m) => m.user_id === p.id).map((m) => m.module),
    })),
  )
})

// POST /api/users : créer un employé avec ses modules
usersRouter.post('/', async (req, res) => {
  const input = createUserSchema.parse(req.body)

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true, // pas besoin de confirmer l'email
    user_metadata: { full_name: input.full_name }, // le trigger SQL s'en sert pour créer le profil
  })
  if (error || !data.user) throw new HttpError(400, error?.message ?? 'Création impossible')

  const userId = data.user.id

  if (input.modules.length > 0) {
    const { error: modError } = await supabaseAdmin
      .from('user_modules')
      .insert(input.modules.map((module) => ({ user_id: userId, module })))

    if (modError) {
      await supabaseAdmin.auth.admin.deleteUser(userId) // on annule tout : pas de compte à moitié créé
      throw new HttpError(500, 'Création annulée : ' + modError.message)
    }
  }

  res.status(201).json({ id: userId, email: input.email })
})

// PATCH /api/users/:id : changer les modules et/ou activer-désactiver
usersRouter.patch('/:id', async (req, res) => {
  const id = idSchema.parse(req.params.id)
  const input = updateUserSchema.parse(req.body)

  const { data: target } = await supabaseAdmin.from('profiles').select('role').eq('id', id).single()
  if (!target) throw new HttpError(404, 'Utilisateur introuvable')
  if (target.role === 'owner') throw new HttpError(400, 'Le compte propriétaire ne se modifie pas ici')

  if (input.is_active !== undefined) {
    const { error } = await supabaseAdmin.from('profiles').update({ is_active: input.is_active }).eq('id', id)
    if (error) throw new HttpError(500, error.message)
  }

  if (input.modules !== undefined) {
    // On remplace la liste : on efface les anciens modules, puis on ajoute les nouveaux
    const { error: delError } = await supabaseAdmin.from('user_modules').delete().eq('user_id', id)
    if (delError) throw new HttpError(500, delError.message)

    if (input.modules.length > 0) {
      const { error: insError } = await supabaseAdmin
        .from('user_modules')
        .insert(input.modules.map((module) => ({ user_id: id, module })))
      if (insError) throw new HttpError(500, insError.message)
    }
  }

  res.json({ ok: true })
})