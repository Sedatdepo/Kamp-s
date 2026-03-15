import React from 'react';

export const Logo = ({ className, hideSlogan = false }: { className?: string, hideSlogan?: boolean }) => {
  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* Logo ve İkon Konteyneri */}
      <div className="relative flex items-center justify-center pt-2 pb-1">
        
        {/* Çoklu Kuyruklu Yıldız İzleri (SVG) */}
        <svg
          className="absolute -top-6 left-[-15px] w-[300px] h-[120px] pointer-events-none z-0"
          viewBox="0 0 280 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Elektrik Mavisi Işık İzleri */}
          <path d="M 10 75 Q 60 10, 215 45" stroke="url(#electric-gradient)" strokeWidth="3.5" strokeLinecap="round" className="opacity-95" />
          <path d="M 15 80 Q 75 25, 200 55" stroke="url(#electric-gradient)" strokeWidth="1.8" strokeLinecap="round" className="opacity-70" />
          <path d="M 25 65 Q 85 15, 185 35" stroke="url(#electric-gradient)" strokeWidth="1.2" strokeLinecap="round" className="opacity-50" />

          {/* PARLAK AY-YILDIZ (Neon Efekti) */}
          <g filter="url(#ultra-glow)" transform="translate(220, 45)">
            <path 
              d="M -5,-13 A 13,13 0 1,0 -5,13 A 10,10 0 1,1 -5,-13 Z" 
              fill="#ffffff" 
              transform="rotate(-10)" 
              className="drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]"
            />
            <path 
              d="M 10,-3 L 13,2 L 18,2 L 14,6 L 15,12 L 10,8 L 5,12 L 6,6 L 2,2 L 7,2 Z" 
              fill="#ffffff" 
              transform="scale(0.85) translate(4, -3)" 
              className="drop-shadow-[0_0_10px_rgba(255,255,255,1)]"
            />
            <circle cx="6" cy="0" r="22" fill="url(#radial-glow)" fillOpacity="0.4" />
          </g>

          <circle cx="195" cy="30" r="3.5" fill="#22d3ee" className="animate-pulse shadow-cyan-500/50" />
          <circle cx="180" cy="62" r="2" fill="#ccfbf1" className="opacity-80" />

          <defs>
            <linearGradient id="electric-gradient" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#0891b2" stopOpacity="0" />
              <stop offset="60%" stopColor="#22d3ee" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
            </linearGradient>
            <radialGradient id="radial-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="1" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </radialGradient>
            <filter id="ultra-glow" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#22d3ee" floodOpacity="1" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </svg>

        <div className="flex items-baseline z-10">
          <span className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-200 to-cyan-500 leading-none drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]">
            L
          </span>
          <span className="text-3xl md:text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-300 to-cyan-400 -ml-1 md:-ml-2 drop-shadow-[0_5px_10px_rgba(0,0,0,0.3)]">
            uminodo
          </span>
        </div>
      </div>

      {!hideSlogan && (
        <div className="mt-[-8px] md:mt-[-12px] z-20">
          <span className="text-[10px] md:text-xl font-bold tracking-[0.12em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#ffe4bc] via-[#ffb347] to-[#d97706] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
            Global Education Platform
          </span>
        </div>
      )}
    </div>
  );
};
