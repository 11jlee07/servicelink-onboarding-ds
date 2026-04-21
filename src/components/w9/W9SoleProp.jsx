import NavFooter from '../shared/NavFooter';
import React, { useState } from 'react';
import MailingAddressQuestion from './MailingAddressQuestion';
import { formatSSN, formatEIN } from '../../utils/validation';

const TOTAL = 2;

const W9SoleProp = ({ state, setState, onNext, onBack }) => {
  const [q, setQ] = useState(1);
  const [hasBusinessName, setHasBusinessName] = useState(
    state.w9Data.businessName ? true : state.w9Data.businessName === '' ? false : null
  );

  const update = (field, value) =>
    setState((prev) => ({ ...prev, w9Data: { ...prev.w9Data, [field]: value } }));

  const handleTaxIdTypeChange = (type) => {
    update('taxIdType', type);
    update('taxId', '');
  };

  const handleTaxIdInput = (e) => {
    const val = state.w9Data.taxIdType === 'ssn'
      ? formatSSN(e.target.value)
      : formatEIN(e.target.value);
    update('taxId', val);
  };

  const isValid = () => {
    if (q === 1) {
      const nameOk = hasBusinessName === false || (hasBusinessName === true && !!state.w9Data.businessName);
      const idOk = !!state.w9Data.taxIdType && state.w9Data.taxId.replace(/\D/g, '').length >= 9;
      return nameOk && idOk && hasBusinessName !== null;
    }
    if (q === 2) {
      const m = state.w9Data.mailingAddress;
      return m.useOfficeAddress || (m.street && m.city && m.state && m.zip);
    }
    return false;
  };

  const handleNext = () => { if (q < TOTAL) setQ(q + 1); else onNext(); };
  const handleBack = () => { if (q > 1) setQ(q - 1); else onBack(); };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-exos shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Step 2 of 6 · W-9</p>
            <h1 className="text-2xl font-bold text-slate-900">
              {q === 1 ? 'Business & Tax Details' : 'Mailing Address'}
            </h1>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-3 py-1">{q} of {TOTAL}</span>
        </div>

        {q === 1 && (
          <div className="space-y-8">
            {/* Business name */}
            <div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">Do you operate under a business name?</h3>
              <p className="text-sm text-slate-500 mb-4">This is optional for sole proprietors.</p>

              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-4 border-2 rounded-exos cursor-pointer transition-all
                  ${hasBusinessName === false ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="hn" checked={hasBusinessName === false}
                    onChange={() => { setHasBusinessName(false); update('businessName', ''); }} />
                  <span className="font-normal text-slate-900 text-sm">No business name — operating as an individual</span>
                </label>

                <label className={`flex items-start gap-3 p-4 border-2 rounded-exos cursor-pointer transition-all
                  ${hasBusinessName === true ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="hn" checked={hasBusinessName === true}
                    onChange={() => setHasBusinessName(true)} className="mt-0.5" />
                  <div className="flex-1">
                    <span className="font-normal text-slate-900 text-sm block mb-2">Yes, I have a business name</span>
                    {hasBusinessName === true && (
                      <input type="text" placeholder="Smith Appraisal Services"
                        value={state.w9Data.businessName || ''}
                        onChange={(e) => update('businessName', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="w-full border border-slate-200 rounded-exos py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Tax ID */}
            <div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">Which tax ID will you use?</h3>
              <p className="text-sm text-slate-500 mb-4">
                Use your SSN unless you specifically got an EIN from the IRS for your business.
              </p>

              <div className="space-y-3">
                {[
                  { type: 'ssn', label: 'Social Security Number (SSN)', placeholder: '123-45-6789', maxLen: 11 },
                  { type: 'ein', label: 'Employer ID Number (EIN)', placeholder: '12-3456789', maxLen: 10 },
                ].map(({ type, label, placeholder, maxLen }) => (
                  <label key={type} className={`flex items-start gap-3 p-4 border-2 rounded-exos cursor-pointer transition-all
                    ${state.w9Data.taxIdType === type ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input type="radio" name="taxIdType" value={type}
                      checked={state.w9Data.taxIdType === type}
                      onChange={() => handleTaxIdTypeChange(type)} className="mt-0.5" />
                    <div className="flex-1">
                      <span className="font-normal text-slate-900 text-sm block mb-2">{label}</span>
                      {state.w9Data.taxIdType === type && (
                        <input type="text" inputMode="numeric" placeholder={placeholder}
                          value={state.w9Data.taxId}
                          onChange={handleTaxIdInput}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          className="w-full border border-slate-200 rounded-exos py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          maxLength={maxLen} />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {q === 2 && <MailingAddressQuestion basicInfo={state.basicInfo} w9Data={state.w9Data} onChange={update} />}

        <NavFooter onBack={handleBack} onContinue={handleNext} continueLabel={q < TOTAL ? 'Continue →' : 'Review W-9 →'} continueDisabled={!isValid()} />
      </div>
    </div>
  );
};

export default W9SoleProp;
