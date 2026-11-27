"""
Gera um WAV por frase com a voz neural "Antônio" do Microsoft Edge (gratuita; a mesma preparada
para o Terço dos Homens). Menos robótica que a voz do Windows e sem gastar crédito.

Uso: python voz-edge.py lista.json   (lista.json = [{ "arquivo": "...wav", "texto": "..." }, ...])
Variáveis opcionais: EDGE_VOICE (padrão pt-BR-AntonioNeural), EDGE_RATE (padrão +0%), EDGE_PITCH (padrão +0Hz).
Precisa de internet (o Edge TTS é um serviço da Microsoft).
"""
import asyncio
import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path

import edge_tts

VOICE = os.getenv("EDGE_VOICE", "pt-BR-AntonioNeural")
RATE = os.getenv("EDGE_RATE", "+0%")
PITCH = os.getenv("EDGE_PITCH", "+0Hz")
CACHE = Path(__file__).resolve().parent.parent / "tmp" / "cache-voz-edge"


async def main(lista: str) -> None:
    itens = json.loads(Path(lista).read_text(encoding="utf-8-sig"))
    CACHE.mkdir(parents=True, exist_ok=True)
    for item in itens:
        chave = hashlib.sha1(f"{item['texto']}|{VOICE}|{RATE}|{PITCH}".encode()).hexdigest()[:16]
        mp3 = CACHE / f"{chave}.mp3"
        if not mp3.exists():
            await edge_tts.Communicate(item["texto"], VOICE, rate=RATE, pitch=PITCH).save(str(mp3))
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(mp3), "-ar", "44100", "-ac", "1", "-sample_fmt", "s16", item["arquivo"]],
            check=True,
        )
    print(f"voz pronta ({len(itens)} falas, {VOICE})")


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1]))
