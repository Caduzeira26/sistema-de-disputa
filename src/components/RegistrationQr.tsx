import { QUIET_ZONE, buildQr, logoBox } from "@/lib/qr";

/**
 * QR code (error-correction H) with the tournament's logo in the middle. It's
 * drawn as plain SVG from the module matrix, so it stays sharp at any print size.
 */
export function RegistrationQr({ url, logoUrl, label }: { url: string; logoUrl: string | null; label: string }) {
  const qr = buildQr(url);
  const total = qr.size + QUIET_ZONE * 2;
  const box = logoBox(qr.size);
  const inner = box.side - box.padding * 2;

  return (
    <svg viewBox={`0 0 ${total} ${total}`} role="img" aria-label={label} className="h-auto w-full">
      <rect width={total} height={total} fill="#ffffff" />
      <path d={qr.path} transform={`translate(${QUIET_ZONE} ${QUIET_ZONE})`} fill="#0f172a" shapeRendering="crispEdges" />
      {logoUrl && (
        <g transform={`translate(${QUIET_ZONE} ${QUIET_ZONE})`}>
          <rect x={box.x} y={box.y} width={box.side} height={box.side} rx={box.side * 0.12} fill="#ffffff" />
          <image
            href={logoUrl}
            x={box.x + box.padding}
            y={box.y + box.padding}
            width={inner}
            height={inner}
            preserveAspectRatio="xMidYMid meet"
          />
        </g>
      )}
    </svg>
  );
}
