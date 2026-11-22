/**
 * Gravador dos vídeos tutoriais.
 *
 * Cada vídeo é um roteiro: uma lista de passos { fala, legenda, acao }. O gravador
 *  1. gera a narração (voz pt-BR do Windows) para todas as falas,
 *  2. grava a tela com o Chromium (cursor, destaques e legendas desenhados na página),
 *  3. espera cada fala terminar antes do passo seguinte,
 *  4. monta o MP4 final com o áudio posicionado em cada passo (ffmpeg).
 *
 * Para regravar depois de mudar o sistema: suba o build (`next start -p 3100`) e rode
 * o roteiro correspondente com `node videos/fonte/NN-nome.cjs`.
 */
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const VIDEOS = path.join(ROOT, "videos");
const TMP = path.join(VIDEOS, "tmp");
const BASE = process.env.BASE || "http://localhost:3100";
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PLAYWRIGHT = process.env.PLAYWRIGHT || "C:/Users/edu-m/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core";
const { chromium } = require(PLAYWRIGHT);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ----------------------------- narração ----------------------------- */

function wavSeconds(file) {
  const buf = fs.readFileSync(file);
  let offset = 12;
  let byteRate = 0;
  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === "fmt ") byteRate = buf.readUInt32LE(offset + 16);
    if (id === "data") return size / byteRate;
    offset += 8 + size + (size % 2);
  }
  throw new Error("WAV sem trecho de dados: " + file);
}

/** Gera um WAV por texto e devolve as durações em segundos. */
function sintetizar(textos, pasta, velocidade = 0) {
  fs.mkdirSync(pasta, { recursive: true });
  const itens = textos.map((texto, i) => ({ arquivo: path.join(pasta, `fala-${String(i).padStart(2, "0")}.wav`), texto }));
  const lista = path.join(pasta, "lista.json");
  fs.writeFileSync(lista, "\ufeff" + JSON.stringify(itens), "utf8");
  const r = spawnSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.join(__dirname, "voz.ps1"), "-Lista", lista, "-Velocidade", String(velocidade)], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("Falha ao gerar a voz: " + (r.stderr || r.stdout));
  return itens.map((it) => ({ arquivo: it.arquivo, segundos: wavSeconds(it.arquivo) }));
}

/* ------------------- camada visual dentro da página ------------------ */

const OVERLAY = `(() => {
  if (window.__tut) return;
  const KEY = "__tut_state";
  const saved = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || "{}"); } catch { return {}; } };
  const save = (patch) => { try { sessionStorage.setItem(KEY, JSON.stringify({ ...saved(), ...patch })); } catch {} };
  let root, capEl, txtEl, badgeEl, cursorEl, ringEl, ringTimer;

  function build() {
    if (root || !document.documentElement) return;
    const host = document.createElement("div");
    host.id = "__tut";
    host.style.cssText = "all:initial;position:fixed;inset:0;z-index:2147483647;pointer-events:none";
    root = host.attachShadow({ mode: "open" });
    root.innerHTML = \`<style>
      *{box-sizing:border-box}
      .cap{position:fixed;left:0;right:0;bottom:0;padding:58px 56px 20px;background:linear-gradient(to top,rgba(4,10,12,.96) 0%,rgba(4,10,12,.86) 55%,rgba(4,10,12,0) 100%);color:#eef6f4;font:700 23px/1.36 Manrope,system-ui,sans-serif;text-align:center;text-shadow:0 2px 12px #000;opacity:0;transition:opacity .25s}
      .cap.on{opacity:1}
      .badge{display:none;margin:0 auto 9px;width:fit-content;padding:6px 16px;border-radius:999px;background:linear-gradient(120deg,#35e0b0,#3fa9ff);color:#06110f;font:700 12px/1 'IBM Plex Mono',ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;box-shadow:0 8px 24px -8px rgba(53,224,176,.7);}
      .badge.on{display:block}
      .cursor{position:fixed;left:0;top:0;width:26px;height:26px;opacity:0;filter:drop-shadow(0 3px 5px rgba(0,0,0,.55))}
      .ripple{position:fixed;width:16px;height:16px;margin:-8px 0 0 -8px;border:3px solid #35e0b0;border-radius:50%;animation:rp .6s ease-out forwards}
      @keyframes rp{from{transform:scale(.4);opacity:1}to{transform:scale(3.6);opacity:0}}
      .ring{position:fixed;border:3px solid #35e0b0;border-radius:12px;box-shadow:0 0 0 6px rgba(53,224,176,.22),0 0 34px rgba(53,224,176,.55);opacity:0;transition:opacity .2s;animation:pl 1s ease-in-out infinite}
      .ring.on{opacity:1}
      @keyframes pl{50%{box-shadow:0 0 0 12px rgba(53,224,176,.12),0 0 44px rgba(63,169,255,.6)}}
    </style>
    <div class="ring"></div>
    <svg class="cursor" viewBox="0 0 24 24"><path d="M3 2l17 8.2-7.3 2.1L9.8 20z" fill="#fff" stroke="#0a1113" stroke-width="1.6" stroke-linejoin="round"/></svg>
    <div class="cap"><div class="badge"></div><div class="txt"></div></div>\`;
    capEl = root.querySelector(".cap");
    txtEl = root.querySelector(".txt");
    badgeEl = root.querySelector(".badge");
    cursorEl = root.querySelector(".cursor");
    ringEl = root.querySelector(".ring");
    document.documentElement.appendChild(host);
    const s = saved();
    if (s.cap) { txtEl.textContent = s.cap; capEl.classList.add("on"); }
    if (s.badge) { badgeEl.textContent = s.badge; badgeEl.classList.add("on"); }
    if (s.x != null) { cursorEl.style.transform = "translate(" + s.x + "px," + s.y + "px)"; cursorEl.style.opacity = "1"; }
  }

  addEventListener("mousemove", (e) => {
    build();
    if (!cursorEl) return;
    cursorEl.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)";
    cursorEl.style.opacity = "1";
    save({ x: e.clientX, y: e.clientY });
  }, true);
  addEventListener("mousedown", (e) => {
    build();
    if (!root) return;
    const r = document.createElement("div");
    r.className = "ripple";
    r.style.left = e.clientX + "px";
    r.style.top = e.clientY + "px";
    root.appendChild(r);
    setTimeout(() => r.remove(), 700);
  }, true);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(build, 50));
  else setTimeout(build, 50);

  window.__tut = {
    caption(text, badge) {
      build();
      save({ cap: text || "", badge: badge || "" });
      if (!capEl) return;
      txtEl.textContent = text || "";
      capEl.classList.toggle("on", !!text);
      badgeEl.textContent = badge || "";
      badgeEl.classList.toggle("on", !!badge);
    },
    ring(box, ms) {
      build();
      if (!ringEl) return;
      const pad = 8;
      ringEl.style.left = box.x - pad + "px";
      ringEl.style.top = box.y - pad + "px";
      ringEl.style.width = box.width + pad * 2 + "px";
      ringEl.style.height = box.height + pad * 2 + "px";
      ringEl.classList.add("on");
      clearTimeout(ringTimer);
      ringTimer = setTimeout(() => ringEl.classList.remove("on"), ms);
    },
  };
})();`;

/* --------------------------- cartões de texto ------------------------ */

function cartaHtml({ etiqueta, titulo, subtitulo, logo }) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
  html,body{margin:0;height:100%;background:#0a1113;color:#eef6f4;font-family:Manrope,system-ui,sans-serif}
  body{display:flex;align-items:center;justify-content:center;text-align:center;
    background:radial-gradient(900px 500px at 85% -10%,rgba(63,169,255,.22),transparent 60%),radial-gradient(700px 420px at -5% 0%,rgba(53,224,176,.2),transparent 60%),#0a1113}
  .box{max-width:980px;padding:0 40px}
  img{width:80px;height:80px;margin-bottom:22px}
  .tag{font:600 14px 'IBM Plex Mono',ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:#35e0b0}
  h1{margin:16px 0 0;font:700 46px/1.12 'Unbounded',system-ui,sans-serif;letter-spacing:-.01em}
  h1 span{background:linear-gradient(120deg,#35e0b0,#3fa9ff);-webkit-background-clip:text;color:transparent}
  p{margin:18px 0 0;font-size:20px;color:#9db3b0}
  </style></head><body><div class="box">${logo ? `<img src="${logo}" alt="">` : ""}<div class="tag">${etiqueta}</div><h1>${titulo}</h1>${subtitulo ? `<p>${subtitulo}</p>` : ""}</div></body></html>`;
}

/* ------------------------------ gravação ----------------------------- */

function auxiliares(page) {
  const ajudantes = {
    sleep: (ms) => page.waitForTimeout(ms),
    async espera() {
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(1000);
    },
    async mover(loc) {
      await loc.scrollIntoViewIfNeeded();
      const b = await loc.boundingBox();
      if (!b) throw new Error("Elemento sem posição na tela");
      await page.mouse.move(b.x + b.width / 2, b.y + Math.min(b.height / 2, 24), { steps: 28 });
      return b;
    },
    async destacar(loc, ms = 1800) {
      await loc.scrollIntoViewIfNeeded();
      const b = await loc.boundingBox();
      if (b) await page.evaluate(([box, t]) => window.__tut && window.__tut.ring(box, t), [b, ms]);
      return b;
    },
    async clicar(loc, { depois = 800 } = {}) {
      await ajudantes.mover(loc);
      await ajudantes.destacar(loc, 1000);
      await page.waitForTimeout(450);
      await loc.click();
      await page.waitForTimeout(depois);
    },
    async digitar(loc, texto, { atraso = 60 } = {}) {
      await ajudantes.mover(loc);
      await loc.click();
      await loc.pressSequentially(texto, { delay: atraso });
      await page.waitForTimeout(350);
    },
    async rolar(px, passos = 14) {
      for (let i = 0; i < passos; i++) {
        await page.mouse.wheel(0, px / passos);
        await page.waitForTimeout(30);
      }
    },
  };
  return ajudantes;
}

/** Deixa a voz num volume confortável (-16 LUFS, padrão das plataformas), sem recodificar a imagem. */
function normalizarVolume(arquivo) {
  const tmp = arquivo.replace(/.mp4$/, ".norm.mp4");
  const r = spawnSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", arquivo, "-c:v", "copy", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", tmp], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("loudnorm falhou: " + r.stderr);
  fs.renameSync(tmp, arquivo);
}

/** Descobre quando a imagem muda pela primeira vez (usado para alinhar áudio e vídeo). */
function primeiraMudancaDeCena(video) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-i", video, "-vf", "select='gt(scene,0.15)',showinfo", "-an", "-f", "null", "-"], { encoding: "utf8" });
  const m = /pts_time:([0-9.]+)/.exec(r.stderr || "");
  return m ? parseFloat(m[1]) : null;
}

/**
 * @param {object} opcoes
 * @param {string} opcoes.nome        arquivo de saída (sem extensão), ex.: "01-criando-a-conta"
 * @param {string} opcoes.titulo      título do cartão de abertura (HTML permitido)
 * @param {string} opcoes.etiqueta    texto pequeno acima do título
 * @param {string} opcoes.abertura    fala da abertura
 * @param {string} opcoes.encerramento fala do encerramento
 * @param {string} opcoes.proximo     texto do cartão final
 * @param {Array}  opcoes.passos      [{ fala, legenda, etiqueta?, acao(ajudantes, page) }]
 * @param {string} [opcoes.estado]    storageState (usuário já logado)
 * @param {string} [opcoes.inicio]    caminho em que a gravação começa (padrão "/")
 */
async function gravar(opcoes) {
  const pasta = path.join(TMP, opcoes.nome);
  fs.rmSync(pasta, { recursive: true, force: true });
  fs.mkdirSync(pasta, { recursive: true });

  const textos = [opcoes.abertura, ...opcoes.passos.map((p) => p.fala), opcoes.encerramento];
  console.log(`[${opcoes.nome}] gerando a voz (${textos.length} falas)...`);
  const vozes = sintetizar(textos, path.join(pasta, "voz"), opcoes.velocidade ?? 0);

  const logo = "data:image/png;base64," + fs.readFileSync(path.join(ROOT, "public", "digitamoney-icon-v2.png")).toString("base64");
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const contexto = await browser.newContext({
    viewport: { width: 1024, height: 576 },
    recordVideo: { dir: path.join(pasta, "raw"), size: { width: 1024, height: 576 } },
    storageState: opcoes.estado || undefined,
    locale: "pt-BR",
    deviceScaleFactor: 1,
  });
  await contexto.addInitScript(OVERLAY);
  const erros = [];
  const t0 = Date.now();
  const page = await contexto.newPage();
  page.on("pageerror", (e) => erros.push("pageerror: " + e.message));
  page.on("console", (m) => m.type() === "error" && erros.push("console: " + m.text().slice(0, 200)));
  const aux = auxiliares(page);

  const marcas = []; // { arquivo, inicioMs }
  const agora = () => Date.now() - t0;
  async function falar(indice, extra = 0) {
    marcas.push({ arquivo: vozes[indice].arquivo, inicioMs: agora() });
    return Math.round(vozes[indice].segundos * 1000) + extra;
  }

  // 1) cartão de abertura
  await page.setContent(cartaHtml({ etiqueta: opcoes.etiqueta, titulo: opcoes.titulo, subtitulo: opcoes.subtitulo, logo }));
  await page.waitForTimeout(500);
  await sleep(await falar(0, 700));

  // clarão em degradê: transição visual e, ao mesmo tempo, o marcador que alinha áudio e vídeo
  const marcaClaraoMs = agora();
  await page.setContent('<body style="margin:0;height:100vh;background:linear-gradient(120deg,#35e0b0,#3fa9ff)"></body>');
  await page.waitForTimeout(450);

  // 2) passos
  await page.goto(BASE + (opcoes.inicio || "/"));
  await aux.espera();
  for (let i = 0; i < opcoes.passos.length; i++) {
    const passo = opcoes.passos[i];
    await page.evaluate(([t, b]) => window.__tut && window.__tut.caption(t, b), [passo.legenda || "", passo.etiqueta || ""]).catch(() => {});
    const duracao = await falar(i + 1);
    const inicio = Date.now();
    await passo.acao(aux, page);
    // re-aplica a legenda caso a página tenha navegado durante a ação
    await page.evaluate(([t, b]) => window.__tut && window.__tut.caption(t, b), [passo.legenda || "", passo.etiqueta || ""]).catch(() => {});
    const faltando = duracao - (Date.now() - inicio);
    if (faltando > 0) await sleep(faltando);
    await sleep(550);
  }

  // 3) encerramento
  await page.evaluate(() => window.__tut && window.__tut.caption("", "")).catch(() => {});
  await page.setContent(cartaHtml({ etiqueta: opcoes.etiquetaFim || "Até o próximo vídeo", titulo: opcoes.proximo, subtitulo: "Sistema de Disputa · Digita Money", logo }));
  await page.waitForTimeout(400);
  await sleep(await falar(vozes.length - 1, 900));

  await contexto.close();
  const bruto = fs.readdirSync(path.join(pasta, "raw")).map((f) => path.join(pasta, "raw", f))[0];
  await browser.close();

  // 4) alinha o áudio com o vídeo e monta o MP4
  const mudanca = primeiraMudancaDeCena(bruto);
  let deslocamento = mudanca == null ? 0 : mudanca * 1000 - marcaClaraoMs;
  if (Math.abs(deslocamento) > 3000) {
    console.log(`[${opcoes.nome}] AVISO: marcador de sincronia fora do esperado (${Math.round(deslocamento)} ms); usando 0`);
    deslocamento = 0;
  }
  console.log(`[${opcoes.nome}] ajuste de sincronia: ${Math.round(deslocamento)} ms`);
  const entradas = ["-i", bruto];
  const filtros = [];
  marcas.forEach((m, i) => {
    entradas.push("-i", m.arquivo);
    const atraso = Math.max(0, Math.round(m.inicioMs + deslocamento));
    filtros.push(`[${i + 1}:a]adelay=${atraso}|${atraso}[a${i}]`);
  });
  filtros.push("[0:v]scale=1280:720:flags=lanczos,setsar=1[vout]");
  filtros.push(`${marcas.map((_, i) => `[a${i}]`).join("")}amix=inputs=${marcas.length}:normalize=0:dropout_transition=0[aout]`);
  const saida = path.join(VIDEOS, opcoes.nome + ".mp4");
  const r = spawnSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...entradas, "-filter_complex", filtros.join(";"), "-map", "[vout]", "-map", "[aout]", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", "30", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", saida], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("ffmpeg falhou: " + r.stderr);
  normalizarVolume(saida);
  const dur = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", saida], { encoding: "utf8" }).stdout.trim();
  console.log(`[${opcoes.nome}] pronto: ${saida} (${Math.round(parseFloat(dur))}s)`);
  if (erros.length) console.log(`[${opcoes.nome}] avisos do navegador:\n  - ` + [...new Set(erros)].slice(0, 6).join("\n  - "));
  return saida;
}

module.exports = { gravar, BASE, ROOT, VIDEOS, TMP, CHROME, PLAYWRIGHT, sleep };
