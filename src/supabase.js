import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://crnxfiakltvxlgcrqsoh.supabase.co'
const supabasePublishableKey = 'sb_publishable_ZS7LK2xfHFCRuSogr0xljg_XBinENYH'

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
})