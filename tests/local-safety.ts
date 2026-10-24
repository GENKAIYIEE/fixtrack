export function assertLocalTestEnvironment() {
  if (process.env.FIXTRACK_ALLOW_LOCAL_TESTS !== '1') throw new Error('Set FIXTRACK_ALLOW_LOCAL_TESTS=1 to opt into synthetic local test records.');
  for (const name of ['DATABASE_URL', 'DIRECT_URL']) {
    const value = process.env[name];
    if (!value) throw new Error(`${name} is required`);
    const url = new URL(value);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !url.pathname.startsWith('/fixtrack_test')) {
      throw new Error(`${name} must point to a localhost database whose name begins fixtrack_test.`);
    }
  }
  const base = new URL(process.env.NEXTAUTH_URL || 'http://localhost:3100');
  if (!['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)) throw new Error('Workflow tests require a localhost app.');
  if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1').hostname)) {
    throw new Error('Workflow tests must not use live Supabase.');
  }
}
