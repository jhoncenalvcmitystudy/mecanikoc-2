// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Supabase Client — Mecani-KOC
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SUPABASE_URL = "https://htkrmcoxtmxapckceowj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0a3JtY294dG14YXBja2Nlb3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1OTI1ODMsImV4cCI6MjA5MzE2ODU4M30.1zMRdw34nhvf-9Y9MXeTitodX0hT6YesWtLJd0Ixhkg";

export const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

console.log("✅ Supabase client conectado");