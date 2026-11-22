/** A soccer ball in plain SVG (no image request), sized by the caller. Pairs with the .anim-ball-* classes. */
export function SportBall({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Bola">
      <defs>
        <radialGradient id="ball-shade" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#dbe9e6" />
          <stop offset="100%" stopColor="#9db3b0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#ball-shade)" stroke="#22343a" strokeWidth="2" />
      {/* centre pentagon */}
      <polygon points="50,33 66,45 60,64 40,64 34,45" fill="#0a1113" />
      {/* seams to the outer patches */}
      <g stroke="#0a1113" strokeWidth="2.4" strokeLinecap="round">
        <line x1="50" y1="33" x2="50" y2="12" />
        <line x1="66" y1="45" x2="86" y2="38" />
        <line x1="60" y1="64" x2="73" y2="82" />
        <line x1="40" y1="64" x2="27" y2="82" />
        <line x1="34" y1="45" x2="14" y2="38" />
      </g>
      {/* outer patches */}
      <g fill="#0a1113">
        <polygon points="50,6 58,12 55,20 45,20 42,12" />
        <polygon points="90,34 94,43 88,50 80,46 82,37" />
        <polygon points="78,84 70,86 66,79 71,72 79,75" />
        <polygon points="22,84 30,86 34,79 29,72 21,75" />
        <polygon points="10,34 6,43 12,50 20,46 18,37" />
      </g>
    </svg>
  );
}
