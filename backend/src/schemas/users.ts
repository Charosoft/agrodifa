import { z } from 'zod'

export const moduleSchema = z.enum(['stock', 'sales', 'staff', 'accounting', 'advertising'])

// Ce que le propriétaire a le droit d'envoyer pour créer un compte
export const createUserSchema = z.object({
  email: z.string().trim().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit avoir au moins 8 caractères'),
  full_name: z.string().trim().min(2, 'Nom trop court').max(100),
  modules: z.array(moduleSchema).default([]),
})

// Ce qu'il peut modifier ensuite
export const updateUserSchema = z
  .object({
    modules: z.array(moduleSchema).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((d) => d.modules !== undefined || d.is_active !== undefined, { message: 'Rien à modifier' })

export const idSchema = z.string().uuid('Identifiant invalide')