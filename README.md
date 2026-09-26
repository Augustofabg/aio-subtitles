# 🎬 AIO Subtitles — Universal Subtitle Aggregator for Stremio & Nuvio

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.7.0-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker Ready](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)

**AIO Subtitles** é um addon de alto desempenho para [Stremio](https://stremio.com) e [Nuvio](https://nuvioapp.com) focado EXCLUSIVAMENTE em **agregação, filtragem e organização de legendas**.

A interface segue de perto o padrão visual e de navegação consagrado pelo **AIOStreams** (tema escuro, sidebar fixa de ícones à esquerda, barra superior com indicador de *"Unsaved changes"*, botões de *Restore*, *Discard*, alternância de rascunhos, botões *Previous* / *Next* de wizard, e cards de serviços/addons com toggle, editar e excluir).

> [!NOTE]
> **Arquitetura Limpa e Estabilidade**: O addon devolve as legendas ao player diretamente com o `id` e `url` originais do provedor e o `lang` estritamente normalizado para o padrão ISO 639-2. Não há camadas frágeis de templates ou proxies de renomeação, garantindo total compatibilidade com todos os players (Stremio Desktop, Web, Android, Android TV e Nuvio) sem vazamento de base64 ou abas "Desconhecido".

---

## 🚀 Funcionalidades Principais

### 1. 🌐 Interface no Padrão AIOStreams
* **Sidebar Fixa:** Navegação lateral com ícones e tooltips para **Home**, **Services**, **Addons**, **Filters** e **Settings**.
* **Topbar de Ação Rápida:**
  * Indicador dinâmico de alterações: pill verde *"All changes saved"* ou pill pulsante âmbar *"Unsaved changes"*.
  * Botões **Restore** (reverte alterações para o último estado salvo) e **Discard** (redefine para as configurações padrão).
  * Toggle *"Don't keep drafts on this browser"* (armazena preferência no navegador).
  * Navegação de wizard com botões **Previous** e **Next**.
  * Botão de destaque **Save & Install** (com ícone de disquete).
  * Botões sociais **Donate** e **Sign Out**.

### 2. 🏠 Home (Branding da Instância)
* **Nome do Addon Editável:** Altere o nome exibido (ex.: `AIOSubtitles`) com edição inline via ícone de lápis.
* **Logo / Ícone Customizado:** URL de logo editável em tempo real.
* **Descrição Curta:** Descrição configurável inline (ex.: `Agregador e organizador de legendas`).
* **Versão:** Exibição da versão da instância (ex.: `v1.0.0`).
* **Your configuration:** Seção com estatísticas ativas e botões de ação rápida:
  * **Continue setup:** Avança para a página de Services no wizard.
  * **Save & Install:** Gera a manifest URL final e abre o modal de instalação.

### 3. ⚡ Services (Fontes Nativas de Legenda com API Keys)
Cada conector nativo possui seu próprio card com nome, badge de status e toggle on/off:
* **OpenSubtitles REST:** Badge `Requer API Key`. API oficial v1 com suporte a busca nativa por idioma e metadados detalhados. Inclui campo de input para a chave do usuário e botão **"Testar conexão"** com ping de validação em tempo real.
* **SubDL:** Badge `Público`. Banco de dados massivo com legendas em múltiplos idiomas e releases. Campo opcional para API key pessoal para limites maiores de requisições.
* **Subsource:** Badge `Público`. Comunidade colaborativa com legendas revisadas para filmes e séries.
* **Addic7ed:** Badge `Público`. Especializado em episódios e lançamentos rápidos de séries de TV.

### 4. 🧩 Addons (Importação Livre por Manifest URL & Marketplace)
* **Aba Installed:**
  * Campo de importação rápida: Cole a URL (`https://.../manifest.json` ou `stremio://...`) de qualquer addon de legendas. O backend valida a presença do recurso `subtitles` e lê automaticamente o `name`, `id` e `logo` do manifest.
  * Proteção de layout: A URL completa é truncada com reticências (`text-overflow: ellipsis`) e conta com botão dedicado de **"Copiar URL"**.
  * Lista agrupada na seção **LEGENDAS**, onde cada addon possui ícone, nome, toggle on/off, botão de configurações (engrenagem), editar (lápis) e excluir (lixeira).
  * Seletor de rodapé **Addon Fetching Strategy** (padrão: *Default* = busca paralela de todos os addons antes de retornar resultados).
* **Aba Marketplace:**
  * Catálogo integrado com 1-clique para adicionar os addons de legenda mais populares do ecossistema: OpenSubtitles v3, LegendasDivx.pt, Podnapisi, Titlovi.

### 5. 🎛️ Filters (Idiomas, Remapeamento, Deduplicação e Prioridade)
* **Idiomas Permitidos (Whitelist):** Seletor multi-select com busca e bandeiras emoji (ex: 🇧🇷 `pob`, 🇵🇹 `por`, 🇺🇸 `eng`). Descarta legendas em idiomas indesejados de todos os conectores.
* **Remapeamento de Código de Idioma:** Tabela visual "De &rarr; Para" editável (regras padrão: `por -> pob`, `pt-br -> pob`, `pt -> pob`, `pt-pt -> por`). Unifica legendas com códigos diferentes na **mesma aba/categoria do player**.
* **Prevenção do Idioma "Desconhecido":** Canonicalização estrita para ISO 639-2 antes de responder ao Stremio. Qualquer código inválido é descartado com log estruturado, impedindo que o player crie abas quebradas.
* **Deduplicação Inteligente:** Toggle on/off com seletor de estratégia:
  * *Ambos (Hash de Conteúdo + Similaridade de Release Fuzzy >85%)*
  * *Apenas Hash de Conteúdo e URL*
  * *Apenas Similaridade de Release (Fuzzy)*
* **Prioridade de Provedores e Addons:** Lista reordenável com botões de subir/descer prioridade, determinando a ordem de exibição final no player.
* **Timeout por Conector:** Slider configurável de 2000ms a 15000ms (padrão 6000ms) com display em tempo real.

### 6. 💾 Settings & Instalação
* Geração instantânea da URL do manifest com a configuração codificada em **Base64URL**:
  `https://SEU_DOMINIO/:config/manifest.json`
* Botão **"Instalar no Stremio"** com deep link `stremio://`.
* Modal **"Instalar no Nuvio (QR Code)"** gerando código QR legível na tela.
* Slider para ajuste do tempo de cache em memória (5 a 120 minutos, padrão 30 min).
* Ferramentas de **Backup e Restauração em JSON** para salvar ou importar suas configurações facilmente.

---

## 🛠️ Tecnologias

* **Runtime:** Node.js 20+ / 22+ / 24+
* **Linguagem:** TypeScript
* **Servidor HTTP:** Express + CORS + Express Rate Limit
* **Frontend SPA:** HTML5 + CSS3 (Design System escuro estilo AIOStreams) + JavaScript Moderno + QRCode.js
* **Cache:** `lru-cache` em memória

---

## 🚀 Como Executar

### 1. Execução Local

```bash
# Instalar dependências
npm install

# Rodar em modo de desenvolvimento com hot-reload
npm run dev

# Rodar a suíte de testes automatizados
npm test

# Compilar para produção
npm run build

# Iniciar servidor compilado
npm start
```

Acesse no navegador:
* **Interface de Configuração:** `http://localhost:7000/configure`
* **Manifest Padrão:** `http://localhost:7000/manifest.json`
* **Health Check:** `http://localhost:7000/health`

### 2. Execução com Docker

```bash
# Construir imagem Docker
docker build -t aio-subtitles .

# Executar contêiner na porta 7000
docker run -d -p 7000:7000 --name aio-subtitles aio-subtitles
```

### 3. Execução com Docker Compose

```bash
docker compose up -d
```

### 4. Deploy no Render / Plataformas Cloud (Persistência com PostgreSQL)

No Render (e plataformas como Neon, Supabase ou Railway), o sistema de arquivos padrão de contêineres é efémero (ephemeral). Para garantir que suas contas, UUIDs e configurações nunca sejam perdidos após reinicializações ou novos deploys:

1. No painel do Render, crie um **PostgreSQL** gerenciado gratuito (ou crie no **Neon** / **Supabase**).
2. Na sua aplicação Web Service no Render, configure a variável de ambiente:
   * `DATABASE_URL`: URL de conexão fornecida pelo PostgreSQL (ex: `postgres://user:password@host/dbname?sslmode=require`)
3. O AIOSubs detecta automaticamente o `DATABASE_URL`:
   * Cria a tabela `configurations` com colunas `uuid`, `password_hash` (bcrypt), `config_data` (JSONB) e timestamps.
   * Mantém um cache ultra-rápido em memória e sincronização assíncrona com o banco.
   * Migra automaticamente qualquer dado local existente sem perda.
4. Se `DATABASE_URL` não for definido (ex: desenvolvimento local), a aplicação usa automaticamente o armazenamento local em arquivo JSON (`./data/configurations.json`).

---

## 📄 Licença

Distribuído sob a licença [MIT](LICENSE).
