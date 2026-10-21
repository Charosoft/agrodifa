import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Lit le taux CDF/USD choisi par le propriétaire (table app_settings).
export function useUsdRate(): number {
  const [rate, setRate] = useState(0)

  useEffect(() => {
    supabase
      .from('app_settings')
      .select('usd_rate')
      .single()
      .then(({ data, error }) => {
        if (error) console.error('Erreur taux :', error.message)
        if (data) setRate(Number(data.usd_rate))
      })
  }, [])

  return rate
}
