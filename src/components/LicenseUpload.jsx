import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle, AlertCircle, Upload, Camera, FileText,
  Loader, ShieldCheck, ChevronDown, X
} from 'lucide-react';
import NavFooter from './shared/NavFooter';
import { processLicenseOCR, verifyLicense } from '../utils/mockApi';

/* ─── Mobile detection ───────────────────────────────────────────── */
const isMobile = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: none) and (pointer: coarse)').matches;

/* ─── Mock ASC lookup — simulates finding license by name ─────────── */
function mockAscLookup(firstName, lastName) {
  // Simulated found license based on applicant's name
  return {
    name: `${firstName} ${lastName}`,
    licenseNumber: 'TX-CR-' + Math.floor(10000 + Math.random() * 89999),
    type: 'Certified Residential',
    state: 'Texas',
    status: 'Active',
    effectiveDate: '2019-03-15',
    expirationDate: '2025-03-14',
    address: '123 Main St, Celina, TX 75009',
  };
}

const inputCls =
  'w-full border border-slate-200 rounded-exos-sm py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

/* ─── License detail card ────────────────────────────────────────── */
const LicenseCard = ({ data }) => (
  <div className="rounded-exos border border-slate-200 overflow-hidden">
    <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2.5">
      <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
      <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
        Found on ASC.gov
      </span>
    </div>
    <div className="px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-3">
      {[
        { label: 'Name',           value: data.name },
        { label: 'License #',      value: data.licenseNumber },
        { label: 'Type',           value: data.type },
        { label: 'State',          value: data.state },
        { label: 'Status',         value: data.status,
          badge: data.status === 'Active'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-amber-100 text-amber-700' },
        { label: 'Expires',        value: data.expirationDate },
      ].map(({ label, value, badge }) => (
        <div key={label}>
          <p className="text-xs text-slate-400 mb-0.5">{label}</p>
          {badge ? (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>
              {value}
            </span>
          ) : (
            <p className="text-sm font-normal text-slate-800">{value}</p>
          )}
        </div>
      ))}
    </div>
  </div>
);

/* ─── OCR review fields ──────────────────────────────────────────── */
const ReviewFields = ({ ocrData, updateOcr }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-normal text-slate-600 mb-1">State</label>
        <select value={ocrData.state} onChange={(e) => updateOcr('state', e.target.value)} className={inputCls}>
          <option value="">Select state...</option>
          {['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
            'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas',
            'Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota',
            'Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey',
            'New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon',
            'Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas',
            'Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming']
            .map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-normal text-slate-600 mb-1">License Type</label>
        <select value={ocrData.type} onChange={(e) => updateOcr('type', e.target.value)} className={inputCls}>
          <option value="">Select type...</option>
          {['Certified Residential','Certified General','Licensed Residential',
            'Licensed Appraiser Trainee','State Certified Appraiser','Supervisory Appraiser']
            .map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
    </div>
    <div>
      <label className="block text-sm font-normal text-slate-600 mb-1">License Number</label>
      <input type="text" value={ocrData.number} onChange={(e) => updateOcr('number', e.target.value)} className={inputCls} />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-normal text-slate-600 mb-1">Effective Date</label>
        <input type="date" value={ocrData.effectiveDate} onChange={(e) => updateOcr('effectiveDate', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="block text-sm font-normal text-slate-600 mb-1">Expiration Date</label>
        <input type="date" value={ocrData.expirationDate} onChange={(e) => updateOcr('expirationDate', e.target.value)} className={inputCls} />
      </div>
    </div>
    <div>
      <label className="block text-sm font-normal text-slate-600 mb-1">License Address</label>
      <input type="text" value={ocrData.address} onChange={(e) => updateOcr('address', e.target.value)} className={inputCls} />
    </div>
  </div>
);

/* ─── Main component ─────────────────────────────────────────────── */
const LicenseUpload = ({ state, setState, onNext, onBack }) => {
  // stages: 'looking' | 'found' | 'fallback' | 'ocr' | 'review' | 'done'
  const [stage, setStage] = useState('looking');
  const [ascData, setAscData] = useState(null);
  const [showFallbackHint, setShowFallbackHint] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null); // 'success' | 'failure'
  const [verifying, setVerifying] = useState(false);
  const [mobile] = useState(isMobile);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const firstName = state.basicInfo?.firstName || 'John';
  const lastName  = state.basicInfo?.lastName  || 'Smith';

  const ocrData = state.license.ocrData;

  const updateOcr = (field, value) =>
    setState((prev) => ({
      ...prev,
      license: { ...prev.license, ocrData: { ...prev.license.ocrData, [field]: value } },
    }));

  /* Simulate ASC lookup on mount */
  useEffect(() => {
    const t = setTimeout(() => {
      const found = mockAscLookup(firstName, lastName);
      setAscData(found);
      setStage('found');
    }, 1800);
    return () => clearTimeout(t);
  }, []);

  /* Confirm the ASC-found license */
  const handleConfirm = async () => {
    // Populate ocrData from ASC result and go straight to verified
    setState((prev) => ({
      ...prev,
      license: {
        ...prev.license,
        apiVerified: true,
        ocrData: {
          state: ascData.state,
          type: ascData.type,
          number: ascData.licenseNumber,
          effectiveDate: ascData.effectiveDate,
          expirationDate: ascData.expirationDate,
          address: ascData.address,
        },
      },
    }));
    setVerifyResult('success');
    setStage('done');
  };

  /* User says the found license isn't theirs */
  const handleDispute = () => {
    setStage('fallback');
  };

  /* File selected — OCR flow */
  const handleFile = async (file) => {
    if (!file) return;
    setState((prev) => ({ ...prev, license: { ...prev.license, uploadedFile: file } }));
    setStage('ocr');

    const data = await processLicenseOCR(file);
    setState((prev) => ({ ...prev, license: { ...prev.license, ocrData: data } }));

    const result = await verifyLicense(data);
    setState((prev) => ({
      ...prev,
      license: { ...prev.license, apiVerified: result.verified, apiError: result.error },
    }));
    setVerifyResult(result.verified ? 'success' : 'failure');
    setStage('done');
  };

  /* Manual entry */
  const handleManual = () => {
    setState((prev) => ({
      ...prev,
      license: {
        ...prev.license,
        ocrData: { state: '', type: '', number: '', effectiveDate: '', expirationDate: '', address: '' },
      },
    }));
    setStage('review');
  };

  /* Verify manually-entered data */
  const handleVerify = async () => {
    setVerifying(true);
    const result = await verifyLicense(state.license.ocrData);
    setState((prev) => ({
      ...prev,
      license: { ...prev.license, apiVerified: result.verified, apiError: result.error },
    }));
    setVerifyResult(result.verified ? 'success' : 'failure');
    setVerifying(false);
    setStage('done');
  };

  const manualFilled = ocrData?.state && ocrData?.number && ocrData?.type;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-exos shadow-sm border border-slate-100 p-6">

        <div className="mb-6">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Step 3 of 6</p>
          <h1 className="text-2xl font-bold text-slate-900">Appraiser License</h1>
        </div>

        {/* ── Looking up ── */}
        {stage === 'looking' && (
          <div className="py-14 flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-exos bg-blue-50 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-blue-600" />
              </div>
              <Loader className="w-5 h-5 text-blue-500 animate-spin absolute -bottom-1 -right-1" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-900">Looking you up on ASC.gov...</p>
              <p className="text-sm text-slate-500 mt-1">Checking the national appraiser registry</p>
            </div>
          </div>
        )}

        {/* ── Found ── */}
        {stage === 'found' && ascData && (
          <div className="space-y-5">
            <div>
              <p className="text-slate-700 text-sm leading-relaxed">
                Good news — we found a license on ASC.gov matching your name.
                Take a quick look to confirm this is yours before we move on.
              </p>
            </div>

            <LicenseCard data={ascData} />

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleConfirm}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase rounded-exos transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Yes, that's my license
              </button>
              <button
                type="button"
                onClick={handleDispute}
                className="w-full py-3 border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-medium rounded-exos transition-colors"
              >
                No, this isn't mine
              </button>
            </div>

            {/* Fallback hint */}
            <div className="pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowFallbackHint((p) => !p)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFallbackHint ? 'rotate-180' : ''}`} />
                What happens if the system can't find my license?
              </button>
              {showFallbackHint && (
                <div className="mt-2.5 p-3.5 bg-slate-50 rounded-exos text-xs text-slate-500 leading-relaxed">
                  No problem. If we can't find your license automatically, you'll be able to
                  upload a photo or PDF of your license, or enter your details manually.
                  We'll verify everything before your application is submitted.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Fallback: upload or manual ── */}
        {stage === 'fallback' && (
          <div className="space-y-5">
            <p className="text-slate-600 text-sm">
              No worries — upload your license and we'll pull the details automatically,
              or enter them yourself.
            </p>

            {/* Upload options */}
            <div className="space-y-3">
              {/* Camera (mobile only) */}
              {mobile && (
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full flex items-center gap-4 p-4 border-2 border-slate-200 hover:border-blue-400 rounded-exos text-left transition-all group"
                >
                  <div className="w-11 h-11 bg-slate-100 group-hover:bg-blue-50 rounded-exos flex items-center justify-center flex-shrink-0 transition-colors">
                    <Camera className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">Take a photo</p>
                    <p className="text-xs text-slate-400 mt-0.5">Use your camera to capture your license</p>
                  </div>
                </button>
              )}

              {/* File upload */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-4 p-4 border-2 border-slate-200 hover:border-blue-400 rounded-exos text-left transition-all group"
              >
                <div className="w-11 h-11 bg-slate-100 group-hover:bg-blue-50 rounded-exos flex items-center justify-center flex-shrink-0 transition-colors">
                  <Upload className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">
                    {mobile ? 'Upload from files' : 'Upload a file'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">PDF, JPG, or PNG · Max 10 MB</p>
                </div>
              </button>

              {/* Manual entry */}
              <button
                type="button"
                onClick={handleManual}
                className="w-full flex items-center gap-4 p-4 border-2 border-slate-200 hover:border-blue-400 rounded-exos text-left transition-all group"
              >
                <div className="w-11 h-11 bg-slate-100 group-hover:bg-blue-50 rounded-exos flex items-center justify-center flex-shrink-0 transition-colors">
                  <FileText className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">Enter details manually</p>
                  <p className="text-xs text-slate-400 mt-0.5">Type in your license number, type, and dates</p>
                </div>
              </button>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFile(e.target.files[0])}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFile(e.target.files[0])}
              className="hidden"
            />

            <button
              type="button"
              onClick={onBack}
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              Back
            </button>
          </div>
        )}

        {/* ── OCR processing ── */}
        {stage === 'ocr' && (
          <div className="text-center py-16">
            <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-lg font-semibold text-slate-900 mb-1">Reading your license...</p>
            <p className="text-sm text-slate-500">Extracting and verifying details</p>
          </div>
        )}

        {/* ── Manual review ── */}
        {stage === 'review' && (
          <div className="space-y-5">
            <p className="text-sm text-slate-500">
              Fill in your license details below and we'll verify them with ASC.gov.
            </p>
            <ReviewFields ocrData={ocrData} updateOcr={updateOcr} />
            {verifying ? (
              <div className="border-t border-exos-border-light mt-6 pt-4 flex items-center justify-between gap-3">
                <button type="button" onClick={() => setStage('fallback')} className="min-w-[140px] px-6 py-3 border-2 border-slate-200 rounded-exos text-sm font-bold uppercase text-slate-700 hover:border-slate-300 transition-colors">Back</button>
                <div className="min-w-[140px] py-3 bg-slate-50 border border-slate-200 rounded-exos flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Loader className="w-4 h-4 animate-spin" /> Verifying...
                </div>
              </div>
            ) : (
              <NavFooter onBack={() => setStage('fallback')} onContinue={handleVerify} continueLabel="Verify with ASC.gov" continueDisabled={!manualFilled} className="pt-2" />
            )}
          </div>
        )}

        {/* ── Done ── */}
        {stage === 'done' && (
          <div className="space-y-5">
            {verifyResult === 'success' && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-exos-sm flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-900 text-sm">License verified</p>
                  <p className="text-sm text-emerald-700 mt-0.5">
                    Your license is active and in good standing with ASC.gov.
                  </p>
                </div>
              </div>
            )}

            {verifyResult === 'failure' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-exos-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 text-sm">Couldn't verify automatically</p>
                  <p className="text-sm text-amber-700 mt-1">
                    This sometimes happens with newly-issued licenses or certain state boards.
                    You can continue — our team will review and confirm within 24 hours.
                  </p>
                </div>
              </div>
            )}

            <ReviewFields ocrData={ocrData} updateOcr={updateOcr} />

            <NavFooter onBack={onBack} onContinue={onNext} className="pt-2" />
          </div>
        )}

      </div>
    </div>
  );
};

export default LicenseUpload;
