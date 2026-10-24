import 'dotenv/config';
import { pathToFileURL } from 'node:url';
export function checkProductionConfig(env: Partial<NodeJS.ProcessEnv>): { errors: string[]; warnings: string[] } {
  const errors: string[] = [], warnings: string[] = [];
  const required = ['DATABASE_URL','DIRECT_URL','NEXTAUTH_URL','NEXTAUTH_SECRET','NEXT_PUBLIC_BASE_URL','NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','NEXT_PUBLIC_TURNSTILE_SITE_KEY','TURNSTILE_SECRET_KEY','TURNSTILE_ALLOWED_HOSTNAMES'];
  const value = (key: string) => env[key]?.trim() || '';
  for (const key of required) if (!value(key) || /REPLACE_|YOUR_|\[REDACTED\]/i.test(value(key))) errors.push(`${key}: missing or still a placeholder.`);
  const url = (key: string, protocols: string[]) => {
    if (!value(key)) return undefined;
    try {
      const parsed = new URL(value(key));
      if (!protocols.includes(parsed.protocol) || ['localhost','127.0.0.1','0.0.0.0','::1','[::1]'].includes(parsed.hostname)) errors.push(`${key}: use a hosted production URL with the correct protocol, not localhost.`);
      return parsed;
    } catch { errors.push(`${key}: invalid URL.`); return undefined; }
  };
  const auth = url('NEXTAUTH_URL',['https:']);
  const base = url('NEXT_PUBLIC_BASE_URL',['https:']);
  url('NEXT_PUBLIC_SUPABASE_URL',['https:']);
  url('DATABASE_URL',['postgres:','postgresql:']); url('DIRECT_URL',['postgres:','postgresql:']);
  if (auth && base && auth.origin !== base.origin) errors.push('NEXTAUTH_URL and NEXT_PUBLIC_BASE_URL must use the same production origin.');
  if (value('NEXTAUTH_SECRET').length < 32) errors.push('NEXTAUTH_SECRET: use at least 32 random characters; preserve the existing strong production secret where possible.');
  for (const key of ['NEXT_PUBLIC_TURNSTILE_SITE_KEY','TURNSTILE_SECRET_KEY']) if (/^[123]x0+/.test(value(key))) errors.push(`${key}: documented dummy test keys cannot be used in production.`);
  const hosts = value('TURNSTILE_ALLOWED_HOSTNAMES').split(',').map(h=>h.trim().toLowerCase()).filter(Boolean);
  if (hosts.some(h=>h.includes('://')||h.includes('/')||h.includes(':')||h==='localhost'||h==='127.0.0.1')) errors.push('TURNSTILE_ALLOWED_HOSTNAMES: exact production hostnames only, no scheme, port, path or localhost.');
  if (auth && !hosts.includes(auth.hostname.toLowerCase())) errors.push('TURNSTILE_ALLOWED_HOSTNAMES must include the production NEXTAUTH_URL hostname.');
  if (value('SUPABASE_SERVICE_ROLE_KEY') && value('SUPABASE_SERVICE_ROLE_KEY') === value('NEXT_PUBLIC_SUPABASE_ANON_KEY')) errors.push('Supabase server service-role and public anon keys must be different.');
  for (const [key, secret] of Object.entries(env)) {
    if (key.startsWith('NEXT_PUBLIC_') && /SERVICE_ROLE|DATABASE_URL|DIRECT_URL|TURNSTILE_SECRET|NEXTAUTH_SECRET|SMTP_PASS/.test(key) && secret) errors.push(`${key}: secret must not use a public variable name.`);
    if (/^FIXTRACK_ALLOW_|^FIXTRACK_ACK_|^SEED_|^LEGACY_/.test(key) && secret && secret !== '0') errors.push(`${key}: unset test/setup/seed/recovery variables for production.`);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value('TECHNICIAN_HEAD_EMAIL') || 'tech@gmail.com')) errors.push('TECHNICIAN_HEAD_EMAIL: invalid email.');
  if (!value('SMTP_USER') || !value('SMTP_PASS')) warnings.push('SMTP credentials missing: existing password-reset email delivery will not work.');
  if (value('DATABASE_URL') === value('DIRECT_URL')) warnings.push('Runtime and migration URLs are identical: verify appropriate Supabase pooler mode and connection capacity.');
  return { errors, warnings };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = checkProductionConfig(process.env);
  for (const message of result.errors) console.error(`FAIL: ${message}`);
  for (const message of result.warnings) console.warn(`WARN: ${message}`);
  if (!result.errors.length) console.log('PASS: configuration shape only. Live credentials, schema, storage policies, account status and provider/domain ownership still need verification. No service was contacted or changed.');
  process.exitCode = result.errors.length ? 1 : 0;
}
