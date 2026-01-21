import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      {...props}
      >
      <g fill="none" stroke="currentColor" strokeWidth="3">
        {/* Book */}
        <path d="M16,52 L16,12 C16,8 20,6 24,6 L48,6" stroke="#22c55e" />
        <path d="M48,6 L48,52 C48,56 44,58 40,58 L16,58" stroke="#16a34a" />
        
        {/* Pencil / K-stem */}
        <path d="M28,15 L28,50" stroke="#3b82f6" strokeWidth="6" />
        <path d="M28,50 L25,58 L31,58 L28,50 Z" fill="#3b82f6" stroke="none" />

        {/* K-arms */}
        <path d="M28,32 L44,18" stroke="#fb923c" strokeWidth="6" />
        <path d="M28,32 L44,46" stroke="#f97316" strokeWidth="6" />

        {/* Graduation cap */}
        <path d="M12,18 L32,10 L52,18 L32,26 Z" fill="#1e3a8a" stroke="none" />
        <path d="M50,18 L54,18 L54,22" stroke="#f59e0b" strokeWidth="2" fill="none"/>
      </g>
    </svg>
  );
}
