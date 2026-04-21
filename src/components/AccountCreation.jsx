import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { isValidEmail, isValidPassword } from '../utils/validation';

const AccountCreation = ({ state, setState, onNext }) => {
  const [email, setEmail] = useState(state.accountData.email || state.marketingData.email || '');
  const [emailLocked, setEmailLocked] = useState(true);
  const [password, setPassword] = useState(state.accountData.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (!state.accountData.email && state.marketingData.email) {
      setEmail(state.marketingData.email);
    }
  }, []);

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const isFormValid =
    isValidEmail(email) && passwordChecks.length && passwordChecks.uppercase && passwordChecks.number;

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) {
      setTouched({ email: true, password: true });
      return;
    }
    setState((prev) => ({
      ...prev,
      accountData: { ...prev.accountData, email, password, authMethod: 'email' },
    }));
    onNext();
  };

  const handleSSO = (method) => {
    setState((prev) => ({
      ...prev,
      accountData: { ...prev.accountData, email, authMethod: method },
    }));
    onNext();
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-exos shadow-sm border border-slate-100 p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Create Your Account</h1>
        <p className="text-slate-500 text-sm mb-8">Secure your application with a password or SSO.</p>

        <form onSubmit={handleEmailSubmit} noValidate>
          {/* Email */}
          <div className="mb-5">
            <label className="block text-sm font-normal text-slate-700 mb-1.5" htmlFor="email">
              Email Address
            </label>
            {emailLocked ? (
              <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-exos-sm ">
                <span className="flex items-center gap-2 text-sm text-slate-800">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  {email}
                </span>
                <button
                  type="button"
                  onClick={() => setEmailLocked(false)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium ml-3"
                >
                  Change
                </button>
              </div>
            ) : (
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                className={`w-full border rounded-exos-sm py-3 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all
                  ${touched.email && !isValidEmail(email) ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                autoFocus
              />
            )}
            {touched.email && !isValidEmail(email) && (
              <p className="text-red-500 text-xs mt-1.5">Enter a valid email address</p>
            )}
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-sm font-normal text-slate-700 mb-1.5" htmlFor="password">
              Create Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                placeholder="Minimum 8 characters"
                className="w-full border border-slate-200 rounded-exos-sm py-3 pl-4 pr-12 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password requirements */}
            {password.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {[
                  { key: 'length', label: '8+ characters' },
                  { key: 'uppercase', label: '1 uppercase letter' },
                  { key: 'number', label: '1 number' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center
                      ${passwordChecks[key] ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                      {passwordChecks[key] && (
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 12 12">
                          <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                    <span className={passwordChecks[key] ? 'text-emerald-700' : 'text-slate-400'}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold uppercase py-3 rounded-exos transition-colors"
          >
            Continue with Email
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-white text-xs text-slate-400 uppercase tracking-wide">or</span>
          </div>
        </div>

        {/* SSO */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleSSO('google')}
            className="w-full flex items-center justify-center gap-3 border-2 border-slate-200 hover:border-slate-300 rounded-exos py-2.5 text-sm font-bold uppercase text-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => handleSSO('microsoft')}
            className="w-full flex items-center justify-center gap-3 border-2 border-slate-200 hover:border-slate-300 rounded-exos py-2.5 text-sm font-bold uppercase text-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#F25022" d="M11 11H1V1h10z" />
              <path fill="#7FBA00" d="M23 11H13V1h10z" />
              <path fill="#00A4EF" d="M11 23H1V13h10z" />
              <path fill="#FFB900" d="M23 23H13V13h10z" />
            </svg>
            Continue with Microsoft
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountCreation;
