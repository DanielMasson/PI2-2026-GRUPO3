# Propriedade Inteligente

Aplicativo de controle de propriedades rurais — **Projeto Integrador II (IFC Concórdia, 2026)**.

Stack: **React 19 + Vite 8 + Cordova 13 + Firebase 10 + cordova-sqlite-storage 7**.

---

## Pré-requisitos

- **Node.js 18+** (Vite 8 não roda em versões anteriores)
- **JDK 17** (somente para build Android)
- **Android SDK + Gradle** (somente para build Android)
- Conta Firebase (Auth + Firestore) — qualquer projeto gratuito serve

---

## Setup rápido

```bash
# 1. Variáveis de ambiente
cp .env.example .env
# Editar .env e preencher as 6 vars VITE_FIREBASE_*

# 2. Dependências
npm install

# 3. Rodar no navegador (modo dev com hot-reload)
npm run dev
# → http://localhost:5173

# 4. Build de produção (gera www/)
npm run build
# ou, direto para Cordova:
npm run build:cordova

# 5. APK Android
npx cordova prepare android
npx cordova run android   # dispositivo/emulador conectado
```

---

## Estrutura

```
src/
  App.jsx, main.jsx
  components/      # 4 componentes compartilhados
  contexts/        # AuthContext, DatabaseContext
  hooks/           # 16 hooks (useAlertasSanitarios, useDashboardStats, etc.)
  pages/           # 15 páginas (AnimalRegistration, Reproducao, HealthModule, ...)
  services/        # 16 services + firebase/ + sqlite/
  styles/, assets/, constants/, utils/

documentacao/      # arquitetura, sprints, requisitos, roteiro de defesa
  CLAUDE.md        # convenções do projeto
  apresentacao/    # roteiro-mvp.md (slides banca)
```

---

## Banco de dados

- **Local (offline):** SQLite via cordova-sqlite-storage, schema em `src/services/sqlite/migrations.js` (migrations idempotentes, executadas via SQL_MIGRACOES).
- **Nuvem (online):** Firebase Firestore via `src/services/firebase/`.
- **Sincronização:** ainda em integração (status: em andamento — 30/07/2026).

---

## Variáveis de ambiente

| Var | Onde conseguir |
|---|---|
| `VITE_FIREBASE_API_KEY` | Console Firebase → Configurações → Web app |
| `VITE_FIREBASE_AUTH_DOMAIN` | idem |
| `VITE_FIREBASE_PROJECT_ID` | idem |
| `VITE_FIREBASE_STORAGE_BUCKET` | idem |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | idem |
| `VITE_FIREBASE_APP_ID` | idem |

⚠️ O `apiKey` do Firebase **não é segredo** em apps client-side — a segurança real vem das regras do Firestore (não configuradas neste repositório).

---

## Documentação adicional

- `documentacao/CLAUDE.md` — convenções, arquitetura, decisões de design
- `documentacao/apresentacao/roteiro-mvp.md` — roteiro de defesa (banca)

---

## Status

✅ Auth Firebase (login/cadastro/recuperação)
✅ SQLite local (migrations idempotentes)
✅ Módulos: Reprodução, Saúde, Produção de Leite, Genealogia, Cadastros
⚠️ Sincronização SQLite ↔ Firestore (em integração)
⚠️ Módulos menores: dashboard, movimentações, vacinas obrigatórias, ocorrências
