import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from './info'

// Create singleton Supabase client
// This ensures only one GoTrueClient instance exists across the entire app
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey
    )
  }
  return supabaseClient
}
