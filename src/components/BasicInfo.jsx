import React, { useState, useEffect } from 'react';
import { CheckCircle, Loader, ScanLine } from 'lucide-react';
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-exos shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Step 1 of 6</p>
            <h1 className="text-2xl font-bold text-slate-900">Let's Get Started</h1>
          </div>
        </div>

        {/* DL pre-fill banner */}
        {(state.basicInfo.firstName || state.basicInfo.address?.street) && (
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-exos px-4 py-3 mb-6">
            <ScanLine className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-800">
              We pre-filled your info from your ID. Review and update anything that looks off.
            </p>
          </div>
        )}

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
              <div>
                <input
                  type="text"
                  value={address.street}
                  onChange={(e) => handleAddressField('street', e.target.value)}
                  placeholder="Street Address"
                  className={inputCls(touched.address && !address.street)}
                />
                {touched.address && !address.street && <p className="text-red-500 text-xs mt-1">Street address is required</p>}
              </div>
              {/* City + State row (always side-by-side) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => handleAddressField('city', e.target.value)}
                    placeholder="City"
                    className={inputCls(touched.address && !address.city) + ' w-full'}
                  />
                  {touched.address && !address.city && <p className="text-red-500 text-xs mt-1">Required</p>}
                </div>
                <div className="sm:col-span-2">
                  <select
                    value={address.stateCode}
                    onChange={(e) => handleAddressField('stateCode', e.target.value)}
                    className={`w-full border rounded-exos-sm py-3 px-3 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base ${touched.address && !address.stateCode ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                  >
                    <option value="">State</option>
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {touched.address && !address.stateCode && <p className="text-red-500 text-xs mt-1">Required</p>}
                </div>
              </div>

              {/* ZIP — own row on mobile */}
              <div className="relative">
                <input
                  type="text"
                  value={address.zip}
                  onChange={(e) => handleAddressField('zip', e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="ZIP Code"
                  inputMode="numeric"
                  className={inputCls(touched.address && !address.zip) + ' w-full' + (validatingAddress ? ' pr-10' : '')}
                  maxLength={5}
                />
                {validatingAddress && (
                  <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                )}
                {address.validated && !validatingAddress && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                )}
              </div>
              {touched.address && !address.zip && <p className="text-red-500 text-xs mt-1">ZIP code is required</p>}
            </div>
          </div>


          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-exos transition-colors mt-2"
          >
            Continue →
          </button>
        </form>
      </div>
    </div>
  );
};

export default BasicInfo;
