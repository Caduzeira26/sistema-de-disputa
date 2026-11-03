import { describe, expect, it } from "vitest";
import jsQR from "jsqr";
import { buildQr, QUIET_ZONE } from "./qr";
import { buildPixPayload, crc16, pixKeyForBrCode } from "./brcode";

/** Reads the top-level TLV fields of an EMV payload. */
function parseTlv(payload: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let i = 0;
  while (i < payload.length) {
    const id = payload.slice(i, i + 2);
    const length = Number(payload.slice(i + 2, i + 4));
    fields[id] = payload.slice(i + 4, i + 4 + length);
    i += 4 + length;
  }
  return fields;
}

describe("crc16", () => {
  it("matches the standard CRC-16/CCITT-FALSE check value", () => {
    expect(crc16("123456789")).toBe("29B1");
  });
});

describe("pixKeyForBrCode", () => {
  it("adds +55 to a mobile phone typed in any format", () => {
    expect(pixKeyForBrCode("43996386452")).toBe("+5543996386452");
    expect(pixKeyForBrCode("(43) 99638-6452")).toBe("+5543996386452");
    expect(pixKeyForBrCode("+55 43 99638-6452")).toBe("+5543996386452");
    expect(pixKeyForBrCode("5543996386452")).toBe("+5543996386452");
  });

  it("keeps a valid CPF as digits", () => {
    expect(pixKeyForBrCode("529.982.247-25")).toBe("52998224725");
  });

  it("keeps a CNPJ as digits", () => {
    expect(pixKeyForBrCode("11.222.333/0001-81")).toBe("11222333000181");
  });

  it("lowercases e-mails and random keys", () => {
    expect(pixKeyForBrCode(" Maria@Exemplo.com ")).toBe("maria@exemplo.com");
    expect(pixKeyForBrCode("123E4567-E89B-12D3-A456-426614174000")).toBe("123e4567-e89b-12d3-a456-426614174000");
  });
});

describe("buildPixPayload", () => {
  const payload = buildPixPayload({ key: "43996386452", holder: "João da Silva", amountCents: 2000 });
  const fields = parseTlv(payload);

  it("has the mandatory fields", () => {
    expect(fields["00"]).toBe("01");
    expect(fields["52"]).toBe("0000");
    expect(fields["53"]).toBe("986");
    expect(fields["58"]).toBe("BR");
  });

  it("carries the PIX key (as +55 phone) under the BCB account", () => {
    const account = parseTlv(fields["26"]);
    expect(account["00"]).toBe("br.gov.bcb.pix");
    expect(account["01"]).toBe("+5543996386452");
  });

  it("carries the amount with two decimals", () => {
    expect(fields["54"]).toBe("20.00");
  });

  it("omits the amount when none is given", () => {
    expect(parseTlv(buildPixPayload({ key: "a@b.com" }))["54"]).toBeUndefined();
  });

  it("sanitizes the receiver name and falls back when empty", () => {
    expect(fields["59"]).toBe("JOAO DA SILVA");
    expect(parseTlv(buildPixPayload({ key: "a@b.com", holder: "" }))["59"]).toBe("RECEBEDOR");
    expect(parseTlv(buildPixPayload({ key: "a@b.com", holder: "x".repeat(60) }))["59"]).toHaveLength(25);
  });

  it("ends with a CRC that matches the rest of the payload", () => {
    const body = payload.slice(0, -4);
    expect(body.endsWith("6304")).toBe(true);
    expect(payload.slice(-4)).toBe(crc16(body));
  });

  it("scans back to the exact payload from the QR image", () => {
    const qr = buildQr(payload, "M");
    const scale = 8;
    const total = (qr.size + QUIET_ZONE * 2) * scale;
    const pixels = new Uint8ClampedArray(total * total * 4).fill(255);
    for (let y = 0; y < qr.size; y++) {
      for (let x = 0; x < qr.size; x++) {
        if (!qr.dark(x, y)) continue;
        for (let py = 0; py < scale; py++) {
          for (let px = 0; px < scale; px++) {
            const i = (((y + QUIET_ZONE) * scale + py) * total + (x + QUIET_ZONE) * scale + px) * 4;
            pixels[i] = pixels[i + 1] = pixels[i + 2] = 0;
          }
        }
      }
    }
    expect(jsQR(pixels, total, total)?.data).toBe(payload);
  });
});
