import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { AppModule, Profile } from '../types/database'

export interface AuthContextValue {
  session: Session | null
  profile: Profile | null
  modules: AppModule[]
  loading: boolean // true tant qu'on ne sait pas encore si quelqu'un est connecté
  isOwner: boolean
  hasModule: (m: AppModule) => boolean
  signIn: (email: string, password: string) => Promise<string | null> // renvoie un message d'erreur ou null
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
