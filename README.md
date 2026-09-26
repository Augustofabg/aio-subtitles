# 🎬 AIOSubs (AIO Subtitles) — Universal Subtitle Aggregator for Stremio & Nuvio

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.7.0-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker Ready](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)
[![Render Deploy](https://img.shields.io/badge/deploy-Render-46E3B7.svg)](https://render.com/)
[![Supabase Powered](https://img.shields.io/badge/database-Supabase-3ECF8E.svg)](https://supabase.com/)

**AIOSubs** é um agregador de legendas de alta performance para o [Stremio](https://stremio.com) e [Nuvio](https://nuvioapp.com), focado exclusivamente em **unificar, filtrar, organizar, sincronizar e deduplicar legendas** de múltiplas fontes em uma experiência fluida, sem falhas e visualmente impecável.

A interface gráfica de configuração adota a estética moderna dark com detalhes em roxo consagrada pelo **AIOStreams**, oferecendo total controle sobre quais provedores utilizar, idiomas aceitos, regras de remapeamento e formatação visual.

---

## 🌟 Funcionalidades e Destaques

### 1. 🎨 Interface Moderna no Estilo AIOStreams
- **Tela Inicial (Home) Descomplicada**:
  - `[ Configure ]`: Inicia imediatamente um fluxo de configuração limpo e novo.
  - `[ Dashboard ]`: Ponto de acesso exclusivo para carregar e autenticar configurações salvas via **UUID + Senha**.
- **Topbar Minimalista**:
  - Navegação do assistente com botões `[ Previous ]` e `[ Next ]` alinhados à direita.
  - Cabeçalho limpo, sem poluição de badges ou atalhos redundantes.
- **Sidebar de Navegação**:
  - Acesso rápido a todas as etapas do assistente: **Home** (Branding), **Services** (Provedores Nativos), **Addons** (Importação Livre), **Languages** (Idiomas), **Filters** (Deduplicação & Prioridade), **Formatting** (Aparência), **Alignment** (Sincronização) e **Install** (Painel de Instalação).

### 2. ⚡ Provedores Nativos com Validação em Tempo Real
- **OpenSubtitles.com (API REST v1 Oficial)**:
  - Totalmente compatível com o endpoint v1 oficial (`https://api.opensubtitles.com/api/v1`).
  - Cabeçalhos de requisição obrigatórios (`Api-Key`, `User-Agent: AIOSubs v1.0.0` e `Content-Type: application/json`).
  - **Validação de API Key em Tempo Real**: Indicador animado posicionado no input antes do botão de visibilidade (`[✓ / ✗] [👁]`) com teste direto em `/api/v1/infos/user`.
  - Proxy de download seguro com conversão e entrega em UTF-8.
- **SubDL**:
  - Banco de dados abrangente de legendas em múltiplos idiomas e releases, com campo para API Key pessoal.
- **Subsource**:
  - Comunidade colaborativa de legendas com suporte a autenticação por chave de API.

### 3. 🧩 Importação Livre de Addons de Legendas (Stremio Manifests)
- **Importação por URL**: Adicione qualquer addon de legendas do Stremio colando a URL do seu `manifest.json` (ex: `https://.../manifest.json` ou `stremio://...`).
- O sistema valida automaticamente se o addon provê o recurso `subtitles`, extrai metadados (`name`, `logo`, `id`) e permite ativá-lo ou desativá-lo individualmente.
- **Addon Fetching Strategy**: Opção de busca em paralelo de todos os addons antes de exibir os resultados consolidados.

### 4. 🌐 Gestão Avançada de Idiomas & Prevenção de "Desconhecido"
- **Whitelist de Idiomas**: Filtre estritamente quais idiomas devem ser exibidos no player através de tags interativas com bandeiras (ex.: 🇧🇷 `pob`, 🇵🇹 `por`, 🇺🇸 `eng`, 🇪🇸 `spa`).
- **Remapeamento de Código de Idioma**: Unifique variações regionais na mesma aba do player (regras padrão: `por -> pob`, `pt-br -> pob`, `pt -> pob`, `pt-pt -> por`).
- **Prevenção da Categoria "Desconhecido"**: Todas as legendas são canonicalizadas para o padrão oficial **ISO 639-2**. Códigos inválidos ou vazios são descartados, evitando abas quebradas no Stremio.

### 5. 🧹 Deduplicação Inteligente & Prioridade
- **Eliminação de Legendas Repetidas**:
  - *Ambos* (Combinação de Hash de Conteúdo + Similaridade Fuzzy de Release > 85%).
  - *Apenas Hash de Conteúdo e URL*.
  - *Apenas Similaridade de Release (Fuzzy)*.
- **Lista de Prioridade Reordenável**: Arraste ou suba/desça provedores e addons para definir quais legendas aparecem primeiro no player.

### 6. 🏷️ Formatador Visual de Legendas (Formatter)
- **Preset Clean / Default (Recomendado para Nuvio & Stremio)**: Remove campos poluídos de descrição e metadados técnicos secundários, mantendo a listagem do player limpa e elegante.
- **Preset Detailed**: Inclui tags ricas com formato, FPS e provider name, aproveitando as diretrizes da PR #947 do Stremio.
- **Preset Custom**: Crie seu próprio padrão de texto usando variáveis dinâmicas:
  - `{addon.name}`, `{sub.lang}`, `{sub.filename}`, `{sub.fps}`, `{sub.format}`, `{sub.delay}`.

### 7. ⏱️ Sincronização Automática (Auto-Alignment)
- Integração modular preparada para alinhamento automático de áudio e legenda (`alass`, `ffsubsync`, `ffmpeg`).
- Sistema resiliente com cache em memória e em disco (`AlignmentCacheManager`) e **fallback automático seguro**: caso as ferramentas de alinhamento não estejam instaladas ou ocorra timeout, a legenda original é entregue instantaneamente sem travar a reprodução.

### 8. ☁️ Persistência em Nuvem com Criptografia
- **Camada Primária (Supabase)**: Armazenamento instantâneo na nuvem na tabela `users_config`.
- **Camada Secundária (PostgreSQL)**: Suporte a bancos relacionais padrão via `DATABASE_URL`.
- **Fallback Local**: Armazenamento em `./data/configurations.json` para desenvolvimento offline.
- **Segurança**: Senhas de configuração são salvas exclusivamente em formato de hash criptográfico via **bcrypt**.

### 9. 📱 Instalação Descomplicada & QR Code Mobile
- Botão direto para instalação no **Stremio Desktop** via protocolo `stremio://`.
- Link direto para instalação no **Stremio Web**.
- Gerador de **QR Code** integrado na tela para instalação imediata no **Nuvio** ou no Stremio para Android / iOS.

---

## 🚀 Como Executar

### Opção 1: Execução Local com NPM

#### Pré-requisitos:
- [Node.js](https://nodejs.org/) versão 20.x ou superior.
- Git instalado.

#### Passos:
```bash
# 1. Clone o repositório
git clone https://github.com/Augustofabg/aio-subtitles.git
cd aio-subtitles

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente (opcional para rodar local)
cp .env.example .env

# 4. Compile o TypeScript e copie os assets
npm run build

# 5. Inicie em modo de desenvolvimento (com auto-reload)
npm run dev

# Ou inicie a versão de produção compilada
npm start
```

Após iniciar, acesse no navegador:
- **Interface de Configuração**: [http://localhost:7000/configure](http://localhost:7000/configure)
- **Manifest Padrão**: [http://localhost:7000/manifest.json](http://localhost:7000/manifest.json)
- **Health Check**: [http://localhost:7000/health](http://localhost:7000/health)

---

### Opção 2: Execução com Docker

O projeto possui um `Dockerfile` multi-stage otimizado baseado em Alpine Linux com usuário não-privilegiado para maior segurança:

```bash
# Construir a imagem Docker
docker build -t aio-subtitles .

# Executar o contêiner mapeando a porta 7000
docker run -d \
  -p 7000:7000 \
  --name aio-subtitles \
  --restart unless-stopped \
  aio-subtitles
```

### Opção 3: Execução com Docker Compose

Você pode subir toda a aplicação com um único comando:

```bash
docker compose up -d
```

Para visualizar os logs:
```bash
docker compose logs -f
```

---

## 🌐 Melhor Forma de Rodar Fora de Casa: Deploy no Render.com (Recomendado)

> [!TIP]
> **Por que o Render é a melhor opção para rodar o AIOSubs fora de casa?**
> 1. **HTTPS / SSL Automático e Obrigatório**: O Stremio Web e os aplicativos modernos de streaming recusam conexões HTTP não-seguras. No Render, seu addon ganha um domínio HTTPS público gratuito (ex: `https://seu-addon.onrender.com`).
> 2. **Sempre Ativo (24/7)**: Você não precisa deixar seu computador ligado nem se preocupar com quedas de energia.
> 3. **Sem Abrir Portas no Roteador**: Elimina a necessidade de Port Forwarding, NAT ou DDNS na sua rede doméstica.
> 4. **Integração Perfeita com Supabase**: Suas configurações e senhas ficam salvas com segurança no banco em nuvem, persistindo entre reinicializações e novos deploys.
> 5. **Deploy Contínuo via GitHub**: Sempre que você atualizar a branch `main`, o Render reconstrói e publica a nova versão automaticamente.

### 📋 Passo a Passo para Hospedar no Render Gratuitamente

#### Passo 1: Criar o Banco de Dados no Supabase
1. Acesse o [Supabase](https://supabase.com/) e crie uma conta gratuita.
2. Crie um novo projeto (ex.: `aiosubs-db`).
3. No painel do projeto, acesse **Project Settings** > **API**.
4. Copie os valores de:
   - **Project URL** (ex.: `https://xxxxxxxxxxxx.supabase.co`)
   - **anon / public key** ou **service_role key** (chave secreta)

#### Passo 2: Criar o Serviço Web no Render
1. Crie uma conta no [Render](https://render.com/).
2. No [Dashboard do Render](https://dashboard.render.com/), clique no botão **New +** e selecione **Web Service**.
3. Conecte sua conta do GitHub e selecione o repositório **aio-subtitles** (branch: `main`).
4. Preencha as configurações do serviço:
   - **Name**: `aio-subtitles` (ou o nome de sua preferência)
   - **Region**: Escolha a região mais próxima de você (ex.: *Ohio (US East)* ou *Frankfurt (EU)*)
   - **Branch**: `main`
   - **Root Directory**: Deixe em branco
   - **Runtime**: `Node`
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

#### Passo 3: Configurar as Variáveis de Ambiente no Render
Na seção **Environment Variables** do Render, adicione as seguintes chaves:

| Variável | Valor | Descrição |
| :--- | :--- | :--- |
| `PORT` | `7000` | Porta interna do servidor |
| `NODE_ENV` | `production` | Modo de produção do Node.js |
| `BASE_URL` | `https://seu-nome-de-app.onrender.com` | URL pública fornecida pelo Render para o seu serviço |
| `SUPABASE_URL` | `https://xxxxxxxxxxxx.supabase.co` | URL do seu projeto no Supabase |
| `SUPABASE_KEY` | `sua-chave-aqui` | Chave de API do Supabase (anon ou service_role) |
| `CACHE_TTL_MINUTES` | `30` | Tempo de cache em memória das buscas |

> [!NOTE]
> *(Opcional)* Se desejar fornecer chaves padrão do servidor para usuários que não queiram registrar as suas próprias, adicione também `OPENSUBTITLES_API_KEY` e `SUBDL_API_KEY`.

#### Passo 4: Concluir o Deploy e Usar
1. Clique em **Deploy Web Service**.
2. Aguarde o término do build (o log exibirá `🚀 AIOSubtitles Stremio Addon listening...`).
3. Clique na URL gerada no topo do painel do Render (ex.: `https://aio-subtitles.onrender.com/configure`).
4. Pronto! Configure seu addon pela interface web, copie o link final ou leia o QR Code e aproveite suas legendas em qualquer lugar!

---

## ⚙️ Variáveis de Ambiente (.env)

| Variável | Padrão | Descrição |
| :--- | :--- | :--- |
| `PORT` | `7000` | Porta onde o servidor HTTP escuta |
| `HOST` | `0.0.0.0` | Host de escuta de rede |
| `BASE_URL` | `""` | URL pública absoluta da aplicação (ex: `https://subs.meudominio.com`) |
| `SUPABASE_URL` | `""` | URL da instância do Supabase para persistência |
| `SUPABASE_KEY` | `""` | Chave pública/secreta da API do Supabase |
| `DATABASE_URL` | `""` | Connection string alternativa para PostgreSQL tradicional |
| `OPENSUBTITLES_API_KEY` | `""` | Fallback de chave do OpenSubtitles v1 a nível de servidor |
| `SUBDL_API_KEY` | `""` | Fallback de chave do SubDL a nível de servidor |
| `CACHE_TTL_MINUTES` | `30` | Duração do cache LRU de resultados de busca |
| `RATE_LIMIT_MAX` | `150` | Máximo de requisições por janela de rate-limit (1 min) |
| `NODE_ENV` | `development` | Ambiente de execução (`development` ou `production`) |

---

## 🧪 Suíte de Testes Automatizados

O projeto conta com testes unitários e de integração abrangentes que cobrem o pipeline completo:

```bash
# Rodar todos os testes de uma vez
npm test

# Testes de validação de provedores nativos e normalização ISO 639-2
npm run test:providers

# Testes do formatador e supressão de poluição em players (Nuvio)
npm run test:formatter

# Testes do mecanismo de alinhamento e sincronização com fallback
npm run test:alignment

# Testes de persistência em nuvem com Supabase e segurança bcrypt
npm run test:supabase

# Testes de fluxo de interface, cabeçalhos OpenSubtitles e limpeza de topbar
npm run test:validation
```

---

## 📄 Licença

Distribuído sob a licença [MIT](LICENSE). Desenvolvido para a comunidade Stremio & Nuvio.
