import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
export const IS_PRODUCTION = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

export const T = {
  kunden: 'stammblatt_kunden',
  positionen: 'stammblatt_positionen',
  touren: 'stammblatt_touren',
  tour_kunden: 'stammblatt_tour_kunden',
  formular_felder: 'stammblatt_formular_felder',
  kunden_felder: 'stammblatt_kunden_felder',
}

export function createSupabaseClient() {
  if (!IS_PRODUCTION) return null
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
