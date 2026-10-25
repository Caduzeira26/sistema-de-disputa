import QRCode from "qrcode";

/** Share of the QR's width taken by the logo in the middle. */
export const LOGO_FRACTION = 0.2;
/** White margin around the logo, as a share of the QR's width. */
export const LOGO_PADDING_FRACTION = 0.025;
/** Blank border around the code that scanners need (in modules). */
export const QUIET_ZONE = 2;

export interface QrGeometry {
  /** Modules per side (without the quiet zone). */
  size: number;
  /** SVG path covering every dark module, in module units. */
  path: string;
  dark: (x: number, y: number) => boolean;
}

/**
 * Builds the QR matrix at the highest error-correction level (H, ~30%
 * recoverable), which is what makes it safe to cover the center with a logo.
 */
export function buildQr(text: string): QrGeometry {
  const qr = QRCode.create(text, { errorCorrectionLevel: "H" });
  const size = qr.modules.size;
  const data = qr.modules.data;
  const dark = (x: number, y: number) => data[y * size + x] === 1;

  let path = "";
  for (let y = 0; y < size; y++) {
    let x = 0;
    while (x < size) {
      if (!dark(x, y)) {
        x++;
        continue;
      }
      const start = x;
      while (x < size && dark(x, y)) x++;
      path += `M${start} ${y}h${x - start}v1h-${x - start}z`;
    }
  }
  return { size, path, dark };
}

/** The square (in module units) the logo, with its white padding, occupies. */
export function logoBox(size: number): { x: number; y: number; side: number; padding: number } {
  const padding = size * LOGO_PADDING_FRACTION;
  const side = size * LOGO_FRACTION + padding * 2;
  return { x: (size - side) / 2, y: (size - side) / 2, side, padding };
}

/** Public URL of a tournament's team registration form. */
export function registrationUrl(baseUrl: string, slug: string): string {
  return `${baseUrl.replace(/\/$/, "")}/torneios/${slug}/inscricao`;
}
