import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 60, className = '', showText = false }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
        
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]">
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Tech Ring (Hexagon) */}
          <path d="M50 2 L93.3 27 V77 L50 102 L6.7 77 V27 Z" fill="none" stroke="url(#logoGrad)" strokeWidth="0.5" opacity="0.3" />
          
          {/* Wireframe Globe */}
          <circle cx="50" cy="50" r="42" fill="none" stroke="url(#logoGrad)" strokeWidth="1.5" opacity="0.8" />
          
          {/* Grid Lines */}
          <path d="M50 8 A 42 42 0 0 1 50 92" fill="none" stroke="url(#logoGrad)" strokeWidth="0.5" opacity="0.4" />
          <path d="M50 8 A 42 42 0 0 0 50 92" fill="none" stroke="url(#logoGrad)" strokeWidth="0.5" opacity="0.4" />
          <path d="M8 50 A 42 42 0 0 1 92 50" fill="none" stroke="url(#logoGrad)" strokeWidth="0.5" opacity="0.4" />
          
          {/* Orbit Rings */}
          <ellipse cx="50" cy="50" rx="48" ry="12" fill="none" stroke="#a855f7" strokeWidth="1" opacity="0.6" transform="rotate(-30 50 50)" />
          
          {/* Inner Fill for Contrast */}
          <circle cx="50" cy="50" r="35" fill="#020617" opacity="0.6" />

          {/* TX Text */}
          <text x="50" y="65" textAnchor="middle" fill="white" fontFamily="sans-serif" fontWeight="900" fontSize="36" letterSpacing="-2" filter="url(#glow)">TX</text>
          
          {/* Tech Dots */}
          <circle cx="50" cy="2" r="1.5" fill="#fff" />
          <circle cx="93.3" cy="27" r="1.5" fill="#fff" />
          <circle cx="93.3" cy="77" r="1.5" fill="#fff" />
          <circle cx="50" cy="102" r="1.5" fill="#fff" />
          <circle cx="6.7" cy="77" r="1.5" fill="#fff" />
          <circle cx="6.7" cy="27" r="1.5" fill="#fff" />
        </svg>
      </div>
      {showText && (
        <div className="mt-4 text-center">
            <h1 className="font-display font-bold text-3xl tracking-[0.2em] text-white leading-none" style={{ textShadow: '0 0 20px rgba(34, 211, 238, 0.6)' }}>TIDE X</h1>
            <div className="flex items-center justify-center gap-2 mt-1">
               <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-cyan-500"></div>
               <p className="text-[10px] text-cyan-400 tracking-[0.4em] uppercase font-bold">App</p>
               <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-cyan-500"></div>
            </div>
        </div>
      )}
    </div>
  );
};