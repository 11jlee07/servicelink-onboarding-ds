import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { US_STATES, COUNTIES } from './data';

const CoverageCustom = ({ value, onChange }) => {
  // value = { [stateCode]: 'all' | string[] }
  const [expandedState, setExpandedState] = useState(null);
  const [stateSearch, setStateSearch] = useState('');

  const selectedStateCodes = Object.keys(value);

  const toggleState = (code) => {
    if (value[code]) {
      const next = { ...value };
      delete next[code];
      onChange(next);
      if (expandedState === code) setExpandedState(null);
    } else {
      onChange({ ...value, [code]: 'all' });
    }
  };

  const setCountyMode = (code, mode) => {
    if (mode === 'all') {
      onChange({ ...value, [code]: 'all' });
    } else {
      onChange({ ...value, [code]: [] });
    }
  };

  const toggleCounty = (code, county) => {
    const current = value[code];
    if (!Array.isArray(current)) return;
    const next = current.includes(county)
      ? current.filter((c) => c !== county)
      : [...current, county];
    onChange({ ...value, [code]: next });
  };

  const toggleAllCounties = (code) => {
    const counties = COUNTIES[code] || [];
    const current = value[code];
    if (!Array.isArray(current)) return;
    onChange({ ...value, [code]: current.length === counties.length ? [] : [...counties] });
  };

  const filteredStates = stateSearch.trim()
    ? US_STATES.filter(
        (s) =>
          s.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
          s.code.toLowerCase().includes(stateSearch.toLowerCase())
      )
    : US_STATES;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-slate-900 mb-1">Which states do you cover?</h3>
        <p className="text-sm text-slate-500 mb-4">
          Select states, then optionally narrow down to specific counties.
        </p>

        {/* Search */}
        <input
          type="text"
          value={stateSearch}
          onChange={(e) => setStateSearch(e.target.value)}
          placeholder="Search states..."
          className="w-full mb-3 border border-slate-200 rounded-exos-sm px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* State grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 mb-4">
          {filteredStates.map(({ code, name }) => {
            const selected = !!value[code];
            return (
              <button
                key={code}
                type="button"
                onClick={() => toggleState(code)}
                className={`flex items-center justify-between px-3 py-2 rounded-exos border-2 text-sm font-medium transition-all ${
                  selected
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
                title={name}
              >
                <span>{code}</span>
                {selected && <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {selectedStateCodes.length > 0 && (
          <p className="text-xs text-slate-500">
            {selectedStateCodes.length} state{selectedStateCodes.length !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      {/* County configuration for selected states */}
      {selectedStateCodes.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-900 mb-3">County coverage</h3>
          <div className="space-y-2">
            {selectedStateCodes.map((code) => {
              const stateName = US_STATES.find((s) => s.code === code)?.name || code;
              const counties = COUNTIES[code];
              const coverageVal = value[code];
              const isAll = coverageVal === 'all';
              const isExpanded = expandedState === code;
              const selectedCounties = Array.isArray(coverageVal) ? coverageVal : [];

              return (
                <div key={code} className="border border-slate-200 rounded-exos-sm overflow-hidden">
                  {/* State row */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => toggleState(code)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      aria-label={`Remove ${stateName}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <span className="font-semibold text-slate-900 text-sm flex-1">{stateName}</span>

                    {counties ? (
                      <div className="flex items-center gap-3">
                        {/* All / Specific toggle */}
                        <div className="flex rounded-exos border border-slate-200 overflow-hidden text-xs">
                          <button
                            type="button"
                            onClick={() => setCountyMode(code, 'all')}
                            className={`px-3 py-1.5 font-medium transition-colors ${isAll ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                          >
                            All counties
                          </button>
                          <button
                            type="button"
                            onClick={() => { setCountyMode(code, 'specific'); setExpandedState(code); }}
                            className={`px-3 py-1.5 font-medium transition-colors ${!isAll ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                          >
                            Specific ({isAll ? 0 : selectedCounties.length})
                          </button>
                        </div>
                        {!isAll && (
                          <button
                            type="button"
                            onClick={() => setExpandedState(isExpanded ? null : code)}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">All counties</span>
                    )}
                  </div>

                  {/* County list */}
                  {counties && !isAll && isExpanded && (
                    <div className="px-4 py-3 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-slate-500">{selectedCounties.length} of {counties.length} counties selected</span>
                        <button
                          type="button"
                          onClick={() => toggleAllCounties(code)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {selectedCounties.length === counties.length ? 'Deselect all' : 'Select all'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-52 overflow-y-auto pr-1">
                        {counties.map((county) => {
                          const checked = selectedCounties.includes(county);
                          return (
                            <label
                              key={county}
                              className="flex items-center gap-2 py-1.5 px-2 rounded-exos hover:bg-slate-50 cursor-pointer"
                            >
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                {checked && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <input type="checkbox" checked={checked} onChange={() => toggleCounty(code, county)} className="sr-only" />
                              <span className="text-xs text-slate-700 truncate">{county}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoverageCustom;
