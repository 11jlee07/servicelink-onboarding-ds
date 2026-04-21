import React from 'react';
import { formatSSN, formatEIN } from '../../utils/validation';

const TaxIdQuestion = ({ w9Data, onChange, einOnly = false }) => {
  const { taxIdType, taxId } = w9Data;

  const setType = (type) => {
    onChange('taxIdType', type);
    onChange('taxId', '');
  };

  const handleChange = (e) => {
    const val = taxIdType === 'ssn' ? formatSSN(e.target.value) : formatEIN(e.target.value);
    onChange('taxId', val);
  };

  if (einOnly) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-1">What's your Employer ID Number (EIN)?</h2>
        <p className="text-slate-500 text-sm mb-6">Your EIN is issued by the IRS to identify your business for tax purposes.</p>
        <label className="block text-sm font-normal text-slate-700 mb-1.5" htmlFor="ein">
          Employer ID Number (EIN)
        </label>
        <input
          id="ein"
          type="text"
          inputMode="numeric"
          placeholder="12-3456789"
          value={taxId}
          onChange={(e) => onChange('taxId', formatEIN(e.target.value))}
          className="w-full border border-slate-200 rounded-exos-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={10}
        />
        <p className="text-xs text-slate-400 mt-1.5">Format: XX-XXXXXXX</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-1">Which tax ID will you use?</h2>
      <p className="text-slate-500 text-sm mb-6">
        Use your SSN unless you specifically got an EIN from the IRS for your business.
      </p>

      <label
        className={`flex items-start gap-3 p-4 border-2 rounded-exos mb-3 cursor-pointer transition-all
          ${taxIdType === 'ssn' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
      >
        <input
          type="radio"
          name="taxIdType"
          value="ssn"
          checked={taxIdType === 'ssn'}
          onChange={() => setType('ssn')}
          className="mt-0.5"
        />
        <div className="flex-1">
          <span className="font-normal text-slate-900 text-sm block mb-2">Social Security Number (SSN)</span>
          {taxIdType === 'ssn' && (
            <input
              type="text"
              inputMode="numeric"
              placeholder="123-45-6789"
              value={taxId}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-exos py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              maxLength={11}
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      </label>

      <label
        className={`flex items-start gap-3 p-4 border-2 rounded-exos cursor-pointer transition-all
          ${taxIdType === 'ein' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
      >
        <input
          type="radio"
          name="taxIdType"
          value="ein"
          checked={taxIdType === 'ein'}
          onChange={() => setType('ein')}
          className="mt-0.5"
        />
        <div className="flex-1">
          <span className="font-normal text-slate-900 text-sm block mb-2">Employer ID Number (EIN)</span>
          {taxIdType === 'ein' && (
            <input
              type="text"
              inputMode="numeric"
              placeholder="12-3456789"
              value={taxId}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-exos py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              maxLength={10}
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      </label>
    </div>
  );
};

export default TaxIdQuestion;
