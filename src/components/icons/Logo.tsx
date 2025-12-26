import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      <path d="M12 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="m12 14-4 4" />
      <path d="m16 6-4 4" />
    </svg>
  );
}
