'use client';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
export default function SignOutButton() {
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const router=useRouter();
  async function leave() {
    setBusy(true);setError('');
    try { await signOut({redirect:false});router.replace('/login');router.refresh(); }
    catch {setError('Could not sign out. Please retry.');setBusy(false);}
  }
  return <><button type="button" disabled={busy} onClick={leave} className="mt-6 rounded-lg bg-blue-900 px-5 py-3 font-semibold text-white disabled:opacity-60">{busy?'Signing out…':'Sign out and return to login'}</button>{error&&<p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}</>;
}
