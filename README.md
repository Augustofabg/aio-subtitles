# 🎬 AIO Subtitles — Universal Subtitle Aggregator for Stremio & Nuvio

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.7.0-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker Ready](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)

**AIO Subtitles** é um addon de alto desempenho e dedicado EXCLUSIVAMENTE à **agregação, filtragem, normalização e personalização de legendas** para [Stremio](https://stremio.com) e [Nuvio](https://nuvioapp.com).

Ele foi projetado especificamente para superar as deficiências conhecidas no manuseio de legendas dos addons tradicionais (como o AIOStreams), oferecendo controle cirúrgico sobre idiomas, unificação de abas no player e templates visuais ricos.

---

## 🚀 Problemas Resolvidos & Funcionalidades

### 1. 🛡️ Filtragem Rígida por Whitelist (Adeus às 40 línguas do OpenSubtitles v3)
* **O Problema:** O endpoint oficial do OpenSubtitles v3 não aceita parâmetros de idioma na URL e devolve todas as legendas existentes em dezenas de línguas indesejadas (russo, árabe, polonês, etc.).
* **Nossa Solução:** O AIO Subtitles recebe as legendas brutas de todas as fontes e aplica um filtro rigoroso de **Whitelist** definido pelo usuário (ex: apenas `pob`, `por`, `eng`), descartando imediatamente qualquer idioma que não pertença à sua lista.

### 2. 📑 Remapeamento de Códigos de Idioma (Fim das Abas Duplicadas no Player)
* **O Problema:** No player do Stremio, as legendas são agrupadas em abas com base estrita no código ISO (`lang`). Quando uma fonte envia `por` e outra envia `pob` (ou `pt-BR`), o player cria duas abas de Português separadas.
* **Nossa Solução:** Motor visual de **Remapeamento de Código** (De &rarr; Para). Regras configuráveis como `por -> pob`, `pt-br -> pob`, `pt -> pob` são aplicadas **antes** de responder ao Stremio, garantindo que todas as legendas em português caiam na **mesma aba**!

### 3. 🏷️ Personalização de Rótulo / Nome de Arquivo (Template Engine)
* **O Problema:** O protocolo de legendas do Stremio não possui campo de descrição em duas linhas (ao contrário das streams de vídeo).
* **Nossa Solução:** Template configurável com interpolação de variáveis:
  * `{provider}`: Nome do provedor (ex: `OpenSubtitles`, `SubDL`, `Subsource`)
  * `{lang_flag}`: Bandeira emoji do idioma (ex: 🇧🇷, 🇵🇹, 🇺🇸, 🇪🇸)
  * `{lang}`: Código do idioma (ex: `POB`, `ENG`)
  * `{release}`: Nome da release ou equipe (ex: `1080p.BluRay.x264-SPARKS`)
  * `{hi}`: Indicador de acessibilidade (`[CC]` para Hearing Impaired / Closed Caption)
  * `{format}`: Formato do arquivo (`SRT`, `VTT`)
  * `{fps}`: Taxa de quadros quando disponível (ex: `23.976fps`)
  * *Template Padrão:* `[{provider}] {lang_flag} {release} {hi}`

### 4. 🔀 Subtitle Proxy com Injeção de Nome de Arquivo & Correção de UTF-8
* Quando ativado, as URLs de legenda são roteadas pelo endpoint `/proxy/subtitle/:data`.
* **Benefícios:**
  1. Injeta o cabeçalho `Content-Disposition: inline; filename="[OpenSubtitles] 🇧🇷 Release [CC].srt"` (para players móveis e externos que exibem o nome do arquivo).
  2. Corrige automaticamente a codificação de caracteres Windows-1252 / ISO-8859-1 para **UTF-8**, eliminando símbolos corrompidos como `` em acentos (`ç`, `ã`, `é`).
  3. Descompacta arquivos ZIP automaticamente (comum no SubDL e Subsource), servindo o arquivo `.srt` direto ao player.
  4. Adiciona cabeçalhos CORS completos (`Access-Control-Allow-Origin: *`).

### 5. ⚡ Múltiplos Conectores Paralelos Plugáveis
O addon executa todas as fontes em paralelo com `Promise.allSettled` e timeout individual configurável (2000 a 15000ms):
* **OpenSubtitles REST API (v1):** Utiliza chave de API pessoal, aceita filtro nativo por idioma e retorna metadados ricos (downloads, FPS, rating).
* **SubDL:** Catálogo abrangente com suporte a filmes e séries de TV.
* **OpenSubtitles v3:** Catálogo oficial integrado via Stremio, filtrado a posteriori.
* **Subsource:** Repositório colaborativo de legendas atualizadas.
* **Addic7ed:** Especializado em episódios e temporadas de séries de TV.
* **Interface `SubtitleProvider` Extensível:** Permite plugar novas fontes em 1 único arquivo TypeScript.

### 6. 🌐 Suporte a QUALQUER Addon via Manifest URL (Importação Livre)
Diferente de agregadores fechados que só permitem fontes pré-integradas, o **AIO Subtitles** permite colar o link de manifest (`https://.../manifest.json` ou `stremio://...`) de **qualquer addon de legendas do ecossistema Stremio** (como Titlovi, Legendas.net, etc.):
* **Validação em tempo real:** O backend valida se o manifest declara o recurso `subtitles` e extrai o nome oficial do addon.
* **Mesmo Pipeline:** O addon externo entra no mesmo pipeline dos provedores nativos: timeout configurável, whitelist de idiomas, remapeamento de código (`por -> pob`), deduplicação e rótulos personalizados.
* **Sem limite:** Adicione quantos addons externos desejar e ordene sua prioridade na interface.

### 6.1 🛡️ Prevenção Rigorosa do Bug do "Desconhecido"
Identificamos e eliminamos a causa raiz de um bug comum em outros agregadores, onde legendas de addons importados aparecem todas com o rótulo genérico *"Desconhecido"*:
* **Propagação Obrigatória de `providerName`:** Todo conector (nativo ou importado) associa um `providerName` fixo e não-vazio derivado do manifest oficial a cada legenda normalizada.
* **Fallback Inteligente:** O formatador de template `{provider}` nunca cai em "Desconhecido", priorizando: `providerName` &rarr; `provider` &rarr; `manifest.name` &rarr; `AIOSubtitles`.
* **Teste Automatizado Obrigatório:** Inclui suite de testes (`npm test`) que valida que nenhum conector configurado ou mock retorna `null`, vazio ou a string literal "Desconhecido".
* **Confirmação Visual na UI:** A interface de configuração exibe a tag `Lido do Manifest: [Nome]` ao lado de cada addon importado para validação imediata do usuário.

### 7. 🧹 Deduplicação Inteligente & Priorização
* **Deduplicação:** Detecta legendas repetidas do mesmo release usando análise fuzzy (>85% de similaridade) e mesmo idioma/HI.
* **Priorização:** Arraste ou reordene seus provedores favoritos no topo da lista.

### 8. 🔒 Zero Dependência de Banco de Dados
* Configuração do usuário inteiramente codificada em **Base64URL** e embutida na própria URL do manifest:
  `https://seu-dominio.com/:config/manifest.json`
* A mesma URL pode ser aberta a qualquer momento em `/:config/configure` para editar suas preferências!

---

## 🛠️ Tecnologias Utilizadas

* **Runtime:** Node.js (v20+ / v22+ / v24+)
* **Linguagem:** TypeScript
* **Servidor HTTP:** Express + CORS + Express Rate Limit
* **Cache em Memória:** `lru-cache` com TTL configurável (default 30 min)
* **Processamento de Legendas:** `iconv-lite` (UTF-8 normalizer) + `adm-zip` (auto-unzip)
* **Frontend SPA:** HTML5 + Vanilla CSS (Glassmorphism & Dark Mode) + QRCode.js

---

## 📁 Estrutura do Projeto

```
/
├── src/
│   ├── config/
│   │   ├── env.ts              # Carregamento de variáveis de ambiente
│   │   └── userConfig.ts       # Parser, defaults e codec Base64URL
│   ├── types/
│   │   ├── stremio.ts          # Interfaces do protocolo Stremio
│   │   ├── config.ts           # Schema de configurações do usuário
│   │   └── provider.ts         # Interfaces de SubtitleProvider e itens de legenda
│   ├── utils/
│   │   ├── languages.ts        # Base de dados ISO 639-1/2/3, nomes e bandeiras
│   │   ├── normalizer.ts       # Validador de whitelist e remapeador de códigos
│   │   ├── template.ts         # Motor de interpolação de rótulo e preview
│   │   ├── deduplicator.ts     # Deduplicação fuzzy e ordenação por prioridade
│   │   ├── cache.ts            # LRU Cache com chaveamento composto
│   │   └── logger.ts           # Logs estruturados com métricas por provedor
│   ├── providers/
│   │   ├── base.ts             # Classe abstrata com controle de timeout e métricas
│   │   ├── openSubtitlesRest.ts# Provedor REST v1 com filtro nativo
│   │   ├── subdl.ts            # Provedor SubDL com suporte a filmes e séries
│   │   ├── openSubtitlesV3.ts  # Provedor OpenSubtitles v3 com filtro pós-resposta
│   │   ├── subsource.ts        # Provedor Subsource
│   │   ├── addic7ed.ts         # Provedor Addic7ed para séries
│   │   └── index.ts            # Registro e executor concorrente (allSettled)
│   ├── core/
│   │   └── aggregator.ts       # Pipeline mestre de agregação
│   ├── proxy/
│   │   └── subtitleProxy.ts    # Streaming, extração de ZIP e injeção de headers
│   ├── web/
│   │   └── public/             # SPA de Configuração
│   │       ├── index.html      # Interface responsiva
│   │       ├── style.css       # Estilos modernos em Dark Mode e Glassmorphism
│   │       └── app.js          # Lógica reativa, live preview e QR code
│   ├── server.ts               # Servidor Express e roteamento dos endpoints
│   └── index.ts                # Ponto de entrada
├── scripts/
│   └── copy-assets.js          # Script cross-platform para empacotar a UI no build
├── Dockerfile                  # Multi-stage build para produção
├── docker-compose.yml          # Orquestração de contêiner
├── .env.example                # Modelo de variáveis de ambiente
├── package.json
└── tsconfig.json
```

---

## 💻 Instalação & Execução Local

### Pré-requisitos
* Node.js v20+ ou superior
* npm (ou pnpm / yarn)

### 1. Clonar e Instalar Dependências
```bash
git clone https://github.com/Augustofabg/Mihon_Fork_Test.git aio-subtitles
cd aio-subtitles
npm install
```

### 2. Configurar Variáveis de Ambiente (Opcional)
Copie o arquivo de exemplo:
```bash
cp .env.example .env
```
Campos disponíveis:
* `PORT`: Porta do servidor (padrão: `7000`)
* `HOST`: Host de bind (padrão: `0.0.0.0`)
* `BASE_URL`: URL pública caso use domínio reverso (ex: `https://subtitles.seudominio.com`)
* `OPENSUBTITLES_API_KEY`: Chave global de fallback para o OpenSubtitles REST
* `SUBDL_API_KEY`: Chave global de fallback para o SubDL

### 3. Modo de Desenvolvimento
Inicie com recarregamento a quente via `tsx`:
```bash
npm run dev
```

### 4. Compilar e Rodar em Produção
```bash
npm run build
npm start
```
O servidor estará disponível em:
* **Interface de Configuração:** `http://localhost:7000/configure`
* **Manifest Padrão:** `http://localhost:7000/manifest.json`
* **Healthcheck:** `http://localhost:7000/health`

---

## 🐳 Deploy com Docker & Docker Compose

### Usando Docker Compose (Recomendado)
```bash
docker compose up -d --build
```
Para ver os logs estruturados:
```bash
docker compose logs -f aio-subtitles
```

### Usando Docker CLI Manual
```bash
# Construir a imagem
docker build -t aio-subtitles .

# Executar o container
docker run -d \
  --name aio-subtitles \
  -p 7000:7000 \
  --restart unless-stopped \
  aio-subtitles
```

---

## 🌐 Deploy em Nuvem (Render, Railway, Fly.io, HuggingFace)

Como o addon utiliza **configuração em Base64URL embutida no path**, ele é **100% stateless** e não requer banco de dados!

1. Conecte o repositório no seu provedor de preferência.
2. Defina o comando de build: `npm ci && npm run build`
3. Defina o comando de início: `npm start`
4. Configure a variável `PORT` (fornecida automaticamente na maioria dos PaaS) e `BASE_URL` para o seu domínio público com HTTPS.

---

## 🖥️ Como Utilizar a Interface `/configure`

Acesse `http://localhost:7000/configure` (ou seu domínio) no navegador:

1. **Fontes de Legenda Nativas:**
   * Ative ou desative os conectores desejados (OpenSubtitles v3, REST, SubDL, Subsource, Addic7ed).
   * Se possuir conta no OpenSubtitles.com, insira sua `API Key` (opcional).
2. **Addons Externos (Importação Livre por URL):**
   * Cole a URL do `manifest.json` (ou `stremio://`) de qualquer addon de legendas.
   * O sistema valida se o addon fornece legendas, exibe o nome oficial verificado do manifest e o integra ao pipeline.
3. **Filtragem de Idiomas (Whitelist):**
   * Selecione seus idiomas permitidos (ex: Português do Brasil e Inglês).
   * Utilize os atalhos rápidos (`🇧🇷 PT-BR + 🇺🇸 EN`). Qualquer legenda fora desses idiomas será sumariamente ignorada.
4. **Remapeamento de Códigos:**
   * Configure regras como `por -> pob`, `pt-br -> pob`. O addon converterá qualquer código antes de entregar ao Stremio, unificando a aba de exibição.
5. **Template de Rótulo:**
   * Personalize com variáveis como `[{provider}] {lang_flag} {release} {hi}`.
   * Visualize a simulação instantânea no mockup do player Stremio ao lado (o `{provider}` nunca fica como "Desconhecido").
6. **Proxy de Legendas:**
   * Deixe marcado para injeção de nome no `Content-Disposition`, descompactação de ZIP e correção UTF-8.
7. **Prioridade e Timeout:**
   * Reordene a prioridade dos provedores e addons importados clicando nas setas.
   * Ajuste o timeout por provedor (padrão: 6000ms).
8. **Instalação:**
   * Clique em **Gerar & Atualizar Manifest**.
   * Copie a URL gerada, ou clique em **Instalar no Stremio** (aciona o protocolo `stremio://`), ou escaneie o **QR Code** no aplicativo Nuvio / Stremio Mobile!

---

## 📡 Endpoints da API Stremio

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/manifest.json` | Manifest padrão do addon |
| `GET` | `/:config/manifest.json` | Manifest dinâmico com as preferências do usuário |
| `GET` | `/:config/subtitles/:type/:id.json` | Consulta de legendas (filmes ou séries sem episódio) |
| `GET` | `/:config/subtitles/:type/:id/:extra.json` | Consulta de legendas completas (séries `tt0903747:1:1`, etc.) |
| `GET` | `/configure` | SPA visual de configuração |
| `GET` | `/:config/configure` | Abre a SPA já preenchida com a configuração existente |
| `GET` | `/proxy/subtitle/:data` | Proxy com UTF-8 fix, auto-unzip e `Content-Disposition` |
| `GET` | `/health` | Checagem de integridade, uptime e tamanho do cache |

---

## 📄 Licença
Distribuído sob a licença [MIT](LICENSE).
