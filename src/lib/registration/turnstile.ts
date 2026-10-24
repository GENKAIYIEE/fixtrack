/** Server verification only. Never import this module into a client component. */
export class RegistrationError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
const ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TEST_SECRETS = new Set(['1x0000000000000000000000000000000AA', '2x0000000000000000000000000000000AA', '3x0000000000000000000000000000000AA']);
export interface TurnstileConfig { secret?: string; hostnames?: string; production: boolean }
export async function verifyTurnstile(token: unknown, config: TurnstileConfig = {
  secret: process.env.TURNSTILE_SECRET_KEY, hostnames: process.env.TURNSTILE_ALLOWED_HOSTNAMES,
  production: process.env.NODE_ENV === 'production',
}, send: typeof fetch = fetch) {
  if (typeof token !== 'string' || !token.trim() || token.length > 2048) throw new RegistrationError('Complete the CAPTCHA before registering.');
  const secret = config.secret?.trim();
  const testKey = !!secret && TEST_SECRETS.has(secret);
  const hosts = (config.hostnames || '').split(',').map(h => h.trim().toLowerCase()).filter(Boolean);
  if (!secret || /^(PASTE_|YOUR_|REPLACE_)/i.test(secret) || (config.production && (testKey || !hosts.length))) throw new RegistrationError('Registration CAPTCHA is not configured. Please contact the administrator.', 503);
  if (testKey && token !== 'XXXX.DUMMY.TOKEN.XXXX') throw new RegistrationError('CAPTCHA verification failed. Complete a new CAPTCHA and try again.');
  let data: unknown;
  try {
    const response = await send(ENDPOINT, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }), cache: 'no-store', signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error('Provider unavailable');
    data = await response.json();
  } catch { throw new RegistrationError('CAPTCHA verification is temporarily unavailable. Retry the CAPTCHA and submit again.', 503); }
  if (!data || typeof data !== 'object') throw new RegistrationError('CAPTCHA verification is temporarily unavailable. Please retry.', 503);
  const result = data as { success?: unknown; hostname?: unknown; action?: unknown; 'error-codes'?: unknown };
  if (result.success !== true) {
    const codes = Array.isArray(result['error-codes']) ? result['error-codes'] : [];
    if (codes.includes('missing-input-secret') || codes.includes('invalid-input-secret')) throw new RegistrationError('Registration CAPTCHA is not configured correctly. Contact the administrator.', 503);
    if (codes.includes('internal-error')) throw new RegistrationError('CAPTCHA verification is temporarily unavailable. Please retry.', 503);
    throw new RegistrationError(codes.includes('timeout-or-duplicate')
      ? 'The CAPTCHA expired or was already used. Complete a new CAPTCHA and try again.'
      : 'CAPTCHA verification failed. Complete a new CAPTCHA and try again.');
  }
  // Official dummy keys do not return the widget's action/hostname consistently. They are
  // accepted only in non-production; Siteverify is STILL called, never bypassed.
  if (!testKey) {
    const allowed = hosts.length ? hosts : ['localhost', '127.0.0.1'];
    if (result.action !== 'register' || typeof result.hostname !== 'string' || !allowed.includes(result.hostname.toLowerCase())) {
      throw new RegistrationError('CAPTCHA verification failed for this registration page. Please retry.');
    }
  }
}
