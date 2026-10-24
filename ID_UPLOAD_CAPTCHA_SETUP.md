# Task 5 follow-up — visible ID upload and local CAPTCHA

## Apply the small patch (recommended for an already configured local project)

1. Stop `npm run dev` with Ctrl+C. Keep the same PowerShell terminal open so your local overrides remain.
2. Back up your existing `src/app/(auth)/register/page.tsx`.
3. Copy the patch's `src/app/(auth)/register/page.tsx` to that same path in your Task 5 project.
4. Leave `.env`, `.env.local`, `supabase/config.toml`, your local database and storage unchanged.
5. Restart `npm run dev`, then refresh http://localhost:3000/register.

The complete-project ZIP also contains this update. Do not replace a working local installation's
private settings or Supabase configuration when copying source from it.

There is NO new migration, environment variable, dependency, status/role change or backend bypass.
Your four existing migrations remain required; do not rerun baseline SQL manually or reset the DB.

## What the upload button does

A visible blue **Upload valid ID photo** button opens the browser file picker. After selection it
shows the filename/size, **Change ID photo**, and **Remove ID photo**. Invalid browser type/size choices
show an error immediately. The server still independently checks the actual image, size/type, CAPTCHA
and registration data. One JPG/PNG/WebP image up to 3MB is supported (existing decoding/pixel limits
also apply). The photo is sent only when registration is submitted; selecting it does not create an
account or upload it immediately. Storage remains the private registration-ids bucket.

## Why CAPTCHA currently says "not configured"

The running Next.js app has no usable NEXT_PUBLIC_TURNSTILE_SITE_KEY. A server-only secret does not
configure the browser widget. Both matching keys are required. The public site key is bundled into
browser assets, so restart the development server after setting it (rebuild for production).

## Enable CAPTCHA for LOCAL development without editing .env

Use the SAME PowerShell terminal where you already pointed BOTH database URLs and all Supabase
settings to your local instance. Do not open an unconfigured terminal that might reload cloud settings.
Stop Next.js with Ctrl+C, then run:

```powershell
$env:NEXT_PUBLIC_TURNSTILE_SITE_KEY = "1x00000000000000000000AA"
$env:TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA"
$env:TURNSTILE_ALLOWED_HOSTNAMES = "localhost,127.0.0.1"
npm run dev
```

These are Cloudflare's documented public always-pass development test keys, NOT private production
credentials. They test the integration, not real bot protection. Internet access is still needed for
the widget and server Siteverify. Do not allow an extension/firewall to block challenges.cloudflare.com.
Refresh the registration page after restarting. The test widget normally completes automatically;
it may not present an image puzzle. Register becomes enabled once a CAPTCHA token is available;
normal required registration/ID validation still applies. Completion does not approve the account.

If it still says not configured, confirm exact variable names and restart from this same terminal.
If it says could not load/expired/failed, check the connection/content blocker and use Retry CAPTCHA.
Closing the terminal removes all temporary overrides; configure them again before running the app.
Never share your real service-role, Turnstile secret, NextAuth secret or database connection string.

## How registration verification works

1. The widget gets a short-lived token using the public site key.
2. Register sends the token, form fields and selected ID to the existing server registration route.
3. The server calls Cloudflare's official Siteverify endpoint with its server-only secret.
4. Invalid/missing/expired/failed verification prevents account creation. Live keys also bind to
   the expected action `register` and allowed hostname. There is no CAPTCHA-disable flag.
5. Valid registration creates STUDENT/PENDING; an ACTIVE ADMIN manually approves/rejects it.

Local private storage/Auth must ALSO be configured: the registration-ids bucket must exist and be
PRIVATE, and the server must have the LOCAL service-role key. A working CAPTCHA does not repair
missing storage, invalid database configuration or absent administrator bootstrap.

## Production later

Create your own Cloudflare Turnstile Managed widget and configure the deployed hostname. Set its
matching NEXT_PUBLIC_TURNSTILE_SITE_KEY and server-only TURNSTILE_SECRET_KEY plus exact comma-separated
TURNSTILE_ALLOWED_HOSTNAMES privately on the deployment platform. Rebuild after public-key changes.
Do not use the public test keys in production; this project intentionally rejects known test secrets
there. CAPTCHA success is not account approval. No push or deployment was performed for this update.

Official references:
- https://developers.cloudflare.com/turnstile/troubleshooting/testing/
- https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
