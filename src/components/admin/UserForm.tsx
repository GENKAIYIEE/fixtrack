'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  idNumber: string;
  department: string;
  contactNumber: string;
  role: string;
  specialization: string;
  password: string;
  accountStatus: 'ACTIVE' | 'INACTIVE' | 'PENDING';
}

interface UserFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<UserFormData>;
  onSubmit: (data: UserFormData) => Promise<void>;
  isSubmitting: boolean;
}

const defaultForm: UserFormData = {
  firstName: '',
  lastName: '',
  email: '',
  idNumber: '',
  department: '',
  contactNumber: '',
  role: '',
  specialization: '',
  password: '',
  accountStatus: 'PENDING',
};

function generateSecurePassword(): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const symbols = '!@#$%^&*';
  const all = upper + lower + digits + symbols;

  const getRandom = (str: string) => str[Math.floor(Math.random() * str.length)];

  let pwd = getRandom(upper) + getRandom(lower) + getRandom(digits) + getRandom(symbols);
  for (let i = 4; i < 12; i++) {
    pwd += getRandom(all);
  }
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

export default function UserForm({ mode, initialData, onSubmit, isSubmitting }: UserFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<UserFormData>({ ...defaultForm, ...initialData });
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
  const [showSpecialization, setShowSpecialization] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({ ...prev, ...initialData }));
      setShowSpecialization(initialData.role === 'TECHNICIAN');
    }
  }, [initialData]);

  // Generate password on create mount
  useEffect(() => {
    if (mode === 'create') {
      setForm((prev) => ({ ...prev, password: generateSecurePassword() }));
    }
  }, [mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'role') {
      setShowSpecialization(value === 'TECHNICIAN');
      if (value !== 'TECHNICIAN') {
        setForm((prev) => ({ ...prev, [name]: value, specialization: '' }));
        setErrors((prev) => ({ ...prev, specialization: undefined }));
        return;
      }
    }

    if (errors[name as keyof UserFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleToggle = () => {
    setForm((prev) => {
      if (mode === 'create') {
        return { ...prev, accountStatus: prev.accountStatus === 'ACTIVE' ? 'PENDING' : 'ACTIVE' };
      }
      return { ...prev, accountStatus: prev.accountStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' };
    });
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof UserFormData, string>> = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required.';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required.';
    if (!form.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Enter a valid email address.';
    }
    if (!form.idNumber.trim()) newErrors.idNumber = 'ID number is required.';
    if (!form.department.trim()) newErrors.department = 'Department is required.';
    if (!form.role) newErrors.role = 'Role is required.';
    if (showSpecialization && !form.specialization) {
      newErrors.specialization = 'Specialization is required for Technicians.';
    }
    if (mode === 'create') {
      if (!form.password) {
        newErrors.password = 'Password is required.';
      } else if (form.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters.';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  };

  const inputBase =
    'w-full px-4 py-2.5 bg-surface-container-low border rounded-lg font-body text-body text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 transition-all duration-150';
  const inputNormal = `${inputBase} border-outline-variant focus:border-primary focus:ring-primary/20`;
  const inputError = `${inputBase} border-error focus:border-error focus:ring-error/20`;

  const getInputClass = (field: keyof UserFormData) =>
    errors[field] ? inputError : inputNormal;

  const labelClass = 'block font-label-md text-label-md text-on-surface mb-1.5';
  const errorClass = 'text-error text-xs mt-1';

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Form Card Header */}
      <div className="px-8 py-6 border-b border-outline-variant/30">
        <h2 className="font-h2 text-h2 text-on-surface">
          {mode === 'create' ? 'New User Details' : 'Edit User Details'}
        </h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          {mode === 'create'
            ? 'Fill in the information below to create a new account.'
            : 'Update the user information below.'}
        </p>
      </div>

      <div className="px-8 py-6 flex flex-col gap-6">
        {/* Personal Information */}
        <div>
          <p className="font-label-md text-label-md text-on-surface uppercase tracking-wider mb-4">
            Personal Information
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className={labelClass}>
                First Name <span className="text-error">*</span>
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={form.firstName}
                onChange={handleChange}
                placeholder="e.g. Jane"
                className={getInputClass('firstName')}
                autoComplete="given-name"
              />
              {errors.firstName && <p className={errorClass}>{errors.firstName}</p>}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className={labelClass}>
                Last Name <span className="text-error">*</span>
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={form.lastName}
                onChange={handleChange}
                placeholder="e.g. Doe"
                className={getInputClass('lastName')}
                autoComplete="family-name"
              />
              {errors.lastName && <p className={errorClass}>{errors.lastName}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={labelClass}>
                Email Address <span className="text-error">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="jane.doe@fixtrack.edu"
                className={getInputClass('email')}
                autoComplete="email"
              />
              {errors.email && <p className={errorClass}>{errors.email}</p>}
            </div>

            {/* ID Number */}
            <div>
              <label htmlFor="idNumber" className={labelClass}>
                ID Number <span className="text-error">*</span>
              </label>
              <input
                id="idNumber"
                name="idNumber"
                type="text"
                value={form.idNumber}
                onChange={handleChange}
                placeholder="e.g. 2024-00123"
                className={getInputClass('idNumber')}
              />
              {errors.idNumber && <p className={errorClass}>{errors.idNumber}</p>}
            </div>

            {/* Department */}
            <div>
              <label htmlFor="department" className={labelClass}>
                Department <span className="text-error">*</span>
              </label>
              <input
                id="department"
                name="department"
                type="text"
                value={form.department}
                onChange={handleChange}
                placeholder="e.g. College of Engineering"
                className={getInputClass('department')}
              />
              {errors.department && <p className={errorClass}>{errors.department}</p>}
            </div>

            {/* Contact Number */}
            <div>
              <label htmlFor="contactNumber" className={labelClass}>
                Contact Number
                <span className="ml-1 font-body-sm text-body-sm text-on-surface-variant">(optional)</span>
              </label>
              <input
                id="contactNumber"
                name="contactNumber"
                type="text"
                value={form.contactNumber}
                onChange={handleChange}
                placeholder="e.g. 09XX-XXX-XXXX"
                className={inputNormal}
              />
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className={labelClass}>
                Role <span className="text-error">*</span>
              </label>
              <div className="relative">
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className={`${getInputClass('role')} appearance-none pr-10`}
                >
                  <option value="" disabled>Select a role...</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="USER">User</option>
                  <option value="FACULTY">Faculty</option>
                  <option value="STAFF">Staff</option>
                  <option value="TECHNICIAN">Technician</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-lg">
                  expand_more
                </span>
              </div>
              {errors.role && <p className={errorClass}>{errors.role}</p>}
            </div>

            {/* Specialization — conditional */}
            <div
              className={`overflow-hidden transition-all duration-200 ${
                showSpecialization ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
              }`}
            >
              <label htmlFor="specialization" className={labelClass}>
                Specialization <span className="text-error">*</span>
              </label>
              <div className="relative">
                <select
                  id="specialization"
                  name="specialization"
                  value={form.specialization}
                  onChange={handleChange}
                  className={`${getInputClass('specialization')} appearance-none pr-10`}
                  tabIndex={showSpecialization ? 0 : -1}
                >
                  <option value="" disabled>Select specialization...</option>
                  <option value="HVAC">HVAC</option>
                  <option value="ELECTRICAL">Electrical</option>
                  <option value="PLUMBING">Plumbing</option>
                  <option value="CARPENTRY">Carpentry</option>
                  <option value="GENERAL">General</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-lg">
                  expand_more
                </span>
              </div>
              {errors.specialization && <p className={errorClass}>{errors.specialization}</p>}
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-t border-surface-variant" />

        {/* Security & Access */}
        <div>
          <p className="font-label-md text-label-md text-on-surface uppercase tracking-wider mb-4">
            Security &amp; Access
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            {/* Temporary Password — create mode only */}
            {mode === 'create' && (
              <div>
                <label htmlFor="password" className={labelClass}>
                  Temporary Password <span className="text-error">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="password"
                    name="password"
                    type="text"
                    value={form.password}
                    readOnly
                    className="flex-1 px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg font-mono text-sm text-on-surface focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newPwd = generateSecurePassword();
                      setForm((prev) => ({ ...prev, password: newPwd }));
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    className="flex items-center gap-1.5 bg-surface border border-outline-variant hover:bg-surface-variant text-on-surface rounded-lg px-4 py-2 font-label-md text-label-md transition-colors whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-base">autorenew</span>
                    Generate
                  </button>
                </div>
                {errors.password && <p className={errorClass}>{errors.password}</p>}
              </div>
            )}

            {/* Account Status Toggle */}
            <div className={mode === 'create' ? '' : 'md:col-span-2'}>
              <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg border border-outline-variant">
                <div>
                  <p className="font-label-md text-label-md text-on-surface">Account Status</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    Active users can access the portal.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={form.accountStatus === 'ACTIVE'}
                    onChange={handleToggle}
                    id="accountStatus"
                  />
                  <div className="w-11 h-6 bg-outline-variant peer-checked:bg-secondary rounded-full relative transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200 peer-checked:after:translate-x-5" />
                </label>
              </div>
              <p className="text-xs text-on-surface-variant mt-1.5">
                Status:{' '}
                <span
                  className={`font-medium ${
                    form.accountStatus === 'ACTIVE' ? 'text-[#10B981]' : 'text-on-surface-variant'
                  }`}
                >
                  {form.accountStatus}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-2 pt-6 border-t border-surface-variant">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="bg-surface border border-outline-variant text-on-surface hover:bg-surface-variant rounded-lg px-6 py-2.5 font-label-md text-label-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-white hover:bg-[#001a54] hover:shadow-lg active:scale-[0.98] rounded-lg px-8 py-3 shadow-md flex items-center gap-2 font-label-md text-label-md transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">save</span>
                {mode === 'create' ? 'Save User' : 'Save Changes'}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
