# Vídeos de ajuda do Sistema de Disputa

Série de 5 vídeos passo a passo (mais 2 extras: planos e pagamento, e Kings League), para quem nunca usou o sistema. Narração em português do Brasil
(voz masculina "Lax Whisper", do ElevenLabs, a mesma do canal Terço dos Homens) e legendas na tela, gravados numa cópia de teste do sistema
com um campeonato de exemplo ("Copa Digita Money de Futsal").

| Arquivo | Assunto | Duração |
|---|---|---|
| `01-criando-a-conta.mp4` | Criar a conta, conhecer o painel, trocar a senha | ~2 min |
| `02-primeiro-campeonato.mp4` | Criar o campeonato e abrir as inscrições | ~2,5 min |
| `03-inscricoes.mp4` | Ficha de inscrição, aprovar equipes, cartaz com QR Code | ~2 min |
| `04-sorteio.mp4` | Potes, sorteio ao vivo e chaveamento | ~2 min |
| `05-resultados.mp4` | Lançar placares, campeão, página pública e estatísticas | ~2,5 min |
| `06-planos-e-pagamento.mp4` | Os planos (Grátis, Start, Pro, Liga, Corporativo) e como pagar | ~4 min |
| `07-kings-league.mp4` | Campeonato Kings League: súmula, cartas, shootouts, classificação e playoffs | ~4 min |

Os `.mp4` não vão para o git (são grandes). O que vai são os roteiros, em `fonte/`.

## Como regravar (depois de mudar alguma tela do sistema)

1. Gere o build e suba o servidor de gravação (usa o banco configurado em `.env`):
   ```
   npx next build
   AUTH_TRUST_HOST=true npx next start -p 3100
   ```
2. Em outro terminal, rode o roteiro que quer refazer, por exemplo:
   ```
   node videos/fonte/04-sorteio.cjs
   ```
   Cada roteiro cria o organizador e o campeonato de demonstração, grava, monta o MP4 em `videos/`
   e a limpeza dos dados de demonstração é feita por `limpar()` em `fonte/demo.cjs`
   (rode `node -e "require('./videos/fonte/demo.cjs').limpar().then(()=>process.exit())"` ao terminar).

O vídeo 6 (planos e pagamento) precisa também do Asaas de mentira, para não cobrar ninguém: rode
`node videos/fonte/fake-asaas.mjs` (servidor local na porta 4010 que imita a API do Asaas) e suba o servidor
de gravação com `ASAAS_API_KEY=test-key ASAAS_API_URL=http://localhost:4010/v3 ASAAS_WEBHOOK_TOKEN=<32+ caracteres>`.
O roteiro simula o pagamento por esse servidor falso (`ASAAS_FALSO` muda o endereço).

**Voz:** o padrão é a voz do Windows ("Microsoft Maria"). Para usar a Lax Whisper, rode com `VOZ=elevenlabs` e deixe a chave em
`videos/fonte/.env.local` (`ELEVENLABS_API_KEY=...`, arquivo ignorado pelo git). Cada texto fica em cache em `videos/tmp/cache-voz`,
então regravar sem mudar a fala não gasta crédito; só texto novo é cobrado (~9 mil caracteres para os 6 vídeos).

**Voz Antônio (gratuita, neural):** `python videos/fonte/voz-edge.py videos/tmp/NOME/voz/lista.json` gera as falas com a voz
`pt-BR-AntonioNeural` do Microsoft Edge (a mesma preparada para o Terço dos Homens), sem gastar crédito. O vídeo 7 usa essa voz;
depois é só rodar o `trocar-voz.py` abaixo.

**Trocar só a voz, sem regravar a tela:** `python videos/fonte/trocar-voz.py NOME` (por exemplo `01-criando-a-conta`) usa o vídeo
original guardado em `videos/tmp/antigos/NOME.mp4` e as falas novas geradas em `videos/tmp/NOME/voz` (uma gravação com `VOZ=elevenlabs`
cria esses arquivos). O script acha o instante exato de cada fala original por correlação e coloca a voz nova no mesmo ponto;
a imagem não é recodificada. A voz nova é mais rápida, então é desacelerada até 0,85x para acompanhar a tela.

Requisitos: Chrome instalado, `ffmpeg` no PATH, a voz pt-BR do Windows e o `playwright-core`
(caminho em `PLAYWRIGHT`, veja `fonte/lib.cjs`; também dá para apontar `CHROME` e `BASE`).

## Como o roteiro funciona

Cada passo tem `fala` (narração), `legenda` (texto na tela), `etiqueta` (nome do passo) e `acao`
(o que acontece na tela). O gravador gera a voz de todas as falas, grava a tela com cursor e
destaques, espera cada fala terminar antes do passo seguinte, alinha o áudio com o vídeo por um
clarão em degradê e normaliza o volume (-16 LUFS).
