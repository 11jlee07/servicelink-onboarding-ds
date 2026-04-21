import NavFooter from '../shared/NavFooter';
import React, { useState } from 'react';
import MailingAddressQuestion from './MailingAddressQuestion';
import InfoTooltip from '../shared/InfoTooltip';
import { formatSSN, formatEIN } from '../../utils/validation';
import { Info } from 'lucide-react';

const TOTAL = 2;

const W9SingleLLC = ({ state, setState, onNext, onBack }) => {
  const [q, setQ] = useState(1);

  const update = (field, value) =>
    setState((prev) => ({ ...prev, w9Data: { ...prev.w9Data, [field]: value } }));

  const handleClassChange = (val) => {
    update('taxClassification', val);
    update('taxId', '');
    update('taxIdType', val === 'disregarded' ? '' : 'ein');
  };

  const isCorpTaxed = ['c_corp', 's_corp'].includes(state.w9Data.taxClassification);

  const handleTaxIdInput = (e) => {
    const val = isCorpTaxed || state.w9Data.taxIdType === 'ein'
      ? formatEIN(e.target.value)
      : formatSSN(e.target.value);
    update('taxId', val);
  };

  const taxIdFilled = state.w9Data.taxId.replace(/\D/g, '').length >= 9;

  const isValid = () => {
    if (q === 1) {
      const nameOk = !!state.w9Data.businessName;
      const classOk = !!state.w9Data.taxClassification;
      if (!nameOk || !classOk) return false;
      if (isCorpTaxed) return taxIdFilled;
      return !!state.w9Data.taxIdType && taxIdFilled;
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
              {q === 1 ? 'LLC & Tax Details' : 'Mailing Address'}
            </h1>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-3 py-1">{q} of {TOTAL}</span>
        </div>

        {q === 1 && (
          <div className="space-y-8">
            {/* LLC Name */}
            <div>
              <label className="block text-sm font-normal text-slate-700 mb-1.5">LLC Legal Name</label>
              <p className="text-xs text-slate-400 mb-2">As registered with your state's Secretary of State.</p>
              <input type="text" placeholder='e.g., "Smith Appraisal LLC"'
                value={state.w9Data.businessName}
                onChange={(e) => update('businessName', e.target.value)}
                className="w-full border border-slate-200 rounded-exos-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="border-t border-slate-100" />

            {/* Tax Classification */}
            <div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">How is your LLC taxed?</h3>
              <p className="text-sm text-slate-500 mb-4">Most single-member LLCs are "disregarded entities."</p>

              <div className="space-y-3">
                {[
                  { value: 'disregarded', label: 'Disregarded entity (most common)', tip: "Didn't file Form 8832 or 2553. The IRS taxes you personally, not the LLC." },
                  { value: 'c_corp', label: 'C Corporation', tip: 'Filed Form 8832 to be taxed as a C-corp.' },
                  { value: 's_corp', label: 'S Corporation', tip: 'Filed Form 2553 to be taxed as an S-corp.' },
                ].map(({ value, label, tip }) => (
                  <label key={value} className={`flex items-center gap-3 p-4 border-2 rounded-exos cursor-pointer transition-all
                    ${state.w9Data.taxClassification === value ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input type="radio" name="taxClass" value={value}
                      checked={state.w9Data.taxClassification === value}
                      onChange={() => handleClassChange(value)} />
                    <span className="flex-1 font-normal text-slate-900 text-sm">{label}</span>
                    <InfoTooltip text={tip} />
                  </label>
                ))}

                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-exos-sm text-sm text-blue-900 flex gap-2">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Not sure?</strong> If you didn't file special tax forms, choose <em>Disregarded entity</em>.</span>
                </div>
              </div>
            </div>

            {/* Tax ID — conditional on classification */}
            {state.w9Data.taxClassification && (
              <>
                <div className="border-t border-slate-100" />
                <div>
                  <h3 className="text-base font-semibold text-slate-900 mb-1">
                    {isCorpTaxed ? 'Employer ID Number (EIN)' : 'Tax Identification Number'}
                  </h3>
                  {isCorpTaxed ? (
                    <>
                      <p className="text-sm text-slate-500 mb-4">LLCs taxed as corporations must use an EIN.</p>
                      <input type="text" inputMode="numeric" placeholder="12-3456789"
                        value={state.w9Data.taxId}
                        onChange={handleTaxIdInput}
                        className="w-full border border-slate-200 rounded-exos-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={10} />
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-slate-500 mb-4">Use your SSN unless you have a separate EIN for the LLC.</p>
                      <div className="space-y-3">
                        {[
                          { type: 'ssn', label: 'Social Security Number (SSN)', placeholder: '123-45-6789', maxLen: 11 },
                          { type: 'ein', label: 'Employer ID Number (EIN)', placeholder: '12-3456789', maxLen: 10 },
                        ].map(({ type, label, placeholder, maxLen }) => (
                          <label key={type} className={`flex items-start gap-3 p-4 border-2 rounded-exos cursor-pointer transition-all
                            ${state.w9Data.taxIdType === type ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                            <input type="radio" name="taxIdType" value={type}
                              checked={state.w9Data.taxIdType === type}
                              onChange={() => { update('taxIdType', type); update('taxId', ''); }}
                              className="mt-0.5" />
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
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {q === 2 && <MailingAddressQuestion basicInfo={state.basicInfo} w9Data={state.w9Data} onChange={update} />}

        <NavFooter onBack={handleBack} onContinue={handleNext} continueLabel={q < TOTAL ? 'Continue' : 'Review W-9'} continueDisabled={!isValid()} />
      </div>
    </div>
  );
};

export default W9SingleLLC;
