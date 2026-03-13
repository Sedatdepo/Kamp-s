import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      {...props}
    >
      <g fill="none" stroke="currentColor" strokeWidth="2">
        {/* Book */}
        <path d="M16,52 L16,12 C16,8 20,6 24,6 L48,6" />
        <path d="M48,6 L48,52 C48,56 44,58 40,58 L16,58" />
        <path d="M32 6 L 32 58" />
        
        {/* Crescent and Star on Left Page */}
        <g transform="translate(22, 26)" fill="currentColor">
            <path d="M5,0 A5,5 0 0,0 5,10 A4,4 0 0,1 5,0 Z" stroke="none" />
            <polygon points="6,3.5 7,5.5 9,6 7.5,7.5 8,9.5 6,8.5 4,9.5 4.5,7.5 3,6 5,5.5" transform="translate(0, 2) scale(0.5)" stroke="none"/>
        </g>

        {/* Cursor on Right Page */}
        <g transform="translate(38, 30)" fill="currentColor" stroke="none">
            <polygon points="0,0 0,10 3,8 5,13 7,12 5,7 9,7" />
        </g>
      </g>
    </svg>
  );
}
