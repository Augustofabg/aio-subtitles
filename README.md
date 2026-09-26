<div align="center">

<img src="src/web/public/assets/AIOsubs_logo_wordmark.png" width="220" height="220" alt="AIOSubs logo">

# AIOSubs

**Agregador universal de legendas para Stremio & Nuvio**

![My Skills](https://skillicons.dev/icons?i=ts,nodejs,js,html,css,docker)
[![Supabase](https://skillicons.dev/icons?i=supabase)](https://supabase.com/)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Render Deploy](https://img.shields.io/badge/deploy-Render-46E3B7.svg)](https://render.com/)

<p align="center">
    <a href="https://github.com/Augustofabg/aio-subtitles/actions/workflows/SEU_WORKFLOW.yml">
        <img src="https://img.shields.io/github/actions/workflow/status/Augustofabg/aio-subtitles/SEU_WORKFLOW.yml?style=for-the-badge&logo=github" alt="Build Status">
    </a>
   <a href="https://github.com/Augustofabg/aio-subtitles/releases/latest">
        <img src="https://img.shields.io/github/v/release/Augustofabg/aio-subtitles?style=for-the-badge&logo=github" alt="Latest Release">
    </a>
    <a href="https://github.com/Augustofabg/aio-subtitles/stargazers">
        <img src="https://img.shields.io/github/stars/Augustofabg/aio-subtitles?style=for-the-badge&logo=github" alt="GitHub Stars">
    </a>
    <a href="https://github.com/Augustofabg/aio-subtitles/network/members">
        <img src="https://img.shields.io/github/forks/Augustofabg/aio-subtitles?style=for-the-badge&logo=github" alt="GitHub Forks">
    </a>
</p>

</div>

<br>

Se você já usou Stremio ou Nuvio por muito tempo, conhece o problema: legendas espalhadas em addons diferentes, idiomas duplicados, abas "Unknown" quebradas e aquela sensação de nunca ter a legenda certa na hora certa.

O **AIOSubs** existe pra resolver exatamente isso. Não é só mais um addon de legendas — é um hub que **unifica, filtra, deduplica e sincroniza** legendas de várias fontes ao mesmo tempo, entregando tudo já limpo dentro do player.

A interface de configuração segue a estética dark com toques em roxo consagrada pelo **AIOStreams**. Se você já usa o AIOStreams, o fluxo vai parecer familiar.

<br>

## Índice

- [Funcionalidades](#-funcionalidades)
- [Como rodar](#-como-rodar)
- [Deploy no Render](#-deploy-no-render)
- [Variáveis de ambiente](#️-variáveis-de-ambiente)
- [Testes](#-testes)

<br>

## ✨ Funcionalidades

<table>
<tr>
<td width="50%" valign="top">

**🎨 Interface no estilo AIOStreams**
Tela inicial com dois caminhos: `Configure`, para começar do zero, ou `Dashboard`, para carregar uma configuração salva via UUID + senha. Um assistente em etapas guia todo o setup, sem poluição visual.

**⚡ Provedores nativos com validação em tempo real**
Suporte oficial a **OpenSubtitles.com** (API v1), **SubDL** e **Subsource**, cada um com campo próprio para a API key. A chave do OpenSubtitles é validada ao vivo (`✓ / ✗`), testando a conexão real com o serviço antes de prosseguir.

**🧩 Importação livre de addons**
Cole a URL de qualquer `manifest.json` de addon de legendas do Stremio e o AIOSubs importa automaticamente — detecta nome, ícone e valida se o addon realmente expõe o recurso `subtitles`. Cada um pode ser ativado/desativado individualmente, com opção de busca em paralelo entre todos.

</td>
<td width="50%" valign="top">

**🌐 Fim das legendas "Unknown"**
Whitelist de idiomas com bandeiras (🇧🇷 `pob`, 🇵🇹 `por`, 🇺🇸 `eng`...). Regras de remapeamento unificam variações regionais automaticamente (`pt-br` → `pob`, `pt` → `por`), e tudo é canonicalizado em **ISO 639-2** — sem abas quebradas no player.

**🧹 Deduplicação inteligente**
Compare por hash de conteúdo, similaridade fuzzy de release (85%+) ou os dois combinados. Depois, é só reordenar provedores e addons por prioridade, arrastando na lista.

**☁️ Persistência segura**
Configurações salvas no **Supabase**, com fallback para PostgreSQL tradicional ou um arquivo local em desenvolvimento. Senhas nunca ficam em texto puro — tudo passa por hash **bcrypt** antes de ser salvo.

</td>
</tr>
</table>

**📱 Instalação em segundos** — botões diretos para Stremio Desktop e Web, mais um QR Code gerado na hora pra instalar no Nuvio ou no Stremio mobile sem digitar nada.

---

## 🚀 Como rodar

### Localmente, com Node.js

Pré-requisitos: **Node.js 20+** e **Git**.

```bash
# Clone o repositório
git clone https://github.com/Augustofabg/aio-subtitles.git
cd aio-subtitles

# Instale as dependências
npm install

# (Opcional) configure as variáveis de ambiente
cp .env.example .env

# Compile o projeto
npm run build

# Modo desenvolvimento (com auto-reload)
npm run dev

# Ou produção
npm start
```

Endereços disponíveis após iniciar:

| Recurso | URL |
| :--- | :--- |
| 🛠️ Interface de configuração | `http://localhost:7000/configure` |
| 📄 Manifest padrão | `http://localhost:7000/manifest.json` |
| ❤️ Health check | `http://localhost:7000/health` |

### Com Docker

O repositório inclui um `Dockerfile` multi-stage baseado em Alpine, rodando com usuário não-privilegiado.

```bash
docker build -t aio-subtitles .

docker run -d \
  -p 7000:7000 \
  --name aio-subtitles \
  --restart unless-stopped \
  aio-subtitles
```

### Com Docker Compose

```bash
docker compose up -d

# Acompanhar os logs
docker compose logs -f
```

---

## 🌐 Deploy no Render

> [!TIP]
> **Por que o Render?**
> - 🔒 **HTTPS automático** — Stremio Web e apps modernos exigem conexão segura, e o Render entrega isso de graça.
> - 🟢 **Sempre online** — sem depender do seu computador ligado 24/7.
> - 🚪 **Zero configuração de rede** — nada de port forwarding, NAT ou DDNS.
> - 🔗 **Integração direta com Supabase** — configurações persistem entre deploys.
> - 🔄 **Deploy contínuo** — cada push na branch `main` sobe uma nova versão automaticamente.

**1. Crie o banco no Supabase**
1. Crie uma conta gratuita em [supabase.com](https://supabase.com/).
2. Crie um novo projeto (ex: `aiosubs-db`).
3. Em **Project Settings → API**, copie a **Project URL** e a **anon/service_role key**.

**2. Crie o serviço web no Render**
1. Crie uma conta em [render.com](https://render.com/).
2. No dashboard, clique em **New + → Web Service** e conecte o repositório `aio-subtitles` (branch `main`).
3. Preencha:

   | Campo | Valor |
   | :--- | :--- |
   | Name | `aio-subtitles` (ou o nome que preferir) |
   | Region | A mais próxima de você |
   | Branch | `main` |
   | Runtime | `Node` |
   | Build Command | `npm run render-build` |
   | Start Command | `npm start` |
   | Instance Type | `Free` |

**3. Configure as variáveis de ambiente**

| Variável | Valor | Descrição |
| :--- | :--- | :--- |
| `PORT` | `7000` | Porta interna do servidor |
| `NODE_ENV` | `production` | Ambiente de execução |
| `BASE_URL` | `https://seu-app.onrender.com` | URL pública gerada pelo Render |
| `SUPABASE_URL` | `https://xxxxxxxxxxxx.supabase.co` | URL do seu projeto Supabase |
| `SUPABASE_KEY` | `sua-chave-aqui` | Chave de API do Supabase |
| `CACHE_TTL_MINUTES` | `30` | Tempo de cache das buscas |

> [!NOTE]
> Quer oferecer chaves padrão para quem não quiser configurar as próprias? Adicione também `OPENSUBTITLES_API_KEY` e `SUBDL_API_KEY`.

**4. Deploy**
Clique em **Deploy Web Service** e aguarde o build finalizar — o log exibirá `🚀 AIOSubtitles Stremio Addon listening...`. Acesse a URL gerada em `/configure`, configure pela interface, copie o link ou escaneie o QR Code. Legendas prontas em qualquer lugar. 🎉

---

## ⚙️ Variáveis de ambiente

| Variável | Padrão | Descrição |
| :--- | :--- | :--- |
| `PORT` | `7000` | Porta onde o servidor HTTP escuta |
| `HOST` | `0.0.0.0` | Host de escuta de rede |
| `BASE_URL` | `""` | URL pública absoluta da aplicação |
| `SUPABASE_URL` | `""` | URL da instância do Supabase |
| `SUPABASE_KEY` | `""` | Chave pública/secreta da API do Supabase |
| `DATABASE_URL` | `""` | Connection string alternativa para PostgreSQL |
| `OPENSUBTITLES_API_KEY` | `""` | Fallback de chave do OpenSubtitles a nível de servidor |
| `SUBDL_API_KEY` | `""` | Fallback de chave do SubDL a nível de servidor |
| `CACHE_TTL_MINUTES` | `30` | Duração do cache LRU de resultados |
| `RATE_LIMIT_MAX` | `150` | Máximo de requisições por minuto |
| `NODE_ENV` | `development` | Ambiente de execução |

---

## 🧪 Testes

Suíte de testes cobrindo todo o pipeline, do provedor até a entrega final da legenda:

```bash
npm test                    # Roda tudo de uma vez

npm run test:providers      # Provedores nativos e normalização ISO 639-2
npm run test:formatter      # Formatação e limpeza para players (Nuvio)
npm run test:alignment      # Alinhamento/sincronização com fallback
npm run test:supabase       # Persistência em nuvem e segurança bcrypt
npm run test:validation     # Fluxo de interface e cabeçalhos OpenSubtitles
```

---

<div align="center">

Distribuído sob a licença [MIT](LICENSE) — feito para a comunidade Stremio & Nuvio.

</div>
