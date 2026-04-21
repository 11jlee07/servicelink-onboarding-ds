import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, ExternalLink } from 'lucide-react';
import NavFooter from './shared/NavFooter';

const BackgroundCheck = ({ state, onNext, onBack }) => {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-exos shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Step 5 of 6</p>
            <h1 className="text-2xl font-bold text-slate-900">Background Check</h1>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-exos flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        {/* Policy statement */}
        <div className="mb-6 p-5 bg-slate-50 border border-slate-200 rounded-exos-sm text-sm text-slate-700 leading-relaxed space-y-3">
          <p>
            ServiceLink's policy is that all Independent Contract vendors are to be background checked
            as a pre-requisite to being added and retained as a member of its panel of independent contractors.
          </p>
          <p>
            This policy also supports our Lender/Client contracts that require ServiceLink to obtain a
            clear background check from each Independent Contract vendor.
          </p>
          <p>
            Shortly, you will be receiving a unique link to complete ServiceLink's required background
            check through CrimCheck. The link you will be receiving is <strong>pre-paid by ServiceLink</strong>,
            in accordance with <em>22 Tex. Admin. Code § 159.201(a)(19)</em>.
          </p>
          <p>
            If you have any questions or do not receive the link to process shortly, please contact
            ServiceLink's Strategic Business Department at{' '}
            <a
              href="mailto:Appraiserbackgroundchecks@svclink.com"
              className="text-blue-600 hover:underline"
            >
              Appraiserbackgroundchecks@svclink.com
            </a>
          </p>
        </div>

        {/* Key callouts */}
        <div className="space-y-3 mb-8">
          <div className="flex items-start gap-3 p-4 bg-danger-light border border-red-200 rounded-exos-sm ">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-red-600">
              Background check search will cover a minimum of 10 years
            </p>
          </div>

          <div className="flex items-start gap-3 p-4 bg-danger-light border border-red-200 rounded-exos-sm ">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-red-600">
              The only acceptable background check company is CrimCheck*
            </p>
          </div>
        </div>

        {/* CrimCheck disclaimer */}
        <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-exos-sm ">
          <p className="text-xs text-slate-500 leading-relaxed italic">
            *ServiceLink has confirmed that CrimCheck is a reputable, independent and qualified
            background check vendor. Neither SL nor FNF have any ownership interest in the vendor,
            nor do they receive any fee "split", referral fee or other compensation from the vendor
            or its fees.
          </p>
        </div>

        {/* Acknowledgment */}
        <div className={`p-5 border-2 rounded-exos transition-all mb-6 ${acknowledged ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 w-4 h-4 flex-shrink-0"
            />
            <span className="text-sm text-slate-700">
              I understand that a background check through <strong>CrimCheck</strong> is required to
              complete my onboarding, and that I will receive a pre-paid link via email shortly after submission.
            </span>
          </label>
        </div>

        <NavFooter onBack={onBack} onContinue={onNext} continueDisabled={!acknowledged} />
      </div>
    </div>
  );
};

export default BackgroundCheck;
