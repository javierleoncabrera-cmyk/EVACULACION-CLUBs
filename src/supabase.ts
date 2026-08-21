import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zvfteytjhriicspbfeg.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZnRleXRqaGpyaWljc3BiZmVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNDAyNzksImV4cCI6MjEwMjgxNjI3OX0.RDUh3zcHSFtPdJ1N7W8P08loV6SzwLYSOSsNRxb53YQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
