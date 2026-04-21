import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { ExosIllustration } from './shared/ExosIcon';
import NavFooter from './shared/NavFooter';

const STRUCTURES = [
  { id: 'sole_prop',    title: 'Individual / Sole Proprietor', illustration: 'Individual',        tooltip: "Just me working for myself — no LLC or corporation" },
  { id: 'single_llc',  title: 'Single-Member LLC',            illustration: 'Single Member LLC',  tooltip: "I have an LLC with only me as the owner" },
  { id: 'multi_llc',   title: 'Multi-Member LLC',             illustration: 'Multi-Member LLC',   tooltip: "I have an LLC with multiple owners or partners" },
  { id: 'partnership', title: 'Partnership',                  illustration: 'Partnership',        tooltip: "A business with 2+ partners (not an LLC)" },
  { id: 'corporation', title: 'Corporation',                  illustration: 'Corporation',        tooltip: "Registered C-corp or S-corp" },
  { id: 'trust',       title: 'Trust or Estate',              illustration: 'Trust or Estate',    tooltip: "Operating as a trust or estate" },
  { id: 'other',       title: 'Other',                        illustration: 'Other',              tooltip: "None of the above — I'll describe my entity type" },
];

const StructureCard = ({ id, title, illustration, tooltip, selected, onSelect }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`relative flex flex-col items-center pt-8 pb-5 px-3 border-2 rounded-exos transition-all duration-150 focus:outline-none bg-white w-44
        ${selected
          ? 'border-blue-500 shadow-lift'
          : 'border-slate-200 hover:border-blue-300 hover:shadow-card'
        }`}
      aria-pressed={selected}
    >
      {/* Info icon — top right, hidden when selected (checkmark takes over) */}
      {!selected && (
        <div
          className="absolute top-3 right-3"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={(e) => e.stopPropagation()}
        >
          <Info className="w-4 h-4 text-slate-400" />
          {showTooltip && (
            <div className="absolute right-0 top-6 w-48 p-2.5 bg-slate-900 text-white text-xs rounded-exos shadow-xl z-20 leading-relaxed">
              {tooltip}
            </div>
          )}
        </div>
      )}

      <div className="w-full mb-5">
        <ExosIllustration name={illustration} size={128} className="w-full h-auto" />
      </div>
      <h3 className={`font-semibold text-sm text-center leading-snug ${selected ? 'text-blue-600' : 'text-slate-800'}`}>
        {title}
      </h3>

      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
          </svg>
        </div>
      )}
    </button>
  );
};

const BusinessStructureSelection = ({ state, setState, onNext, onBack }) => {
  const [selected, setSelected] = useState(state.businessStructure || null);
  const [otherDescription, setOtherDescription] = useState('');

  const handleContinue = () => {
    setState((prev) => ({
      ...prev,
      businessStructure: selected,
      w9Data: {
        businessName: '',
        taxClassification: '',
        foreignMembers: null,
        taxId: '',
        taxIdType: '',
        mailingAddress: { useOfficeAddress: true, street: '', city: '', state: '', zip: '' },
      },
    }));
    onNext();
  };

  const isValid = selected && (selected !== 'other' || otherDescription.trim());

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-exos shadow-sm border border-slate-100 p-6">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Step 2 of 6 · W-9</p>
          <h1 className="text-2xl font-bold text-slate-900">How is your business set up?</h1>
          <p className="text-slate-500 text-sm mt-1">This determines your W-9 tax form requirements.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-6">
          {STRUCTURES.map((s) => (
            <StructureCard
              key={s.id}
              {...s}
              selected={selected === s.id}
              onSelect={setSelected}
            />
          ))}
        </div>

        {selected === 'other' && (
          <div className="mb-6">
            <label className="block text-sm font-normal text-slate-700 mb-1.5">
              Please describe your entity type
            </label>
            <input
              type="text"
              value={otherDescription}
              onChange={(e) => setOtherDescription(e.target.value)}
              placeholder="e.g., Joint Venture, Cooperative"
              className="w-full border border-slate-200 rounded-exos-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <NavFooter onBack={onBack} onContinue={handleContinue} continueDisabled={!isValid} />
      </div>
    </div>
  );
};

export default BusinessStructureSelection;
