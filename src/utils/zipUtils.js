import zipcodes from 'zipcodes';

export function distanceMi(lat1, lng1, lat2, lng2) {
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

export function getNearbyZips(baseZip, maxMi = 150) {
  const base = zipcodes.lookup(baseZip);
  if (!base) return [];
  return zipcodes
    .radius(baseZip, maxMi)
    .map((zip) => {
      const info = zipcodes.lookup(zip);
      if (!info?.latitude) return null;
      const dist = Math.round(distanceMi(base.latitude, base.longitude, info.latitude, info.longitude));
      return { zip, lat: info.latitude, lng: info.longitude, city: info.city, state: info.state, distMi: dist };
    })
    .filter(Boolean)
    .sort((a, b) => a.distMi - b.distMi)
    .slice(0, 600);
}

export function pointInPolygon([px, py], polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

export function generateCirclePoly(center, radiusMi, steps = 80) {
  const [lng, lat] = center;
  const R = 3958.8;
  const coords = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const dlat = (radiusMi / R) * (180 / Math.PI) * Math.cos(angle);
    const dlng =
      (radiusMi / R) * (180 / Math.PI) * Math.sin(angle) /
      Math.cos((lat * Math.PI) / 180);
    coords.push([lng + dlng, lat + dlat]);
  }
  return coords;
}

// Factory — returns a fresh object each call so MapLibre can't mutate a shared reference
export function getMapStyle() {
  return {
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
}
// Kept for any legacy imports
export const MAP_STYLE = getMapStyle();

export const AREA_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];
