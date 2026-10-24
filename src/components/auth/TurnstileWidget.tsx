'use client';
import { useEffect, useRef, useState } from 'react';
interface WidgetOptions {
  sitekey: string; action: string; size: 'flexible'; theme: 'light'; retry: 'never'; 'refresh-expired': 'manual';
  callback: (token: string) => void; 'expired-callback': () => void; 'timeout-callback': () => void; 'error-callback': () => boolean;
}
interface TurnstileAPI { render: (el: HTMLElement, options: WidgetOptions) => string; remove: (id: string) => void }
declare global { interface Window { turnstile?: TurnstileAPI } }
let scriptPromise: Promise<TurnstileAPI> | undefined;
function loadTurnstile(): Promise<TurnstileAPI> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true; script.defer = true;
    const timer = window.setTimeout(() => fail(), 15000);
    function fail() { clearTimeout(timer); script.remove(); scriptPromise = undefined; reject(new Error('CAPTCHA could not load. Check your connection or content blocker, then retry.')); }
    script.onerror = fail;
    script.onload = () => { clearTimeout(timer); if (window.turnstile) resolve(window.turnstile); else fail(); };
    document.head.appendChild(script);
  });
  return scriptPromise;
}
export default function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const container = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState('Loading CAPTCHA…');
  useEffect(() => {
    if (!sitekey) return;
    let cancelled = false, widget: string | undefined;
    let api: TurnstileAPI | undefined;
    const fail = (message: string) => { if (!cancelled) { onToken(''); setStatus(message); } };
    const timer = window.setTimeout(() => fail('CAPTCHA is taking too long. Please retry.'), 45000);
    void loadTurnstile().then(loaded => {
      if (cancelled || !container.current) return;
      api = loaded;
      widget = api.render(container.current, {
        sitekey, action: 'register', theme: 'light', size: 'flexible', retry: 'never', 'refresh-expired': 'manual',
        callback: token => { if (!cancelled) { clearTimeout(timer); onToken(token); setStatus('CAPTCHA completed.'); } },
        'expired-callback': () => fail('CAPTCHA expired. Please retry.'),
        'timeout-callback': () => fail('CAPTCHA timed out. Please retry.'),
        'error-callback': () => { clearTimeout(timer); fail('CAPTCHA failed. Please retry.'); return true; },
      });
    }).catch(() => fail('CAPTCHA could not load. Check your connection or content blocker, then retry.'));
    return () => { cancelled = true; clearTimeout(timer); if (api && widget !== undefined) api.remove(widget); };
  }, [sitekey, attempt, onToken]);
  return <section aria-label="Registration CAPTCHA" className="min-w-0 space-y-2 rounded-lg border border-outline-variant p-3">
    <p className="font-medium text-on-surface">CAPTCHA</p>
    <div ref={container} className="min-w-0" />
    <p role="status" className="text-sm text-on-surface-variant">{sitekey ? status : 'CAPTCHA is not configured. Contact the administrator.'}</p>
    {sitekey && <button type="button" className="text-sm font-medium text-secondary underline" onClick={() => { onToken(''); setStatus('Loading CAPTCHA…'); setAttempt(value => value + 1); }}>Retry CAPTCHA</button>}
  </section>;
}
