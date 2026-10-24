import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testAuth() {
  if (!process.env.LEGACY_TEST_EMAIL || !process.env.LEGACY_TEST_PASSWORD) throw new Error('Set LEGACY_TEST_EMAIL and LEGACY_TEST_PASSWORD explicitly.');
  console.log('Testing User Login with new active account...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: process.env.LEGACY_TEST_EMAIL,
    password: process.env.LEGACY_TEST_PASSWORD,
  });

  if (error) {
    console.error('Login failed:', error.message);
  } else {
    console.log('Login successful for user:', data.user.email);
    console.log('User ID:', data.user.id);
  }
}

testAuth();
