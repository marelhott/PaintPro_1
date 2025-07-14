
import { createClient } from '@supabase/supabase-js'

// Pro Vite používáme import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug output pro kontrolu
console.log('🔧 Supabase URL:', supabaseUrl ? 'OK' : 'CHYBÍ')
console.log('🔧 Supabase Key:', supabaseAnonKey ? 'OK' : 'CHYBÍ')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Chybí Supabase konfigurace v environment variables!')
  console.error('Zkontrolujte Secrets v Replit:')
  console.error('- VITE_SUPABASE_URL')
  console.error('- VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
