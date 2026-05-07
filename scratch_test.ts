import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import fetch from 'node-fetch';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function runTests() {
  console.log('Testing Registration...');
  
  const uniqueEmail = `testuser_${Date.now()}@pclu.edu`;
  const password = 'testpassword123';

  try {
    const regRes = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: uniqueEmail,
        idNumber: `ID-${Date.now()}`,
        department: 'CIT',
        password: password
      })
    });
    
    const regData = await regRes.json();
    console.log('Registration Response:', regRes.status, regData);

    console.log('\nTesting Login...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: uniqueEmail,
      password: password,
    });

    if (error) {
      console.error('Login failed:', error.message);
    } else {
      console.log('Login successful for user:', data.user?.email);
      console.log('User ID:', data.user?.id);
      
      console.log('\nTesting Next.js Login Route...');
      const loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.user?.id })
      });
      const loginData = await loginRes.json();
      console.log('Next.js Login Response:', loginRes.status, loginData);
    }
  } catch (e) {
    console.error('Test error:', e);
  }
}

runTests();
