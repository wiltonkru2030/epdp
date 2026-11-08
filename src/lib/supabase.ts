import { createClient } from '@supabase/supabase-js'

// A chave publishable é própria para uso no navegador.
// A segurança dos dados é garantida pelas políticas RLS do banco.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mfbhzoegjdheayxjwldw.supabase.co'
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_m7QVLPJLKY-P7bzbhRIbSg_IteLvqpr'

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
