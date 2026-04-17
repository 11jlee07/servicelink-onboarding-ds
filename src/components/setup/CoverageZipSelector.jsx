import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import zipcodes from 'zipcodes';
import { MapPin, X, Check, Search, Loader, Pencil } from 'lucide-react';

/* ─── Haversine distance ─────────────────────────────────────────── */
function distanceMi(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ─── Real nearby ZIPs ───────────────────────────────────────────── */
function getNearbyZips(baseZip, maxMi = 150) {
  const base = zipcodes.lookup(baseZip);
  if (!base) return [];
  return zipcodes
    .radius(baseZip, maxMi)
    .map((zip) => {
      const info = zipcodes.lookup(zip);
      if (!info?.latitude) return null;
      const dist = Math.round(
        distanceMi(base.latitude, base.longitude, info.latitude, info.longitude)
      );
      return { zip, lat: info.latitude, lng: info.longitude, city: info.city, state: info.state, distMi: dist };
    })
    .filter(Boolean)
    .sort((a, b) => a.distMi - b.distMi)
    .slice(0, 600);
}

/* ─── OpenDataSoft boundary fetch (per-ZIP, no auth needed) ─────── */
const boundaryCache = new Map(); // zip → GeoJSON Feature | null

async function fetchZipBoundary(zip) {
  if (boundaryCache.has(zip)) return boundaryCache.get(zip);

  try {
    const res = await fetch(
      `https://public.opendatasoft.com/api/records/1.0/search/?dataset=georef-united-states-of-america-zcta5&q=${zip}&rows=1`
    );
    const data = await res.json();
    const record = data.records?.[0];
    const geoShape = record?.fields?.geo_shape;
    const returnedZip = record?.fields?.zcta5_code;

    if (!geoShape || returnedZip !== zip) {
      boundaryCache.set(zip, null);
      return null;
    }

    const feature = { type: 'Feature', geometry: geoShape, properties: { zip } };
    boundaryCache.set(zip, feature);
    return feature;
  } catch (e) {
    console.warn(`[boundary] error for ${zip}:`, e.message);
    boundaryCache.set(zip, null);
    return null;
  }
}

/* ─── Bounding box helper for fitBounds ─────────────────────────── */
function getFeatureBounds(feature) {
  const coords = [];
  const extract = (arr) => {
    if (typeof arr[0] === 'number') { coords.push(arr); return; }
    arr.forEach(extract);
  };
  extract(feature.geometry.coordinates);
  const lngs = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

/* ─── Light map style — CartoDB Positron, no API key needed ─────── */
const MAP_STYLE = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© <a href="https://carto.com/">CARTO</a> © <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [{ id: 'carto-tiles', type: 'raster', source: 'carto' }],
};

/* ─── Metro list for city search ─────────────────────────────────── */
const METRO_PREFIXES = [
  '100','021','191','200','212','282','302','322','328','331','336',
  '372','432','441','462','482','606','641','530','551','701','730',
  '750','770','782','787','800','841','850','871','891','900','920',
  '940','958','971','980',
];
const METROS = METRO_PREFIXES
  .map((p) => zipcodes.lookup(p + '00') || zipcodes.lookup(p + '01'))
  .filter(Boolean)
  .filter((v, i, arr) => arr.findIndex((x) => x.city === v.city) === i)
  .map((v) => ({ zip: v.zip, city: v.city, state: v.state, lat: v.latitude, lng: v.longitude }))
  .sort((a, b) => a.city.localeCompare(b.city));

const RADIUS_OPTIONS = [25, 50, 75, 100, 150];

/* ─── Ray-casting point-in-polygon ──────────────────────────────── */
function pointInPolygon([px, py], polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/* ─── Main component ─────────────────────────────────────────────── */
const CoverageZipSelector = ({ baseZip, selectedZips, onChange }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const mapReady = useRef(false);
  const activeBoundaries = useRef(new Set()); // ZIPs currently rendered on map

  const baseInfo = useMemo(() => zipcodes.lookup(baseZip) || null, [baseZip]);
  const allZips = useMemo(() => getNearbyZips(baseZip, 150), [baseZip]);

  const [radius, setRadius] = useState(50);
  const [hoveredZip, setHoveredZip] = useState(null);
  const [loadingZips, setLoadingZips] = useState(new Set());
  const [boundaryCount, setBoundaryCount] = useState(0);
  const [drawMode, setDrawMode] = useState(false);

  const isDrawing = useRef(false);
  const drawPoints = useRef([]);
  const visibleZipsRef = useRef([]);
  const metroZipsRef = useRef([]);

  const [metroSearch, setMetroSearch] = useState('');
  const [activeMetro, setActiveMetro] = useState(null);
  const [metroZips, setMetroZips] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const visibleZips = useMemo(
    () => allZips.filter((z) => z.distMi <= radius),
    [allZips, radius]
  );

  /* Stable refs so map event handlers don't capture stale closures */
  const selectedZipsRef = useRef(selectedZips);
  const onChangeRef = useRef(onChange);
  useEffect(() => { selectedZipsRef.current = selectedZips; }, [selectedZips]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { visibleZipsRef.current = visibleZips; }, [visibleZips]);
  useEffect(() => { metroZipsRef.current = metroZips; }, [metroZips]);

  const toggle = useCallback((zip) => {
    const cur = selectedZipsRef.current;
    onChangeRef.current(
      cur.includes(zip) ? cur.filter((z) => z !== zip) : [...cur, zip]
    );
  }, []);

  const removeZip = (zip) => onChange(selectedZips.filter((z) => z !== zip));

  /* ── Initialize MapLibre ── */
  useEffect(() => {
    if (!mapContainer.current || !baseInfo) return;

    const m = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [baseInfo.longitude, baseInfo.latitude],
      zoom: 9,
      scrollZoom: false,
      attributionControl: false,
    });

    m.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    mapRef.current = m;

    m.on('load', () => {
      mapReady.current = true;

      /* Base ZIP marker */
      new maplibregl.Marker({ color: '#2563eb' })
        .setLngLat([baseInfo.longitude, baseInfo.latitude])
        .addTo(m);

      /* ZIP dot source + layer */
      m.addSource('zip-dots', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      m.addLayer({
        id: 'zip-circles',
        type: 'circle',
        source: 'zip-dots',
        paint: {
          'circle-radius': [
            'case',
            ['boolean', ['get', 'hovered'], false], 9,
            ['boolean', ['get', 'selected'], false], 7,
            4,
          ],
          'circle-color': [
            'case',
            ['boolean', ['get', 'selected'], false], '#16a34a',
            ['boolean', ['get', 'hovered'], false], '#3b82f6',
            '#94a3b8',
          ],
          'circle-stroke-width': [
            'case',
            ['boolean', ['get', 'selected'], false], 2,
            ['boolean', ['get', 'hovered'], false], 2,
            1,
          ],
          'circle-stroke-color': [
            'case',
            ['boolean', ['get', 'selected'], false], '#15803d',
            ['boolean', ['get', 'hovered'], false], '#2563eb',
            '#64748b',
          ],
          'circle-opacity': [
            'case',
            ['boolean', ['get', 'hovered'], false], 1,
            ['boolean', ['get', 'selected'], false], 1,
            0.65,
          ],
        },
      });

      /* Lasso draw sources + layers */
      m.addSource('lasso-line', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addSource('lasso-start', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

      m.addLayer({
        id: 'lasso-line-layer',
        type: 'line',
        source: 'lasso-line',
        paint: { 'line-color': '#2563eb', 'line-width': 2.5, 'line-dasharray': [3, 2] },
      });
      m.addLayer({
        id: 'lasso-start-layer',
        type: 'circle',
        source: 'lasso-start',
        paint: {
          'circle-radius': 7,
          'circle-color': 'rgba(37,99,235,0.15)',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#2563eb',
        },
      });

      /* Click to toggle */
      m.on('click', 'zip-circles', (e) => {
        const zip = e.features?.[0]?.properties?.zip;
        if (zip) toggle(zip);
      });

      /* Hover tooltip */
      m.on('mouseenter', 'zip-circles', (e) => {
        m.getCanvas().style.cursor = 'pointer';
        const p = e.features?.[0]?.properties;
        if (p) setHoveredZip({ zip: p.zip, city: p.city, state: p.state, distMi: p.distMi, lat: p.lat, lng: p.lng });
      });
      m.on('mouseleave', 'zip-circles', () => {
        m.getCanvas().style.cursor = '';
        setHoveredZip(null);
      });
    });

    return () => {
      m.remove();
      mapRef.current = null;
      mapReady.current = false;
      activeBoundaries.current.clear();
    };
  }, [baseZip]); // re-init if home ZIP changes

  /* ── Keep ZIP dots in sync ── */
  useEffect(() => {
    if (!mapReady.current || !mapRef.current) return;
    const source = mapRef.current.getSource('zip-dots');
    if (!source) return;

    const allDisplay = [
      ...visibleZips,
      ...metroZips.filter((m) => !visibleZips.find((v) => v.zip === m.zip)),
    ];

    source.setData({
      type: 'FeatureCollection',
      features: allDisplay.map((item) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [item.lng, item.lat] },
        properties: {
          zip: item.zip,
          city: item.city,
          state: item.state || '',
          distMi: item.distMi,
          lat: item.lat,
          lng: item.lng,
          selected: selectedZips.includes(item.zip),
          hovered: hoveredZip?.zip === item.zip,
        },
      })),
    });
  }, [visibleZips, metroZips, selectedZips, hoveredZip]);

  /* ── Helper: add boundary layers to map ── */
  const addBoundaryToMap = useCallback((zip, feature) => {
    const m = mapRef.current;
    if (!m || m.getSource(`boundary-${zip}`)) return;

    m.addSource(`boundary-${zip}`, { type: 'geojson', data: feature });

    m.addLayer(
      {
        id: `boundary-fill-${zip}`,
        type: 'fill',
        source: `boundary-${zip}`,
        paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.12 },
      },
      'zip-circles'
    );

    m.addLayer(
      {
        id: `boundary-line-${zip}`,
        type: 'line',
        source: `boundary-${zip}`,
        paint: {
          'line-color': '#2563eb',
          'line-width': 2.5,
          'line-dasharray': [4, 3],
        },
      },
      'zip-circles'
    );

    activeBoundaries.current.add(zip);
    setBoundaryCount((n) => n + 1); // trigger fit effect
  }, []);

  /* ── Manage boundary layers when selection changes ── */
  useEffect(() => {
    if (!mapReady.current || !mapRef.current) return;
    const m = mapRef.current;

    /* Remove boundaries for deselected ZIPs */
    let removed = false;
    activeBoundaries.current.forEach((zip) => {
      if (!selectedZips.includes(zip)) {
        if (m.getLayer(`boundary-fill-${zip}`)) m.removeLayer(`boundary-fill-${zip}`);
        if (m.getLayer(`boundary-line-${zip}`)) m.removeLayer(`boundary-line-${zip}`);
        if (m.getSource(`boundary-${zip}`)) m.removeSource(`boundary-${zip}`);
        activeBoundaries.current.delete(zip);
        removed = true;
      }
    });
    if (removed) setBoundaryCount((n) => n + 1);

    /* Add boundaries for newly selected ZIPs */
    selectedZips.forEach((zip) => {
      if (activeBoundaries.current.has(zip)) return;

      if (boundaryCache.has(zip)) {
        const cached = boundaryCache.get(zip);
        if (cached) addBoundaryToMap(zip, cached);
        return;
      }

      setLoadingZips((prev) => new Set([...prev, zip]));
      fetchZipBoundary(zip).then((feature) => {
        setLoadingZips((prev) => {
          const next = new Set(prev);
          next.delete(zip);
          return next;
        });
        if (feature && mapRef.current && mapReady.current) {
          if (selectedZipsRef.current.includes(zip)) {
            addBoundaryToMap(zip, feature);
          }
        }
      });
    });
  }, [selectedZips, addBoundaryToMap]);

  /* ── Fit map to all selected boundaries whenever boundaries change ── */
  useEffect(() => {
    if (!mapReady.current || !mapRef.current || selectedZips.length === 0) return;

    const features = selectedZips.map((zip) => boundaryCache.get(zip)).filter(Boolean);
    if (features.length === 0) return;

    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    features.forEach((f) => {
      const [[fMinLng, fMinLat], [fMaxLng, fMaxLat]] = getFeatureBounds(f);
      minLng = Math.min(minLng, fMinLng);
      minLat = Math.min(minLat, fMinLat);
      maxLng = Math.max(maxLng, fMaxLng);
      maxLat = Math.max(maxLat, fMaxLat);
    });

    try {
      mapRef.current.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
        padding: 60,
        duration: 600,
        maxZoom: 13,
      });
    } catch (_) {}
  }, [boundaryCount, selectedZips]);

  /* ── Lasso / draw mode ── */
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !mapReady.current) return;

    if (!drawMode) {
      m.dragPan.enable();
      m.getCanvas().style.cursor = '';
      return;
    }

    m.dragPan.disable();
    m.getCanvas().style.cursor = 'crosshair';

    const canvas = m.getCanvas();

    const clearLasso = () => {
      m.getSource('lasso-line')?.setData({ type: 'FeatureCollection', features: [] });
      m.getSource('lasso-start')?.setData({ type: 'FeatureCollection', features: [] });
      if (m.getLayer('lasso-line-layer')) m.setPaintProperty('lasso-line-layer', 'line-color', '#2563eb');
    };

    const updateLine = (color = '#2563eb') => {
      const pts = drawPoints.current;
      if (pts.length < 2) return;
      if (m.getLayer('lasso-line-layer')) m.setPaintProperty('lasso-line-layer', 'line-color', color);
      m.getSource('lasso-line')?.setData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: pts },
        properties: {},
      });
    };

    const getPt = (e) => {
      const raw = e.touches ? e.touches[0] : e;
      const rect = canvas.getBoundingClientRect();
      const x = raw.clientX - rect.left;
      const y = raw.clientY - rect.top;
      return { x, y, lngLat: m.unproject([x, y]) };
    };

    const onDown = (e) => {
      e.preventDefault();
      isDrawing.current = true;
      drawPoints.current = [];
      const { x, y, lngLat } = getPt(e);
      drawPoints.current.push([lngLat.lng, lngLat.lat]);
      // Show start-point ring
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

      // Check if near start (snap indicator: turn green)
      const startPx = m.project(drawPoints.current[0]);
      const dist = Math.hypot(x - startPx.x, y - startPx.y);
      const snapping = drawPoints.current.length > 15 && dist < 22;
      updateLine(snapping ? '#16a34a' : '#2563eb');
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
        // ✅ Closed — select ZIPs inside
        const polygon = [...pts, pts[0]];
        const candidates = [...visibleZipsRef.current, ...metroZipsRef.current.filter(mz => !visibleZipsRef.current.find(v => v.zip === mz.zip))];
        const inside = candidates.filter((z) => pointInPolygon([z.lng, z.lat], polygon)).map((z) => z.zip);
        const toAdd = inside.filter((z) => !selectedZipsRef.current.includes(z));
        if (toAdd.length > 0) onChangeRef.current([...selectedZipsRef.current, ...toAdd]);
        clearLasso();
        setDrawMode(false);
      } else {
        // ❌ Not closed — flash red then disappear
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

  /* ── Metro search ── */
  const filteredMetros =
    metroSearch.trim().length >= 2
      ? METROS.filter(
          (m) =>
            m.city.toLowerCase().includes(metroSearch.toLowerCase()) ||
            m.state.toLowerCase().includes(metroSearch.toLowerCase())
        ).slice(0, 6)
      : [];

  const selectMetro = (metro) => {
    setActiveMetro(metro);
    setMetroZips(getNearbyZips(metro.zip, 30).slice(0, 12));
    setMetroSearch('');
    setShowDropdown(false);
  };

  const allDisplayed = [
    ...visibleZips,
    ...metroZips.filter((m) => !visibleZips.find((v) => v.zip === m.zip)),
  ];

  if (!baseZip || !baseInfo) {
    return (
      <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        Complete your office address in Step 1 to see nearby ZIP code suggestions.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Primary ZIP badge */}
      <div className="flex items-center gap-2.5">
        <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <span className="text-sm text-slate-600">Your primary ZIP:</span>
        <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full font-mono">
          {baseZip}
        </span>
        <span className="text-sm text-slate-500">
          {baseInfo.city}, {baseInfo.state}
        </span>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* ── Left: ZIP list ── */}
        <div className="space-y-3">
          {/* Radius pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Radius:
            </span>
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => { setRadius(r); setShowAll(false); }}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  radius === r
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-slate-200 text-slate-600 hover:border-blue-300 bg-white'
                }`}
              >
                {r} mi
              </button>
            ))}
            <span className="text-xs text-slate-400">{visibleZips.length} ZIPs</span>
          </div>

          {/* Nearby ZIP checklist */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-y-auto" style={{ maxHeight: '17.5rem' }}>
            {visibleZips.map((item) => {
              const checked = selectedZips.includes(item.zip);
              const isLoading = loadingZips.has(item.zip);
              return (
                <label
                  key={item.zip}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors ${
                    hoveredZip?.zip === item.zip ? 'bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                  onMouseEnter={() => setHoveredZip(item)}
                  onMouseLeave={() => setHoveredZip(null)}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                      checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                    }`}
                  >
                    {checked && !isLoading && <Check className="w-2.5 h-2.5 text-white" />}
                    {checked && isLoading && <Loader className="w-2.5 h-2.5 text-white animate-spin" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(item.zip)}
                    className="sr-only"
                  />
                  <span className="font-mono text-sm font-semibold text-slate-800 w-14">
                    {item.zip}
                  </span>
                  <span className="text-xs text-slate-500">
                    {item.city}, {item.state}
                  </span>
                  <span className="ml-auto text-xs text-slate-400 flex-shrink-0">
                    {item.distMi} mi
                  </span>
                </label>
              );
            })}
            </div>
          </div>

          {/* City/metro search */}
          <div className="pt-1 space-y-2">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Add ZIPs from another city
              </p>
              <p className="text-xs text-slate-400">Search a city — we'll show real ZIPs near it.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={metroSearch}
                onChange={(e) => { setMetroSearch(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                placeholder="e.g. Austin, Chicago, Miami"
                className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {showDropdown && filteredMetros.length > 0 && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                  {filteredMetros.map((m) => (
                    <button
                      key={`${m.city}-${m.state}`}
                      type="button"
                      onMouseDown={() => selectMetro(m)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors text-left"
                    >
                      <span className="font-medium text-slate-800">{m.city}</span>
                      <span className="text-xs text-slate-400">{m.state}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {activeMetro && metroZips.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    ZIPs near {activeMetro.city}, {activeMetro.state}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setActiveMetro(null); setMetroZips([]); }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {metroZips.map((item) => {
                  const checked = selectedZips.includes(item.zip);
                  const isLoading = loadingZips.has(item.zip);
                  return (
                    <label
                      key={item.zip}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors ${
                        hoveredZip?.zip === item.zip ? 'bg-amber-50' : 'hover:bg-slate-50'
                      }`}
                      onMouseEnter={() => setHoveredZip(item)}
                      onMouseLeave={() => setHoveredZip(null)}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                          checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                        }`}
                      >
                        {checked && !isLoading && <Check className="w-2.5 h-2.5 text-white" />}
                        {checked && isLoading && <Loader className="w-2.5 h-2.5 text-white animate-spin" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(item.zip)}
                        className="sr-only"
                      />
                      <span className="font-mono text-sm font-semibold text-slate-800 w-14">
                        {item.zip}
                      </span>
                      <span className="text-xs text-slate-500">{item.city}</span>
                      <span className="ml-auto text-xs text-slate-400 flex-shrink-0">
                        {item.distMi} mi from {activeMetro.city}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected chips */}
          {selectedZips.length > 0 && (
            <div className="overflow-y-auto flex flex-wrap gap-2 pt-1 content-start" style={{ maxHeight: '76px' }}>
              {selectedZips.map((zip) => {
                const meta = allDisplayed.find((z) => z.zip === zip);
                return (
                  <span
                    key={zip}
                    className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-800 text-sm font-mono font-semibold px-3 py-1 rounded-full"
                    onMouseEnter={() => meta && setHoveredZip(meta)}
                    onMouseLeave={() => setHoveredZip(null)}
                  >
                    {zip}
                    <button
                      type="button"
                      onClick={() => removeZip(zip)}
                      className="text-blue-400 hover:text-blue-700 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right: Map ── */}
        <div className="rounded-2xl overflow-hidden border border-slate-200 h-[420px] lg:h-auto relative">
          {/* Pencil / draw mode toggle */}
          <button
            type="button"
            onClick={() => setDrawMode((p) => !p)}
            title={drawMode ? 'Cancel draw' : 'Draw to select ZIPs'}
            className={`absolute top-3 right-3 z-[1000] w-9 h-9 rounded-lg flex items-center justify-center shadow-md border transition-colors ${
              drawMode
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600'
            }`}
          >
            <Pencil className="w-4 h-4" />
          </button>

          {drawMode && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
              Draw around ZIPs — connect back to start to select
            </div>
          )}

          {!drawMode && hoveredZip && (
            <div className="absolute top-3 left-3 z-[1000] bg-white border border-slate-200 shadow-md rounded-lg px-3 py-2 text-sm pointer-events-none">
              <span className="font-mono font-bold text-blue-700">{hoveredZip.zip}</span>
              <span className="text-slate-500 ml-2">
                {hoveredZip.city}, {hoveredZip.state} · {hoveredZip.distMi} mi
              </span>
            </div>
          )}
          <div ref={mapContainer} style={{ height: '100%', width: '100%', minHeight: 300 }} />
        </div>
      </div>

    </div>
  );
};

export default CoverageZipSelector;
