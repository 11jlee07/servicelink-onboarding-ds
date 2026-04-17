import React, { useState } from 'react';
import { Check, X, ChevronDown, ChevronRight, Plus, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { US_STATES, COUNTIES } from './data';

/* ─── State geographic centers (for map dots) ─────────────────────── */
const STATE_CENTERS = {
  AL: [32.8, -86.8],  AK: [64.2, -153.4], AZ: [34.3, -111.1], AR: [34.8, -92.2],
  CA: [37.2, -119.4], CO: [39.0, -105.5],  CT: [41.6, -72.7],  DE: [39.0, -75.5],
  FL: [28.6, -82.4],  GA: [32.7, -83.4],   HI: [20.3, -156.4], ID: [44.4, -114.6],
  IL: [40.0, -89.2],  IN: [39.9, -86.3],   IA: [42.1, -93.5],  KS: [38.5, -98.4],
  KY: [37.5, -85.3],  LA: [31.1, -91.9],   ME: [45.4, -69.0],  MD: [39.1, -76.8],
  MA: [42.3, -71.8],  MI: [44.3, -85.4],   MN: [46.4, -93.1],  MS: [32.7, -89.7],
  MO: [38.5, -92.5],  MT: [47.0, -110.0],  NE: [41.5, -99.9],  NV: [38.5, -117.1],
  NH: [43.7, -71.6],  NJ: [40.1, -74.5],   NM: [34.5, -106.2], NY: [42.9, -75.5],
  NC: [35.6, -79.8],  ND: [47.5, -100.5],  OH: [40.4, -82.8],  OK: [35.6, -96.9],
  OR: [44.1, -120.5], PA: [40.9, -77.8],   RI: [41.7, -71.5],  SC: [33.9, -80.9],
  SD: [44.4, -100.2], TN: [35.9, -86.7],   TX: [31.5, -99.3],  UT: [39.3, -111.1],
  VT: [44.1, -72.7],  VA: [37.8, -79.5],   WA: [47.4, -120.5], WV: [38.9, -80.5],
  WI: [44.3, -89.6],  WY: [43.0, -107.6],
};

/* ─── Coverage summary label ──────────────────────────────────────── */
function summarize(val) {
  if (val === 'all') return { text: 'Entire state', color: 'emerald' };
  const counties = Object.keys(val);
  if (counties.length === 0) return { text: 'No counties selected', color: 'amber' };
  const specific = counties.filter((c) => Array.isArray(val[c]));
  if (specific.length === 0)
    return { text: `${counties.length} ${counties.length === 1 ? 'county' : 'counties'} · all ZIPs`, color: 'blue' };
  return {
    text: `${counties.length} ${counties.length === 1 ? 'county' : 'counties'} · ${specific.length} with specific ZIPs`,
    color: 'blue',
  };
}

const BADGE = {
  emerald: 'bg-emerald-100 text-emerald-700',
  blue:    'bg-blue-100 text-blue-700',
  amber:   'bg-amber-100 text-amber-700',
};

/* ─── ZIP chips + input within a county ──────────────────────────── */
const ZipEditor = ({ zips, onAdd, onRemove }) => {
  const [input, setInput] = useState('');
  const [err, setErr] = useState('');

  const add = () => {
    const z = input.trim();
    if (!/^\d{5}$/.test(z)) { setErr('5-digit ZIP required'); return; }
    if (zips.includes(z)) { setErr('Already added'); return; }
    onAdd(z);
    setInput('');
    setErr('');
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value.replace(/\D/g, '').slice(0, 5)); setErr(''); }}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Enter ZIP"
          maxLength={5}
          className="flex-1 border border-slate-200 rounded-exos px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={add}
          disabled={input.length !== 5}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-exos transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
      {err && <p className="text-xs text-red-500">{err}</p>}
      {zips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {zips.map((z) => (
            <span key={z} className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-mono font-semibold px-2.5 py-1 rounded-full">
              {z}
              <button type="button" onClick={() => onRemove(z)} className="text-blue-400 hover:text-blue-700 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {zips.length === 0 && (
        <p className="text-xs text-amber-600">Add at least one ZIP to cover this county.</p>
      )}
    </div>
  );
};

/* ─── County row inside an expanded state ────────────────────────── */
const CountyRow = ({ county, countyVal, onToggle, onSetMode, onAddZip, onRemoveZip }) => {
  const [open, setOpen] = useState(false);
  const isSelected = countyVal !== undefined;
  const isAll = countyVal === 'all';
  const zips = Array.isArray(countyVal) ? countyVal : [];

  return (
    <div className={`border-b border-slate-100 last:border-b-0 ${isSelected ? 'bg-white' : 'bg-slate-50/60'}`}>
      <div className="flex items-center gap-3 px-4 py-2.5">
        {/* Select checkbox */}
        <button
          type="button"
          onClick={onToggle}
          className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 hover:border-blue-400'
          }`}
        >
          {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
        </button>

        <span className={`text-sm flex-1 ${isSelected ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
          {county}
        </span>

        {isSelected && (
          <div className="flex items-center gap-2">
            {/* All ZIPs / Specific ZIPs toggle */}
            <div className="flex rounded-md border border-slate-200 overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => { onSetMode('all'); setOpen(false); }}
                className={`px-2.5 py-1 font-medium transition-colors ${isAll ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                All ZIPs
              </button>
              <button
                type="button"
                onClick={() => { onSetMode('specific'); setOpen(true); }}
                className={`px-2.5 py-1 font-medium transition-colors ${!isAll ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                Specific{!isAll && zips.length > 0 ? ` (${zips.length})` : ''}
              </button>
            </div>
            {!isAll && (
              <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            )}
          </div>
        )}
      </div>

      {isSelected && !isAll && open && (
        <div className="px-4 pb-3 ml-7">
          <ZipEditor zips={zips} onAdd={(z) => onAddZip(county, z)} onRemove={(z) => onRemoveZip(county, z)} />
        </div>
      )}
    </div>
  );
};

/* ─── Single selected-state card ─────────────────────────────────── */
const StateCard = ({ code, val, onRemove, onSetEntire, onSetCounties, onToggleCounty, onSetCountyMode, onAddZip, onRemoveZip }) => {
  const [expanded, setExpanded] = useState(false);
  const stateName = US_STATES.find((s) => s.code === code)?.name || code;
  const counties = COUNTIES[code];
  const isAll = val === 'all';
  const summary = summarize(val);

  return (
    <div className="border border-slate-200 rounded-exos overflow-hidden bg-white">
      {/* State header row */}
      <div className="flex items-center gap-3 px-4 py-3.5 bg-slate-50">
        <button
          type="button"
          onClick={onRemove}
          className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
          aria-label={`Remove ${stateName}`}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 text-sm">{stateName}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BADGE[summary.color]}`}>
              {summary.text}
            </span>
          </div>
        </div>

        {/* Entire state / Customize counties */}
        {counties ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex rounded-exos border border-slate-200 overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => { onSetEntire(); setExpanded(false); }}
                className={`px-3 py-1.5 font-medium transition-colors ${isAll ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                Entire state
              </button>
              <button
                type="button"
                onClick={() => { onSetCounties(); setExpanded(true); }}
                className={`px-3 py-1.5 font-medium transition-colors ${!isAll ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                Customize
              </button>
            </div>
            {!isAll && (
              <button
                type="button"
                onClick={() => setExpanded((p) => !p)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic flex-shrink-0">All counties</span>
        )}
      </div>

      {/* County list */}
      {counties && !isAll && expanded && (
        <div className="divide-y-0 border-t border-slate-100">
          {counties.map((county) => (
            <CountyRow
              key={county}
              county={county}
              countyVal={typeof val === 'object' ? val[county] : undefined}
              onToggle={() => onToggleCounty(county)}
              onSetMode={(mode) => onSetCountyMode(county, mode)}
              onAddZip={(c, z) => onAddZip(c, z)}
              onRemoveZip={(c, z) => onRemoveZip(c, z)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Map dots from current coverage ─────────────────────────────── */
const CoverageMarkers = ({ coverage }) => {
  const markers = [];
  Object.entries(coverage).forEach(([code, val]) => {
    const center = STATE_CENTERS[code];
    if (!center) return;
    if (val === 'all') {
      markers.push({ key: code, pos: center, color: '#16a34a', radius: 10, label: `${code} — Entire state` });
    } else {
      // Show county-level dots (offset slightly for visibility)
      const countyEntries = Object.entries(val);
      countyEntries.forEach(([county, cv], i) => {
        const angle = (i / Math.max(countyEntries.length, 1)) * 2 * Math.PI;
        const offset = 1.2;
        const pos = [center[0] + Math.sin(angle) * offset, center[1] + Math.cos(angle) * offset];
        const isSpecific = Array.isArray(cv);
        markers.push({
          key: `${code}-${county}`,
          pos,
          color: isSpecific ? '#2563eb' : '#16a34a',
          radius: 7,
          label: `${county} — ${isSpecific ? `${cv.length} ZIPs` : 'All ZIPs'}`,
        });
      });
      // State label dot
      if (countyEntries.length > 0) {
        markers.push({ key: `${code}-center`, pos: center, color: '#94a3b8', radius: 5, label: code });
      }
    }
  });
  return markers.map(({ key, pos, color, radius, label }) => (
    <CircleMarker
      key={key}
      center={pos}
      radius={radius}
      pathOptions={{ color, fillColor: color, fillOpacity: 0.75, weight: 1.5 }}
    >
      <Popup>{label}</Popup>
    </CircleMarker>
  ));
};

/* ─── Main component ──────────────────────────────────────────────── */
const CoverageHierarchy = ({ value, onChange }) => {
  // value = { [stateCode]: 'all' | { [countyName]: 'all' | string[] } }
  const [search, setSearch] = useState('');

  const selectedCodes = Object.keys(value);
  const filtered = search.trim()
    ? US_STATES.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.code.toLowerCase().includes(search.toLowerCase())
      )
    : US_STATES;

  /* ── State actions ── */
  const addState = (code) => {
    if (value[code]) return;
    onChange({ ...value, [code]: 'all' });
  };

  const removeState = (code) => {
    const next = { ...value };
    delete next[code];
    onChange(next);
  };

  const setEntire = (code) => onChange({ ...value, [code]: 'all' });

  const setCounties = (code) => {
    // Preserve existing county config if already customized
    if (typeof value[code] === 'object') return;
    onChange({ ...value, [code]: {} });
  };

  /* ── County actions ── */
  const toggleCounty = (code, county) => {
    const stateVal = value[code];
    if (stateVal === 'all') return;
    const next = { ...stateVal };
    if (next[county] !== undefined) {
      delete next[county];
    } else {
      next[county] = 'all';
    }
    onChange({ ...value, [code]: next });
  };

  const setCountyMode = (code, county, mode) => {
    const stateVal = value[code];
    if (stateVal === 'all') return;
    onChange({
      ...value,
      [code]: { ...stateVal, [county]: mode === 'all' ? 'all' : [] },
    });
  };

  const addZip = (code, county, zip) => {
    const stateVal = value[code];
    if (stateVal === 'all') return;
    const countyVal = stateVal[county];
    if (!Array.isArray(countyVal)) return;
    onChange({ ...value, [code]: { ...stateVal, [county]: [...countyVal, zip] } });
  };

  const removeZip = (code, county, zip) => {
    const stateVal = value[code];
    if (stateVal === 'all') return;
    const countyVal = stateVal[county];
    if (!Array.isArray(countyVal)) return;
    onChange({ ...value, [code]: { ...stateVal, [county]: countyVal.filter((z) => z !== zip) } });
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-slate-900 mb-1">Where do you cover?</h3>
        <p className="text-sm text-slate-500">
          Add states you work in. Each defaults to the entire state — expand to restrict by county or specific ZIP codes.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* ── Left: Hierarchy editor ── */}
        <div className="space-y-3">
          {/* State search/picker */}
          <div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search states..."
              className="w-full border border-slate-200 rounded-exos-sm px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            />
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-40 overflow-y-auto pr-1">
              {filtered.map(({ code, name }) => {
                const selected = !!value[code];
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => (selected ? removeState(code) : addState(code))}
                    title={name}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-exos border-2 text-xs font-semibold transition-all ${
                      selected
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span>{code}</span>
                    {selected && <Check className="w-3 h-3 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected state cards */}
          {selectedCodes.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">No states selected yet.</p>
          )}

          <div className="space-y-2">
            {selectedCodes.map((code) => (
              <StateCard
                key={code}
                code={code}
                val={value[code]}
                onRemove={() => removeState(code)}
                onSetEntire={() => setEntire(code)}
                onSetCounties={() => setCounties(code)}
                onToggleCounty={(county) => toggleCounty(code, county)}
                onSetCountyMode={(county, mode) => setCountyMode(code, county, mode)}
                onAddZip={(county, zip) => addZip(code, county, zip)}
                onRemoveZip={(county, zip) => removeZip(code, county, zip)}
              />
            ))}
          </div>
        </div>

        {/* ── Right: Map overview ── */}
        <div className="rounded-exos overflow-hidden border border-slate-200 h-[420px] sticky top-4">
          {selectedCodes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 gap-2">
              <MapPin className="w-8 h-8 opacity-40" />
              <p className="text-sm">Select states to see coverage map</p>
            </div>
          ) : (
            <MapContainer
              center={[39.5, -98.35]}
              zoom={4}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <CoverageMarkers coverage={value} />
            </MapContainer>
          )}
        </div>
      </div>

      {/* Legend */}
      {selectedCodes.length > 0 && (
        <div className="flex items-center gap-5 text-xs text-slate-500 flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" /> Entire state</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Specific counties / ZIPs</span>
        </div>
      )}
    </div>
  );
};

export default CoverageHierarchy;
