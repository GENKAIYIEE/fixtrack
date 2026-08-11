'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ForgotClientProps {
  initialPlatformName: string;
  initialLogoUrl: string;
}

type Step = 'REQUEST_OTP' | 'VERIFY_OTP' | 'RESET_PASSWORD';

export default function ForgotClient({ initialPlatformName = 'FixTrack', initialLogoUrl = '' }: ForgotClientProps) {
  const [step, setStep] = useState<Step>('REQUEST_OTP');
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to request OTP. Please try again.');
        return;
      }

      setSuccessMessage('An OTP has been sent to your email.');
      setStep('VERIFY_OTP');
    } catch (error) {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Invalid or expired OTP.');
        return;
      }

      setSuccessMessage('OTP verified. Please enter your new password.');
      setStep('RESET_PASSWORD');
    } catch (error) {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to reset password.');
        return;
      }

      setSuccessMessage('Password reset successfully. Redirecting to login...');
      
      setTimeout(() => {
        router.replace('/login');
      }, 2000);
      
    } catch (error) {
      setErrorMessage('An unexpected error occurred. Please try again.');
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
          <div className="flex items-center justify-center w-20 h-20 bg-surface-container-lowest rounded-xl shadow-2xl mb-8 overflow-hidden">
            {initialLogoUrl ? (
              <img src={initialLogoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '48px', fontVariationSettings: "'FILL' 1" }}>domain</span>
            )}
          </div>
          <h1 className="font-h1 text-h1 text-on-primary mb-4 tracking-tighter" style={{ fontSize: '4rem' }}>{initialPlatformName}</h1>
          <p className="font-h2 text-h2 text-primary-fixed-dim font-light">Secure Password Recovery</p>
        </div>
      </div>
      
      {/* Right Panel: Reset Form (40%) */}
      <div className="flex-1 lg:w-[40%] bg-surface-container-lowest flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 relative z-10 shadow-[-20px_0_40px_-15px_rgba(0,0,0,0.1)]">
        <div className="w-full max-w-md mx-auto">
          <div className="flex lg:hidden items-center justify-center mb-10 gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary-container rounded-lg shadow-md overflow-hidden">
              {initialLogoUrl ? (
                <img src={initialLogoUrl} alt="Logo" className="w-full h-full object-contain bg-white p-1" />
              ) : (
                <span className="material-symbols-outlined text-on-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>domain</span>
              )}
            </div>
            <span className="font-h2 text-h2 text-primary-container tracking-tighter">{initialPlatformName}</span>
          </div>
          
          <div className="mb-10 text-center lg:text-left">
            <h2 className="font-h1 text-h1 text-on-surface mb-2">Forgot Password</h2>
            <p className="font-body text-body text-on-surface-variant">
              {step === 'REQUEST_OTP' && "Enter your email to receive a One-Time Password."}
              {step === 'VERIFY_OTP' && "Enter the 6-digit code sent to your email."}
              {step === 'RESET_PASSWORD' && "Create a new, secure password."}
            </p>
          </div>
          
          {successMessage && (
            <div className="mb-6 p-4 bg-success-container text-on-success-container rounded-lg text-sm flex items-start gap-3">
              <span className="material-symbols-outlined">check_circle</span>
              <p>{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-lg text-sm flex items-start gap-3">
              <span className="material-symbols-outlined">error</span>
              <p>{errorMessage}</p>
            </div>
          )}

          {step === 'REQUEST_OTP' && (
            <form className="space-y-6" onSubmit={handleRequestOtp}>
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface block" htmlFor="email">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline-variant">mail</span>
                  </div>
                  <input 
                    className="w-full bg-surface font-body text-body text-on-surface border border-outline-variant rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-shadow placeholder:text-outline-variant/60" 
                    id="email" 
                    type="email"
                    placeholder="name@institution.edu" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
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
                    Sending...
                  </>
                ) : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 'VERIFY_OTP' && (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface block" htmlFor="otp">One-Time Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline-variant">pin</span>
                  </div>
                  <input 
                    className="w-full bg-surface font-body text-body text-on-surface border border-outline-variant rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-shadow placeholder:text-outline-variant/60 text-center tracking-widest text-lg" 
                    id="otp" 
                    type="text"
                    placeholder="••••••" 
                    maxLength={6}
                    required 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <button 
                className="w-full bg-secondary hover:bg-secondary-container text-on-primary font-label-md text-label-md py-4 rounded-lg shadow-[0_4px_12px_rgba(37,99,235,0.2)] transition-all hover:shadow-[0_6px_16px_rgba(37,99,235,0.3)] active:scale-[0.98] flex items-center justify-center gap-2 mt-8 disabled:opacity-70 disabled:cursor-not-allowed" 
                type="submit"
                disabled={isLoading || otp.length < 6}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : 'Verify OTP'}
              </button>

              <div className="text-center mt-4">
                <button 
                  type="button" 
                  className="font-body-sm text-body-sm text-secondary hover:underline"
                  onClick={() => setStep('REQUEST_OTP')}
                  disabled={isLoading}
                >
                  Change Email or Resend OTP
                </button>
              </div>
            </form>
          )}

          {step === 'RESET_PASSWORD' && (
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface block" htmlFor="new-password">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline-variant">lock</span>
                  </div>
                  <input 
                    className="w-full bg-surface font-body text-body text-on-surface border border-outline-variant rounded-lg pl-12 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-shadow placeholder:text-outline-variant/60" 
                    id="new-password" 
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••" 
                    required 
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button 
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline-variant hover:text-on-surface transition-colors" 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface block" htmlFor="confirm-password">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline-variant">lock_clock</span>
                  </div>
                  <input 
                    className="w-full bg-surface font-body text-body text-on-surface border border-outline-variant rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-shadow placeholder:text-outline-variant/60" 
                    id="confirm-password" 
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••" 
                    required 
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
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
                    Resetting...
                  </>
                ) : 'Reset Password'}
              </button>
            </form>
          )}
          
          <div className="mt-8 text-center">
            <p className="font-body text-body text-on-surface-variant">
              Remember your password?{' '}
              <Link className="text-secondary font-medium hover:underline underline-offset-4 transition-all" href="/login">Back to Login</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
