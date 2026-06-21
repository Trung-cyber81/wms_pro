import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error(
    'Thiếu biến môi trường VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY. ' +
    'Hãy kiểm tra file .env.local (khi chạy local) hoặc Environment Variables trên Vercel (khi deploy).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
