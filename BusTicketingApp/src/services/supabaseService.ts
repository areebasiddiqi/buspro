import { createClient } from '@supabase/supabase-js';

// TODO: Replace with your actual Supabase project URL and anon key
const SUPABASE_URL = 'https://iahorqybniqsfhvntkwz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhaG9ycXlibmlxc2Zodm50a3d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMTA3MzcsImV4cCI6MjA2Nzg4NjczN30.DeWypUJKIDJV9ADwRwGnUyLDzGD2fHOAJo53qdGUhGA';


if (SUPABASE_URL.includes('YOUR_SUPABASE_URL') || SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY')) {
  throw new Error('Please set your Supabase URL and anon key in src/services/supabaseService.ts');
}

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);