# Fluxo Completo de Dados

> Como os dados fluem no **Propriedade Inteligente**: UI ↔ Contexts ↔ Services ↔ SQLite ↔ Firestore.
> Regra: leitura sempre do SQLite local, Firestore é remoto/sync.

---

## 1. Diagrama Geral

```text
┌──────────────────────────────────────────────────────────────────────┐
│                              UI (React)                              │
│  Telas, Componentes, Hooks                                           │
└──────────────┬────────────────────────────┬──────────────────────────┘
               │ leitura                    │ escrita
               ▼                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          CONTEXTS (Estado Global)                    │
│  AuthContext · PropriedadeContext · SyncContext · OfflineContext      │
└──────────────┬────────────────────────────┬──────────────────────────┘
               │                            │
               ▼                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      SERVICES DE NEGÓCIO                             │
│  animalService · vacinaService · propriedadeService · etc.          │
│  (orquestam leitura local + escrita + fila de sync)                 │
└───────┬──────────────────────────┬───────────────────────────────────┘
        │                          │
        ▼                          ▼
┌──────────────┐          ┌──────────────────┐          ┌────────────┐
│ sqliteService│          │   syncService    │          │  firestore │
│ (leitura +   │◄────────►│  (pull + push)   │◄────────►│  Service   │
│  escrita     │          │                  │          │ (remoto)   │
│  local)      │          │                  │          │            │
└──────────────┘          └──────────────────┘          └────────────┘
```

---

## 2. Fluxo de Leitura (padrão)

### 2.1. Login → Dashboard

```text
1. Usuário faz login
   │
   ▼
2. AuthContext detecta sessão via Firebase Auth
   │
   ▼
3. SyncService.pullPropriedades(usuarioUid)
   │
   ├─► Firestore: listar propriedades do usuário
   │
   ├─► SQLite: salvar/atualizar propriedades locais
   │
   └─► SyncService.pullMembros(propriedadeId) para cada propriedade
   │
   ▼
4. Dashboard.ler propriedades do SQLite (via propriedadeService)
   │
   ▼
5. UI renderiza lista de propriedades
```

### 2.2. Acessar uma propriedade

```text
1. Usuário clica em "Fazenda Norte"
   │
   ▼
2. PropriedadeContext.selecionarPropriedade(uuid)
   │
   ├─► propriedadeService.buscarPropriedade(uuid) do SQLite
   │
   ├─► membroService.buscarMembro(uuid, usuarioId) do SQLite
   │
   └─► SyncService.pullDadosPropriedade(uuid)
       │
       ├─► Firestore: baixar animais, vacinas, medicamentos,
       │               ocorrências, pesagens, reprodução
       │
       └─► SQLite: salvar tudo localmente
   │
   ▼
3. PropertyHome.carrega dados do SQLite
   │
   ▼
4. UI renderiza painel com dados atualizados
```

### 2.3. Listar animais

```text
1. Tela ListaAnimais abre
   │
   ▼
2. useAnimais(propriedadeId) é chamado
   │
   ▼
3. animalService.listarAnimais(propriedadeId)
   │
   └─► SQLite: SELECT * FROM animais
       WHERE propriedade_uuid = ? AND deleted = 0
   │
   ▼
4. Hook retorna array de animais
   │
   ▼
5. UI renderiza cards de animais
```

### 2.4. Ver ficha de um animal

```text
1. Usuário clica em "Mimosa"
   │
   ▼
2. useAnimal(animalId) é chamado
   │
   ├─► animalService.buscarAnimal(uuid) do SQLite
   │
   ├─► usePesagens(animalId) → SQLite → calcula GMD
   │
   ├─► useVacinas(animalId) → SQLite → próximas doses
   │
   └─► useReproducao(animalId) → SQLite → gestação ativa
   │
   ▼
3. FichaAnimal.renderiza todos os dados
```

---

## 3. Fluxo de Escrita (padrão)

### 3.1. Cadastrar animal

```text
1. Usuário preenche formulário e clica "Salvar"
   │
   ▼
2. Validação no frontend (campos obrigatórios, tipos)
   │
   ▼
3. animalService.criarAnimal(dados)
   │
   ├─► SQLite: INSERT INTO animais (uuid, ..., sync_status='novo')
   │
   └─► syncService.pendenciar('animais', uuid)
       └─► SQLite: sync_status = 'novo' (já definido no INSERT)
   │
   ▼
4. Hook atualiza estado local (setAnimais)
   │
   ▼
5. UI mostra animal na lista + badge "pendente de sync"
   │
   ▼ (quando houver internet, em background)
6. SyncService.pushPendentes()
   │
   ├─► Firestore: setDoc(propriedade/.../animais/uuid, dados)
   │
   └─► SQLite: UPDATE animais SET sync_status='sincronizado',
       synced_at=agora WHERE uuid=?
   │
   ▼
7. Badge muda para "sincronizado"
```

### 3.2. Registrar vacina

```text
1. Usuário preenche formulário de vacina
   │
   ▼
2. vacinaService.registrarVacina(dados)
   │
   ├─► SQLite: INSERT INTO vacinas (uuid, animal_uuid, ..., sync_status='novo')
   │
   └─► syncService.pendenciar('vacinas', uuid)
   │
   ▼
3. Hook atualiza lista de vacinas
   │
   ▼
4. UI mostra vacina na lista + badge "pendente"
   │
   ▼ (background sync)
5. Firestore: setDoc(propriedade/.../animais/animalId/vacinas/uuid, dados)
   │
   ▼
6. sync_status = 'sincronizado'
```

### 3.3. Editar animal

```text
1. Usuário altera dados e clica "Salvar"
   │
   ▼
2. animalService.editarAnimal(uuid, dados)
   │
   ├─► SQLite: UPDATE animais SET nome=?, raca=?, ...,
   │           updated_at=agora, sync_status='modificado'
   │
   └─► syncService.pendenciar('animais', uuid)
   │
   ▼
3. Hook atualiza animal no estado
   │
   ▼
4. UI mostra dados atualizados + badge "pendente"
   │
   ▼ (background sync)
5. Firestore: updateDoc(propriedade/.../animais/uuid, dados)
   │
   ▼
6. sync_status = 'sincronizado'
```

### 3.4. Excluir animal (soft delete)

```text
1. Usuário confirma exclusão
   │
   ▼
2. animalService.excluirAnimal(uuid)
   │
   ├─► SQLite: UPDATE animais SET deleted=1, updated_at=agora,
   │           sync_status='modificado'
   │
   └─► syncService.pendenciar('animais', uuid)
   │
   ▼
3. Hook remove animal do estado local (filtered out)
   │
   ▼
4. UI remove animal da lista
   │
   ▼ (background sync)
5. Firestore: updateDoc(propriedade/.../animais/uuid, { deleted: true, updated_at })
   │
   ▼
6. sync_status = 'sincronizado'
```

---

## 4. Fluxo de Sincronização

### 4.1. Sync inicial (login)

```text
Login
  │
  ▼
SyncService.pullDados()
  │
  ├─► pullPropriedades(usuarioUid)
  │   ├─ Firestore: getDocs(propriedade where membros/{uid} exists)
  │   └─ SQLite: INSERT OR REPLACE INTO propriedades
  │
  ├─► pullMembros(propriedadeId) para cada propriedade
  │   ├─ Firestore: getDocs(propriedade/{id}/membros)
  │   └─ SQLite: INSERT OR REPLACE INTO propriedade_membros
  │
  └─► pullDadosPropriedade(propriedadeId) para cada propriedade (background)
      ├─ Firestore: getDocs(propriedade/{id}/animais)
      │   └─ SQLite: INSERT OR REPLACE INTO animais
      ├─ Firestore: getDocs(propriedade/{id}/animais/{id}/vacinas)
      │   └─ SQLite: INSERT OR REPLACE INTO vacinas
      ├─ Firestore: getDocs(.../medicamentos) → SQLite
      ├─ Firestore: getDocs(.../ocorrencias) → SQLite
      ├─ Firestore: getDocs(.../pesagens) → SQLite
      └─ Firestore: getDocs(.../reproducao) → SQLite
```

### 4.2. Sync periódica (a cada 5 min)

```text
A cada 5 minutos (se online):
  │
  ▼
SyncService.pullDados()
  │
  ├─► Para cada propriedade:
  │   ├─ Firestore: getDocs com filtro updated_at > ultimaSync
  │   └─ SQLite: atualizar apenas registros mudados
  │
  ▼
SyncService.pushPendentes()
  │
  ├─► SQLite: SELECT * FROM animais WHERE sync_status IN ('novo','modificado')
  │
  ├─► Para cada registro pendente:
  │   ├─ Se 'novo': Firestore setDoc()
  │   ├─ Se 'modificado': Firestore updateDoc()
  │   └─ Se deleted=1: Firestore updateDoc(deleted=true)
  │
  └─► SQLite: UPDATE sync_status='sincronizado', synced_at=agora
```

### 4.3. Sync ao reconectar

```text
Evento 'online' do navegador
  │
  ▼
SyncContext detecta reconexão
  │
  ▼
Executa sincronizar() automaticamente
  │
  ├─► pullDados() (baixa mudanças do remoto)
  │
  └─► pushPendentes() (envia pendências locais)
```

---

## 5. Fluxo de Conflitos

### 5.1. Merge quando possível

```text
Registro alterado no local E no remoto:
  │
  ▼
Comparar updated_at
  │
  ├─► Se local.updated_at > remoto.updated_at:
  │   └─ Manter local, push para remoto
  │
  ├─► Se remoto.updated_at > local.updated_at:
  │   └─ Atualizar local com dados remotos
  │
  └─► Se updated_at iguais:
      └─ Manter local (última escrita conhecida)
```

### 5.2. Merge de campos

Quando possível, merge por campo:

```javascript
function mergeDados(local, remoto) {
  const merged = { ...local }

  // Para cada campo, manter o mais recente
  for (const campo of Object.keys(remoto)) {
    if (campo === 'updated_at' || campo === 'synced_at' || campo === 'sync_status') continue

    if (local.updated_at > remoto.updated_at) {
      // Local é mais recente → manter local (já no merged)
    } else {
      // Remoto é mais recente → usar valor remoto
      merged[campo] = remoto[campo]
    }
  }

  merged.updated_at = new Date().toISOString()
  merged.sync_status = 'sincronizado'
  merged.synced_at = new Date().toISOString()

  return merged
}
```

### 5.3. LWW como fallback

Se merge não for possível (campos complexos, estruturas diferentes):

```javascript
function resolverConflitoLWW(local, remoto) {
  if (local.updated_at >= remoto.updated_at) {
    return local // Local vence
  } else {
    return remoto // Remoto vence
  }
}
```

---

## 6. Estados de Sync

```text
         INSERT                  UPDATE                  SYNC OK
  ┌──────────────┐      ┌──────────────────┐      ┌─────────────────┐
  │              │      │                  │      │                 │
  │     novo     │─────►│    modificado    │─────►│  sincronizado   │
  │              │      │                  │      │                 │
  └──────────────┘      └──────────────────┘      └─────────────────┘
         │                                               │
         │              UPDATE                           │
         └───────────────────────────────────────────────┘
```

| sync_status   | Significado                          | Quando ocorre                    |
|---------------|--------------------------------------|----------------------------------|
| `novo`        | Criado localmente, nunca no remoto   | INSERT no SQLite                 |
| `modificado`  | Alterado localmente após última sync | UPDATE no SQLite                 |
| `sincronizado`| Local e remoto idênticos             | Após push bem-sucedido           |

---

## 7. Regras de Ouro

1. **Leitura:** Sempre do SQLite. Nunca do Firestore na UI.
2. **Escrita:** Sempre no SQLite primeiro. Firestore em background.
3. **Sync:** Pull (remoto→local) + Push (local→remoto).
4. **Conflitos:** Merge quando possível, LWW como fallback.
5. **Offline:** App funciona 100% sem internet. Sync quando reconectar.
6. **Reatividade:** UI atualiza ao concluir pull.
