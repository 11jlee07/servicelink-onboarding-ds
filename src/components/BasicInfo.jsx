import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, MapPin, Loader, TrendingUp, Briefcase } from 'lucide-react';
import { formatPhone, isValidPhone } from '../utils/validation';
import { validateAddress } from '../utils/mockApi';

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC',
  'ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

const BasicInfo = ({ state, setState, onNext }) => {
  const [firstName, setFirstName] = useState(state.basicInfo.firstName || '');
  const [lastName, setLastName] = useState(state.basicInfo.lastName || '');
  const [phone, setPhone] = useState(state.basicInfo.phone || '');
  const [address, setAddress] = useState(state.basicInfo.address || { street: '', city: '', stateCode: '', zip: '', validated: false });
  const [validatingAddress, setValidatingAddress] = useState(false);
  const [touched, setTouched] = useState({});

  // Reveal animation state
  const [displayCount, setDisplayCount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  const countTimerRef = useRef(null);

  // Auto-populate name from marketing data
  useEffect(() => {
    if (state.marketingData.name && !state.basicInfo.firstName) {
      const parts = state.marketingData.name.trim().split(/\s+/);
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
    }
  }, []);

  // Auto-trigger validation when ZIP hits 5 digits and all fields are filled
  useEffect(() => {
    if (
      address.zip.length === 5 &&
      address.street.trim() &&
      address.city.trim() &&
      address.stateCode &&
      !address.validated &&
      !validatingAddress
    ) {
      const timer = setTimeout(async () => {
        setValidatingAddress(true);
        try {
          await validateAddress(address);
          setAddress((prev) => ({ ...prev, validated: true }));
        } finally {
          setValidatingAddress(false);
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [address.zip, address.street, address.city, address.stateCode]);

  // Animate the market reveal when validated flips true
  useEffect(() => {
    if (!address.validated) {
      setDisplayCount(0);
      setShowDetails(false);
      setCardVisible(false);
      if (countTimerRef.current) clearInterval(countTimerRef.current);
      return;
    }

    // Slight delay so card fade-in starts first
    const fadeTimer = setTimeout(() => setCardVisible(true), 50);

    const target = 47;
    const duration = 900;
    const steps = 45;
    let current = 0;

    countTimerRef.current = setInterval(() => {
      current += 1;
      setDisplayCount(Math.round((current / steps) * target));
      if (current >= steps) {
        clearInterval(countTimerRef.current);
        setDisplayCount(target);
        setTimeout(() => setShowDetails(true), 120);
      }
    }, duration / steps);

    return () => {
      clearTimeout(fadeTimer);
      if (countTimerRef.current) clearInterval(countTimerRef.current);
    };
  }, [address.validated]);

  const handleAddressField = (field, value) => {
    setAddress((prev) => ({ ...prev, [field]: value, validated: false }));
  };

  const isAddressComplete = address.street && address.city && address.stateCode && address.zip;
  const isFormValid = firstName && lastName && isValidPhone(phone) && isAddressComplete;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ firstName: true, lastName: true, phone: true, address: true });
    if (!isFormValid) return;
    setState((prev) => ({
      ...prev,
      basicInfo: { firstName, lastName, phone, address: { ...address, state: address.stateCode } },
    }));
    onNext();
  };

  const inputCls = (hasError) =>
    `w-full border rounded-exos-sm py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all
    ${hasError ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'}`;

  const cityLabel = address.city ? address.city : 'Your Area';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-exos shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Step 1 of 6</p>
            <h1 className="text-2xl font-bold text-slate-900">Let's Get Started</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Name row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="firstName">
                Legal First Name
              </label>
              <div className="relative">
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, firstName: true }))}
                  className={inputCls(touched.firstName && !firstName) + (firstName ? ' pl-10' : '')}
                  required
                />
                {firstName && (
                  <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                )}
              </div>
              {touched.firstName && !firstName && (
                <p className="text-red-500 text-xs mt-1">Required</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="lastName">
                Legal Last Name
              </label>
              <div className="relative">
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, lastName: true }))}
                  className={inputCls(touched.lastName && !lastName) + (lastName ? ' pl-10' : '')}
                  required
                />
                {lastName && (
                  <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                )}
              </div>
              {touched.lastName && !lastName && (
                <p className="text-red-500 text-xs mt-1">Required</p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="phone">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
              placeholder="(555) 000-0000"
              className={inputCls(touched.phone && !isValidPhone(phone))}
            />
            {touched.phone && !isValidPhone(phone) && (
              <p className="text-red-500 text-xs mt-1">Enter a valid 10-digit phone number</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Office Address
            </label>
            <div className="space-y-3">
              <input
                type="text"
                value={address.street}
                onChange={(e) => handleAddressField('street', e.target.value)}
                placeholder="Street Address"
                className={inputCls(false)}
              />
              {/* City + State row (always side-by-side) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => handleAddressField('city', e.target.value)}
                  placeholder="City"
                  className={inputCls(false) + ' sm:col-span-3'}
                />
                <select
                  value={address.stateCode}
                  onChange={(e) => handleAddressField('stateCode', e.target.value)}
                  className="border border-slate-200 rounded-exos-sm py-3 px-3 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 sm:col-span-2 text-base"
                >
                  <option value="">State</option>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* ZIP — own row on mobile */}
              <div className="relative">
                <input
                  type="text"
                  value={address.zip}
                  onChange={(e) => handleAddressField('zip', e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="ZIP Code"
                  inputMode="numeric"
                  className={inputCls(false) + ' w-full' + (validatingAddress ? ' pr-10' : '')}
                  maxLength={5}
                />
                {validatingAddress && (
                  <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                )}
                {address.validated && !validatingAddress && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                )}
              </div>
            </div>
          </div>

          {/* Animated market reveal card */}
          {(address.validated || validatingAddress) && (
            <div
              className="overflow-hidden rounded-exos border border-blue-100 shadow-sm"
              style={{
                opacity: cardVisible ? 1 : 0,
                transform: cardVisible ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 400ms ease, transform 400ms ease',
              }}
            >
              {/* Header band */}
              <div className="bg-blue-600 px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-xs font-medium uppercase tracking-wider mb-0.5">
                    Market availability
                  </p>
                  <p className="text-white font-bold text-lg leading-tight">{cityLabel}</p>
                </div>
                <MapPin className="w-6 h-6 text-blue-300" />
              </div>

              {/* Stats row */}
              <div className="bg-white px-5 py-5">
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-bold text-slate-900 tabular-nums leading-none">
                    {displayCount}
                  </span>
                  <span className="text-slate-500 text-sm mb-1 ml-1">open assignments</span>
                </div>

                <div
                  style={{
                    opacity: showDetails ? 1 : 0,
                    transform: showDetails ? 'translateY(0)' : 'translateY(4px)',
                    transition: 'opacity 400ms ease, transform 400ms ease',
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold text-sm">
                      $4,200–$8,500<span className="text-emerald-600 font-normal">/month for vendors in this area</span>
                    </span>
                  </div>

                  {/* Blurred assignment previews */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { type: 'Residential', fee: '$385', due: '04/22' },
                      { type: 'FHA Appraisal', fee: '$420', due: '04/23' },
                      { type: 'Condo Review',  fee: '$310', due: '04/25' },
                    ].map((job, i) => (
                      <div
                        key={i}
                        className="bg-slate-50 border border-slate-200 rounded-exos-sm p-3"
                        style={{
                          opacity: showDetails ? 1 : 0,
                          transition: `opacity 350ms ease ${120 + i * 80}ms`,
                        }}
                      >
                        <div className="flex items-center gap-1.5 mb-2">
                          <Briefcase className="w-3 h-3 text-blue-500 flex-shrink-0" />
                          <p className="text-xs font-semibold text-slate-700 leading-tight">{job.type}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs text-slate-400 blur-sm select-none">123 Oak Street</p>
                          <p className="text-xs text-slate-500 blur-sm select-none">Fee: {job.fee}</p>
                          <p className="text-xs text-slate-500 blur-sm select-none">Due: {job.due}</p>
                        </div>
                        <p className="text-xs text-blue-600 font-medium mt-2">Finish to unlock →</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3 rounded-exos transition-colors mt-2"
          >
            Continue →
          </button>
        </form>
      </div>
    </div>
  );
};

export default BasicInfo;
