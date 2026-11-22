/** Pitch markings drawn as a faint background: halfway line, centre circle and both boxes. Decorative only. */
export function FieldLines({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <g fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="40" y="40" width="1120" height="520" rx="6" />
        <line x1="600" y1="40" x2="600" y2="560" />
        <circle cx="600" cy="300" r="82" />
        <circle cx="600" cy="300" r="4" fill="currentColor" />
        <rect x="40" y="170" width="150" height="260" />
        <rect x="40" y="235" width="56" height="130" />
        <rect x="1010" y="170" width="150" height="260" />
        <rect x="1104" y="235" width="56" height="130" />
        <path d="M190 255 A60 60 0 0 1 190 345" />
        <path d="M1010 255 A60 60 0 0 0 1010 345" />
      </g>
    </svg>
  );
}
