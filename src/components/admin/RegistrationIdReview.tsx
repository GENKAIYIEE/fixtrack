'use client';
import { useEffect, useState } from 'react';
export default function RegistrationIdReview({ userId }: { userId: string }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!url) return;
    const timer = setTimeout(() => setUrl(''), 60000);
    return () => clearTimeout(timer);
  }, [url]);
  async function open() {
    setLoading(true); setError(''); setUrl('');
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/id-photo`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load the ID photo.');
      setUrl(data.url);
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not load the ID photo.'); }
    finally { setLoading(false); }
  }
  return <section aria-label="Registration ID review" className="border-b border-outline-variant p-5">
    <h3 className="font-semibold text-on-surface">Registration ID review</h3>
    <p className="mt-2 text-sm text-on-surface-variant">Review the submitted ID before approving a pending account. This is manual review, not face recognition. Do not share or download the ID unnecessarily.</p>
    <button type="button" disabled={loading} onClick={open} className="mt-3 rounded-lg border border-outline-variant px-4 py-2 text-sm font-medium text-secondary disabled:opacity-50">{loading ? 'Loading ID…' : 'Review ID photo'}</button>
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    {url && <div className="mt-3 space-y-2">
      {/* Identity documents remain private; only a short-lived administrator-authorized URL is used. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Submitted valid ID for administrator review" referrerPolicy="no-referrer" className="max-h-80 w-full rounded-lg border border-outline-variant object-contain" />
      <button type="button" onClick={() => setUrl('')} className="text-sm text-secondary underline">Hide ID photo</button>
      <p className="text-xs text-on-surface-variant">The preview closes after 60 seconds. Review again to obtain a new temporary link.</p>
    </div>}
  </section>;
}
