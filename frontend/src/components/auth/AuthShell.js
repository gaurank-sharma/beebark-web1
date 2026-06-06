import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';

/**
 * Shared two-panel auth layout.
 * - On large screens: brand illustration on the left, form on the right.
 * - On mobile: illustration hidden, compact brand header above the form.
 */
const POSITIONING = 'The professional network for architecture, interiors & construction.';
const VALUE_POINTS = [
  'Build your portfolio',
  'Connect with professionals',
  'Get hired',
  'Showcase your work'
];

const BrandMark = ({ className = '' }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-yellow-400 text-base font-extrabold">
      B
    </span>
    <span className="text-xl font-extrabold tracking-tight text-black">BeeBark</span>
  </div>
);

const Honeycomb = () => (
  <svg viewBox="0 0 400 400" className="w-52 h-52 xl:w-60 xl:h-60 drop-shadow-xl" aria-hidden="true">
    <defs>
      <linearGradient id="cell" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1A1A1A" />
        <stop offset="100%" stopColor="#333333" />
      </linearGradient>
    </defs>
    {[
      [140, 90], [220, 90],
      [100, 160], [180, 160], [260, 160],
      [140, 230], [220, 230],
      [180, 300]
    ].map(([cx, cy], i) => {
      const r = 38;
      const pts = Array.from({ length: 6 }, (_, k) => {
        const a = (Math.PI / 180) * (60 * k - 30);
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      }).join(' ');
      const filled = [1, 2, 4, 6].includes(i);
      return (
        <polygon
          key={i}
          points={pts}
          fill={filled ? 'url(#cell)' : '#FFFFFF'}
          opacity={filled ? 0.95 : 0.9}
          stroke="#1A1A1A"
          strokeWidth="2"
        />
      );
    })}
    <circle cx="300" cy="300" r="26" fill="#1A1A1A" />
    <circle cx="291" cy="294" r="4" fill="#FFC107" />
    <circle cx="309" cy="294" r="4" fill="#FFC107" />
  </svg>
);

const AuthShell = ({ children, headline, subline }) => {
  return (
    <div className="min-h-screen flex bg-white" data-testid="auth-shell">
      {/* Left brand panel (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 overflow-hidden bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#1A1A1A 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div className="relative z-10 max-w-md">
          <BrandMark className="mb-8" />
          <h2 className="text-3xl xl:text-4xl font-bold text-black leading-tight">
            {headline || POSITIONING}
          </h2>
          {subline && <p className="mt-4 text-black/70 text-base">{subline}</p>}
          <ul className="mt-8 space-y-3">
            {VALUE_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-3 text-black/80">
                <FaCheckCircle className="text-black shrink-0" />
                <span className="font-medium">{point}</span>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex justify-center">
            <Honeycomb />
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <BrandMark className="lg:hidden mb-8" />
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
export { BrandMark };
