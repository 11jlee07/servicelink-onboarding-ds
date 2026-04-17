import React, { useRef, useState } from 'react';
import { Info, ChevronDown } from 'lucide-react';

const TVAAgreement = ({ state, setState, onNext, onBack }) => {
  const [agreed, setAgreed] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = useRef(null);

  const handleScroll = (e) => {
    const el = e.target;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 20) {
      setScrolledToBottom(true);
    }
  };

  const handleSubmit = () => {
    setState((prev) => ({
      ...prev,
      tva: { agreed: true, agreedAt: new Date().toISOString() },
    }));
    onNext();
  };

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const { basicInfo, w9Data } = state;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Step 6 of 6</p>
            <h1 className="text-2xl font-bold text-slate-900">Vendor Agreement</h1>
          </div>
        </div>

        <p className="text-slate-500 text-sm mb-6">
          Please read and accept the Trade Vendor Agreement to complete your application.
        </p>

        {/* Scroll reminder */}
        {!scrolledToBottom && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-900 flex items-center gap-2">
            <ChevronDown className="w-4 h-4 text-blue-500 animate-bounce" />
            Scroll to the bottom to review the full agreement
          </div>
        )}

        {/* Scrollable agreement */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="border-2 border-slate-200 rounded-xl p-6 h-96 overflow-y-auto bg-white mb-6"
        >
          <h2 className="text-xl font-bold text-slate-900 mb-1">TRADE VENDOR AGREEMENT</h2>
          <p className="text-xs text-slate-400 mb-6">ServiceLink Field Services, LLC · Effective {today}</p>

          <p className="text-sm text-slate-700 mb-5">
            This Agreement is entered into on <strong>{today}</strong> between ServiceLink Field Services, LLC
            ("<strong>ServiceLink</strong>") and{' '}
            <strong>{basicInfo.firstName} {basicInfo.lastName}</strong>
            {w9Data.businessName ? ` (operating as <strong>${w9Data.businessName}</strong>)` : ''}
            {' '}("<strong>Vendor</strong>").
          </p>

          {[
            {
              title: '1. SERVICES',
              body: 'Vendor agrees to provide residential and/or commercial appraisal services in accordance with ServiceLink\'s standards and requirements. All appraisals must comply with USPAP (Uniform Standards of Professional Appraisal Practice) and all applicable state and federal regulations. Vendor accepts assignments through the ServiceLink platform and agrees to complete them within the agreed-upon timeframes.',
            },
            {
              title: '2. PAYMENT TERMS',
              body: 'ServiceLink shall pay Vendor the agreed-upon fees for completed and accepted assignments within thirty (30) days of receiving a completed appraisal report. Payment terms and fee schedules will be provided separately and may be updated from time to time with written notice. Vendor acknowledges that fees may vary by assignment type, geography, and complexity.',
            },
            {
              title: '3. CONFIDENTIALITY',
              body: 'Vendor agrees to maintain strict confidentiality of all client information, property data, loan data, and ServiceLink business information obtained during this engagement. Vendor shall not disclose, sell, or use such information for any purpose other than performing services under this Agreement. This obligation survives the termination or expiration of this Agreement.',
            },
            {
              title: '4. INDEPENDENT CONTRACTOR STATUS',
              body: 'Vendor is an independent contractor and not an employee, agent, partner, or joint venturer of ServiceLink. Vendor is solely responsible for all federal, state, and local taxes, insurance premiums, and other obligations arising from their independent contractor status. ServiceLink will not withhold or pay any taxes on behalf of Vendor.',
            },
            {
              title: '5. LICENSE & COMPLIANCE',
              body: 'Vendor warrants that they maintain all necessary licenses, certifications, and insurance (including E&O insurance) required to perform appraisal services in each jurisdiction where services are performed. Vendor agrees to notify ServiceLink immediately, and in no event later than 24 hours, of any license suspension, revocation, lapse, or material change in status.',
            },
            {
              title: '6. QUALITY STANDARDS',
              body: 'All work product must meet ServiceLink\'s quality standards as communicated from time to time. ServiceLink reserves the right to reject work that does not meet these standards or to request revisions at no additional cost to ServiceLink. Repeated quality failures may result in suspension or termination of this Agreement.',
            },
            {
              title: '7. TERMINATION',
              body: 'Either party may terminate this Agreement with thirty (30) days written notice. ServiceLink may terminate immediately for cause, including but not limited to quality issues, compliance violations, license revocation, fraud, or misconduct. Upon termination, Vendor shall complete all accepted but uncompleted assignments unless ServiceLink waives this requirement.',
            },
            {
              title: '8. INDEMNIFICATION',
              body: 'Vendor agrees to indemnify, defend, and hold harmless ServiceLink and its affiliates, officers, directors, employees, and agents from any claims, damages, losses, or liabilities arising from or related to Vendor\'s performance of services, breach of this Agreement, negligence, or willful misconduct.',
            },
            {
              title: '9. DISPUTE RESOLUTION',
              body: 'The parties agree to first attempt to resolve any disputes through good-faith negotiation. If negotiation fails, disputes shall be resolved through binding arbitration under the American Arbitration Association rules. This Agreement shall be governed by the laws of the Commonwealth of Pennsylvania.',
            },
            {
              title: '10. ENTIRE AGREEMENT',
              body: 'This Agreement, together with any applicable fee schedules and platform terms, constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior agreements, representations, and understandings.',
            },
          ].map(({ title, body }) => (
            <div key={title} className="mb-6">
              <h3 className="text-sm font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
            </div>
          ))}

          <p className="text-xs text-slate-400 italic mt-4">
            [End of Trade Vendor Agreement]
          </p>
        </div>

        {/* Acceptance checkbox */}
        <div className={`p-5 border-2 rounded-xl transition-all mb-6 ${agreed ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 flex-shrink-0"
              aria-label="I accept the Vendor Agreement"
            />
            <div>
              <p className="font-semibold text-slate-900 text-sm mb-3">I have read and agree to the Trade Vendor Agreement</p>
              <div className="text-sm text-slate-600 space-y-1">
                <p><span className="font-medium">Name:</span> {basicInfo.firstName} {basicInfo.lastName}</p>
                {w9Data.businessName && <p><span className="font-medium">Business:</span> {w9Data.businessName}</p>}
                <p><span className="font-medium">Date:</span> {today}</p>
              </div>
            </div>
          </label>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onBack}
            className="px-6 py-3 border-2 border-slate-200 rounded-xl font-medium text-slate-700 hover:border-slate-300 transition-colors">
            ← Back
          </button>
          <button type="button" onClick={handleSubmit} disabled={!agreed}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl transition-colors">
            Submit →
          </button>
        </div>
      </div>
    </div>
  );
};

export default TVAAgreement;
