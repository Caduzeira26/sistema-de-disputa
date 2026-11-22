"""
Troca só a voz de um vídeo já gravado, sem regravar a tela.

Uso: python trocar-voz.py NOME   (NOME = 01-criando-a-conta, por exemplo)

Precisa de:
  videos/tmp/antigos/NOME.mp4        o vídeo original (tela + voz do Windows)
  videos/tmp/NOME/voz/lista.json     as falas (texto) e os WAV da voz nova (gerados por VOZ=elevenlabs)
Como funciona:
  1. regera a voz original do Windows (de graça) e localiza cada fala dentro do áudio do vídeo original
     por correlação cruzada, o que dá o instante exato em que cada fala começa;
  2. coloca a fala da voz nova nesse mesmo instante (se a nova for mais curta, é levemente desacelerada,
     no máximo até 0,85x, para acompanhar o ritmo da tela);
  3. normaliza o volume (-16 LUFS) e troca só o áudio do vídeo (a imagem não é recodificada).
"""
import json, subprocess, sys, os, tempfile
import numpy as np
from scipy.signal import fftconvolve

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
VIDEOS = os.path.join(RAIZ, "videos")
FONTE = os.path.join(VIDEOS, "fonte")
SR8 = 8000
SR = 44100
LIMITE_LENTO = 0.85


def ffmpeg_pcm(args, sr):
    """Decodifica qualquer entrada para float32 mono na taxa pedida."""
    r = subprocess.run(["ffmpeg", "-v", "error", *args, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"], capture_output=True)
    if r.returncode:
        raise SystemExit(r.stderr.decode(errors="replace"))
    return np.frombuffer(r.stdout, dtype=np.float32).copy()


def localizar(audio, trecho):
    """Instante (em amostras) em que `trecho` começa dentro de `audio` (correlação normalizada)."""
    n = len(trecho)
    trecho = trecho - trecho.mean()
    corr = fftconvolve(audio, trecho[::-1], mode="valid")
    a = audio.astype(np.float64)
    c1 = np.concatenate([[0.0], np.cumsum(a)])
    c2 = np.concatenate([[0.0], np.cumsum(a * a)])
    soma = c1[n:] - c1[:-n]
    energia = c2[n:] - c2[:-n]
    var = np.maximum(energia - soma**2 / n, 1e-9)
    score = corr / np.sqrt(var * (trecho.astype(np.float64) ** 2).sum())
    i = int(np.argmax(score))
    return i, float(score[i])


def main(nome):
    pasta = os.path.join(VIDEOS, "tmp", nome)
    original = os.path.join(VIDEOS, "tmp", "antigos", nome + ".mp4")
    saida = os.path.join(VIDEOS, nome + ".mp4")
    lista = json.load(open(os.path.join(pasta, "voz", "lista.json"), encoding="utf-8-sig"))

    # 1) voz antiga regerada (determinística) só para achar os instantes
    pmaria = os.path.join(VIDEOS, "tmp", "maria", nome)
    os.makedirs(pmaria, exist_ok=True)
    lm = [{"arquivo": os.path.join(pmaria, f"fala-{i:02d}.wav"), "texto": it["texto"]} for i, it in enumerate(lista)]
    arq_lista = os.path.join(pmaria, "lista.json")
    with open(arq_lista, "w", encoding="utf-8-sig") as f:
        json.dump(lm, f, ensure_ascii=False)
    r = subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", os.path.join(FONTE, "voz.ps1"), "-Lista", arq_lista, "-Velocidade", "0"], capture_output=True, text=True)
    if r.returncode:
        raise SystemExit("voz antiga falhou: " + r.stderr)

    audio = ffmpeg_pcm(["-i", original, "-vn"], SR8)
    dur_video = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", original], capture_output=True, text=True).stdout)

    # 2) onde cada fala antiga começa
    inicios, duracoes_m = [], []
    for i, it in enumerate(lm):
        m = ffmpeg_pcm(["-i", it["arquivo"]], SR8)
        pos, score = localizar(audio, m)
        inicios.append(pos / SR8)
        duracoes_m.append(len(m) / SR8)
        print(f"  fala {i:02d}: começa em {pos / SR8:7.2f}s  dura {len(m) / SR8:5.1f}s  (certeza {score:.2f})")
        if score < 0.3:
            raise SystemExit(f"fala {i}: correlação baixa ({score:.2f}); abortei para não desalinhar")
    if any(b <= a for a, b in zip(inicios, inicios[1:])):
        raise SystemExit("ordem das falas inconsistente; abortei")

    # 3) monta a trilha nova
    total = int((dur_video + 1) * SR)
    trilha = np.zeros(total, dtype=np.float32)
    for i, it in enumerate(lista):
        nova = ffmpeg_pcm(["-i", it["arquivo"]], SR)
        dm = duracoes_m[i]
        dn = len(nova) / SR
        if dn < dm * LIMITE_LENTO or dn < dm:
            tempo = max(dn / dm, LIMITE_LENTO)
            if tempo < 0.999:
                with tempfile.TemporaryDirectory() as t:
                    tmp_in = os.path.join(t, "a.wav")
                    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", it["arquivo"], "-af", f"atempo={tempo:.4f}", "-ar", str(SR), "-ac", "1", tmp_in], check=True)
                    nova = ffmpeg_pcm(["-i", tmp_in], SR)
        ini = int(inicios[i] * SR)
        fim = min(ini + len(nova), total)
        trilha[ini:fim] += nova[: fim - ini]
        proxima = inicios[i + 1] if i + 1 < len(inicios) else dur_video
        print(f"  fala {i:02d}: voz nova {len(nova) / SR:5.1f}s no espaço de {proxima - inicios[i]:5.1f}s")
        if len(nova) / SR > proxima - inicios[i] + 0.2:
            print("   AVISO: a fala nova passa do espaço disponível")

    with tempfile.TemporaryDirectory() as t:
        bruto = os.path.join(t, "trilha.f32")
        trilha.tofile(bruto)
        r = subprocess.run([
            "ffmpeg", "-v", "error", "-y",
            "-i", original,
            "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", bruto,
            "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy",
            "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", saida,
        ], capture_output=True, text=True)
        if r.returncode:
            raise SystemExit("mux falhou: " + r.stderr)
    print("pronto:", saida)


if __name__ == "__main__":
    main(sys.argv[1])
