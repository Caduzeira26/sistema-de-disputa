# Gera um WAV por frase com a voz pt-BR do Windows.
# Uso: powershell -File voz.ps1 -Lista lista.json   (lista.json = [{ "arquivo": "...wav", "texto": "..." }, ...])
param([string]$Lista, [int]$Velocidade = 0)

Add-Type -AssemblyName System.Speech
$voz = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voz.SelectVoice("Microsoft Maria Desktop")
$voz.Rate = $Velocidade
$voz.Volume = 100

$itens = Get-Content -Raw -Encoding UTF8 $Lista | ConvertFrom-Json
foreach ($item in $itens) {
  $voz.SetOutputToWaveFile($item.arquivo)
  $voz.Speak($item.texto)
}
$voz.SetOutputToNull()
$voz.Dispose()
