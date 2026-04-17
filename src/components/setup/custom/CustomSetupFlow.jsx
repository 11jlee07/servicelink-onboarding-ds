import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import zipcodes from 'zipcodes';
import {
  Check, X, ChevronRight, Pencil, Circle, Plus, Edit2,
  MapPin, Package, DollarSign, AlertTriangle, Loader,
} from 'lucide-react';
import ProductSelection from './ProductSelection';
import FeeSetting from './FeeSetting';
import { categorizeProducts } from './data';
import {
  getMapStyle, AREA_COLORS, distanceMi, getNearbyZips,
  pointInPolygon, generateCirclePoly,
} from '../../../utils/zipUtils';

/* ─── Helpers ────────────────────────────────────────────────────── */
let areaCounter = 0;
const nextAreaId = () => `area-${++areaCounter}`;

function getZipsInShape(allZips, shape) {
  if (shape.type === 'radius') {
    return allZips.filter(
      (z) => distanceMi(shape.center[1], shape.center[0], z.lat, z.lng) <= shape.radiusMi
    );
  }
  return allZips.filter((z) => pointInPolygon([z.lng, z.lat], shape.polygon));
}

/* ─── Right panel: ZIP list + Products per area ──────────────────── */
const AreaPanel = ({ area, allZips, globalFees, selectedProducts, onUpdateArea, onClose, onDelete }) => {
  const [tab, setTab] = useState('zips');
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(area.name);

  const cats = useMemo(() => categorizeProducts([...selectedProducts]), [selectedProducts]);

  const commitName = () => {
    setEditingName(false);
    if (nameVal.trim()) onUpdateArea(area.id, { name: nameVal.trim() });
  };

  const removeZip = (zip) =>
    onUpdateArea(area.id, { zips: area.zips.filter((z) => z !== zip) });

  const setFee = (product, val) =>
    onUpdateArea(area.id, { fees: { ...area.fees, [product]: val.replace(/[^0-9]/g, '') } });

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: area.color }} />
            {editingName ? (
              <input
                autoFocus
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => e.key === 'Enter' && commitName()}
                className="text-base font-bold text-slate-900 border-b-2 border-blue-500 outline-none bg-transparent min-w-0 w-full"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="flex items-center gap-1.5 text-base font-bold text-slate-900 hover:text-blue-600 transition-colors truncate"
              >
                {area.name}
                <Edit2 className="w-3.5 h-3.5 flex-shrink-0 opacity-40" />
              </button>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 flex-shrink-0 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-400">{area.zips.length} ZIP{area.zips.length !== 1 ? 's' : ''} covered</p>

        {/* Tabs */}
        <div className="flex gap-1 mt-3 bg-slate-100 rounded-lg p-0.5">
          {['zips', 'products'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors capitalize ${
                tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t === 'zips' ? 'ZIP Codes' : 'Products'}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'zips' && (
          <>
            {area.zips.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-8">No ZIPs in this area</p>
            )}
            {area.zips.map((zip) => {
              const meta = allZips.find((z) => z.zip === zip);
              return (
                <div key={zip} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 hover:bg-slate-50">
                  <div>
                    <span className="font-mono text-sm font-semibold text-slate-800">{zip}</span>
                    {meta && <span className="text-xs text-slate-400 ml-2">{meta.city}</span>}
                  </div>
                  <button type="button" onClick={() => removeZip(zip)} className="text-slate-300 hover:text-red-400 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </>
        )}

        {tab === 'products' && (
          <div className="p-4 space-y-4">
            <p className="text-xs text-slate-400">
              Prices default to your global settings. Override per-area below.
            </p>
            {Object.entries(cats).map(([catKey, products]) => {
              if (!products.length) return null;
              const titles = {
                fullInterior: 'Full Interior', exterior: 'Exterior-Only',
                desktop: 'Desktop / Desk Review', fieldReview: 'Field Review',
                specialized: 'Specialized',
                multiFamily2: '2-Unit', multiFamily3: '3-Unit', multiFamily4: '4-Unit',
              };
              return (
                <div key={catKey}>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    {titles[catKey] || catKey}
                  </p>
                  <div className="space-y-2">
                    {products.map((p) => (
                      <div key={p} className="flex items-center gap-3">
                        <span className="text-xs text-slate-700 flex-1 truncate">{p}</span>
                        <div className="relative w-24 flex-shrink-0">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={area.fees[p] ?? globalFees[p] ?? ''}
                            onChange={(e) => setFee(p, e.target.value)}
                            placeholder={globalFees[p] || '0'}
                            className="w-full border border-slate-200 rounded-lg py-1.5 pl-6 pr-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-100 flex-shrink-0">
        <button
          type="button"
          onClick={() => onDelete(area.id)}
          className="w-full py-2 text-xs font-medium text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          Delete this area
        </button>
      </div>
    </div>
  );
};

/* ─── Main component ─────────────────────────────────────────────── */
const CustomSetupFlow = ({ state, setState, onBack, onDone }) => {
  const baseZip = state.basicInfo?.address?.zip || '75009';
  const baseInfo = useMemo(() => zipcodes.lookup(baseZip) || zipcodes.lookup('75009'), [baseZip]);
  const allZips = useMemo(() => getNearbyZips(baseZip, 150), [baseZip]);

  // Stage: 'products' → 'fees' → 'map'
  const [stage, setStage] = useState('products');

  // Global products + fees (set in products/fees stages)
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [globalFees, setGlobalFees] = useState({});

  // Coverage areas
  const [areas, setAreas] = useState([]);
  const [activeAreaId, setActiveAreaId] = useState(null);

  // Drawing state
  const [drawMode, setDrawMode] = useState(null); // null | 'radius' | 'pencil'
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [radiusMi, setRadiusMi] = useState(25);
  const [pendingCenter, setPendingCenter] = useState(null);
  const [overridePrompt, setOverridePrompt] = useState(null); // { newArea, overlaps }

  // Map refs
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const mapReady = useRef(false);
  const isDrawing = useRef(false);
  const drawPoints = useRef([]);

  // Stable refs
  const areasRef = useRef(areas);
  const allZipsRef = useRef(allZips);
  const drawModeRef = useRef(drawMode);
  const radiusMiRef = useRef(radiusMi);
  const pendingCenterRef = useRef(pendingCenter);
  useEffect(() => { areasRef.current = areas; }, [areas]);
  useEffect(() => { allZipsRef.current = allZips; }, [allZips]);
  useEffect(() => { drawModeRef.current = drawMode; }, [drawMode]);
  useEffect(() => { radiusMiRef.current = radiusMi; }, [radiusMi]);
  useEffect(() => { pendingCenterRef.current = pendingCenter; }, [pendingCenter]);

  const activeArea = areas.find((a) => a.id === activeAreaId) || null;

  /* ── Initialize map (only when stage='map' so the container exists) ── */
  useEffect(() => {
    if (stage !== 'map') return;
    if (!mapContainer.current || !baseInfo) return;

    const m = new maplibregl.Map({
      container: mapContainer.current,
      style: getMapStyle(),
      center: [baseInfo.longitude, baseInfo.latitude],
      zoom: 9,
      attributionControl: false,
    });

    m.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    mapRef.current = m;

    m.on('load', () => {
      mapReady.current = true;

      // Base ZIP marker
      new maplibregl.Marker({ color: '#1e40af' })
        .setLngLat([baseInfo.longitude, baseInfo.latitude])
        .addTo(m);

      // Pending area preview (radius or lasso)
      m.addSource('pending-area', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addLayer({ id: 'pending-fill', type: 'fill', source: 'pending-area', paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.15 } });
      m.addLayer({ id: 'pending-line', type: 'line', source: 'pending-area', paint: { 'line-color': '#2563eb', 'line-width': 2, 'line-dasharray': [3, 2] } });

      // Lasso drawing
      m.addSource('lasso-line', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addSource('lasso-start', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addLayer({ id: 'lasso-line-layer', type: 'line', source: 'lasso-line', paint: { 'line-color': '#2563eb', 'line-width': 2.5, 'line-dasharray': [3, 2] } });
      m.addLayer({ id: 'lasso-start-layer', type: 'circle', source: 'lasso-start', paint: { 'circle-radius': 7, 'circle-color': 'rgba(37,99,235,0.15)', 'circle-stroke-width': 2, 'circle-stroke-color': '#2563eb' } });
    });

    return () => {
      m.remove();
      mapRef.current = null;
      mapReady.current = false;
    };
  }, [stage]);

  /* ── Auto-place radius at base address when entering radius mode ── */
  useEffect(() => {
    if (drawMode !== 'radius' || !baseInfo || !mapRef.current || !mapReady.current) return;
    const center = [baseInfo.longitude, baseInfo.latitude];
    setPendingCenter(center);
    const poly = generateCirclePoly(center, radiusMiRef.current);
    mapRef.current.getSource('pending-area')?.setData({
      type: 'Feature', geometry: { type: 'Polygon', coordinates: [poly] }, properties: {},
    });
  }, [drawMode]);

  /* ── Map click to reposition radius circle ── */
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !mapReady.current) return;

    const handleClick = (e) => {
      if (drawModeRef.current !== 'radius') return;
      const center = [e.lngLat.lng, e.lngLat.lat];
      setPendingCenter(center);
      const poly = generateCirclePoly(center, radiusMiRef.current);
      m.getSource('pending-area')?.setData({
        type: 'Feature', geometry: { type: 'Polygon', coordinates: [poly] }, properties: {},
      });
    };

    m.on('click', handleClick);
    return () => m.off('click', handleClick);
  }, [mapReady.current]);

  /* ── Update radius preview when miles change ── */
  useEffect(() => {
    if (!pendingCenter || !mapRef.current || !mapReady.current) return;
    const poly = generateCirclePoly(pendingCenter, radiusMi);
    mapRef.current.getSource('pending-area')?.setData({
      type: 'Feature', geometry: { type: 'Polygon', coordinates: [poly] }, properties: {},
    });
  }, [radiusMi, pendingCenter]);

  /* ── Lasso / pencil drawing ── */
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !mapReady.current || drawMode !== 'pencil') return;

    m.dragPan.disable();
    m.getCanvas().style.cursor = 'crosshair';

    const canvas = m.getCanvas();

    const clearLasso = () => {
      m.getSource('lasso-line')?.setData({ type: 'FeatureCollection', features: [] });
      m.getSource('lasso-start')?.setData({ type: 'FeatureCollection', features: [] });
      m.getSource('pending-area')?.setData({ type: 'FeatureCollection', features: [] });
      if (m.getLayer('lasso-line-layer')) m.setPaintProperty('lasso-line-layer', 'line-color', '#2563eb');
    };

    const updateLine = (color = '#2563eb') => {
      const pts = drawPoints.current;
      if (pts.length < 2) return;
      if (m.getLayer('lasso-line-layer')) m.setPaintProperty('lasso-line-layer', 'line-color', color);
      m.getSource('lasso-line')?.setData({
        type: 'Feature', geometry: { type: 'LineString', coordinates: pts }, properties: {},
      });
    };

    const getPt = (e) => {
      const raw = e.touches ? e.touches[0] : e;
      const rect = canvas.getBoundingClientRect();
      return { x: raw.clientX - rect.left, y: raw.clientY - rect.top, lngLat: m.unproject([raw.clientX - rect.left, raw.clientY - rect.top]) };
    };

    const onDown = (e) => {
      e.preventDefault();
      isDrawing.current = true;
      drawPoints.current = [];
      const { lngLat } = getPt(e);
      drawPoints.current.push([lngLat.lng, lngLat.lat]);
      m.getSource('lasso-start')?.setData({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [lngLat.lng, lngLat.lat] }, properties: {} }],
      });
    };

    const onMove = (e) => {
      if (!isDrawing.current) return;
      e.preventDefault();
      const { x, y, lngLat } = getPt(e);
      drawPoints.current.push([lngLat.lng, lngLat.lat]);
      const startPx = m.project(drawPoints.current[0]);
      const dist = Math.hypot(x - startPx.x, y - startPx.y);
      updateLine(drawPoints.current.length > 15 && dist < 22 ? '#16a34a' : '#2563eb');
    };

    const onUp = (e) => {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      const pts = drawPoints.current;
      if (pts.length < 10) { clearLasso(); return; }

      const raw = e.changedTouches ? e.changedTouches[0] : e;
      const rect = canvas.getBoundingClientRect();
      const x = raw.clientX - rect.left;
      const y = raw.clientY - rect.top;
      const startPx = m.project(pts[0]);
      const dist = Math.hypot(x - startPx.x, y - startPx.y);

      if (dist < 30) {
        const polygon = [...pts, pts[0]];
        clearLasso();
        finalizeShape({ type: 'pencil', polygon });
        setDrawMode(null);
      } else {
        updateLine('#ef4444');
        setTimeout(clearLasso, 500);
      }
    };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('touchstart', onDown, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onUp);

    return () => {
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('touchstart', onDown);
      canvas.removeEventListener('touchmove', onMove);
      canvas.removeEventListener('touchend', onUp);
      m.dragPan.enable();
      m.getCanvas().style.cursor = '';
    };
  }, [drawMode]);

  /* ── Add area to map ── */
  const addAreaToMap = useCallback((area) => {
    const m = mapRef.current;
    if (!m) return;
    const poly = area.type === 'radius' ? area.circlePoly : area.polygon;
    if (m.getSource(`area-${area.id}`)) return;

    m.addSource(`area-${area.id}`, {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [poly] }, properties: {} },
    });
    m.addLayer({ id: `area-fill-${area.id}`, type: 'fill', source: `area-${area.id}`, paint: { 'fill-color': area.color, 'fill-opacity': 0.18 } });
    m.addLayer({ id: `area-line-${area.id}`, type: 'line', source: `area-${area.id}`, paint: { 'line-color': area.color, 'line-width': 2 } });
  }, []);

  /* ── Remove area from map ── */
  const removeAreaFromMap = useCallback((areaId) => {
    const m = mapRef.current;
    if (!m) return;
    if (m.getLayer(`area-fill-${areaId}`)) m.removeLayer(`area-fill-${areaId}`);
    if (m.getLayer(`area-line-${areaId}`)) m.removeLayer(`area-line-${areaId}`);
    if (m.getSource(`area-${areaId}`)) m.removeSource(`area-${areaId}`);
  }, []);

  /* ── Finalize shape → create area (with overlap handling) ── */
  const finalizeShape = useCallback((shape) => {
    const allCoveredZips = areasRef.current.flatMap((a) => a.zips);
    const inShape = getZipsInShape(allZipsRef.current, shape);
    const newZips = inShape.filter((z) => !allCoveredZips.includes(z.zip)).map((z) => z.zip);
    const overlaps = inShape.filter((z) => allCoveredZips.includes(z.zip)).map((z) => z.zip);

    const areaNum = areasRef.current.length + 1;
    const color = AREA_COLORS[(areasRef.current.length) % AREA_COLORS.length];
    const id = nextAreaId();

    const newArea = {
      id,
      name: `Coverage Area ${areaNum}`,
      color,
      zips: newZips,
      fees: {},
      ...(shape.type === 'radius'
        ? { type: 'radius', center: shape.center, radiusMi: shape.radiusMi, circlePoly: shape.circlePoly }
        : { type: 'pencil', polygon: shape.polygon }),
    };

    // Check for significant overlap → show override prompt
    const overlapRatio = inShape.length > 0 ? overlaps.length / inShape.length : 0;
    if (overlaps.length > 0 && overlapRatio > 0.25) {
      setOverridePrompt({ newArea, overlaps });
    } else {
      commitArea(newArea, []);
    }
  }, []);

  const commitArea = useCallback((newArea, overrideZips) => {
    // If overriding: remove those ZIPs from their current area
    if (overrideZips.length > 0) {
      setAreas((prev) =>
        prev.map((a) => ({ ...a, zips: a.zips.filter((z) => !overrideZips.includes(z)) }))
      );
      // Update map sources for modified areas (simple: remove+re-add)
      // For simplicity we'll just update state; map visual will be slightly off until remount
    }
    const finalArea = { ...newArea, zips: [...newArea.zips, ...overrideZips] };
    setAreas((prev) => [...prev, finalArea]);
    setActiveAreaId(finalArea.id);
    setOverridePrompt(null);

    // Clear pending preview
    mapRef.current?.getSource('pending-area')?.setData({ type: 'FeatureCollection', features: [] });
    setPendingCenter(null);

    // Add to map after state update
    requestAnimationFrame(() => addAreaToMap(finalArea));
  }, [addAreaToMap]);

  /* ── Confirm radius area ── */
  const confirmRadius = () => {
    if (!pendingCenter) return;
    const circlePoly = generateCirclePoly(pendingCenter, radiusMi);
    finalizeShape({ type: 'radius', center: pendingCenter, radiusMi, circlePoly });
    setDrawMode(null);
  };

  /* ── Update area ── */
  const updateArea = (id, patch) => setAreas((prev) => prev.map((a) => a.id === id ? { ...a, ...patch } : a));

  /* ── Delete area ── */
  const deleteArea = (id) => {
    removeAreaFromMap(id);
    setAreas((prev) => prev.filter((a) => a.id !== id));
    if (activeAreaId === id) setActiveAreaId(null);
  };

  /* ── Save & Finish ── */
  const handleFinish = () => {
    setState((prev) => ({
      ...prev,
      setup: {
        type: 'custom',
        products: [...selectedProducts],
        globalFees,
        areas: areas.map((a) => ({ id: a.id, name: a.name, zips: a.zips, fees: a.fees })),
      },
    }));
    onDone();
  };

  const canFinish = areas.length > 0 && areas.every((a) => a.zips.length > 0);

  /* ══════════════════════════════════════════════════════
     STAGE: products
  ══════════════════════════════════════════════════════ */
  if (stage === 'products') {
    const canContinue = selectedProducts.size > 0;
    return (
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-slate-200" />
        <div className="absolute inset-0 flex items-center justify-center p-6 z-10">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <Package className="w-4 h-4 text-blue-600" />
                <h2 className="font-bold text-slate-900">Select Products</h2>
              </div>
              <p className="text-sm text-slate-500 ml-10">
                Choose which products you offer. You can customize these per coverage area later.
              </p>
            </div>
            <div className="px-6 py-5 max-h-[55vh] overflow-y-auto">
              <ProductSelection selected={selectedProducts} onChange={setSelectedProducts} />
            </div>
            <div className="px-6 pb-5 pt-3 border-t border-slate-100 flex gap-3">
              <button type="button" onClick={onBack}
                className="px-5 py-2.5 border-2 border-slate-200 rounded-xl font-medium text-slate-700 hover:border-slate-300 transition-colors text-sm">
                ← Back
              </button>
              <button type="button" onClick={() => setStage('fees')} disabled={!canContinue}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl transition-colors text-sm">
                Continue to Fees →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════
     STAGE: fees
  ══════════════════════════════════════════════════════ */
  if (stage === 'fees') {
    const cats = categorizeProducts([...selectedProducts]);
    const allProducts = Object.values(cats).flat();
    const canContinue = allProducts.every((p) => globalFees[p] !== undefined && globalFees[p] !== '');

    return (
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-slate-200" />
        <div className="absolute inset-0 flex items-center justify-center p-6 z-10">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <DollarSign className="w-4 h-4 text-blue-600" />
                <h2 className="font-bold text-slate-900">Set Default Fees</h2>
              </div>
              <p className="text-sm text-slate-500 ml-10">
                These are your baseline fees. You can override them per coverage area on the next step.
              </p>
            </div>
            <div className="px-6 py-5 max-h-[55vh] overflow-y-auto">
              <FeeSetting selectedProducts={selectedProducts} fees={globalFees} onChange={setGlobalFees} />
            </div>
            <div className="px-6 pb-5 pt-3 border-t border-slate-100 flex gap-3">
              <button type="button" onClick={() => setStage('products')}
                className="px-5 py-2.5 border-2 border-slate-200 rounded-xl font-medium text-slate-700 hover:border-slate-300 transition-colors text-sm">
                ← Back
              </button>
              <button type="button" onClick={() => setStage('map')} disabled={!canContinue}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl transition-colors text-sm">
                Continue to Coverage Map →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════
     STAGE: map
  ══════════════════════════════════════════════════════ */
  return (
    <div className="fixed inset-0">
      {/* Full-screen map */}
      <div ref={mapContainer} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3">
          <button type="button" onClick={() => setStage('fees')}
            className="bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-600 hover:text-slate-900 text-sm font-medium px-3 py-1.5 rounded-lg shadow-sm transition-colors">
            ← Back
          </button>
          <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Custom Setup</span>
            <span className="text-slate-300 mx-2">·</span>
            <span className="text-xs text-slate-500">Coverage Areas</span>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          {areas.length > 0 && !drawMode && (
            <button type="button" onClick={handleFinish} disabled={!canFinish}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors">
              Save & Finish →
            </button>
          )}
          {!drawMode && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAddDropdown((v) => !v)}
                className="bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600 text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Coverage Area
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showAddDropdown ? 'rotate-90' : 'rotate-0'}`} />
              </button>
              {showAddDropdown && (
                <div className="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden w-52 z-30">
                  <button
                    type="button"
                    onClick={() => { setDrawMode('radius'); setShowAddDropdown(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <Circle className="w-4 h-4 flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-semibold">Radius</p>
                      <p className="text-xs text-slate-400">Draw a circle by distance</p>
                    </div>
                  </button>
                  <div className="border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={() => { setDrawMode('pencil'); setShowAddDropdown(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <Pencil className="w-4 h-4 flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-semibold">Draw</p>
                      <p className="text-xs text-slate-400">Freehand lasso on the map</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Radius tool */}
      {drawMode === 'radius' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 w-80">
          <p className="text-sm font-semibold text-slate-900 mb-3 text-center">Set Radius</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Radius</span>
              <span className="text-sm font-bold text-blue-600">{radiusMi} mi</span>
            </div>
            <input type="range" min={5} max={150} step={5} value={radiusMi}
              onChange={(e) => setRadiusMi(Number(e.target.value))}
              className="w-full accent-blue-600" />
            <div className="flex justify-between text-xs text-slate-400">
              <span>5 mi</span><span>150 mi</span>
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-3">
            Click the map to reposition the circle
          </p>
          <button type="button" onClick={confirmRadius} disabled={!pendingCenter}
            className="w-full mt-3 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl text-sm transition-colors">
            Confirm Coverage Area
          </button>
          <button type="button" onClick={() => { setDrawMode(null); setPendingCenter(null); mapRef.current?.getSource('pending-area')?.setData({ type: 'FeatureCollection', features: [] }); }}
            className="w-full mt-2 py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
            Cancel
          </button>
        </div>
      )}

      {/* Pencil instructions */}
      {drawMode === 'pencil' && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 text-white text-xs px-4 py-2 rounded-full pointer-events-none">
          Draw your coverage shape — connect back to start to confirm
        </div>
      )}

      {/* Override prompt */}
      {overridePrompt && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 text-sm">Overlapping coverage</p>
                <p className="text-sm text-slate-500 mt-1">
                  {overridePrompt.overlaps.length} ZIP{overridePrompt.overlaps.length !== 1 ? 's' : ''} in this area are already assigned to another coverage area. What would you like to do?
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <button type="button" onClick={() => commitArea(overridePrompt.newArea, [])}
                className="w-full py-2.5 border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-medium rounded-xl text-sm transition-colors">
                Keep original assignments
              </button>
              <button type="button" onClick={() => commitArea(overridePrompt.newArea, overridePrompt.overlaps)}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-sm transition-colors">
                Override — assign to this area
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom area cards */}
      {areas.length > 0 && !drawMode && (
        <div className="absolute bottom-5 left-4 right-4 z-10 flex gap-2 overflow-x-auto pb-1 pointer-events-none">
          {areas.map((area) => (
            <button
              key={area.id}
              type="button"
              onClick={() => setActiveAreaId(activeAreaId === area.id ? null : area.id)}
              className={`pointer-events-auto flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 bg-white/95 backdrop-blur-sm rounded-xl shadow-md border-2 transition-all ${
                activeAreaId === area.id ? 'border-blue-500' : 'border-transparent hover:border-slate-300'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: area.color }} />
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-800">{area.name}</p>
                <p className="text-xs text-slate-400">{area.zips.length} ZIPs</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); deleteArea(area.id); }}
                className="ml-1 text-slate-300 hover:text-red-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </button>
          ))}
        </div>
      )}

      {/* Empty state hint */}
      {areas.length === 0 && !drawMode && (
        <div className="absolute bottom-1/2 translate-y-1/2 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 px-6 py-5">
            <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No coverage areas yet</p>
            <p className="text-xs text-slate-400 mt-0.5">Click "Add Coverage Area" to get started</p>
          </div>
        </div>
      )}

      {/* Right panel */}
      <div className={`absolute top-0 right-0 bottom-0 z-20 w-80 shadow-2xl transform transition-transform duration-300 ${activeArea ? 'translate-x-0' : 'translate-x-full'}`}>
        {activeArea && (
          <AreaPanel
            area={activeArea}
            allZips={allZips}
            globalFees={globalFees}
            selectedProducts={selectedProducts}
            onUpdateArea={updateArea}
            onClose={() => setActiveAreaId(null)}
            onDelete={deleteArea}
          />
        )}
      </div>
    </div>
  );
};

export default CustomSetupFlow;
