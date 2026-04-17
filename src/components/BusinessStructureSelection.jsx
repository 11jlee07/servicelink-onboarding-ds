import React, { useState } from 'react';
import { Info } from 'lucide-react';

const STRUCTURES = [
  {
    id: 'sole_prop',
    title: 'Individual / Sole Proprietor',
    icon: '👤',
    tooltip: "Just me working for myself — no LLC or corporation",
  },
  {
    id: 'single_llc',
    title: 'Single-Member LLC',
    icon: '🏢',
    tooltip: "I have an LLC with only me as the owner",
  },
  {
    id: 'multi_llc',
    title: 'Multi-Member LLC',
    icon: '🏗️',
    tooltip: "I have an LLC with multiple owners or partners",
  },
  {
    id: 'partnership',
    title: 'Partnership',
    icon: '🤝',
    tooltip: "A business with 2+ partners (not an LLC)",
  },
  {
    id: 'corporation',
    title: 'Corporation',
    icon: '🏛️',
    tooltip: "Registered C-corp or S-corp",
  },
  {
    id: 'trust',
    title: 'Trust or Estate',
    icon: '📜',
    tooltip: "Operating as a trust or estate",
  },
  {
    id: 'other',
    title: 'Other',
    icon: '❓',
    tooltip: "None of the above — I'll describe my entity type",
  },
];

const StructureCard = ({ id, title, icon, tooltip, selected, onSelect }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`relative p-5 border-2 rounded-2xl text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400
        ${selected
          ? 'border-blue-600 bg-blue-50 shadow-sm'
          : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
        }`}
      aria-pressed={selected}
    >
      {/* Info icon */}
      <div
        className="absolute top-3 right-3"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={(e) => e.stopPropagation()}
      >
        <Info className="w-4 h-4 text-slate-400" />
        {showTooltip && (
          <div className="absolute right-0 top-6 w-52 p-2.5 bg-slate-900 text-white text-xs rounded-xl shadow-xl z-20 leading-relaxed">
            {tooltip}
          </div>
        )}
      </div>

      <span className="text-2xl mb-3 block">{icon}</span>
      <h3 className={`font-semibold text-sm leading-tight ${selected ? 'text-blue-900' : 'text-slate-800'}`}>
        {title}
      </h3>

      {selected && (
        <div className="absolute bottom-3 right-3 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
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

  const handleSelect = (id) => {
    setSelected(id);
  };

  const handleContinue = () => {
    // Reset W9 data when structure changes
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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Step 2 of 6 · W-9</p>
            <h1 className="text-2xl font-bold text-slate-900">How is your appraisal business set up?</h1>
            <p className="text-slate-500 text-sm mt-1">This determines your W-9 tax form requirements.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {STRUCTURES.map((s) => (
            <StructureCard
              key={s.id}
              {...s}
              selected={selected === s.id}
              onSelect={handleSelect}
            />
          ))}
        </div>

        {selected === 'other' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Please describe your entity type
            </label>
            <input
              type="text"
              value={otherDescription}
              onChange={(e) => setOtherDescription(e.target.value)}
              placeholder="e.g., Joint Venture, Cooperative"
              className="w-full border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 border-2 border-slate-200 rounded-xl font-medium text-slate-700 hover:border-slate-300 transition-colors"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!isValid}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl transition-colors"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessStructureSelection;
