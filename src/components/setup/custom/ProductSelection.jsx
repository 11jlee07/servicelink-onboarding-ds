import React, { useRef, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import { PRODUCT_GROUPS } from './data';

/* ─── Indeterminate checkbox ──────────────────────────────────────── */
const IndeterminateCheckbox = ({ checked, indeterminate, onChange, label, className = '' }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);
  return (
    <label className={`flex items-center gap-2.5 cursor-pointer ${className}`}>
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
      />
      <span>{label}</span>
    </label>
  );
};

/* ─── Helpers ─────────────────────────────────────────────────────── */
const getGroupProducts = (group) => group.subgroups.flatMap((s) => s.products);

/* ─── Main component ──────────────────────────────────────────────── */
const ProductSelection = ({ selected, onChange }) => {
  // selected = Set<string>
  const [expanded, setExpanded] = useState({ conventional: true, fha: false, usda: true, specialty: false });

  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleProduct = (product) => {
    const next = new Set(selected);
    next.has(product) ? next.delete(product) : next.add(product);
    onChange(next);
  };

  const toggleGroup = (group) => {
    const products = getGroupProducts(group);
    const allSelected = products.every((p) => selected.has(p));
    const next = new Set(selected);
    if (allSelected) {
      products.forEach((p) => next.delete(p));
    } else {
      products.forEach((p) => next.add(p));
    }
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-slate-900 mb-1">Which products do you offer?</h3>
        <p className="text-sm text-slate-500 mb-4">
          Select the appraisal types you're qualified and willing to complete.
          <span className="ml-2 font-medium text-blue-600">{selected.size} selected</span>
        </p>
      </div>

      {PRODUCT_GROUPS.map((group) => {
        const products = getGroupProducts(group);
        const selectedCount = products.filter((p) => selected.has(p)).length;
        const allSelected = selectedCount === products.length;
        const someSelected = selectedCount > 0 && !allSelected;
        const isExpanded = expanded[group.id];
        const isSingle = products.length === 1;

        return (
          <div key={group.id} className="border border-slate-200 rounded-exos overflow-hidden">
            {/* Group header */}
            <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 border-b border-slate-200">
              <IndeterminateCheckbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={() => toggleGroup(group)}
                label=""
                className="flex-shrink-0"
              />
              <div className="flex-1">
                <p className="font-bold text-slate-900 text-sm">{group.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedCount} / {products.length} selected
                </p>
              </div>
              {!isSingle && (
                <button
                  type="button"
                  onClick={() => toggleExpand(group.id)}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  aria-expanded={isExpanded}
                >
                  {isExpanded
                    ? <><ChevronDown className="w-3.5 h-3.5" /> Hide</>
                    : <><ChevronRight className="w-3.5 h-3.5" /> Show all</>
                  }
                </button>
              )}
            </div>

            {/* Products (expanded) */}
            {(isExpanded || isSingle) && (
              <div className="divide-y divide-slate-100">
                {group.subgroups
                  .filter((sg) => sg.products.length > 0)
                  .map((subgroup, si) => (
                    <div key={si} className="px-5 py-3">
                      {subgroup.label && (
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          {subgroup.label}
                        </p>
                      )}
                      <div className="space-y-1">
                        {subgroup.products.map((product) => {
                          const checked = selected.has(product);
                          return (
                            <label
                              key={product}
                              className="flex items-center gap-3 py-1.5 px-2 rounded-exos hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                              }`}>
                                {checked && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleProduct(product)}
                                className="sr-only"
                              />
                              <span className="text-sm text-slate-700">{product}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProductSelection;
