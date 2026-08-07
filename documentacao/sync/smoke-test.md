# Smoke Test — Sync SQLite ↔ Firestore

**Objetivo:** Validar 5 cenários críticos do sync antes da banca de PI2 (06-09/08/2026).

**Tempo total estimado:** ~40 minutos.

**Pré-requisitos:**
- App rodando em Chrome DevTools (`npm run dev`) ou APK instalado.
- 2 contas Firebase Auth de teste (conta A e conta B) — usar emails descartáveis.
- Firebase Console aberto em outra aba: <https://console.firebase.google.com/> → projeto → Firestore → Data.
- DevTools aberto: F12 → Application → IndexedDB (verificar SQLite local).

---

## Cenário 1 — Push (criar local → subir para nuvem)

**Tempo:** ~5 min.

**Objetivo:** Validar que uma criação local aparece no Firestore.

### Passos
1. Login com **conta A**.
2. Navegar para `/animais` (ou Cadastros → Animais).
3. Criar animal de teste: nome `Smoke-Push-A1`, brinco `BR-SP-001`.
4. Aguardar 3s (sync automático após criação).
5. Olhar **SyncIndicator** (canto superior direito do app): deve mostrar ✓ verde.
6. Abrir **Firebase Console** → Firestore → Data → `users/{uid_da_conta_A}/animais/`.
7. Verificar que existe documento com `nome = 'Smoke-Push-A1'`, `_updated_at` recente, `_deleted: false`.

### Critério de PASS
- ✅ SyncIndicator verde em <5s.
- ✅ Doc existe no Firestore com `_updated_at` ≠ null.

### Critério de FAIL
- ❌ SyncIndicator fica laranja/vermelho com `pendentesCount > 0`.
- ❌ Doc não aparece no Firestore após 30s.
- ❌ Console do browser mostra erro de permissão.

### Debug se falhar
```js
// DevTools → Console
const { sincronizarAgora } = await import('/src/services/sync/orchestrator.js')
await sincronizarAgora()
// ver retorno: { enviados, falhas, erros, ... }
```

---

## Cenário 2 — Pull (segundo device / reset SQLite)

**Tempo:** ~10 min.

**Objetivo:** Validar que login em SQLite vazio recria entidades via pull.

### Passos
1. Ainda logado como **conta A**, ir para DevTools → Application → Storage → Clear site data.
2. Reload da página (F5). App deve voltar para `/login`.
3. Logar novamente com **conta A** (mesma conta do cenário 1).
4. Aguardar 5-10s (listener dispara sync automático).
5. Navegar para `/animais`.
6. Verificar que o animal `Smoke-Push-A1` aparece na lista.

### Critério de PASS
- ✅ Animal aparece após reload + login.
- ✅ Firebase Console: doc `Smoke-Push-A1` continua existindo.

### Critério de FAIL
- ❌ Lista de animais vazia após login.
- ❌ Console mostra `no such table` (provavelmente migration não rodou).
- ❌ Pull trava sem erro (timeout >30s).

### Debug se falhar
```js
// DevTools → Console
const { pullAlteracoes } = await import('/src/services/sync/pullEngine.js')
const result = await pullAlteracoes()
console.log(result)

// Checar last_pull_at
const { obterMeta } = await import('/src/services/sqlite/queries.js')
console.log(await obterMeta('last_pull_at'))
```

---

## Cenário 3 — Security Rules

**Tempo:** ~5 min.

**Objetivo:** Validar que `firestore.rules` bloqueia acesso cross-user.

### Passos
1. **Logout** da conta A (botão Sair em Configurações).
2. **NÃO logar** ainda. Abrir Firebase Console → Firestore → Data.
3. Tentar acessar manualmente `users/{uid_da_conta_A}/animais/{qualquer_uuid}` via console rule playground:
   - Firestore → Rules → Playground.
   - Method: `get`, Path: `/users/{uid_da_conta_A}/animais/xyz`.
   - Auth: signed out (default).
   - Run.
4. Verificar que retorna `permission_denied`.
5. Login com **conta B** (diferente).
6. Tentar `get` em `/users/{uid_da_conta_A}/animais/xyz` com `request.auth.uid = uid_B`.
7. Verificar `permission_denied`.
8. Verificar que conta B consegue `get` em `/users/{uid_da_conta_B}/...` (caminho do próprio user).

### Critério de PASS
- ✅ Cenários 3.4 e 3.7 retornam `permission_denied`.
- ✅ Cenário 3.8 retorna `allow`.

### Critério de FAIL
- ❌ Conta B consegue ler dados da conta A.
- ❌ Acesso anônimo não é bloqueado.

### Debug se falhar
- Verificar `firestore.rules` foi publicado: Firebase Console → Firestore → Rules → última publicação <30 min.
- Sintaxe: `rules_version = '2'` e `match /users/{userId}/{document=**}` (wildcard recursivo).

---

## Cenário 4 — Last-write-wins

**Tempo:** ~10 min.

**Objetivo:** Validar que divergência entre devices é resolvida por `_updated_at`.

### Passos
1. Ainda logado como **conta B** (cenário 3).
2. Criar animal de teste: nome `LWW-Original-B`, brinco `BR-LWW-001`.
3. Aguardar push completar (SyncIndicator ✓).
4. **Logout** conta B.
5. **Login conta A**.
6. **Editar** o animal `LWW-Original-B`: mudar nome para `LWW-Editado-A`.
7. Aguardar push (SyncIndicator ✓).
8. **Logout** conta A.
9. **Login conta B** — pull deve trazer `LWW-Editado-A` (versão da conta A é mais recente).
10. Verificar lista de animais da conta B: mostra `LWW-Editado-A`.

### Critério de PASS
- ✅ Após login B no passo 9, lista mostra `LWW-Editado-A` (não `LWW-Original-B`).
- ✅ Firebase Console: doc tem `_updated_at` mais recente que o último push de B.

### Critério de FAIL
- ❌ Conta B continua mostrando `LWW-Original-B` (pull não rodou).
- ❌ Doc do Firestore foi sobrescrito com versão antiga (push B sobrescreveu A).

### Variante offline-first
- Se possível, repetir passos 6-7 com conta A offline (DevTools → Network → Offline) e voltar online após 30s. Pull de B deve trazer versão A.

---

## Cenário 5 — Offline + reload

**Tempo:** ~10 min.

**Objetivo:** Validar que app funciona offline e sync retoma ao reconectar.

### Passos
1. Logado como **conta A** (ou B, qualquer uma).
2. Criar animal de teste: nome `Offline-Test`, brinco `BR-OFF-001`.
3. **Imediatamente** (sem esperar push), abrir DevTools → Network → Throttling → **Offline**.
4. Aguardar 5s. Olhar SyncIndicator: deve mostrar ⊘ cinza (offline).
5. Criar mais 2 animais offline: `Offline-2`, `Offline-3`.
6. SyncIndicator deve mostrar badge laranja com `3 pendentes`.
7. **Reload da página** (F5) ainda em offline.
8. Aguardar app carregar. Verificar lista de animais: **3 animais criados offline devem estar lá** (SQLite persistiu).
9. **Voltar online**: DevTools → Network → Throttling → **No throttling**.
10. Aguardar 5-10s. SyncIndicator volta para ✓ (push automático retomou via listener? ou precisa reload?).
11. Se não retomou sozinho: navegar para outra rota (force re-render) ou chamar manualmente via SecaoSync.
12. Verificar Firebase Console: 3 docs aparecem em `users/{uid}/animais/`.

### Critério de PASS
- ✅ Animais persistem após reload offline.
- ✅ SyncIndicator muda para ✓ quando volta online.
- ✅ 3 docs aparecem no Firestore após reconexão.

### Critério de FAIL
- ❌ Lista vazia após reload offline (SQLite não persistiu).
- ❌ SyncIndicator fica ⊘ mesmo após voltar online (listener não disparou).
- ❌ Push parcial — só 1-2 docs aparecem no Firestore.

### Debug se falhar
```js
// DevTools → Console (online)
const { contarPendentes } = await import('/src/services/sqlite/queries.js')
console.log(await contarPendentes())  // deve ser 0 após sync
```

---

## Checklist de execução

Marcar ✅ conforme completa cada cenário:

- [ ] Cenário 1 — Push (conta A cria animal → Firestore)
- [ ] Cenário 2 — Pull (reset SQLite → login → dados voltam)
- [ ] Cenário 3 — Regras (cross-user bloqueado)
- [ ] Cenário 4 — Last-write-wins (divergência resolvida por timestamp)
- [ ] Cenário 5 — Offline + reload (3 animais persistem + sync retoma)

**Resultado global:**

- [ ] **5/5 PASS** — sync pronto para banca.
- [ ] **3-4/5 PASS** — investigar falhas antes da defesa; sync demonstrável.
- [ ] **<3/5 PASS** — bloqueador crítico; NÃO defender sync sem correção.

---

## Pós-smoke: cleanup

Após todos os cenários:

1. Deletar animais de teste do Firestore (Console → delete docs).
2. Deletar animais de teste do SQLite local (ou rodar migrations reset).
3. Logout da conta de teste, logout conta B.
4. Limpar DevTools → Application → Storage.

---

## Suporte

- Issues? `documentacao/CLAUDE.md` → convenções do projeto.
- Plano original: `~/.openclaude/plans/harmonic-prancing-sprout.md` (no host do dev).
- Memo de implementação: `memory/project-sync-firebase-implementation-2026-08-05.md`.
