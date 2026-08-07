# Propriedade Inteligente

Aplicativo de controle de propriedades rurais — **Projeto Integrador II (IFC Concórdia, 2026)**.

Stack: **React 19 + Vite 8 + Cordova 13 + Firebase 10 + cordova-sqlite-storage 7**.

---

## Pré-requisitos

- **Node.js 18+** (Vite 8 não roda em versões anteriores)
- **JDK 17** (somente para build Android)
- **Android SDK + Gradle** (somente para build Android)
- **Firebase CLI** (`npm i -g firebase-tools`) — para publicar as regras de segurança do Firestore
- Conta Firebase (Auth + Firestore) — qualquer projeto gratuito serve

---

## Setup rápido

```bash
# 1. Variáveis de ambiente
cp .env.example .env
# Editar .env e preencher as 6 vars VITE_FIREBASE_*
# (copie os valores de Firebase Console → Configurações do projeto → Web app)

# 2. Dependências
npm install

# 3. Rodar no navegador (modo dev com hot-reload)
npm run dev
# → http://localhost:5173

# 4. Build de produção (gera www/)
npm run build
# ou, direto para Cordova:
npm run build:cordova
# ou APK debug direto:
npm run build:android

# 5. APK Android (primeira vez na máquina)
npx cordova platform add android          # só uma vez
npx cordova plugin add cordova-sqlite-storage   # idempotente, restaura config
npx cordova prepare android
npx cordova run android                   # dispositivo/emulador conectado
```

### Scripts npm disponíveis

| Script | O que faz |
|---|---|
| `npm run dev` | Sobe Vite dev server (HMR) em `localhost:5173` |
| `npm run build` | Build Vite → `www/` |
| `npm run build:cordova` | Build Vite + `cordova prepare android` |
| `npm run build:android` | Build Vite + `cordova build android --debug` (gera APK) |
| `npm run preview` | Serve o `dist/` localmente |

---

## Firebase Console — provisionamento manual (obrigatório)

O `.env` sozinho **não basta**. Antes de usar sync, faça estes 3 passos no [Firebase Console](https://console.firebase.google.com/):

1. **Criar o Firestore Database**
   - Firestore Database → *Criar banco* → modo **Produção** → região `southamerica-east1` (ou outra próxima)
   - Sem esse passo, sync trava em *spinner infinite* sem erro visível.

2. **Habilitar Authentication**
   - Authentication → *Começar* → aba *Sign-in method* → habilitar **E-mail/senha**.

3. **Publicar as regras de segurança**
   ```bash
   firebase login
   firebase use --add          # selecione o projeto do .env
   firebase deploy --only firestore:rules
   ```
   O arquivo `firestore.rules` (na raiz) já implementa o modelo **multi-tenant per-user**:
   cada conta só lê/escreve a subárvore `users/{seu-uid}/...`.

---

## Estrutura

```
src/
  App.jsx, main.jsx
  components/      # 5 componentes compartilhados (SyncIndicator, ...)
  contexts/        # AuthContext, DatabaseContext
  hooks/           # 21 hooks (useSync, useAlertasSanitarios, useDashboardStats, ...)
  pages/           # 15 páginas (AnimalRegistration, Reproducao, HealthModule, ...)
  services/        # 18 services + firebase/ + sqlite/ + sync/
  styles/, assets/, constants/, utils/

documentacao/      # arquitetura, sprints, requisitos, roteiro de defesa
  CLAUDE.md        # convenções do projeto
  apresentacao/    # roteiro-mvp.md (slides banca)
  sync/            # README.md + smoke-test.md do sync

firestore.rules    # regras de segurança do Firestore (deploy obrigatório)
.env.example       # template das 6 VITE_FIREBASE_*
```

---

## Banco de dados

- **Local (offline):** SQLite via `cordova-sqlite-storage`. Schema em `src/services/sqlite/migrations.js` (9 tabelas, migrations idempotentes executadas via `SQL_MIGRACOES` no primeiro boot). Cada dispositivo tem sua cópia isolada.
- **Nuvem (online):** Firebase Firestore em `src/services/firebase/firestore.js`. Modelo **multi-tenant**: cada conta vive em `users/{uid}/{animais,vacinas,cios,...}`. Regras em `firestore.rules`.
- **Sincronização:** ✅ push/pull bidirecional, last-write-wins por `_updated_at`, tombstones via `_deleted: true`, SyncIndicator no header global. Detalhes em `documentacao/sync/`.

---

## Variáveis de ambiente

Crie `.env` a partir de `.env.example`:

| Var | Onde conseguir |
|---|---|
| `VITE_FIREBASE_API_KEY` | Console Firebase → Configurações → Web app |
| `VITE_FIREBASE_AUTH_DOMAIN` | idem |
| `VITE_FIREBASE_PROJECT_ID` | idem |
| `VITE_FIREBASE_STORAGE_BUCKET` | idem |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | idem |
| `VITE_FIREBASE_APP_ID` | idem |

⚠️ O `apiKey` do Firebase **não é segredo** em apps client-side — a segurança real vem das regras do Firestore em `firestore.rules` (deploy obrigatório, ver seção *Firebase Console*).

---

## Testes

Projeto sem suíte automatizada — validação pré-banca é **smoke manual** de 5 cenários (≈40 min):
1. Cadastro + login Firebase
2. CRUD animal local + sync push
3. Sync pull (logout + login em outra sessão)
4. Conflito last-write-wins
5. Rebuild APK

Checklist completa em `documentacao/sync/smoke-test.md`.

---

## Documentação adicional

- `documentacao/CLAUDE.md` — convenções, arquitetura, decisões de design
- `documentacao/apresentacao/roteiro-mvp.md` — roteiro de defesa (banca)
- `documentacao/sync/README.md` — arquitetura do sync SQLite ↔ Firestore
- `documentacao/sync/smoke-test.md` — checklist de validação pré-banca

---

## Status

✅ Auth Firebase (login/cadastro/recuperação)
✅ SQLite local (migrations idempotentes, 9 tabelas)
✅ Módulos: Reprodução, Saúde, Produção de Leite, Genealogia, Cadastros
✅ Sincronização SQLite ↔ Firestore — push/pull + SyncIndicator no header (06/08/2026)
✅ Multi-tenant per-user (rules em `firestore.rules`)
⚠️ Módulos menores: dashboard, movimentações, vacinas obrigatórias, ocorrências
