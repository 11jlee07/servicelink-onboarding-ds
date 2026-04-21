import React from 'react';
import { CheckCircle } from 'lucide-react';

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC',
  'ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

const MailingAddressQuestion = ({ basicInfo, w9Data, onChange }) => {
  const { mailingAddress } = w9Data;
  const useOffice = mailingAddress.useOfficeAddress;

  const setUseOffice = (val) => {
    onChange('mailingAddress', { ...mailingAddress, useOfficeAddress: val });
  };

  const setField = (field, value) => {
    onChange('mailingAddress', { ...mailingAddress, [field]: value });
  };

  const officeAddr = basicInfo.address;

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-1">What's your business mailing address?</h2>
      <p className="text-slate-500 text-sm mb-6">This is where we'll send your tax forms.</p>

      {/* Option: same as office */}
      <label
        className={`flex items-start gap-3 p-4 border-2 rounded-exos mb-3 cursor-pointer transition-all
          ${useOffice ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
      >
        <input
          type="radio"
          name="mailingOption"
          checked={useOffice}
          onChange={() => setUseOffice(true)}
          className="mt-0.5"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {useOffice && <CheckCircle className="w-4 h-4 text-emerald-500" />}
            <span className="font-normal text-slate-900 text-sm">Same as my office address</span>
          </div>
          <p className="text-sm text-slate-600">
            {officeAddr.street}<br />
            {officeAddr.city}{officeAddr.city && ','} {officeAddr.state || officeAddr.stateCode} {officeAddr.zip}
          </p>
        </div>
      </label>

      {/* Option: different address */}
      <label
        className={`flex items-start gap-3 p-4 border-2 rounded-exos cursor-pointer transition-all
          ${!useOffice ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
      >
        <input
          type="radio"
          name="mailingOption"
          checked={!useOffice}
          onChange={() => setUseOffice(false)}
          className="mt-0.5"
        />
        <div className="flex-1">
          <span className="font-normal text-slate-900 text-sm block mb-3">Use a different address</span>
          {!useOffice && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Street Address"
                value={mailingAddress.street || ''}
                onChange={(e) => setField('street', e.target.value)}
                className="w-full border border-slate-200 rounded-exos py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="grid grid-cols-5 gap-2">
                <input
                  type="text"
                  placeholder="City"
                  value={mailingAddress.city || ''}
                  onChange={(e) => setField('city', e.target.value)}
                  className="border border-slate-200 rounded-exos py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white col-span-2"
                  onClick={(e) => e.stopPropagation()}
                />
                <select
                  value={mailingAddress.state || ''}
                  onChange={(e) => setField('state', e.target.value)}
                  className="border border-slate-200 rounded-exos py-2.5 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white col-span-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="">ST</option>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="ZIP"
                  value={mailingAddress.zip || ''}
                  onChange={(e) => setField('zip', e.target.value.replace(/\D/g, '').slice(0, 5))}
                  className="border border-slate-200 rounded-exos py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white col-span-2"
                  maxLength={5}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
        </div>
      </label>
    </div>
  );
};

export default MailingAddressQuestion;
