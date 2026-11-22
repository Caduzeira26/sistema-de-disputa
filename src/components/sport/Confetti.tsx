import type { CSSProperties } from "react";

const COLORS = ["#35e0b0", "#3fa9ff", "#9b7bff", "#fbbf24", "#f87171", "#eef6f4"];

// Fixed values (not random) so server and client render the same markup.
const PIECES = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: ((i * 53) % 30) / 10,
  duration: 2.6 + ((i * 17) % 18) / 10,
  drift: ((i * 29) % 80) - 40,
  spin: 360 + ((i * 71) % 540),
  color: COLORS[i % COLORS.length],
  width: 5 + (i % 3) * 2,
}));

/** Confetti falling over its (relatively positioned) parent, for the champion's podium. Decorative only. */
export function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden print:hidden">
      {PIECES.map((p, i) => (
        <span
          key={i}
          className="confetti-piece absolute top-0 block rounded-[2px] opacity-0"
          style={
            {
              left: `${p.left}%`,
              width: p.width,
              height: p.width * 1.6,
              background: p.color,
              "--delay": `${p.delay}s`,
              "--dur": `${p.duration}s`,
              "--drift": `${p.drift}px`,
              "--spin": `${p.spin}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
