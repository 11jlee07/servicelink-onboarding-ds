import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Info, ChevronDown, PenLine, X, RotateCcw } from 'lucide-react';

const W9ReviewSign = ({ state, setState, onNext, onBack }) => {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState(null); // captured on confirm
  const [showCertInfo, setShowCertInfo] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [isLandscape, setIsLandscape] = useState(
    typeof window !== 'undefined' && window.innerWidth > window.innerHeight
  );

  useEffect(() => {
    const update = () => setIsLandscape(window.innerWidth > window.innerHeight);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', () => setTimeout(update, 150));
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  // Clear canvas whenever modal opens
  useEffect(() => {
    if (showSignModal && canvasRef.current) {
      canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      // Don't reset hasSignature here — user may have already signed
    }
  }, [showSignModal]);

  const getPos = (canvas, e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY,
      scaleX,
    };
  };

  const startDraw = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawingRef.current = true;
    const ctx = canvas.getContext('2d');
    const { x, y, scaleX } = getPos(canvas, e);
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 2.5 * scaleX; // scale so it appears as ~2.5px regardless of canvas resolution
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, []);

  const draw = useCallback((e) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(canvas, e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }, []);

  const endDraw = useCallback(() => { isDrawingRef.current = false; }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignatureDataUrl(null);
  };

  const confirmSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL();
    setSignatureDataUrl(url);
    setHasSignature(true);
    setShowSignModal(false);
  };

  const handleSubmit = () => {
    if (!signatureDataUrl) return;
    setState((prev) => ({
      ...prev,
      w9Signature: {
        signatureData: signatureDataUrl,
        signedAt: new Date().toISOString(),
      },
    }));
    onNext();
  };

  const { basicInfo, w9Data, businessStructure } = state;
  const addr = w9Data.mailingAddress.useOfficeAddress
    ? basicInfo.address
    : w9Data.mailingAddress;

  const classLabel = () => {
    if (businessStructure === 'sole_prop') return 'Individual / Sole Proprietor';
    if (businessStructure === 'single_llc') return `Limited Liability Company (${w9Data.taxClassification || 'disregarded'})`;
    if (businessStructure === 'multi_llc') return `Limited Liability Company (${w9Data.taxClassification || 'partnership'})`;
    if (businessStructure === 'partnership') return 'Partnership';
    if (businessStructure === 'corporation') return `${w9Data.taxClassification === 's_corp' ? 'S' : 'C'} Corporation`;
    if (businessStructure === 'trust') return 'Trust / Estate';
    return 'Other';
  };

  const maskedId = w9Data.taxId
    ? w9Data.taxId.slice(0, -4).replace(/\d/g, '•') + w9Data.taxId.slice(-4)
    : '';

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Step 2 of 6 · W-9</p>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Review Your W-9</h1>
            </div>
          </div>

          <p className="text-slate-500 text-sm mb-5 sm:mb-6">
            Please review the information below before signing. You can go back to make changes.
          </p>

          {/* W-9 Preview */}
          <div className="mb-5 sm:mb-6 border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-5 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Form W-9 Preview</span>
              <span className="hidden sm:block text-xs text-slate-400">Request for Taxpayer Identification Number</span>
            </div>
            <div className="p-4 sm:p-6 max-h-72 sm:max-h-80 overflow-y-auto bg-white">
              <div className="space-y-4 text-sm font-mono">
                <div>
                  <span className="text-xs font-sans font-medium text-slate-400 uppercase tracking-wide">Line 1 · Name</span>
                  <p className="text-slate-900 mt-0.5">{basicInfo.firstName} {basicInfo.lastName}</p>
                </div>
                {w9Data.businessName && (
                  <div className="border-t border-slate-100 pt-4">
                    <span className="text-xs font-sans font-medium text-slate-400 uppercase tracking-wide">Line 2 · Business Name</span>
                    <p className="text-slate-900 mt-0.5">{w9Data.businessName}</p>
                  </div>
                )}
                <div className="border-t border-slate-100 pt-4">
                  <span className="text-xs font-sans font-medium text-slate-400 uppercase tracking-wide">Line 3 · Tax Classification</span>
                  <p className="text-slate-900 mt-0.5">☑ {classLabel()}</p>
                </div>
                {w9Data.foreignMembers !== null && (
                  <div className="border-t border-slate-100 pt-4">
                    <span className="text-xs font-sans font-medium text-slate-400 uppercase tracking-wide">Line 3b · Foreign Members / Partners</span>
                    <p className="text-slate-900 mt-0.5">{w9Data.foreignMembers ? '☑ Yes' : '☐ No'}</p>
                  </div>
                )}
                <div className="border-t border-slate-100 pt-4">
                  <span className="text-xs font-sans font-medium text-slate-400 uppercase tracking-wide">Lines 5–6 · Address</span>
                  <p className="text-slate-900 mt-0.5">
                    {addr.street}<br />
                    {addr.city}{addr.city && ','} {addr.state || addr.stateCode} {addr.zip}
                  </p>
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <span className="text-xs font-sans font-medium text-slate-400 uppercase tracking-wide">Part I · Taxpayer Identification Number</span>
                  <p className="text-slate-900 mt-0.5">
                    {w9Data.taxIdType === 'ssn' ? 'SSN:' : 'EIN:'} {maskedId}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Certification */}
          <div className="mb-5 sm:mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h3 className="font-semibold text-slate-900 mb-3 text-sm">By signing below, you certify that:</h3>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li>• The tax information shown above is accurate and complete</li>
              <li>• You are a U.S. person (citizen or resident alien)</li>
              <li>• You are not subject to backup withholding (or are exempt)</li>
            </ul>
            <button type="button" onClick={() => setShowCertInfo(!showCertInfo)}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 mt-3">
              <Info className="w-3.5 h-3.5" />
              What am I certifying?
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCertInfo ? 'rotate-180' : ''}`} />
            </button>
            {showCertInfo && (
              <div className="mt-3 p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-600">
                You're confirming that the tax information is accurate and that you're authorized to provide it.
                This is the standard IRS requirement for all independent contractors under penalty of perjury.
              </div>
            )}
          </div>

          {/* Signature section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">Signature</label>

            {/* Preview — shows captured data URL as image, not a live canvas */}
            {signatureDataUrl && (
              <div className="border-2 border-blue-400 rounded-xl overflow-hidden bg-white mb-3">
                <img
                  src={signatureDataUrl}
                  alt="Your signature"
                  className="w-full object-contain"
                  style={{ height: '80px' }}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSignModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                <PenLine className="w-4 h-4" />
                {hasSignature ? 'Re-sign' : 'Sign W-9'}
              </button>
              {hasSignature && (
                <button type="button" onClick={clearCanvas}
                  className="px-3 py-2.5 text-xs text-slate-500 hover:text-red-500 transition-colors border border-slate-200 rounded-xl">
                  Clear
                </button>
              )}
            </div>

            {!hasSignature && (
              <p className="text-xs text-slate-400 mt-2">Tap "Sign W-9" to open the signature pad</p>
            )}
          </div>

          {/* Date */}
          <p className="text-sm text-slate-500 mb-6 sm:mb-8">
            Date: <strong>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={onBack}
              className="px-6 py-3 border-2 border-slate-200 rounded-xl font-medium text-slate-700 hover:border-slate-300 transition-colors text-sm sm:text-base">
              ← Back to Edit
            </button>
            <button type="button" onClick={handleSubmit} disabled={!hasSignature}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl transition-colors text-sm sm:text-base">
              Sign &amp; Continue →
            </button>
          </div>
        </div>
      </div>

      {/* ── Signature Modal — canvas only lives here ── */}
      {showSignModal && (
        <div style={{ position: 'fixed', inset: '32px', zIndex: 50 }}
          className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
            <div>
              <p className="font-bold text-slate-900 text-sm sm:text-base">Sign Your W-9</p>
              <p className="text-xs text-slate-400 mt-0.5">Draw your signature in the box below</p>
            </div>
            <button type="button" onClick={() => setShowSignModal(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Portrait orientation hint */}
          {!isLandscape && (
            <div className="flex items-center gap-3 px-5 py-3 bg-amber-50 border-b border-amber-100 flex-shrink-0">
              <RotateCcw className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700 font-medium">
                Rotate to landscape for a better signing experience
              </p>
            </div>
          )}

          {/* Canvas — fills all available space */}
          <div className="flex-1 p-3 sm:p-5" style={{ minHeight: 0 }}>
            <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-slate-200">
              <canvas
                ref={canvasRef}
                width={2000}
                height={800}
                style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none', cursor: 'crosshair' }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
              {/* Placeholder text — CSS only, no state needed */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                <PenLine className="w-6 h-6 text-slate-200 mb-1" />
                <p className="text-slate-300 text-sm">Sign here</p>
              </div>
              {/* Baseline guide */}
              <div className="absolute bottom-[28%] left-8 right-8 border-b border-dashed border-slate-200 pointer-events-none" />
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-slate-100 flex items-center gap-3 flex-shrink-0">
            <button type="button" onClick={clearCanvas}
              className="px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:border-slate-300 transition-colors">
              Clear
            </button>
            <button type="button" onClick={confirmSignature}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors">
              Use this signature →
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default W9ReviewSign;
