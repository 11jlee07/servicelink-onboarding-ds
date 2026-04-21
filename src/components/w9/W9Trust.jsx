import NavFooter from '../shared/NavFooter';
import React, { useState } from 'react';
import MailingAddressQuestion from './MailingAddressQuestion';
import { formatEIN } from '../../utils/validation';

const TOTAL = 2;

const W9Trust = ({ state, setState, onNext, onBack }) => {
  const [q, setQ] = useState(1);

  const update = (field, value) =>
    setState((prev) => ({ ...prev, w9Data: { ...prev.w9Data, [field]: value } }));

  const isValid = () => {
    if (q === 1) return !!state.w9Data.businessName && state.w9Data.taxId.replace(/\D/g, '').length >= 9;
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
              {q === 1 ? 'Trust / Estate Details' : 'Mailing Address'}
            </h1>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-3 py-1">{q} of {TOTAL}</span>
        </div>

        {q === 1 && (
          <div className="space-y-6">
            {/* Trust name */}
            <div>
              <label className="block text-sm font-normal text-slate-700 mb-1.5">Trust or Estate Legal Name</label>
              <p className="text-xs text-slate-400 mb-2">As registered with the IRS or probate court.</p>
              <input
                type="text"
                placeholder='e.g., "The John Smith Living Trust"'
                value={state.w9Data.businessName}
                onChange={(e) => update('businessName', e.target.value)}
                className="w-full border border-slate-200 rounded-exos-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* EIN */}
            <div>
              <label className="block text-sm font-normal text-slate-700 mb-1.5">Employer ID Number (EIN)</label>
              <p className="text-xs text-slate-400 mb-2">Trusts and estates must provide an EIN, not a personal SSN.</p>
              <input
                type="text"
                inputMode="numeric"
                placeholder="12-3456789"
                value={state.w9Data.taxId}
                onChange={(e) => {
                  update('taxId', formatEIN(e.target.value));
                  update('taxIdType', 'ein');
                }}
                className="w-full border border-slate-200 rounded-exos-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={10}
              />
              <p className="text-xs text-slate-400 mt-1.5">Format: XX-XXXXXXX</p>
            </div>
          </div>
        )}

        {q === 2 && <MailingAddressQuestion basicInfo={state.basicInfo} w9Data={state.w9Data} onChange={update} />}

        <NavFooter onBack={handleBack} onContinue={handleNext} continueLabel={q < TOTAL ? 'Continue →' : 'Review W-9 →'} continueDisabled={!isValid()} />
      </div>
    </div>
  );
};

export default W9Trust;
