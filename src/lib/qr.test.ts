import { describe, expect, it } from "vitest";
import jsQR from "jsqr";
import { QUIET_ZONE, buildQr, logoBox, registrationUrl } from "./qr";

/** Rasterizes the QR (with the logo area blanked, like the real poster) and tries to scan it. */
function scan(url: string, withLogo: boolean): string | null {
  const qr = buildQr(url);
  const scale = 8;
  const total = (qr.size + QUIET_ZONE * 2) * scale;
  const pixels = new Uint8ClampedArray(total * total * 4).fill(255);
  const box = logoBox(qr.size);

  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (!qr.dark(x, y)) continue;
      const covered = withLogo && x >= box.x && x < box.x + box.side && y >= box.y && y < box.y + box.side;
      if (covered) continue;
      for (let py = 0; py < scale; py++) {
        for (let px = 0; px < scale; px++) {
          const i = (((y + QUIET_ZONE) * scale + py) * total + (x + QUIET_ZONE) * scale + px) * 4;
          pixels[i] = pixels[i + 1] = pixels[i + 2] = 0;
        }
      }
    }
  }
  return jsQR(pixels, total, total)?.data ?? null;
}

describe("registrationUrl", () => {
  it("points at the public registration form of the tournament", () => {
    expect(registrationUrl("https://sistema-de-disputa.vercel.app", "interclasse-colegio-marques")).toBe(
      "https://sistema-de-disputa.vercel.app/torneios/interclasse-colegio-marques/inscricao"
    );
  });

  it("doesn't double the slash when the base URL ends with one", () => {
    expect(registrationUrl("https://exemplo.com/", "copa")).toBe("https://exemplo.com/torneios/copa/inscricao");
  });
});

describe("QR code", () => {
  const url = "https://sistema-de-disputa.vercel.app/torneios/interclasse-colegio-marques-de-caravelas-vespertino/inscricao";

  it("scans back to the exact registration URL", () => {
    expect(scan(url, false)).toBe(url);
  });

  it("still scans with the logo covering the center", () => {
    expect(scan(url, true)).toBe(url);
  });

  it("still scans with the logo for short and long addresses", () => {
    for (const slug of ["a", "copa-teste", "interclasse-colegio-marques", "x".repeat(60)]) {
      const text = registrationUrl("https://sistema-de-disputa.vercel.app", slug);
      expect(scan(text, true), slug).toBe(text);
    }
  });

  it("keeps the logo box small enough to stay inside the error-correction budget", () => {
    const qr = buildQr(url);
    const box = logoBox(qr.size);
    expect((box.side * box.side) / (qr.size * qr.size)).toBeLessThan(0.1);
  });

  it("builds a path with only dark modules", () => {
    const qr = buildQr("https://exemplo.com");
    expect(qr.path.startsWith("M")).toBe(true);
    expect(qr.path.endsWith("z")).toBe(true);
  });
});
