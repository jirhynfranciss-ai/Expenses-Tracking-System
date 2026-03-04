import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const isMissing = !SUPABASE_URL || !SUPABASE_ANON_KEY
  || SUPABASE_URL === 'https://ujwmmcfsctfdziijrcym.supabase.co'
  || SUPABASE_ANON_KEY === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqd21tY2ZzY3RmZHppaWpyY3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NTg4MzQsImV4cCI6MjA4ODEzNDgzNH0.0wQ1vAWPwmHBazRpK9uIYY5ewJkNsGISMypuyEDC9L8';

export const isSupabaseConfigured = !isMissing;

export const supabase = createClient(
  isMissing ? 'https://placeholder.supabase.co' : SUPABASE_URL,
  isMissing ? 'placeholder-key' : SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'implicit',
      storageKey: 'spendwise-auth',
      storage: window.localStorage,
    },
  }
);

export function getRedirectUrl(): string {
  return window.location.origin;
}

export function cleanUrl(): void {
  const url = window.location.href;
  const hasHash = url.includes('#access_token=') || url.includes('#error=');
  const hasCode = url.includes('?code=') || url.includes('&code=');
  if (hasHash || hasCode) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}
