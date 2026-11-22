/**
 * Gera um WAV por frase com a voz do ElevenLabs (a mesma do canal Terço dos Homens: "Lax Whisper").
 *
 * Uso: node voz-elevenlabs.cjs lista.json   (lista.json = [{ "arquivo": "...wav", "texto": "..." }, ...])
 *
 * A chave vem de ELEVENLABS_API_KEY (variável de ambiente) ou do arquivo videos/fonte/.env.local
 * (ignorado pelo git). Cada texto fica em cache em videos/tmp/cache-voz, então regravar um vídeo
 * sem mudar a fala não gasta crédito de novo.
 */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

function lerChave() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim();
  const arquivo = path.join(__dirname, ".env.local");
  if (!fs.existsSync(arquivo)) return null;
  for (const linha of fs.readFileSync(arquivo, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*ELEVENLABS_API_KEY\s*=\s*(.+?)\s*$/);
    if (m) return m[1].replace(/^["']|["']$/g, "");
  }
  return null;
}

const CHAVE = lerChave();
const VOZ = (process.env.ELEVENLABS_VOICE_ID || "EeTjZnu1OfgjhGKT6ywY").trim(); // Lax Whisper
const MODELO = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";
const VELOCIDADE = Number(process.env.ELEVENLABS_SPEED || 1); // no canal é 0,9; em tutorial 1,0 fica mais natural
const CACHE = path.resolve(__dirname, "..", "tmp", "cache-voz");

async function sintetizar(texto, mp3) {
  const corpo = {
    text: texto,
    model_id: MODELO,
    language_code: "pt",
    voice_settings: { stability: 0.6, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true, speed: VELOCIDADE },
  };
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOZ}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": CHAVE, "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  if (!r.ok) throw new Error(`ElevenLabs recusou (${r.status}): ${(await r.text()).slice(0, 400)}`);
  fs.writeFileSync(mp3, Buffer.from(await r.arrayBuffer()));
}

(async () => {
  if (!CHAVE) {
    console.error("Sem chave do ElevenLabs: defina ELEVENLABS_API_KEY ou crie videos/fonte/.env.local");
    process.exit(2);
  }
  const itens = JSON.parse(fs.readFileSync(process.argv[2], "utf8").replace(/^﻿/, ""));
  fs.mkdirSync(CACHE, { recursive: true });
  let gastos = 0;
  for (const item of itens) {
    const id = crypto.createHash("sha1").update(`${item.texto}|${VOZ}|${MODELO}|${VELOCIDADE}`).digest("hex").slice(0, 16);
    const mp3 = path.join(CACHE, `${id}.mp3`);
    if (!fs.existsSync(mp3)) {
      await sintetizar(item.texto, mp3);
      gastos += item.texto.length;
    }
    const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", mp3, "-ar", "44100", "-ac", "1", "-sample_fmt", "s16", item.arquivo], { encoding: "utf8" });
    if (r.status !== 0) throw new Error("ffmpeg falhou: " + r.stderr);
  }
  console.log(`voz pronta (${itens.length} falas, ${gastos} caracteres novos enviados ao ElevenLabs)`);
})().catch((e) => {
  console.error(String(e.message || e));
  process.exit(1);
});
