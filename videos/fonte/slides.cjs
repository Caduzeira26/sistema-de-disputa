/**
 * Slides para os vídeos explicativos (sem tela do sistema). Cada slide é uma página HTML servida
 * localmente durante a gravação (page.route), no visual do Sistema de Disputa. A parte de baixo
 * fica livre para a legenda do vídeo.
 */
const fs = require("node:fs");
const path = require("node:path");

const LOGO = "data:image/png;base64," + fs.readFileSync(path.resolve(__dirname, "..", "..", "public", "digitamoney-icon-v2.png")).toString("base64");

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * @param {object} s
 * @param {string} s.tag        etiqueta pequena (ex.: "Kings League · Tempo")
 * @param {string} s.titulo     título (pode ter <span> para o degradê)
 * @param {string} [s.sub]      linha de apoio
 * @param {Array}  [s.itens]    [{ icone, titulo, texto }]
 * @param {number} [s.colunas]  colunas dos cartões (padrão 2)
 * @param {string} [s.grande]   número ou palavra em destaque (ex.: "20 + 16")
 * @param {Array}  [s.linha]    linha do tempo: [{ quando, oque }]
 */
function slideHtml(s) {
  const cols = s.colunas || 2;
  const cartoes = (s.itens || [])
    .map(
      (it, i) => `<div class="card" style="animation-delay:${0.12 + i * 0.09}s">
        <div class="ic">${it.icone || "•"}</div>
        <div><div class="ct">${it.titulo ? esc(it.titulo) : ""}</div>${it.texto ? `<div class="cx">${esc(it.texto)}</div>` : ""}</div>
      </div>`
    )
    .join("");
  const linha = (s.linha || [])
    .map(
      (l, i) => `<div class="tl" style="animation-delay:${0.12 + i * 0.09}s"><div class="tq">${esc(l.quando)}</div><div class="to">${esc(l.oque)}</div></div>`
    )
    .join("");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@600;800&family=Manrope:wght@500;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0}
body{width:100vw;height:100vh;overflow:hidden;background:radial-gradient(1200px 600px at 85% -10%,rgba(63,169,255,.22),transparent 60%),radial-gradient(900px 500px at -10% 110%,rgba(53,224,176,.18),transparent 60%),#071012;color:#eef6f4;font-family:Manrope,system-ui,sans-serif;padding:44px 64px 150px}
.top{display:flex;align-items:center;gap:14px}
.top img{width:44px;height:44px;border-radius:12px}
.tag{padding:7px 16px;border-radius:999px;background:linear-gradient(120deg,#35e0b0,#3fa9ff);color:#06110f;font:700 14px/1 'IBM Plex Mono',ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase}
h1{margin-top:26px;font:800 50px/1.08 Unbounded,sans-serif;letter-spacing:-.01em;animation:up .5s ease both}
h1 span{background:linear-gradient(120deg,#35e0b0,#3fa9ff);-webkit-background-clip:text;color:transparent}
.sub{margin-top:14px;font-size:24px;color:#9db3b0;max-width:1050px;animation:up .5s .06s ease both}
.grande{margin-top:22px;font:800 92px/1 Unbounded,sans-serif;background:linear-gradient(120deg,#35e0b0,#3fa9ff);-webkit-background-clip:text;color:transparent;animation:up .5s .1s ease both}
.grid{margin-top:28px;display:grid;grid-template-columns:repeat(${cols},1fr);gap:16px}
.card{display:flex;gap:16px;align-items:flex-start;padding:18px 20px;border-radius:18px;background:rgba(255,255,255,.045);border:1px solid rgba(157,179,176,.18);animation:up .45s ease both}
.ic{font-size:34px;line-height:1;min-width:40px;text-align:center}
.ct{font:700 23px/1.2 Manrope,sans-serif}
.cx{margin-top:6px;font-size:19px;line-height:1.35;color:#b7c9c6}
.tls{margin-top:28px;display:flex;flex-direction:column;gap:10px}
.tl{display:flex;gap:18px;align-items:baseline;animation:up .45s ease both}
.tq{min-width:150px;font:800 24px/1 Unbounded,sans-serif;color:#35e0b0}
.to{font-size:22px;color:#dce8e6}
@keyframes up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
</style></head><body>
<div class="top"><img src="${LOGO}" alt=""><div class="tag">${esc(s.tag)}</div></div>
<h1>${s.titulo}</h1>
${s.sub ? `<div class="sub">${esc(s.sub)}</div>` : ""}
${s.grande ? `<div class="grande">${esc(s.grande)}</div>` : ""}
${linha ? `<div class="tls">${linha}</div>` : ""}
${cartoes ? `<div class="grid">${cartoes}</div>` : ""}
</body></html>`;
}

/** Registra os slides em BASE/__slides/N e devolve o caminho de cada um. */
async function servirSlides(page, slides) {
  await page.route("**/__slides/*", async (route) => {
    const n = Number(route.request().url().split("/").pop());
    await route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: slideHtml(slides[n]) });
  });
}

/** Transforma uma lista de slides com fala/legenda em passos do gravador. */
function passosDeSlides(slides, BASE) {
  return slides.map((s, i) => ({
    etiqueta: s.etiqueta || s.tag,
    legenda: s.legenda,
    fala: s.fala,
    acao: async (a, page) => {
      await page.goto(`${BASE}/__slides/${i}`);
      await page.waitForLoadState("networkidle").catch(() => {});
      await a.sleep(600);
    },
  }));
}

module.exports = { slideHtml, servirSlides, passosDeSlides };
