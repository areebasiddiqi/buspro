import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase URL and anon key
const supabaseUrl = 'https://iahorqybniqsfhvntkwz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhaG9ycXlibmlxc2Zodm50a3d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMTA3MzcsImV4cCI6MjA2Nzg4NjczN30.DeWypUJKIDJV9ADwRwGnUyLDzGD2fHOAJo53qdGUhGA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);