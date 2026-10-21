import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { AppModule, Profile } from '../types/database'
import { AuthContext, type AuthContextValue } from './auth-context'

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  // Profil et modules chargés pour UN utilisateur précis (on mémorise de qui ils sont)
  const [loaded, setLoaded] = useState<{ userId: string; profile: Profile | null; modules: AppModule[] } | null>(null)

  // 1) Suivre la session (connecté ou non)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setSessionReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Important : ici on met seulement à jour l'état, on n'appelle pas d'autre requête Supabase.
      setSession(newSession)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // 2) Quand l'utilisateur change, charger son profil et ses modules
  const userId = session?.user.id
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    Promise.all([
      supabase.from('profiles').select('id, full_name, role, is_active').eq('id', userId).single(),
      supabase.from('user_modules').select('module').eq('user_id', userId),
    ]).then(([p, m]) => {
      if (cancelled) return
      setLoaded({
        userId,
        profile: (p.data as Profile | null) ?? null,
        modules: (m.data ?? []).map((row) => row.module as AppModule),
      })
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  // Valeurs dérivées : on n'utilise le profil que s'il correspond à l'utilisateur connecté
  const current = userId && loaded?.userId === userId ? loaded : null
  const profile = current?.profile ?? null
  const modules = current?.modules ?? []
  const profileReady = !userId || current !== null

  const isOwner = profile?.role === 'owner'

  const value: AuthContextValue = {
    session,
    profile,
    modules,
    loading: !sessionReady || !profileReady,
    isOwner,
    hasModule: (m) => isOwner || modules.includes(m), // le propriétaire a tous les modules
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (!error) return null
      return error.message === 'Invalid login credentials'
        ? 'Email ou mot de passe incorrect.'
        : 'Connexion impossible : ' + error.message
    },
    signOut: async () => {
      await supabase.auth.signOut()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
