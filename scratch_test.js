import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testAuth() {
  console.log('Testing User Login with new active account...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'teststudent100@pclu.edu',
    password: 'testpassword123',
  });

  if (error) {
    console.error('Login failed:', error.message);
  } else {
    console.log('Login successful for user:', data.user.email);
    console.log('User ID:', data.user.id);
  }
}

testAuth();
