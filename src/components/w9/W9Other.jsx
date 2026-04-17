import React, { useState } from 'react';
import TaxIdQuestion from './TaxIdQuestion';
import MailingAddressQuestion from './MailingAddressQuestion';

const TOTAL = 2;

const W9Other = ({ state, setState, onNext, onBack }) => {
  const [q, setQ] = useState(1);
  const [entityDescription, setEntityDescription] = useState('');

  const update = (field, value) =>
    setState((prev) => ({ ...prev, w9Data: { ...prev.w9Data, [field]: value } }));

  const isValid = () => {
    if (q === 1) {
      return entityDescription.trim() && !!state.w9Data.businessName &&
        !!state.w9Data.taxIdType && state.w9Data.taxId.replace(/\D/g, '').length >= 9;
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
              {q === 1 ? 'Entity Information' : 'Mailing Address'}
            </h1>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-3 py-1">{q} of {TOTAL}</span>
        </div>

        {q === 1 && (
          <div className="space-y-6">
            {/* Entity type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Entity Type</label>
              <p className="text-xs text-slate-400 mb-2">Describe how your business is structured.</p>
              <input
                type="text"
                placeholder="e.g., Joint Venture, Cooperative, Government Entity"
                value={entityDescription}
                onChange={(e) => setEntityDescription(e.target.value)}
                className="w-full border border-slate-200 rounded-exos-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Entity name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Entity Legal Name</label>
              <input
                type="text"
                placeholder='e.g., "Smith Appraisal Ventures"'
                value={state.w9Data.businessName}
                onChange={(e) => update('businessName', e.target.value)}
                className="w-full border border-slate-200 rounded-exos-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tax ID */}
            <TaxIdQuestion w9Data={state.w9Data} onChange={update} />
          </div>
        )}

        {q === 2 && <MailingAddressQuestion basicInfo={state.basicInfo} w9Data={state.w9Data} onChange={update} />}

        <div className="flex gap-3 mt-8">
          <button type="button" onClick={handleBack}
            className="px-6 py-3 border-2 border-slate-200 rounded-exos font-medium text-slate-700 hover:border-slate-300 transition-colors">
            ← Back
          </button>
          <button type="button" onClick={handleNext} disabled={!isValid()}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-exos transition-colors">
            {q < TOTAL ? 'Continue →' : 'Review W-9 →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default W9Other;
