import React from 'react';
import { Check } from 'lucide-react';

const STEPS = [
  'Basic Info',
  'W-9',
  'License',
  'Insurance',
  'Bkg Check',
  'Agreement',
];

const ProgressBar = ({ currentStep, onStepClick }) => {
  return (
    <div className="flex items-center w-full" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={8}>
      {STEPS.map((label, index) => {
        const step = index + 1;
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => onStepClick?.(step)}
                aria-label={`Go to step ${step}: ${label}`}
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
                  transition-all duration-200 cursor-pointer
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1
                  ${isCompleted ? 'bg-emerald-500 text-white hover:bg-emerald-600' : ''}
                  ${isActive ? 'bg-blue-600 text-white ring-4 ring-blue-100 hover:bg-blue-700' : ''}
                  ${!isCompleted && !isActive ? 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600' : ''}
                `}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : step}
              </button>
              <span
                className={`
                  text-xs mt-1 hidden lg:block whitespace-nowrap
                  ${isActive ? 'text-blue-600 font-medium' : ''}
                  ${isCompleted ? 'text-emerald-600' : ''}
                  ${!isCompleted && !isActive ? 'text-slate-400' : ''}
                `}
              >
                {label}
              </span>
            </div>

            {index < STEPS.length - 1 && (
              <div
                className={`
                  flex-1 h-0.5 mx-1 transition-all duration-300
                  ${isCompleted ? 'bg-emerald-400' : 'bg-slate-200'}
                `}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ProgressBar;
