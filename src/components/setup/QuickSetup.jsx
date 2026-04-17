import React, { useState } from 'react';
import { Check, ChevronDown, ChevronRight, MapPin, Package, DollarSign } from 'lucide-react';
import CoverageZipSelector from './CoverageZipSelector';

/* ── Data ─────────────────────────────────────────────────────────── */
const CORE_PRODUCTS = [
  { id: 'int_1004',  label: '1004 Single Family Interior' },
  { id: 'ext_2055',  label: '2055 Single Family Exterior' },
  { id: 'int_1073',  label: '1073 Condo Interior' },
  { id: 'ext_1075',  label: '1075 Condo Exterior' },
  { id: 'desk',      label: 'Desk Review' },
  { id: 'desktop',   label: 'Desktop Appraisal' },
];

const FHA_PRODUCTS = [
  { id: 'fha_int_1004', label: 'FHA 1004 Single Family Interior' },
  { id: 'fha_ext_2055', label: 'FHA 2055 Single Family Exterior' },
  { id: 'fha_int_1073', label: 'FHA 1073 Condo Interior' },
  { id: 'fha_desk',     label: 'FHA Desk Review' },
];

const FEE_GROUPS = [
  { key: 'interior', label: 'Full Interior Inspections',    placeholder: '450', hint: 'Avg. in your area: $420–$480' },
  { key: 'exterior', label: 'Exterior-Only Inspections',   placeholder: '250', hint: 'Avg. in your area: $225–$275' },
  { key: 'desktop',  label: 'Desktop / Desk Review',       placeholder: '175', hint: 'Avg. in your area: $150–$200' },
];

/* ── Helpers ──────────────────────────────────────────────────────── */
const formatCurrency = (val) => {
  const num = val.replace(/[^0-9]/g, '');
  return num ? num : '';
};

/* ── Section wrapper ──────────────────────────────────────────────── */
const Section = ({ number, icon: Icon, title, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-xs font-bold">{number}</span>
      </div>
      <Icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
      <h2 className="font-bold text-slate-900">{title}</h2>
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

/* ── Main component ───────────────────────────────────────────────── */
const QuickSetup = ({ state, setState, onBack, onDone }) => {
  /* Coverage */
  const [zips, setZips] = useState([]);

  /* Products */
  const [selectedProducts, setSelectedProducts] = useState(
    new Set(CORE_PRODUCTS.map((p) => p.id))
  );
  const [fhaEnabled, setFhaEnabled] = useState(false);
  const [showProducts, setShowProducts] = useState(false);

  /* Fees */
  const [fees, setFees] = useState({ interior: '', exterior: '', desktop: '' });

  /* ── Product handling ─────────────────────────────────────────── */
  const allProducts = fhaEnabled ? [...CORE_PRODUCTS, ...FHA_PRODUCTS] : CORE_PRODUCTS;

  const toggleProduct = (id) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleFha = () => {
    setFhaEnabled((prev) => {
      const next = !prev;
      if (next) {
        setSelectedProducts((p) => {
          const s = new Set(p);
          FHA_PRODUCTS.forEach((fp) => s.add(fp.id));
          return s;
        });
      } else {
        setSelectedProducts((p) => {
          const s = new Set(p);
          FHA_PRODUCTS.forEach((fp) => s.delete(fp.id));
          return s;
        });
      }
      return next;
    });
  };

  /* ── Validation ───────────────────────────────────────────────── */
  const baseZip = state.basicInfo?.address?.zip || '';

  const canSave =
    zips.length > 0 &&
    selectedProducts.size > 0 &&
    fees.interior && fees.exterior && fees.desktop;

  const handleSave = () => {
    if (!canSave) return;
    setState((prev) => ({
      ...prev,
      setup: {
        coverage: { zips },
        products: {
          selected: [...selectedProducts],
          fha: fhaEnabled,
        },
        fees,
      },
    }));
    onDone();
  };

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-1.5 transition-colors"
      >
        ← Back
      </button>

      <div className="mb-7">
        <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Quick Setup</span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Set Up Product, Fees and Coverage</h1>
        <p className="text-slate-500 text-sm mt-1">Takes about 2 minutes. You can refine everything later.</p>
      </div>

      <div className="space-y-4">

        {/* ── 1. Coverage ─────────────────────────────────────────── */}
        <Section number="1" icon={MapPin} title="Coverage Area">
          <CoverageZipSelector
            baseZip={baseZip}
            selectedZips={zips}
            onChange={setZips}
          />
        </Section>

        {/* ── 2. Products ─────────────────────────────────────────── */}
        <Section number="2" icon={Package} title="Products">
          <p className="text-sm text-slate-500 mb-4">
            We've pre-selected the most common appraisal products. Adjust as needed.
          </p>

          {/* FHA toggle */}
          <button
            type="button"
            onClick={toggleFha}
            className={`w-full flex items-center justify-between p-4 border-2 rounded-xl mb-4 text-left transition-all ${
              fhaEnabled
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <p className="font-semibold text-slate-900 text-sm">I also complete FHA appraisals</p>
              <p className="text-xs text-slate-500 mt-0.5">Adds 4 FHA product variants to your panel</p>
            </div>
            <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
              fhaEnabled ? 'bg-blue-600' : 'bg-white border-2 border-slate-300'
            }`}>
              {fhaEnabled && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
          </button>

          {/* Expand/collapse product list */}
          <button
            type="button"
            onClick={() => setShowProducts((p) => !p)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            aria-expanded={showProducts}
          >
            {showProducts ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {showProducts ? 'Hide' : 'Review'} all {allProducts.length} products
            <span className="text-slate-400 font-normal">({selectedProducts.size} selected)</span>
          </button>

          {showProducts && (
            <div className="mt-3 space-y-1.5 border border-slate-100 rounded-xl p-3 bg-slate-50">
              {allProducts.map((product) => {
                const checked = selectedProducts.has(product.id);
                const isFha = FHA_PRODUCTS.some((f) => f.id === product.id);
                return (
                  <label
                    key={product.id}
                    className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white cursor-pointer transition-colors"
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                        checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'
                      }`}
                      onClick={() => toggleProduct(product.id)}
                    >
                      {checked && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProduct(product.id)}
                      className="sr-only"
                    />
                    <span className="text-sm text-slate-700">{product.label}</span>
                    {isFha && (
                      <span className="ml-auto text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">FHA</span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </Section>

        {/* ── 3. Fees ─────────────────────────────────────────────── */}
        <Section number="3" icon={DollarSign} title="Fees">
          <p className="text-sm text-slate-500 mb-5">
            Set a default fee for each inspection type. These apply to all matching products.
          </p>
          <div className="space-y-4">
            {FEE_GROUPS.map(({ key, label, placeholder, hint }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">{label}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={fees[key]}
                    onChange={(e) => setFees((prev) => ({ ...prev, [key]: formatCurrency(e.target.value) }))}
                    placeholder={placeholder}
                    className="w-full border border-slate-200 rounded-xl py-3 pl-8 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={`Fee for ${label}`}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">{hint}</p>
              </div>
            ))}
          </div>
        </Section>

      </div>

      {/* CTA */}
      <div className="mt-8 space-y-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl transition-colors"
        >
          Save & Finish →
        </button>
        {!canSave && (
          <p className="text-center text-xs text-slate-400">
            Add at least one ZIP, confirm your products, and enter all three fees to continue
          </p>
        )}
        <p className="text-center text-xs text-slate-400">
          You can update coverage, products, and fees any time from your dashboard
        </p>
      </div>
    </div>
  );
};

export default QuickSetup;
