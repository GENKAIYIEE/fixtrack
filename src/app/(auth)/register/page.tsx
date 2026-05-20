'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Basic required field validation
    if (!firstName || !lastName || !email || !idNumber || !department || !password || !confirmPassword) {
      setErrorMessage('All fields are required.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          idNumber,
          department,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || 'An error occurred during registration.');
        return;
      }

      setSuccessMessage('Registration successful! Your account is now active. You can log in immediately.');
      
      // Clear form
      setFirstName('');
      setLastName('');
      setEmail('');
      setIdNumber('');
      setDepartment('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
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
      <div className="w-full lg:w-[55%] h-screen flex flex-col justify-center p-8 overflow-hidden">
        <div className="w-full max-w-[512px] mx-auto py-6">
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
            
            {/* ID Number */}
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="idNumber">ID Number</label>
              <input 
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-DEFAULT px-4 py-3 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors" 
                id="idNumber" 
                name="idNumber" 
                placeholder="Enter institutional ID" 
                required 
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
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
            
            {/* Submit Button */}
            <div className="pt-2">
              <button 
                className="w-full flex justify-center items-center py-4 px-8 bg-secondary hover:bg-secondary/90 text-on-secondary font-label-md text-label-md rounded-lg shadow-sm transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed" 
                type="submit"
                disabled={isLoading || successMessage !== null}
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
              <div className="mt-4 p-4 bg-error-container text-on-error-container rounded-lg text-sm flex items-start gap-3">
                <span className="material-symbols-outlined">error</span>
                <p>{errorMessage}</p>
              </div>
            )}
            
            {successMessage && (
              <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-lg text-sm flex items-start gap-3">
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
  );
}
