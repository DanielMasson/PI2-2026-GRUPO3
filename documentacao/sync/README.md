# Sincronização SQLite ↔ Firebase Firestore

Implementação do sync offline-first do **Propriedade Inteligente** (PI2 — IFC Concórdia 2026).

**Status:** ✅ Implementado (06/08/2026). Verifier PASS, build verde 804.98 kB. Smoke manual pendente antes da banca — ver [`smoke-test.md`](./smoke-test.md).

---

## Arquitetura

```
┌─────────────────┐         ┌──────────────────────┐         ┌─────────────────┐
│  UI/Pages       │         │  src/services/sync/  │         │  Firebase       │
│                 │         │                      │         │                 │
│ SyncIndicator   │ ◄─────  │ orchestrator.js      │ ──────► │  Firestore      │
│ SecaoSync       │  hook   │  ├─ pushQueue.js     │  SDK    │  users/{uid}/   │
│ (useSync)       │         │  └─ pullEngine.js    │         │    {tabela}/    │
└─────────────────┘         │                      │         │    {uuid}       │
                            └──────────┬───────────┘         └─────────────────┘
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │ SQLite local         │
                            │ (cordova-sqlite-     │
                            │  storage + _sync_    │
                            │  meta table)         │
                            └──────────────────────┘
```

### Princípios

1. **SQLite é source-of-truth.** Tudo grava local primeiro (`sync_status='novo'` ou `'modificado'`). App funciona 100% offline.
2. **Push primeiro, pull depois.** Modificações locais vão para cima antes do pull puxar mudanças remotas (evita clobber local).
3. **Last-write-wins silencioso.** Conflitos resolvidos por `_updated_at` (Firestore `serverTimestamp()`). Sem prompt para o usuário.
4. **Tombstones via flag.** Soft-delete usa `_deleted: true` no Firestore (não `deleteDoc`) — preserva informação offline.
5. **Per-row state machine.** Cada linha tem `sync_status` ∈ {`novo`, `modificado`, `sincronizado`, `removido`}.

---

## Tabelas sincronizadas (11)

Layout Firestore: `users/{firebase_uid}/{tabela}/{uuid}` — flat por tabela.

| Tabela SQLite | Subcollection Firestore | Observação |
|---|---|---|
| `usuarios` | `usuarios` | 1 doc/user (anchor) |
| `propriedades` | `propriedades` | |
| `propriedade_membros` | `membros` | RBAC server-side |
| `animais` | `animais` | Suporta soft-delete |
| `vacinas` | `vacinas` | |
| `pesagens` | `pesagens` | |
| `medicamentos` | `medicamentos` | |
| `ocorrencias` | `ocorrencias` | |
| `movimentacoes_local` | `movimentacoes` | Subcollection sem `_local` |
| `reproducao` | `reproducao` | S7 |
| `producao_leite` | `producao_leite` | S6 |

## Tabelas locais (NÃO sincronizadas)

| Tabela | Razão |
|---|---|
| `_sync_meta` | Metadados do próprio sync (chave/valor) |
| `ci_os` | Cios — fora de escopo MVP (S7+) |
| `propriedade_vacinas_obrigatorias` | Calendário fixo, sem necessidade de sync |

---

## Modelo de documento Firestore

```js
// users/{uid}/animais/{uuid}
{
  uuid: 'fbu_abc123_xyz',         // mesmo UUID do SQLite
  nome: 'Mimosa',
  brinco: 'BR-001',
  sexo: 'fêmea',
  data_nascimento: '2024-03-15',
  // ... todos os campos da tabela (exceto colunas internas)

  _updated_at: Timestamp,          // serverTimestamp — base do last-write-wins
  _deleted: false,                 // tombstone para soft-delete
}
```

**Colunas internas SQLite removidas antes do push:**
- `sync_status`
- `synced_at`

Sanitização em `src/services/sync/pushQueue.js:32` (`sanitizarDoc`).

---

## Fluxo de conflito (last-write-wins)

```
Device A:                              Device B:
1. edita animal X                      1. edita animal X
   local: updated_at=10:00               local: updated_at=10:01
   sync_status='modificado'              sync_status='modificado'
2. push → Firestore                    2. (offline, sem push ainda)
   Firestore X._updated_at=10:00       
   Firestore.sync_status='sincronizado'
3. (offline, sem pull)                 3. online → push X
                                        Firestore X._updated_at=10:01
                                        → 10:01 > 10:00, B vence
4. online → pull X
   Firestore._updated_at=10:01 > local 10:00
   → UPDATE local com versão B (silencioso)
```

**Não há prompt.** Usuário do Device A perde a edição sem aviso. Trade-off aceito para MVP — implementar merge UI é desproporcional para banca.

---

## Pontos de integração

### `src/contexts/AuthContext.jsx` (listener)
```js
onAuthStateChanged(auth, async (firebaseUser) => {
  if (firebaseUser) {
    if (syncingRef.current) return          // evita race com login/cadastrar
    const local = await espelharUsuarioLocal(firebaseUser)
    setUsuario(local)
    if (navigator.onLine) {
      sincronizarAgora()                    // fire-and-forget
        .then(() => console.log('[AuthContext] Sync automática OK'))
        .catch(err => console.warn('[AuthContext] Sync automática falhou:', err))
    }
  }
})
```

### `src/components/SyncIndicator/` (header global)
- Fixado `top: 12px; right: 12px; z-index: 1000` em todas as 14 rotas privadas via `RotaPrivadaComShell`.
- Estados: ✓ idle, ⟳ sincronizando, ! erro, ⊘ offline.
- Badge laranja com `pendentesCount` quando > 0.
- Click → `sincronizarAgora()`.

### `src/pages/Configuracoes/SecaoSync/` (tela dedicada)
- Mostra status real (badge colorido), último sync (relativo), contagem de pendentes.
- Botão "Sincronizar agora" → `sincronizarAgora()`.

---

## Security Rules (`firestore.rules`)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Como aplicar:** Firebase Console → Firestore → Rules → colar conteúdo → Publish.

**Verificação:** logout + `getDoc` direto no console do Firebase → `permission-denied`. Login uid X tentando ler `users/{Y}/...` → `permission-denied`.

---

## Free tier (Firestore Spark)

| Recurso | Limite/dia | Estratégia |
|---|---|---|
| Reads | 50.000 | Pull sempre lê tudo (9-11 reads/sync) — <50 syncs/dia = OK |
| Writes | 20.000 | Push em batch 500 — ações típicas <100 writes/sync |
| Storage | 1 GiB | Estimativa: ~10 KB/doc × 1000 docs ≈ 10 MB |
| Deletes | 20.000 | Não usamos `deleteDoc` (tombstones) — não conta |

**Saturação esperada:** Só com >5000 syncs/dia ou >5000 docs únicos. Muito acima do MVP.

**Mitigação se necessário:** adicionar `where('_updated_at', >)` no pull para incrementais — requer índice composto (free tier aceita, console-config).

---

## Troubleshooting

| Sintoma | Causa provável | Fix |
|---|---|---|
| `Sem usuário autenticado` | Sessão expirou ou login não disparou listener | Relogar; verificar `auth.currentUser` no DevTools |
| `permission-denied` em push | Regras Firestore não publicadas ou `auth.uid != userId` | Publish rules; checar UID Firebase |
| Sync trava em "Sincronizando" | Conflito de batch ou doc >1 MiB | DevTools → Console; verificar `erro` retornado por `useSync` |
| Pendentes não zera após sync | `sync_status` ficou preso em `'modificado'` (push falhou por doc) | Forçar `marcarSincronizado(tabela, uuid)` via DevTools |
| Pull não traz dados novos | Firestore > SQLite `_updated_at` mas `last_pull_at` não atualizou | Checar `_sync_meta.last_pull_at` via `obterMeta()` |
| `Firebase: Error (auth/quota-exceeded)` | Muitas tentativas de signup com mesmo email | Esperar 1h ou usar email diferente |

---

## Arquivos principais

- `src/services/sync/orchestrator.js` — `sincronizarAgora()`, push+pull sequencial
- `src/services/sync/pushQueue.js` — UPSERT 11 tabelas via `writeBatch`
- `src/services/sync/pullEngine.js` — last-write-wins + tombstones
- `src/hooks/useSync.js` — estado reativo (`statusSync`, `pendentesCount`, `ultimoSyncEm`)
- `src/services/firebase/firestore.js` — singleton `db`
- `firestore.rules` — security rules
- `src/services/sqlite/queries.js:719` — `contarPendentes()`
- `src/services/sqlite/migrations.js` — `_sync_meta` table
