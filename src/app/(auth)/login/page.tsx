'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.user) {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: data.user.id }),
        });

        const result = await response.json();

        if (!response.ok) {
          setErrorMessage(result.message || 'An error occurred during login validation.');
          // Sign out the user if verification fails
          await supabase.auth.signOut();
          return;
        }

        const role = result.role;

        if (role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else if (role === 'TECHNICIAN') {
          router.push('/technician/dashboard');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col lg:flex-row overflow-hidden bg-surface-container-lowest">
      {/* Left Panel: Brand & Context (60%) */}
      <div className="hidden lg:flex lg:w-[60%] bg-primary-container relative flex-col justify-between p-12 overflow-hidden">
        <div 
          className="absolute inset-0 z-0 opacity-20 mix-blend-overlay pointer-events-none" 
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC_89p-O4X-7UzRnI6BKqLCV5owJqCB7eaSY6mcgpTpvKks89Ky5guf1XtWkh3Ka5zWM6GIIHywk31xISzVYEECa8_YRzWpjMpq5LctUZwp7_GQmBfwV8nnUPNplANioUj29LrqxtzjHmBfoK6DtJKgGaGIHFHmsN-5aJs_U4Ka-e0ErxkTjswGTYML3wnQhlT2Q7Yt-WyUyPMDhBl1fJM5Isu43YP3zF4kxrrslUNC-y5EIKsIeD4CO3VQ5lcHmznQYCzE69z2Y_c')", backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
        </div>
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-primary-container/40 to-primary-container/90 pointer-events-none"></div>
        <div className="relative z-20 flex flex-col items-center justify-center flex-grow text-center">
          <div className="flex items-center justify-center w-20 h-20 bg-surface-container-lowest rounded-xl shadow-2xl mb-8">
            <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '48px', fontVariationSettings: "'FILL' 1" }}>domain</span>
          </div>
          <h1 className="font-h1 text-h1 text-on-primary mb-4 tracking-tighter" style={{ fontSize: '4rem' }}>FixTrack</h1>
          <p className="font-h2 text-h2 text-primary-fixed-dim font-light">Smart Maintenance. Zero Delays.</p>
        </div>
        <div className="relative z-20 mt-auto">
          <p className="font-sidebar-label text-sidebar-label text-on-primary-container mb-6 text-center uppercase tracking-widest opacity-80">Integrated Portal Access</p>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest/10 backdrop-blur-md border border-surface-container-lowest/20 rounded-xl p-6 flex flex-col items-center text-center transition-transform hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 rounded-full bg-surface-container-lowest/20 flex items-center justify-center mb-4 text-on-primary">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              </div>
              <h3 className="font-label-md text-label-md text-on-primary mb-2">User</h3>
              <p className="font-body-sm text-body-sm text-primary-fixed-dim opacity-80">Submit & track requests</p>
            </div>
            <div className="bg-surface-container-lowest/10 backdrop-blur-md border border-surface-container-lowest/20 rounded-xl p-6 flex flex-col items-center text-center transition-transform hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 rounded-full bg-surface-container-lowest/20 flex items-center justify-center mb-4 text-on-primary">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
              </div>
              <h3 className="font-label-md text-label-md text-on-primary mb-2">Admin</h3>
              <p className="font-body-sm text-body-sm text-primary-fixed-dim opacity-80">Manage assets & teams</p>
            </div>
            <div className="bg-surface-container-lowest/10 backdrop-blur-md border border-surface-container-lowest/20 rounded-xl p-6 flex flex-col items-center text-center transition-transform hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 rounded-full bg-surface-container-lowest/20 flex items-center justify-center mb-4 text-on-primary">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>build</span>
              </div>
              <h3 className="font-label-md text-label-md text-on-primary mb-2">Technician</h3>
              <p className="font-body-sm text-body-sm text-primary-fixed-dim opacity-80">Execute work orders</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Panel: Login Form (40%) */}
      <div className="flex-1 lg:w-[40%] bg-surface-container-lowest flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 relative z-10 shadow-[-20px_0_40px_-15px_rgba(0,0,0,0.1)]">
        <div className="w-full max-w-md mx-auto">
          <div className="flex lg:hidden items-center justify-center mb-10 gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary-container rounded-lg shadow-md">
              <span className="material-symbols-outlined text-on-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>domain</span>
            </div>
            <span className="font-h2 text-h2 text-primary-container tracking-tighter">FixTrack</span>
          </div>
          
          <div className="mb-10 text-center lg:text-left">
            <h2 className="font-h1 text-h1 text-on-surface mb-2">Welcome Back</h2>
            <p className="font-body text-body text-on-surface-variant">Sign in to your FixTrack account</p>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="font-label-md text-label-md text-on-surface block" htmlFor="email">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline-variant">mail</span>
                </div>
                <input 
                  className="w-full bg-surface font-body text-body text-on-surface border border-outline-variant rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-shadow placeholder:text-outline-variant/60" 
                  id="email" 
                  name="email" 
                  placeholder="name@institution.edu" 
                  required 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-label-md text-label-md text-on-surface block" htmlFor="password">Password</label>
                <Link className="font-body-sm text-body-sm text-secondary hover:text-secondary-container transition-colors" href="#">Forgot password?</Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline-variant">lock</span>
                </div>
                <input 
                  className="w-full bg-surface font-body text-body text-on-surface border border-outline-variant rounded-lg pl-12 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-shadow placeholder:text-outline-variant/60" 
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  required 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button 
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline-variant hover:text-on-surface transition-colors" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
            </div>
            
            <button 
              className="w-full bg-secondary hover:bg-secondary-container text-on-primary font-label-md text-label-md py-4 rounded-lg shadow-[0_4px_12px_rgba(37,99,235,0.2)] transition-all hover:shadow-[0_6px_16px_rgba(37,99,235,0.3)] active:scale-[0.98] flex items-center justify-center gap-2 mt-8 disabled:opacity-70 disabled:cursor-not-allowed" 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Login
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                </>
              )}
            </button>
            
            {errorMessage && (
              <div className="mt-4 p-4 bg-error-container text-on-error-container rounded-lg text-sm flex items-start gap-3">
                <span className="material-symbols-outlined">error</span>
                <p>{errorMessage}</p>
              </div>
            )}
          </form>
          
          <div className="mt-8 text-center">
            <p className="font-body text-body text-on-surface-variant">
              Don't have an account?{' '}
              <Link className="text-secondary font-medium hover:underline underline-offset-4 transition-all" href="/register">Register here</Link>
            </p>
          </div>
          
          <div className="mt-16 pt-8 border-t border-surface-variant text-center">
            <div className="inline-flex items-center justify-center gap-2 bg-surface-container-low px-4 py-2 rounded-full border border-surface-variant">
              <span className="material-symbols-outlined text-outline text-sm" style={{ fontSize: '16px' }}>info</span>
              <p className="font-body-sm text-body-sm text-outline">
                You will be automatically redirected to your assigned portal based on your role.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
