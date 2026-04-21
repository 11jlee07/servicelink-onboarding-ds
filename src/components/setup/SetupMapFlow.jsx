import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import zipcodes from 'zipcodes';
import {
  Zap, SlidersHorizontal, ArrowRight, Clock, Info,
  X, ChevronRight, Pencil, Circle, Plus, Edit2,
  MapPin, Package, DollarSign, AlertTriangle,
} from 'lucide-react';
import ProductSelection from './custom/ProductSelection';
import FeeSetting from './custom/FeeSetting';
import { categorizeProducts } from './custom/data';
import {
  getMapStyle, AREA_COLORS, distanceMi, getNearbyZips,
  pointInPolygon, generateCirclePoly,
} from '../../utils/zipUtils';

/* ─── ZIP boundary cache + fetch ────────────────────────────────── */
const boundaryCache = new Map();

async function fetchZipBoundary(zip) {
  if (boundaryCache.has(zip)) return boundaryCache.get(zip);
  try {
    const res = await fetch(
      `https://public.opendatasoft.com/api/records/1.0/search/?dataset=georef-united-states-of-america-zcta5&q=${zip}&rows=5`
    );
    const json = await res.json();
    const record = json.records?.find((r) => r.fields?.zcta5_code === zip);
    if (!record?.fields?.geo_shape) { boundaryCache.set(zip, null); return null; }
    const feature = { type: 'Feature', geometry: record.fields.geo_shape, properties: { zip } };
    boundaryCache.set(zip, feature);
    return feature;
  } catch {
    boundaryCache.set(zip, null);
    return null;
  }
}

/* ─── Area counter ───────────────────────────────────────────────── */
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

/* ─── AreaPanel ──────────────────────────────────────────────────── */
const AreaPanel = ({ area, allZips, globalFees, selectedProducts, onUpdateArea, onClose, onDelete, onZipHover, onRemoveZip, isMobile }) => {
  const [tab, setTab] = useState('zips');
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(area.name);

  const cats = useMemo(() => categorizeProducts([...selectedProducts]), [selectedProducts]);
  const disabled = useMemo(() => new Set(area.disabledProducts || []), [area.disabledProducts]);

  const commitName = () => {
    setEditingName(false);
    if (nameVal.trim()) onUpdateArea(area.id, { name: nameVal.trim() });
  };
  const removeZip = (zip) => onRemoveZip ? onRemoveZip(area.id, zip) : onUpdateArea(area.id, { zips: area.zips.filter((z) => z !== zip) });
  const setFee = (product, val) =>
    onUpdateArea(area.id, { fees: { ...area.fees, [product]: val.replace(/[^0-9]/g, '') } });
  const toggleProduct = (product) => {
    const next = new Set(disabled);
    if (next.has(product)) next.delete(product); else next.add(product);
    onUpdateArea(area.id, { disabledProducts: [...next] });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white">

      {/* Header */}
      <div className="px-4 pt-3 pb-3 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: area.color }} />
            {editingName ? (
              <input autoFocus value={nameVal} onChange={(e) => setNameVal(e.target.value)}
                onBlur={commitName} onKeyDown={(e) => e.key === 'Enter' && commitName()}
                className="text-base font-bold text-slate-900 border-b-2 border-blue-500 outline-none bg-transparent min-w-0 w-full" />
            ) : (
              <button type="button" onClick={() => setEditingName(true)}
                className="flex items-center gap-1.5 text-base font-bold text-slate-900 hover:text-blue-600 transition-colors truncate">
                {area.name}<Edit2 className="w-3.5 h-3.5 flex-shrink-0 opacity-40" />
              </button>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 flex-shrink-0 ml-2 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-400">{area.zips.length} ZIP{area.zips.length !== 1 ? 's' : ''} covered</p>
        <div className="flex gap-1 mt-2.5 bg-slate-100 rounded-exos p-0.5">
          {['zips', 'products'].map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
              {t === 'zips' ? 'ZIP Codes' : 'Products'}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'zips' && (
          <>
            {/* Click-to-add hint */}
            <div className="flex items-center gap-2 px-4 pt-3 pb-1">
              <MapPin className="w-3 h-3 text-blue-400 flex-shrink-0" />
              <p className="text-xs text-slate-400">Tap any ZIP on the map to add or remove it</p>
            </div>
            {area.zips.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-6">No ZIPs in this area</p>
            )}
            {area.zips.map((zip) => {
              const meta = allZips.find((z) => z.zip === zip);
              return (
                <div key={zip}
                  className="flex items-center justify-between px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-default"
                  onMouseEnter={() => onZipHover?.(zip)}
                  onMouseLeave={() => onZipHover?.(null)}
                >
                  <div>
                    <span className="font-mono text-sm font-semibold text-slate-800">{zip}</span>
                    {meta && <span className="text-xs text-slate-400 ml-2">{meta.city}</span>}
                  </div>
                  <button type="button" onClick={() => removeZip(zip)}
                    className="text-slate-300 hover:text-red-400 transition-colors p-1">
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
              Uncheck products you don't offer here. Override fees per-product below.
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
                  <div className="space-y-1">
                    {products.map((p) => {
                      const enabled = !disabled.has(p);
                      return (
                        <div key={p} className={`rounded-exos transition-opacity ${enabled ? '' : 'opacity-40'}`}>
                          <div className="flex items-center gap-2.5 py-1.5">
                            <button type="button" onClick={() => toggleProduct(p)}
                              className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                                enabled ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                              {enabled && (
                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            <span className={`text-xs flex-1 truncate ${enabled ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                              {p}
                            </span>
                            {enabled && (
                              <div className="relative w-20 flex-shrink-0">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                <input type="text" inputMode="numeric"
                                  value={area.fees[p] ?? globalFees[p] ?? ''}
                                  onChange={(e) => setFee(p, e.target.value)}
                                  placeholder={globalFees[p] || '0'}
                                  className="w-full border border-slate-200 rounded-exos py-1 pl-5 pr-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-100 flex-shrink-0 space-y-1">
        <button type="button" onClick={onClose}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold uppercase rounded-exos transition-colors">
          Save Area
        </button>
        <button type="button" onClick={() => onDelete(area.id)}
          className="w-full py-2 text-xs font-medium text-red-400 hover:text-red-600 hover:bg-red-50 rounded-exos transition-colors">
          Delete this area
        </button>
      </div>
    </div>
  );
};

/* ─── Main component ─────────────────────────────────────────────── */
const SetupMapFlow = ({ state, setState, onQuick, onBack, onDone }) => {
  const baseZip = state?.basicInfo?.address?.zip || '75009';
  const baseInfo = useMemo(() => zipcodes.lookup(baseZip) || zipcodes.lookup('75009'), [baseZip]);
  const allZips = useMemo(() => getNearbyZips(baseZip, 150), [baseZip]);

  const [mode, setMode] = useState('landing');
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [globalFees, setGlobalFees] = useState({});
  const [areas, setAreas] = useState([]);
  const [activeAreaId, setActiveAreaId] = useState(null);
  const [drawMode, setDrawMode] = useState(null);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [radiusMi, setRadiusMi] = useState(25);
  const [pendingCenter, setPendingCenter] = useState(null);
  const [overridePrompt, setOverridePrompt] = useState(null);

  // Mobile detection (< 640px = sm breakpoint)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 640
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const [zipToast, setZipToast] = useState(null);
  const zipToastTimer = useRef(null);

  // Mobile panel swipe-to-dismiss
  const panelRef = useRef(null);
  const dragStartY = useRef(null);
  const dragCurrentY = useRef(0);
  const onPanelDragStart = useCallback((e) => {
    dragStartY.current = e.touches[0].clientY;
    dragCurrentY.current = 0;
    if (panelRef.current) panelRef.current.style.transition = 'none';
  }, []);
  const onPanelDragMove = useCallback((e) => {
    if (dragStartY.current === null) return;
    const delta = Math.max(0, e.touches[0].clientY - dragStartY.current);
    dragCurrentY.current = delta;
    if (panelRef.current) panelRef.current.style.transform = `translateY(${delta}px)`;
  }, []);
  const onPanelDragEnd = useCallback(() => {
    if (dragStartY.current === null) return;
    dragStartY.current = null;
    if (panelRef.current) panelRef.current.style.transition = '';
    if (dragCurrentY.current > 80) {
      setActiveAreaId(null);
    } else {
      if (panelRef.current) panelRef.current.style.transform = 'translateY(0)';
    }
    dragCurrentY.current = 0;
  }, []);

  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const mapReady = useRef(false);
  const isDrawing = useRef(false);
  const drawPoints = useRef([]);

  const areasRef = useRef(areas);
  const allZipsRef = useRef(allZips);
  const drawModeRef = useRef(drawMode);
  const radiusMiRef = useRef(radiusMi);
  const activeAreaIdRef = useRef(activeAreaId);
  useEffect(() => { areasRef.current = areas; }, [areas]);
  useEffect(() => { allZipsRef.current = allZips; }, [allZips]);
  useEffect(() => { drawModeRef.current = drawMode; }, [drawMode]);
  useEffect(() => { radiusMiRef.current = radiusMi; }, [radiusMi]);
  useEffect(() => { activeAreaIdRef.current = activeAreaId; }, [activeAreaId]);

  const activeArea = areas.find((a) => a.id === activeAreaId) || null;

  /* ── Initialize map once on mount ── */
  useEffect(() => {
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
      new maplibregl.Marker({ color: '#1e40af' })
        .setLngLat([baseInfo.longitude, baseInfo.latitude])
        .addTo(m);
      m.addSource('pending-area', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addLayer({ id: 'pending-fill', type: 'fill', source: 'pending-area', paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.12 } });
      m.addLayer({ id: 'pending-line', type: 'line', source: 'pending-area', paint: { 'line-color': '#2563eb', 'line-width': 2, 'line-dasharray': [3, 2] } });
      m.addSource('lasso-line', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addSource('lasso-start', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addLayer({ id: 'lasso-line-layer', type: 'line', source: 'lasso-line', paint: { 'line-color': '#2563eb', 'line-width': 2.5, 'line-dasharray': [3, 2] } });
      m.addLayer({ id: 'lasso-start-layer', type: 'circle', source: 'lasso-start', paint: { 'circle-radius': 7, 'circle-color': 'rgba(37,99,235,0.15)', 'circle-stroke-width': 2, 'circle-stroke-color': '#2563eb' } });
    });
    return () => { m.remove(); mapRef.current = null; mapReady.current = false; };
  }, []);

  /* ── Auto-place radius on base address ── */
  useEffect(() => {
    if (drawMode !== 'radius' || !baseInfo || !mapRef.current || !mapReady.current) return;
    const center = [baseInfo.longitude, baseInfo.latitude];
    setPendingCenter(center);
    const poly = generateCirclePoly(center, radiusMiRef.current);
    mapRef.current.getSource('pending-area')?.setData({
      type: 'Feature', geometry: { type: 'Polygon', coordinates: [poly] }, properties: {},
    });
  }, [drawMode]);

  /* ── Map click to reposition radius ── */
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    const onLoad = () => {
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
      m._radiusClickHandler = handleClick;
    };
    if (mapReady.current) onLoad(); else m.on('load', onLoad);
    return () => { if (m._radiusClickHandler) m.off('click', m._radiusClickHandler); };
  }, []);

  /* ── Update radius preview on slider change ── */
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
      return { x: raw.clientX - rect.left, y: raw.clientY - rect.top,
        lngLat: m.unproject([raw.clientX - rect.left, raw.clientY - rect.top]) };
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
      updateLine(drawPoints.current.length > 15 && Math.hypot(x - startPx.x, y - startPx.y) < 22 ? '#16a34a' : '#2563eb');
    };
    const onUp = (e) => {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      const pts = drawPoints.current;
      if (pts.length < 10) { clearLasso(); return; }
      const raw = e.changedTouches ? e.changedTouches[0] : e;
      const rect = canvas.getBoundingClientRect();
      const startPx = m.project(pts[0]);
      const dist = Math.hypot(raw.clientX - rect.left - startPx.x, raw.clientY - rect.top - startPx.y);
      if (dist < 30) {
        clearLasso();
        finalizeShape({ type: 'pencil', polygon: [...pts, pts[0]] });
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

  /* ── ZIP boundary helpers ── */
  const setZipBoundaryColor = useCallback((zip, color) => {
    fetchZipBoundary(zip).then((feature) => {
      const m = mapRef.current;
      if (!feature || !m) return;
      const srcId = `zbnd-${zip}`, fillId = `zbnd-fill-${zip}`, lineId = `zbnd-line-${zip}`;
      if (!m.getSource(srcId)) {
        m.addSource(srcId, { type: 'geojson', data: feature });
        m.addLayer({ id: fillId, type: 'fill', source: srcId, paint: { 'fill-color': color, 'fill-opacity': 0.22 } });
        m.addLayer({ id: lineId, type: 'line', source: srcId, paint: { 'line-color': color, 'line-width': 1.5 } });
      } else {
        if (m.getLayer(fillId)) m.setPaintProperty(fillId, 'fill-color', color);
        if (m.getLayer(lineId)) m.setPaintProperty(lineId, 'line-color', color);
      }
    });
  }, []);

  const removeAreaBoundaries = useCallback((zips) => {
    const m = mapRef.current;
    if (!m) return;
    zips.forEach((zip) => {
      if (m.getLayer(`zbnd-fill-${zip}`)) m.removeLayer(`zbnd-fill-${zip}`);
      if (m.getLayer(`zbnd-line-${zip}`)) m.removeLayer(`zbnd-line-${zip}`);
      if (m.getSource(`zbnd-${zip}`)) m.removeSource(`zbnd-${zip}`);
    });
  }, []);

  const handleZipHover = useCallback((zip) => {
    const m = mapRef.current;
    if (!m) return;
    if (zip) {
      if (m.getLayer(`zbnd-fill-${zip}`)) m.setPaintProperty(`zbnd-fill-${zip}`, 'fill-opacity', 0.55);
      if (m.getLayer(`zbnd-line-${zip}`)) m.setPaintProperty(`zbnd-line-${zip}`, 'line-width', 3);
    } else {
      areasRef.current.forEach((a) => a.zips.forEach((z) => {
        if (m.getLayer(`zbnd-fill-${z}`)) m.setPaintProperty(`zbnd-fill-${z}`, 'fill-opacity', 0.22);
        if (m.getLayer(`zbnd-line-${z}`)) m.setPaintProperty(`zbnd-line-${z}`, 'line-width', 1.5);
      }));
    }
  }, []);

  /* ── ZIP click-to-add helpers ── */
  const showZipToast = useCallback((zip, action) => {
    if (zipToastTimer.current) clearTimeout(zipToastTimer.current);
    setZipToast({ zip, action });
    zipToastTimer.current = setTimeout(() => setZipToast(null), 2000);
  }, []);

  const removeZipFromArea = useCallback((areaId, zip) => {
    removeAreaBoundaries([zip]);
    setAreas((prev) => prev.map((a) => a.id === areaId ? { ...a, zips: a.zips.filter((z) => z !== zip) } : a));
  }, [removeAreaBoundaries]);

  const toggleZipOnActiveArea = useCallback((zip) => {
    const areaId = activeAreaIdRef.current;
    if (!areaId) return;
    const currentArea = areasRef.current.find((a) => a.id === areaId);
    if (!currentArea) return;

    if (currentArea.zips.includes(zip)) {
      // Remove from area
      removeAreaBoundaries([zip]);
      setAreas((prev) => prev.map((a) => a.id === areaId ? { ...a, zips: a.zips.filter((z) => z !== zip) } : a));
      showZipToast(zip, 'removed');
    } else {
      // Check if assigned to another area
      const otherArea = areasRef.current.find((a) => a.id !== areaId && a.zips.includes(zip));
      if (otherArea) {
        // Reassign: remove from other, add to current
        setAreas((prev) => prev.map((a) => {
          if (a.id === otherArea.id) return { ...a, zips: a.zips.filter((z) => z !== zip) };
          if (a.id === areaId) return { ...a, zips: [...a.zips, zip] };
          return a;
        }));
      } else {
        setAreas((prev) => prev.map((a) => a.id === areaId ? { ...a, zips: [...a.zips, zip] } : a));
      }
      // Fetch boundary and color it
      fetchZipBoundary(zip).then(() => setZipBoundaryColor(zip, currentArea.color));
      showZipToast(zip, 'added');
    }
  }, [removeAreaBoundaries, setZipBoundaryColor, showZipToast]);

  /* ── Map click → add/remove ZIP when area panel is open ── */
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    const setup = () => {
      const handler = (e) => {
        if (drawModeRef.current) return;
        if (!activeAreaIdRef.current) return;

        // Try hitting an already-loaded ZIP boundary layer
        const loadedLayers = (m.getStyle()?.layers || [])
          .map((l) => l.id)
          .filter((id) => id.startsWith('zbnd-fill-'));
        const hits = loadedLayers.length
          ? m.queryRenderedFeatures(e.point, { layers: loadedLayers })
          : [];

        if (hits.length > 0) {
          const zip = hits[0].layer.id.replace('zbnd-fill-', '');
          toggleZipOnActiveArea(zip);
        } else {
          // Fall back to nearest ZIP centroid
          const lngLat = [e.lngLat.lng, e.lngLat.lat];
          const nearest = allZipsRef.current.reduce(
            (best, z) => {
              const d = distanceMi(lngLat[1], lngLat[0], z.lat, z.lng);
              return d < best.d ? { zip: z.zip, d } : best;
            },
            { zip: null, d: Infinity }
          );
          if (nearest.zip) toggleZipOnActiveArea(nearest.zip);
        }
      };
      m.on('click', handler);
      m._areaZipClickHandler = handler;
    };
    if (mapReady.current) setup(); else m.on('load', setup);
    return () => { if (m?._areaZipClickHandler) m.off('click', m._areaZipClickHandler); };
  }, [toggleZipOnActiveArea]);

  /* ── Cursor when area panel is open (click-to-add mode) ── */
  useEffect(() => {
    if (!mapRef.current || !mapReady.current) return;
    const canvas = mapRef.current.getCanvas();
    if (activeAreaId && !drawMode) {
      canvas.style.cursor = 'crosshair';
      return () => { canvas.style.cursor = ''; };
    }
  }, [activeAreaId, drawMode]);

  /* ── Area shape on map ── */
  const addAreaToMap = useCallback((area) => {
    const m = mapRef.current;
    if (!m) return;
    const poly = area.type === 'radius' ? area.circlePoly : area.polygon;
    if (m.getSource(`area-${area.id}`)) return;
    m.addSource(`area-${area.id}`, {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [poly] }, properties: {} },
    });
    m.addLayer({ id: `area-line-${area.id}`, type: 'line', source: `area-${area.id}`,
      paint: { 'line-color': area.color, 'line-width': 2, 'line-opacity': 0.5 } });
  }, []);

  const removeAreaFromMap = useCallback((areaId) => {
    const m = mapRef.current;
    if (!m) return;
    if (m.getLayer(`area-fill-${areaId}`)) m.removeLayer(`area-fill-${areaId}`);
    if (m.getLayer(`area-line-${areaId}`)) m.removeLayer(`area-line-${areaId}`);
    if (m.getSource(`area-${areaId}`)) m.removeSource(`area-${areaId}`);
  }, []);

  /* ── Shape → area ── */
  const finalizeShape = useCallback((shape) => {
    const allCoveredZips = areasRef.current.flatMap((a) => a.zips);
    const inShape = getZipsInShape(allZipsRef.current, shape);
    const newZips = inShape.filter((z) => !allCoveredZips.includes(z.zip)).map((z) => z.zip);
    const overlaps = inShape.filter((z) => allCoveredZips.includes(z.zip)).map((z) => z.zip);
    const color = AREA_COLORS[areasRef.current.length % AREA_COLORS.length];
    const id = nextAreaId();
    const newArea = {
      id, name: `Coverage Area ${areasRef.current.length + 1}`, color,
      zips: newZips, fees: {}, disabledProducts: [],
      ...(shape.type === 'radius'
        ? { type: 'radius', center: shape.center, radiusMi: shape.radiusMi, circlePoly: shape.circlePoly }
        : { type: 'pencil', polygon: shape.polygon }),
    };
    const overlapRatio = inShape.length > 0 ? overlaps.length / inShape.length : 0;
    if (overlaps.length > 0 && overlapRatio > 0.25) setOverridePrompt({ newArea, overlaps });
    else commitArea(newArea, []);
  }, []);

  const commitArea = useCallback((newArea, overrideZips) => {
    if (overrideZips.length > 0)
      setAreas((prev) => prev.map((a) => ({ ...a, zips: a.zips.filter((z) => !overrideZips.includes(z)) })));
    const finalArea = { ...newArea, zips: [...newArea.zips, ...overrideZips] };
    setAreas((prev) => [...prev, finalArea]);
    setActiveAreaId(finalArea.id);
    setOverridePrompt(null);
    mapRef.current?.getSource('pending-area')?.setData({ type: 'FeatureCollection', features: [] });
    setPendingCenter(null);
    requestAnimationFrame(() => {
      addAreaToMap(finalArea);
      finalArea.zips.forEach((zip) => setZipBoundaryColor(zip, finalArea.color));
    });
  }, [addAreaToMap, setZipBoundaryColor]);

  const confirmRadius = () => {
    if (!pendingCenter) return;
    finalizeShape({ type: 'radius', center: pendingCenter, radiusMi, circlePoly: generateCirclePoly(pendingCenter, radiusMi) });
    setDrawMode(null);
  };

  const updateArea = (id, patch) =>
    setAreas((prev) => prev.map((a) => a.id === id ? { ...a, ...patch } : a));

  const deleteArea = (id) => {
    const area = areasRef.current.find((a) => a.id === id);
    if (area) removeAreaBoundaries(area.zips);
    removeAreaFromMap(id);
    setAreas((prev) => prev.filter((a) => a.id !== id));
    if (activeAreaId === id) setActiveAreaId(null);
  };

  const handleFinish = () => {
    setState((prev) => ({
      ...prev,
      setup: {
        type: 'custom', products: [...selectedProducts], globalFees,
        areas: areas.map((a) => ({ id: a.id, name: a.name, zips: a.zips, fees: a.fees })),
      },
    }));
    onDone();
  };

  const canFinish = areas.length > 0 && areas.every((a) => a.zips.length > 0);

  /* ─────────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0">
      {/* Map — always mounted */}
      <div ref={mapContainer} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

      {/* ══ LANDING ══ */}
      {mode === 'landing' && (
        <>
          <div className="absolute inset-0 bg-slate-900/55 z-10" />
          <button type="button" onClick={onBack}
            className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 text-xs sm:text-sm text-white/70 hover:text-white flex items-center gap-1.5 transition-colors">
            ← Back
          </button>
          {/* Scrollable content wrapper so cards don't get cut on small phones */}
          <div className="absolute inset-0 z-20 overflow-y-auto flex flex-col items-center justify-start sm:justify-center px-4 sm:px-6 pt-16 sm:pt-0 pb-6">
            <div className="text-center mb-6 sm:mb-8 w-full max-w-2xl">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Set Up Coverage, Products & Fees
              </h1>
              <p className="text-white/60 text-xs sm:text-sm">
                Choose how you'd like to get started. You can update everything later.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-2xl">
              {/* Quick Setup */}
              <button type="button" onClick={onQuick}
                className="group flex flex-col gap-3 sm:gap-4 p-4 sm:p-6 bg-white/95 backdrop-blur-sm border-2 border-transparent hover:border-blue-400 rounded-exos text-left transition-all hover:shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-slate-100 group-hover:bg-blue-50 rounded-exos flex items-center justify-center transition-colors">
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
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />{item}
                    </li>
                  ))}
                </ul>
                {/* Hide info box on mobile to save space */}
                <div className="hidden sm:flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-exos-sm px-3 py-2.5 mt-auto">
                  <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Need 44 products or per-area pricing?{' '}
                    <span className="font-semibold text-slate-700">Custom Setup</span> has that.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 font-bold uppercase text-sm mt-auto">
                  Get started
                </div>
              </button>

              {/* Custom Setup */}
              <button type="button" onClick={() => setMode('products')}
                className="group flex flex-col gap-3 sm:gap-4 p-4 sm:p-6 bg-white/95 backdrop-blur-sm border-2 border-transparent hover:border-blue-400 rounded-exos text-left transition-all hover:shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-slate-100 group-hover:bg-blue-50 rounded-exos flex items-center justify-center transition-colors">
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
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />{item}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-1.5 text-slate-700 font-bold uppercase text-sm mt-auto">
                  Get started
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══ PRODUCTS overlay ══ */}
      {mode === 'products' && (
        <div className="fixed inset-0 z-20 bg-slate-900/40 flex items-end sm:items-center justify-center sm:p-6">
          <div
            className="bg-white rounded-t-2xl sm:rounded-exos shadow-2xl w-full sm:max-w-2xl flex flex-col"
            style={{ maxHeight: '88vh' }}
          >
            <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex justify-center mb-3 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-slate-200" />
              </div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <Package className="w-4 h-4 text-blue-600" />
                <h2 className="font-bold text-slate-900">Select Products</h2>
              </div>
              <p className="text-sm text-slate-500 ml-10">Choose which products you offer. Customize per coverage area later.</p>
            </div>
            <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1" style={{ minHeight: 0 }}>
              <ProductSelection selected={selectedProducts} onChange={setSelectedProducts} />
            </div>
            <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-3 border-t border-slate-100 flex gap-2 sm:gap-3 flex-shrink-0">
              <button type="button" onClick={() => setMode('landing')}
                className="px-3 sm:px-5 py-2.5 border-2 border-slate-200 rounded-exos font-bold uppercase text-slate-700 hover:border-slate-300 transition-colors text-sm">
                ← Back
              </button>
              <button type="button" onClick={() => setMode('fees')} disabled={selectedProducts.size === 0}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold uppercase rounded-exos transition-colors text-sm">
                Continue to Fees →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ FEES overlay ══ */}
      {mode === 'fees' && (
        <div className="fixed inset-0 z-20 bg-slate-900/40 flex items-end sm:items-center justify-center sm:p-6">
          <div
            className="bg-white rounded-t-2xl sm:rounded-exos shadow-2xl w-full sm:max-w-2xl flex flex-col"
            style={{ maxHeight: '88vh' }}
          >
            <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex justify-center mb-3 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-slate-200" />
              </div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <DollarSign className="w-4 h-4 text-blue-600" />
                <h2 className="font-bold text-slate-900">Set Default Fees</h2>
              </div>
              <p className="text-sm text-slate-500 ml-10">Baseline fees. Override per coverage area in the next step.</p>
            </div>
            <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1" style={{ minHeight: 0 }}>
              <FeeSetting selectedProducts={selectedProducts} fees={globalFees} onChange={setGlobalFees} />
            </div>
            <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-3 border-t border-slate-100 flex gap-2 sm:gap-3 flex-shrink-0">
              <button type="button" onClick={() => setMode('products')}
                className="px-3 sm:px-5 py-2.5 border-2 border-slate-200 rounded-exos font-bold uppercase text-slate-700 hover:border-slate-300 transition-colors text-sm">
                ← Back
              </button>
              <button type="button" onClick={() => setMode('map')}
                disabled={[...selectedProducts].some((p) => !globalFees[p])}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold uppercase rounded-exos transition-colors text-sm">
                Continue to Coverage Map →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MAP mode ══ */}
      {mode === 'map' && (
        <>
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 pointer-events-none">
            {/* Left */}
            <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
              <button type="button" onClick={() => setMode('fees')}
                className="bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-600 hover:text-slate-900 text-xs sm:text-sm font-medium px-2.5 sm:px-3 py-1.5 rounded-exos shadow-sm transition-colors">
                ← Back
              </button>
              {/* Breadcrumb — desktop only */}
              <div className="hidden sm:block bg-white/90 backdrop-blur-sm border border-slate-200 rounded-exos px-3 py-1.5 shadow-sm">
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Custom Setup</span>
                <span className="text-slate-300 mx-2">·</span>
                <span className="text-xs text-slate-500">Draw Coverage Areas</span>
              </div>
            </div>

            {/* Right */}
            <div className="pointer-events-auto flex items-center gap-2">
              {areas.length > 0 && !drawMode && (
                <button type="button" onClick={handleFinish} disabled={!canFinish}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-exos shadow-sm transition-colors whitespace-nowrap">
                  <span className="hidden sm:inline">Save & Finish →</span>
                  <span className="sm:hidden">Save →</span>
                </button>
              )}
              {!drawMode && (
                <div className="relative">
                  <button type="button" onClick={() => setShowAddDropdown((v) => !v)}
                    className="bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600 text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-exos shadow-sm transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                    <Plus className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Add Coverage Area</span>
                    <span className="sm:hidden">Add Area</span>
                    <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${showAddDropdown ? 'rotate-90' : ''}`} />
                  </button>
                  {showAddDropdown && (
                    <div className="absolute right-0 top-full mt-1.5 bg-white rounded-exos shadow-xl border border-slate-200 overflow-hidden w-48 sm:w-52 z-30">
                      <button type="button"
                        onClick={() => { setDrawMode('radius'); setShowAddDropdown(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                        <Circle className="w-4 h-4 flex-shrink-0" />
                        <div className="text-left">
                          <p className="font-semibold">Radius</p>
                          <p className="text-xs text-slate-400">Circle by distance</p>
                        </div>
                      </button>
                      <div className="border-t border-slate-100" />
                      <button type="button"
                        onClick={() => { setDrawMode('pencil'); setShowAddDropdown(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                        <Pencil className="w-4 h-4 flex-shrink-0" />
                        <div className="text-left">
                          <p className="font-semibold">Draw</p>
                          <p className="text-xs text-slate-400">Freehand lasso</p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Radius panel — full-width on mobile, centered fixed-width on desktop */}
          {drawMode === 'radius' && (
            <div className="absolute top-14 sm:top-16 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-80 z-20 bg-white rounded-exos shadow-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900 mb-3 text-center">Set Radius</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Radius</span>
                  <span className="text-sm font-bold text-blue-600">{radiusMi} mi</span>
                </div>
                <input type="range" min={5} max={150} step={5} value={radiusMi}
                  onChange={(e) => setRadiusMi(Number(e.target.value))}
                  className="w-full accent-blue-600" />
                <div className="flex justify-between text-xs text-slate-400"><span>5 mi</span><span>150 mi</span></div>
              </div>
              <p className="text-center text-xs text-slate-400 mt-3">Tap the map to reposition</p>
              <button type="button" onClick={confirmRadius} disabled={!pendingCenter}
                className="w-full mt-3 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold uppercase rounded-exos text-sm transition-colors">
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
            <div className="absolute bottom-8 sm:bottom-24 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 text-white text-xs px-4 py-2 rounded-full pointer-events-none whitespace-nowrap">
              Draw your coverage shape — connect back to start
            </div>
          )}

          {/* Overlap prompt */}
          {overridePrompt && (
            <div className="absolute inset-0 z-30 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/30">
              <div className="bg-white rounded-t-2xl sm:rounded-exos shadow-2xl p-5 sm:p-6 w-full sm:max-w-sm">
                <div className="flex justify-center mb-3 sm:hidden">
                  <div className="w-10 h-1 rounded-full bg-slate-200" />
                </div>
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">Overlapping coverage</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {overridePrompt.overlaps.length} ZIP{overridePrompt.overlaps.length !== 1 ? 's' : ''} are already assigned. What would you like to do?
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <button type="button" onClick={() => commitArea(overridePrompt.newArea, [])}
                    className="w-full py-2.5 border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-medium rounded-exos text-sm transition-colors">
                    Keep original assignments
                  </button>
                  <button type="button" onClick={() => commitArea(overridePrompt.newArea, overridePrompt.overlaps)}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase rounded-exos text-sm transition-colors">
                    Override — assign to this area
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {areas.length === 0 && !drawMode && (
            <div className="absolute bottom-1/2 translate-y-1/2 left-1/2 -translate-x-1/2 z-10 pointer-events-none w-64 sm:w-auto">
              <div className="bg-white/90 backdrop-blur-sm rounded-exos shadow-lg border border-slate-200 px-5 py-4 sm:px-6 sm:py-5 text-center">
                <MapPin className="w-7 h-7 sm:w-8 sm:h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No coverage areas yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Tap "Add Area" to get started</p>
              </div>
            </div>
          )}

          {/* Bottom area cards — hidden on mobile when panel is open */}
          {areas.length > 0 && !drawMode && !(isMobile && activeAreaId) && (
            <div className="absolute bottom-4 sm:bottom-5 left-3 right-3 sm:left-4 sm:right-4 z-10 flex gap-2 overflow-x-auto pb-1 pointer-events-none">
              {areas.map((area) => (
                <button key={area.id} type="button"
                  onClick={() => setActiveAreaId(activeAreaId === area.id ? null : area.id)}
                  className={`pointer-events-auto flex-shrink-0 flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-2 sm:py-2.5 bg-white/95 backdrop-blur-sm rounded-exos shadow-md border-2 transition-all ${
                    activeAreaId === area.id ? 'border-blue-500' : 'border-transparent hover:border-slate-300'}`}>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: area.color }} />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-800 max-w-[80px] sm:max-w-none truncate">{area.name}</p>
                    <p className="text-xs text-slate-400">{area.zips.length} ZIPs</p>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); deleteArea(area.id); }}
                    className="ml-1 text-slate-300 hover:text-red-400 transition-colors p-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </button>
              ))}
            </div>
          )}

          {/* ZIP click toast */}
          {zipToast && (
            <div className="absolute bottom-24 sm:bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <div className="flex items-center gap-2 bg-slate-900/90 text-white text-xs px-4 py-2 rounded-full whitespace-nowrap shadow-lg">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${zipToast.action === 'added' ? 'bg-green-400' : 'bg-red-400'}`} />
                ZIP {zipToast.zip} {zipToast.action}
              </div>
            </div>
          )}

          {/* Area panel — bottom sheet on mobile, right panel on desktop */}
          <div
            ref={panelRef}
            className={`z-20 shadow-2xl bg-white transition-transform duration-300 flex flex-col overflow-hidden ${
              isMobile
                ? 'fixed bottom-0 left-0 right-0 rounded-t-2xl'
                : 'absolute top-0 right-0 bottom-0 w-80'
            }`}
            style={{
              height: isMobile ? '48vh' : undefined,
              transform: activeArea
                ? 'translate(0, 0)'
                : isMobile ? 'translateY(100%)' : 'translateX(100%)',
            }}
          >
            {/* Drag handle — mobile only, fully interactive */}
            {isMobile && (
              <div
                className="flex justify-center pt-3 pb-1 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
                onTouchStart={onPanelDragStart}
                onTouchMove={onPanelDragMove}
                onTouchEnd={onPanelDragEnd}
              >
                <div className="w-10 h-1 rounded-full bg-slate-300" />
              </div>
            )}
            {activeArea && (
              <AreaPanel area={activeArea} allZips={allZips} globalFees={globalFees}
                selectedProducts={selectedProducts} onUpdateArea={updateArea}
                onClose={() => setActiveAreaId(null)} onDelete={deleteArea}
                onZipHover={handleZipHover} onRemoveZip={removeZipFromArea} isMobile={isMobile} />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SetupMapFlow;
export { SetupMapFlow as CustomSetupFlow };
