import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import zipcodes from 'zipcodes';
import { Zap, SlidersHorizontal, ArrowRight, Clock, Info } from 'lucide-react';
import { getMapStyle } from '../../utils/zipUtils';

const ProductSetupLanding = ({ state, onQuick, onCustom, onBack }) => {
  const mapContainer = useRef(null);
  const baseZip = state?.basicInfo?.address?.zip || '75009';

  useEffect(() => {
    if (!mapContainer.current) return;
    const info = zipcodes.lookup(baseZip) || zipcodes.lookup('75009');
    const center = info ? [info.longitude, info.latitude] : [-96.8, 32.9];
    const zoom = 8;

    const m = new maplibregl.Map({
      container: mapContainer.current,
      style: getMapStyle(),
      center,
      zoom,
      interactive: false,
      attributionControl: false,
    });

    return () => m.remove();
  }, []);

  return (
    <div className="fixed inset-0">
      {/* Map background */}
      <div ref={mapContainer} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-slate-900/55" />

      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        className="absolute top-6 left-6 z-10 text-sm text-white/70 hover:text-white flex items-center gap-1.5 transition-colors"
      >
        Back to application
      </button>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Set Up Coverage, Products & Fees
          </h1>
          <p className="text-white/60 text-sm">
            Choose how you'd like to get started. You can update everything later from your dashboard.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 w-full max-w-2xl">
          {/* Quick Setup */}
          <button
            type="button"
            onClick={onQuick}
            className="group flex flex-col gap-4 p-6 bg-white/95 backdrop-blur-sm border-2 border-transparent hover:border-blue-400 rounded-exos text-left transition-all hover:shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 bg-slate-100 group-hover:bg-blue-50 rounded-exos flex items-center justify-center transition-colors">
                <Zap className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
              </div>
              <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                <Clock className="w-3.5 h-3.5" /> ~2 min
              </span>
            </div>
            <div>
              <p className="font-bold text-slate-900 mb-1">Quick Setup</p>
              <p className="text-sm text-slate-500 leading-relaxed">
                Start with sensible defaults. Pre-selected products and suggested market-rate fees.
              </p>
            </div>
            <ul className="space-y-1.5 text-sm text-slate-600">
              {['ZIP-based coverage picker', '6 core products pre-selected', 'Suggested fees by type'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-exos-sm px-3 py-2.5 mt-auto">
              <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 leading-relaxed">
                Need 44 products or per-area pricing?{' '}
                <span className="font-semibold text-slate-700">Custom Setup</span> has that.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 font-bold uppercase text-sm">
              Get started
            </div>
          </button>

          {/* Custom Setup */}
          <button
            type="button"
            onClick={onCustom}
            className="group flex flex-col gap-4 p-6 bg-white/95 backdrop-blur-sm border-2 border-transparent hover:border-blue-400 rounded-exos text-left transition-all hover:shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 bg-slate-100 group-hover:bg-blue-50 rounded-exos flex items-center justify-center transition-colors">
                <SlidersHorizontal className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
              </div>
              <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                <Clock className="w-3.5 h-3.5" /> ~8 min
              </span>
            </div>
            <div>
              <p className="font-bold text-slate-900 mb-1">Custom Setup</p>
              <p className="text-sm text-slate-500 leading-relaxed">
                Draw coverage areas on the map. Set products and fees per area.
              </p>
            </div>
            <ul className="space-y-1.5 text-sm text-slate-600">
              {['Draw coverage areas on the map', 'Full product catalog (44 products)', 'Per-area fee overrides'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-1.5 text-slate-700 font-bold uppercase text-sm mt-auto pt-6">
              Get started
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductSetupLanding;
