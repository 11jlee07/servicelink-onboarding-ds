import React from 'react';

// Eagerly load all EXOS SVG icons as URL strings via Vite's import.meta.glob
const iconModules = import.meta.glob('../../assets/icons/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
});

const illustrationModules = import.meta.glob('../../assets/illustrations/**/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
});

/**
 * ExosIcon — renders a named EXOS icon SVG.
 * @param {string} name - Icon name without prefix/extension, e.g. "check-circle-fill"
 * @param {number} size - Width/height in px (default 20)
 * @param {string} className - Additional CSS classes
 */
export const ExosIcon = ({ name, size = 20, className = '' }) => {
  const key = `../../assets/icons/icon-${name}.svg`;
  const src = iconModules[key];
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={className}
      style={{ display: 'inline-block' }}
    />
  );
};

/**
 * ExosIllustration — renders a named EXOS illustration SVG.
 * @param {string} name - Filename without extension, e.g. "house-search", "trophy", "mail-open-checkmark"
 * @param {string} folder - Subfolder: "core" | "default-client-portal/..." | "exos-verify/..."  (default "core")
 * @param {number} size - Width/height in px (default 120)
 * @param {string} className - Additional CSS classes
 */
export const ExosIllustration = ({ name, folder = 'core', size = 120, className = '' }) => {
  const key = `../../assets/illustrations/${folder}/${name}.svg`;
  const src = illustrationModules[key];
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      width={size}
      className={`object-contain max-w-full h-auto ${className}`}
    />
  );
};

/**
 * ExosHalo — the signature purpleblue radial halo circle used behind illustrations.
 * Wrap any illustration in this for the EXOS "scene" treatment.
 */
export const ExosHalo = ({ children, size = 160, className = '' }) => (
  <div
    className={`relative flex items-center justify-center flex-shrink-0 ${className}`}
    style={{ width: size, height: size }}
  >
    {/* Halo layers */}
    <div
      className="absolute inset-0 rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(121,134,203,0.18) 0%, rgba(99,130,235,0.12) 40%, rgba(6,109,206,0.06) 70%, transparent 100%)',
      }}
    />
    <div
      className="absolute rounded-full"
      style={{
        inset: '12%',
        background: 'radial-gradient(circle, rgba(149,117,205,0.10) 0%, rgba(99,130,235,0.08) 50%, transparent 100%)',
      }}
    />
    {/* Content */}
    <div className="relative z-10 flex items-center justify-center">
      {children}
    </div>
  </div>
);

export default ExosIcon;
