'use client';
import { useCallback, useEffect, useState } from 'react';
import RegistrationIdReview from './RegistrationIdReview';
type Account = { id: string; firstName: string; lastName: string; email: string; idNumber: string | null; department: string | null; role: string; createdAt: string; accountStatus: string; hasRegistrationId: boolean; verificationRejectionReason: string | null };
const labels: Record<string,string> = { PENDING:'Pending', ACTIVE:'Approved / active', REJECTED:'Rejected', INACTIVE:'Inactive' };
export default function AccountVerification({ onDecision }: { onDecision?: () => void }) {
  const [status,setStatus]=useState('PENDING'),[page,setPage]=useState(1),[totalPages,setTotalPages]=useState(1);
  const [accounts,setAccounts]=useState<Account[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [selected,setSelected]=useState<Account|null>(null),[action,setAction]=useState<'APPROVE'|'REJECT'|null>(null),[reason,setReason]=useState(''),[saving,setSaving]=useState(false);
  const load=useCallback((signal?:AbortSignal)=>{
    return fetch(`/api/admin/users?status=${status}&page=${page}&limit=10`,{cache:'no-store',signal})
      .then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error || 'Could not load account verification.');return data;})
      .then(data=>{if(!signal?.aborted){setError('');setAccounts(data.users);setTotalPages(Math.max(1,data.pagination.totalPages));}})
      .catch(error=>{if(error instanceof Error && error.name==='AbortError')return;setError(error instanceof Error?error.message:'Could not load accounts.');})
      .finally(()=>{if(!signal?.aborted)setLoading(false);});
  },[status,page]);
  useEffect(()=>{const controller=new AbortController();void load(controller.signal);return()=>controller.abort();},[load]);
  async function decide() {
    if(!selected || !action || saving)return;setSaving(true);setError('');setNotice('');
    try {
      const response=await fetch(`/api/admin/users/${encodeURIComponent(selected.id)}/verification`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,reason:action==='REJECT'?reason:''})});
      const data=await response.json();if(!response.ok)throw new Error(data.error || 'Could not record the decision.');
      setNotice(data.message);setSelected(null);setAction(null);setReason('');setLoading(true);await load();onDecision?.();
    } catch(error){setError(error instanceof Error?error.message:'Could not save the decision.');}
    finally{setSaving(false);}
  }
  return <section id="account-verification" aria-labelledby="verification-heading" className="rounded-xl border border-outline-variant bg-white p-4 shadow-sm sm:p-6 scroll-mt-24">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="verification-heading" className="text-xl font-semibold text-slate-900">Account verification</h2><p className="mt-1 text-sm text-slate-600">Manually review submitted IDs. Approval preserves the account’s existing role.</p></div><button type="button" disabled={loading || saving} onClick={()=>{setLoading(true);setError('');void load();}} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50">Refresh verification</button></div>
    <label className="mt-4 block text-sm font-medium">Verification status<select aria-label="Verification status" value={status} disabled={saving} onChange={e=>{setLoading(true);setStatus(e.target.value);setPage(1);setSelected(null);setAction(null);setNotice('');}} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-3 sm:max-w-xs">{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
    {notice&&<p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
    {error&&<p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error} Use Refresh verification to reload current records.</p>}
    {loading?<p role="status" className="py-6">Loading verification accounts…</p>:error&&!accounts.length?null:accounts.length===0?<p className="py-6 text-sm text-slate-600">No {labels[status].toLowerCase()} accounts to display.</p>:<div className="mt-4 grid gap-4 lg:grid-cols-2">{accounts.map(account=><article key={account.id} className="min-w-0 rounded-xl border border-slate-200 p-4" aria-label={`Verification for ${account.email}`}>
      <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="break-words font-semibold">{account.firstName} {account.lastName}</h3><span className={`rounded-full px-3 py-1 text-xs font-medium ${account.accountStatus==='REJECTED'?'bg-red-50 text-red-700':account.accountStatus==='ACTIVE'?'bg-green-50 text-green-700':'bg-slate-100 text-slate-700'}`}>{labels[account.accountStatus]}</span></div>
      <dl className="mt-3 space-y-1 break-words text-sm text-slate-700"><div><dt className="inline font-medium">Email: </dt><dd className="inline">{account.email}</dd></div><div><dt className="inline font-medium">Account type / role: </dt><dd className="inline">{account.role==='STUDENT'?'Student':account.role==='TECHNICIAN'?'Technician':'Administrator'}</dd></div><div><dt className="inline font-medium">PCLU ID number: </dt><dd className="inline">{account.idNumber || 'Not provided'}</dd></div><div><dt className="inline font-medium">Department: </dt><dd className="inline">{account.department || 'Not recorded'}</dd></div><div><dt className="inline font-medium">Registered: </dt><dd className="inline">{new Date(account.createdAt).toLocaleString('en-PH',{timeZone:'Asia/Manila'})} (Asia/Manila)</dd></div></dl>
      {account.verificationRejectionReason&&<p className="mt-3 whitespace-pre-wrap break-words text-sm text-red-800">Rejection reason: {account.verificationRejectionReason}</p>}
      <button type="button" disabled={saving} onClick={()=>{setSelected(account);setAction(null);setReason('');setError('');setNotice('');}} className="mt-4 rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-900">Review registration</button>
      {!account.hasRegistrationId&&<p className="mt-2 text-xs text-slate-600">No submitted ID on file. Legacy data was preserved; this account cannot be decided here.</p>}
    </article>)}</div>}
    <div className="mt-4 flex items-center justify-between gap-3 text-sm"><button type="button" disabled={page<=1 || loading || saving} onClick={()=>{setLoading(true);setPage(p=>p-1);}} className="rounded border px-3 py-2 disabled:opacity-40">Previous verification page</button><span>Page {page} of {totalPages}</span><button type="button" disabled={page>=totalPages || loading || saving} onClick={()=>{setLoading(true);setPage(p=>p+1);}} className="rounded border px-3 py-2 disabled:opacity-40">Next verification page</button></div>
    {selected&&<div role="dialog" aria-modal="true" aria-labelledby="review-heading" className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-3"><div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
      <div className="flex items-start justify-between gap-3"><div><h3 id="review-heading" className="text-lg font-semibold">Review {selected.firstName} {selected.lastName}</h3><p className="break-all text-sm text-slate-600">{selected.email} · {selected.idNumber || 'Not provided'}</p></div><button type="button" disabled={saving} onClick={()=>{setSelected(null);setAction(null);}} aria-label="Close verification review" className="rounded border px-3 py-1">Close</button></div>
      <RegistrationIdReview key={selected.id} userId={selected.id}/>
      {error&&<p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {selected.accountStatus==='PENDING'&&selected.hasRegistrationId?<div className="mt-4">
        <p className="text-sm text-slate-700">Check the registration details against the ID manually. Nothing here performs biometric or automated identity matching.</p>
        <div className="mt-3 flex flex-wrap gap-3"><button type="button" disabled={saving} onClick={()=>{setAction('APPROVE');setReason('');}} className="rounded-lg bg-blue-800 px-4 py-2 font-medium text-white">Approve account</button><button type="button" disabled={saving} onClick={()=>setAction('REJECT')} className="rounded-lg border border-red-300 px-4 py-2 font-medium text-red-800">Reject account</button></div>
        {action&&<div className="mt-4 rounded-lg border p-4"><p className="text-sm font-medium">{action==='APPROVE'?'Confirm approval with the existing role?':'Confirm rejection? The user will not be able to access protected features.'}</p>{action==='REJECT'&&<label className="mt-3 block text-sm">Reason shown to the user (optional)<textarea value={reason} disabled={saving} maxLength={300} onChange={e=>setReason(e.target.value)} className="mt-1 block w-full rounded-lg border p-3" rows={3}/><span className="text-xs text-slate-500">{reason.length}/300 — do not include internal notes or unnecessary ID details.</span></label>}<button type="button" disabled={saving} onClick={()=>void decide()} className="mt-3 rounded-lg bg-blue-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving?'Saving decision…':action==='APPROVE'?'Confirm approval':'Confirm rejection'}</button></div>}
      </div>:<p className="mt-4 text-sm text-slate-700">{selected.accountStatus==='PENDING'?'No ID is on file; leave pending until documentation is resolved.':'A decision or inactive state is already recorded. This interface does not reset or reopen it.'}</p>}
    </div></div>}
  </section>;
}
