import React from 'react';

const NavFooter = ({
  onBack,
  onContinue,
  continueLabel = 'Continue',
  continueDisabled = false,
  continueType = 'button',
  className = '',
}) => (
  <div className={`border-t border-exos-border-light mt-6 pt-4 flex items-center justify-between gap-3 ${className}`}>
    <button
      type="button"
      onClick={onBack}
      className="min-w-[140px] px-6 py-3 border-2 border-slate-200 rounded-exos text-sm font-bold uppercase text-slate-700 hover:border-slate-300 transition-colors"
    >
      Back
    </button>
    <button
      type={continueType}
      onClick={continueType === 'button' ? onContinue : undefined}
      disabled={continueDisabled}
      className="min-w-[140px] px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold uppercase rounded-exos transition-colors"
    >
      {continueLabel}
    </button>
  </div>
);

export default NavFooter;
