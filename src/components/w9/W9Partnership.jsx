import React, { useState } from 'react';
import MailingAddressQuestion from './MailingAddressQuestion';
import { formatEIN } from '../../utils/validation';
import { ChevronDown } from 'lucide-react';

const TOTAL = 2;

const W9Partnership = ({ state, setState, onNext, onBack }) => {
  const [q, setQ] = useState(1);
  const [showForeignInfo, setShowForeignInfo] = useState(false);

  const update = (field, value) =>
    setState((prev) => ({ ...prev, w9Data: { ...prev.w9Data, [field]: value } }));

  const isValid = () => {
    if (q === 1) {
      return !!state.w9Data.businessName &&
        state.w9Data.foreignMembers !== null &&
        state.w9Data.taxId.replace(/\D/g, '').length >= 9;
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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Step 2 of 6 · W-9</p>
            <h1 className="text-2xl font-bold text-slate-900">
              {q === 1 ? 'Partnership Details' : 'Mailing Address'}
            </h1>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-3 py-1">{q} of {TOTAL}</span>
        </div>

        {q === 1 && (
          <div className="space-y-8">
            {/* Partnership name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Partnership Legal Name</label>
              <p className="text-xs text-slate-400 mb-2">As registered with your state or county.</p>
              <input type="text" placeholder='e.g., "Smith & Jones Appraisal Partners"'
                value={state.w9Data.businessName}
                onChange={(e) => update('businessName', e.target.value)}
                className="w-full border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="border-t border-slate-100" />

            {/* Foreign partners */}
            <div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">Do any partners live outside the U.S.?</h3>
              <button type="button" onClick={() => setShowForeignInfo(!showForeignInfo)}
                className="flex items-center gap-1 text-blue-600 text-sm mb-4 hover:text-blue-700">
                Why does this matter?
                <ChevronDown className={`w-4 h-4 transition-transform ${showForeignInfo ? 'rotate-180' : ''}`} />
              </button>
              {showForeignInfo && (
                <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700">
                  Foreign partners trigger additional withholding requirements under IRC Section 1446(f). We need this for proper compliance.
                </div>
              )}
              <div className="space-y-3">
                {[
                  { value: false, label: 'No — all partners are U.S. residents' },
                  { value: true, label: 'Yes — we have foreign partners' },
                ].map(({ value, label }) => (
                  <label key={String(value)} className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all
                    ${state.w9Data.foreignMembers === value ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input type="radio" name="foreign"
                      checked={state.w9Data.foreignMembers === value}
                      onChange={() => update('foreignMembers', value)} />
                    <span className="font-medium text-slate-900 text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* EIN */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Employer ID Number (EIN)</label>
              <p className="text-xs text-slate-400 mb-2">All partnerships must have an EIN.</p>
              <input type="text" inputMode="numeric" placeholder="12-3456789"
                value={state.w9Data.taxId}
                onChange={(e) => {
                  update('taxId', formatEIN(e.target.value));
                  update('taxIdType', 'ein');
                }}
                className="w-full border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={10} />
            </div>
          </div>
        )}

        {q === 2 && <MailingAddressQuestion basicInfo={state.basicInfo} w9Data={state.w9Data} onChange={update} />}

        <div className="flex gap-3 mt-8">
          <button type="button" onClick={handleBack}
            className="px-6 py-3 border-2 border-slate-200 rounded-xl font-medium text-slate-700 hover:border-slate-300 transition-colors">
            ← Back
          </button>
          <button type="button" onClick={handleNext} disabled={!isValid()}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl transition-colors">
            {q < TOTAL ? 'Continue →' : 'Review W-9 →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default W9Partnership;
