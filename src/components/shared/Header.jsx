import React, { useState, useEffect, useRef } from 'react';
import ProgressBar from './ProgressBar';
import { HelpCircle, ChevronDown, Check } from 'lucide-react';

const STEPS = [
  'Basic Info',
  'W-9',
  'License',
  'Insurance',
  'Bkg Check',
  'Agreement',
];

const Header = ({ progressStep, onStepClick }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [dropdownOpen]);

  const currentLabel = progressStep ? STEPS[progressStep - 1] : null;
  const nextLabel = progressStep && progressStep < STEPS.length ? STEPS[progressStep] : null;
  const progressPct = progressStep ? Math.round((progressStep / STEPS.length) * 100) : 0;

  return (
    <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50" ref={dropdownRef}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-6">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0">
          <img src="/logo.png" alt="ServiceLink" className="h-8 w-auto" />
        </div>

        {/* ── Mobile: compact step button ── */}
        {progressStep && (
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex-1 sm:hidden flex items-center justify-between min-w-0"
          >
            <div className="text-left min-w-0">
              <p className="text-[11px] text-slate-400 font-medium">
                Step {progressStep} of {STEPS.length}
              </p>
              <p className="text-sm font-semibold text-slate-900 truncate">{currentLabel}</p>
              {nextLabel && (
                <p className="text-[11px] text-slate-400 truncate">Next: {nextLabel}</p>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 flex-shrink-0 ml-2 transition-transform duration-200 ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        )}

        {/* ── Desktop: full circle progress bar ── */}
        {progressStep && (
          <div className="hidden sm:block flex-1 min-w-0">
            <ProgressBar currentStep={progressStep} onStepClick={onStepClick} />
          </div>
        )}

        {/* Help link */}
        <a
          href="#"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors flex-shrink-0"
          aria-label="Get help"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:block">Help</span>
        </a>
      </div>

      {/* ── Mobile: thin progress bar ── */}
      {progressStep && (
        <div className="sm:hidden h-0.5 bg-slate-100">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* ── Mobile: step dropdown ── */}
      {dropdownOpen && progressStep && (
        <div className="sm:hidden absolute left-0 right-0 top-full bg-white border-t border-slate-100 shadow-xl z-50 py-2">
          {STEPS.map((label, index) => {
            const step = index + 1;
            const isCompleted = step < progressStep;
            const isActive = step === progressStep;
            return (
              <button
                key={step}
                type="button"
                onClick={() => {
                  if (isCompleted || isActive) onStepClick?.(step);
                  setDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                  isActive ? 'bg-blue-50' : isCompleted ? 'hover:bg-slate-50' : 'opacity-40 cursor-default'
                }`}
              >
                {/* Step circle */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  isCompleted ? 'bg-emerald-500 text-white' :
                  isActive ? 'bg-blue-600 text-white' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : step}
                </div>
                {/* Label */}
                <span className={`text-sm font-medium ${
                  isActive ? 'text-blue-700' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                }`}>
                  {label}
                </span>
                {isActive && (
                  <span className="ml-auto text-xs text-blue-500 font-medium">Current</span>
                )}
                {isCompleted && (
                  <span className="ml-auto text-xs text-emerald-500 font-medium">Done</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};

export default Header;
