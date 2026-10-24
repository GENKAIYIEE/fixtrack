'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import TurnstileWidget from '@/components/auth/TurnstileWidget';

const calculatePasswordStrength = (pass: string) => {
  const reqs = {
    length: pass.length >= 8,
    lowercase: /[a-z]/.test(pass),
    uppercase: /[A-Z]/.test(pass),
    number: /[0-9]/.test(pass),
    special: /[^a-zA-Z0-9]/.test(pass),
  };

  if (!pass) return { score: 0, label: '', color: 'bg-transparent', text: '', reqs };
  
  let score = 0;
  if (reqs.length) score += 1;
  if (reqs.lowercase) score += 1;
  if (reqs.uppercase) score += 1;
  if (reqs.number) score += 1;
  if (reqs.special) score += 1;

  if (!reqs.length) {
    score = Math.min(score, 2);
  }

  if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500', text: 'text-red-500', reqs };
  if (score <= 4) return { score, label: 'Medium', color: 'bg-yellow-500', text: 'text-yellow-600', reqs };
  return { score, label: 'Strong', color: 'bg-green-500', text: 'text-green-600', reqs };
};

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const idPhotoInput = useRef<HTMLInputElement>(null);
  const [idPhotoError, setIdPhotoError] = useState('');
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaRevision, setCaptchaRevision] = useState(0);
  const [fileRevision, setFileRevision] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const strength = calculatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Basic required field validation
    if (!firstName || !lastName || !email || !department || !password || !confirmPassword) {
      setErrorMessage('All fields are required.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    if (strength.score <= 2) {
      setErrorMessage('Password is too weak. Please include a mix of uppercase/lowercase letters, numbers, and special characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!idPhoto || idPhoto.size > 3 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(idPhoto.type)) {
      setErrorMessage('Upload one JPG, PNG, or WEBP photo of your valid ID, no larger than 3MB.'); return;
    }
    if (!captchaToken) { setErrorMessage('Complete the CAPTCHA before registering.'); return; }
    setIsLoading(true);

    try {
      const form = new FormData();
      for (const [key, value] of Object.entries({ firstName, lastName, email, department, password, turnstileToken: captchaToken })) form.append(key, value);
      form.append('idPhoto', idPhoto);
      const response = await fetch('/api/auth/register', { method: 'POST', body: form });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || 'An error occurred during registration.');
        return;
      }

      setSuccessMessage(data.message || 'Your account is pending administrator review. You cannot log in until it is approved.');
      setIdPhoto(null); setIdPhotoError(''); setFileRevision(value => value + 1);
      
      // Clear form
      setFirstName('');
      setLastName('');
      setEmail('');
      setDepartment('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setCaptchaToken(''); setCaptchaRevision(value => value + 1);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-surface-container-lowest overflow-hidden">
      {/* Left Panel (Brand / Image) */}
      <div className="hidden lg:flex w-[45%] bg-primary-container relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 w-full h-full opacity-40 mix-blend-overlay">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            alt="Corporate modern aesthetic" 
            className="w-full h-full object-cover grayscale brightness-75" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqwK9SGAj-2N7cZTRGjWucfLLzY7q7bMUQ6P-splLp1nwc8B8J_1rT9yP-Bm51YJO2BjbJW7REg99KjgrrjX80YF-nBTwVlZsa63Bffqx07hA7vESeZccWghrV85BqJLl5nLlPz350jsD5te0BAXfG3jZdCYtT7fGU_xke9ec_MsER7pTDeKR3Qd8E-fTMAB8yb4f9oOLRpW9kkkH62Suxowdf2e4SZ-4VNIVK7bCkpWoZ9I_EEmUdjS14aCokkUYI2c-CzVgX-S4"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary-container/90 to-primary/95"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8 text-on-primary">
            <span className="material-symbols-outlined text-h1 font-h1" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
            <span className="font-h2 text-h2 uppercase tracking-tighter">FIXTRACK</span>
          </div>
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="font-h1 text-h1 text-on-primary mb-6">Systematic Order & High-Velocity Efficiency.</h2>
          <p className="font-body text-body text-primary-fixed-dim">
            Join the administrative platform built to handle complex facility operations with absolute precision and clarity.
          </p>
        </div>
      </div>
      
      {/* Right Panel (Registration Form) */}
      <div className="w-full lg:w-[55%] h-screen overflow-y-auto relative bg-surface-container-lowest">
        <Link 
          href="/login" 
          className="absolute top-6 left-6 lg:top-8 lg:left-8 z-10 inline-flex items-center justify-center w-10 h-10 rounded-full border border-outline-variant text-on-surface bg-surface-container-lowest hover:bg-surface-container transition-all"
          title="Back to Login"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
        </Link>
        
        <div className="flex flex-col min-h-full p-6 lg:p-8 pt-24 lg:pt-24 pb-12">
          <div className="w-full max-w-[512px] mx-auto my-auto">
            <div className="mb-8">
              <h1 className="font-sans text-h1 text-on-surface mb-2">Create Your Account</h1>
              <p className="font-sans text-body text-on-surface-variant">Fill in your details to request system access</p>
          </div>
          

          
          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* First & Last Name */}
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1 flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="firstName">First Name</label>
                <input 
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-DEFAULT px-4 py-3 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors" 
                  id="firstName" 
                  name="firstName" 
                  placeholder="Enter first name" 
                  required 
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isLoading || successMessage !== null}
                />
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="lastName">Last Name</label>
                <input 
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-DEFAULT px-4 py-3 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors" 
                  id="lastName" 
                  name="lastName" 
                  placeholder="Enter last name" 
                  required 
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isLoading || successMessage !== null}
                />
              </div>
            </div>
            
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="email">Email</label>
              <input 
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-DEFAULT px-4 py-3 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors" 
                id="email" 
                name="email" 
                placeholder="name@institution.edu" 
                required 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || successMessage !== null}
              />
            </div>
            
            {/* Department */}
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="department">Department</label>
              <div className="relative">
                <select 
                  className="w-full appearance-none bg-surface-container-lowest border border-outline-variant rounded-DEFAULT px-4 py-3 pr-8 font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors" 
                  id="department" 
                  name="department" 
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={isLoading || successMessage !== null}
                >
                  <option disabled value="">Select department</option>
                  <option value="BSIT">BSIT</option>
                  <option value="BEED/BSE">BEED/BSE</option>
                  <option value="BSBA">BSBA</option>
                  <option value="BSHM">BSHM</option>
                  <option value="BSTM">BSTM</option>
                  <option value="MARINE">MARINE</option>
                  <option value="CRIM">CRIM</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
              </div>
            </div>
            
            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="password">Password</label>
              <input 
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-DEFAULT px-4 py-3 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors" 
                id="password" 
                name="password" 
                placeholder="Create a strong password" 
                required 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || successMessage !== null}
              />
              {password && (
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex gap-1 h-1.5 w-full">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div 
                        key={level} 
                        className={`h-full flex-1 rounded-full transition-colors duration-300 ${strength.score >= level ? strength.color : 'bg-gray-200'}`}
                      ></div>
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${strength.text}`}>
                    {strength.label}
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1 text-xs text-on-surface-variant">
                    <div className={`flex items-center gap-1 ${strength.reqs.length ? 'text-green-600' : 'opacity-70'}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{strength.reqs.length ? 'check' : 'close'}</span>
                      At least 8 characters
                    </div>
                    <div className={`flex items-center gap-1 ${strength.reqs.uppercase ? 'text-green-600' : 'opacity-70'}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{strength.reqs.uppercase ? 'check' : 'close'}</span>
                      Uppercase letter
                    </div>
                    <div className={`flex items-center gap-1 ${strength.reqs.lowercase ? 'text-green-600' : 'opacity-70'}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{strength.reqs.lowercase ? 'check' : 'close'}</span>
                      Lowercase letter
                    </div>
                    <div className={`flex items-center gap-1 ${strength.reqs.number ? 'text-green-600' : 'opacity-70'}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{strength.reqs.number ? 'check' : 'close'}</span>
                      Number
                    </div>
                    <div className={`flex items-center gap-1 ${strength.reqs.special ? 'text-green-600' : 'opacity-70'}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{strength.reqs.special ? 'check' : 'close'}</span>
                      Special character
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Confirm Password */}
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="confirmPassword">Confirm Password</label>
              <input 
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-DEFAULT px-4 py-3 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors" 
                id="confirmPassword" 
                name="confirmPassword" 
                placeholder="Repeat password" 
                required 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading || successMessage !== null}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label htmlFor="idPhoto" className="font-label-md text-label-md text-on-surface-variant">Photo of Valid ID</label>
              <input key={fileRevision} ref={idPhotoInput} id="idPhoto" name="idPhoto" type="file" required accept="image/jpeg,image/png,image/webp"
                disabled={isLoading || successMessage !== null} tabIndex={-1}
                onChange={event => {
                  const file = event.target.files?.[0] || null;
                  setErrorMessage(null); setIdPhotoError('');
                  if (file && (file.size === 0 || file.size > 3 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
                    setIdPhoto(null); setIdPhotoError('Choose one JPG, PNG, or WEBP image, no larger than 3MB.'); setFileRevision(value => value + 1); return;
                  }
                  setIdPhoto(file);
                }}
                aria-describedby="id-photo-help id-photo-selection" aria-invalid={Boolean(idPhotoError)} className="sr-only" />
              <div className="min-w-0 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
                <button type="button" aria-controls="idPhoto" onClick={() => idPhotoInput.current?.click()}
                  disabled={isLoading || successMessage !== null}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0-4 4m4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></svg>
                  {idPhoto ? 'Change ID photo' : 'Upload valid ID photo'}
                </button>
                <p id="id-photo-selection" role="status" aria-live="polite" className="mt-3 break-all text-sm text-on-surface-variant">{idPhoto ? `Selected: ${idPhoto.name} (${(idPhoto.size / 1024).toFixed(1)} KB)` : 'No ID photo selected.'}</p>
                {idPhoto && <button type="button" disabled={isLoading || successMessage !== null} onClick={() => { setIdPhoto(null); setIdPhotoError(''); setFileRevision(value => value + 1); }} className="mt-2 rounded px-1 py-1 text-sm font-medium text-red-700 underline focus-visible:outline-2 focus-visible:outline-offset-2">Remove ID photo</button>}
              </div>
              <p id="id-photo-help" className="text-xs text-on-surface-variant">Upload one JPG, PNG, or WEBP image, up to 3MB. It is stored privately for administrator review. No face recognition is performed.</p>
              {idPhotoError && <p role="alert" className="text-sm text-red-700">{idPhotoError}</p>}
            </div>
            {!successMessage && <TurnstileWidget key={captchaRevision} onToken={setCaptchaToken} />}
            <p className="text-sm text-on-surface-variant">Registration requires administrator approval. Completing CAPTCHA does not activate your account.</p>
            {/* Submit Button */}
            <div className="pt-2">
              <button 
                className="w-full flex justify-center items-center py-4 px-8 bg-secondary hover:bg-secondary/90 text-on-secondary font-label-md text-label-md rounded-lg shadow-sm transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed" 
                type="submit"
                disabled={isLoading || successMessage !== null || !captchaToken}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registering...
                  </>
                ) : (
                  'Register'
                )}
              </button>
            </div>
            
            {errorMessage && (
              <div role="alert" className="mt-4 p-4 bg-error-container text-on-error-container rounded-lg text-sm flex items-start gap-3">
                <span className="material-symbols-outlined">error</span>
                <p>{errorMessage}</p>
              </div>
            )}
            
            {successMessage && (
              <div role="status" className="mt-4 p-4 bg-green-100 text-green-800 rounded-lg text-sm flex items-start gap-3">
                <span className="material-symbols-outlined">check_circle</span>
                <p>{successMessage}</p>
              </div>
            )}
          </form>
          
          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Already have an account?{' '}
              <Link className="font-label-md text-label-md text-secondary hover:text-secondary-container hover:underline transition-all" href="/login">Login</Link>
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
