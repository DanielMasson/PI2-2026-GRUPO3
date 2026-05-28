# Estratégia Local vs Remoto

> Definição clara de quando usar SQLite (local) vs Firestore (remoto) no **Propriedade Inteligente**.

---

## 1. Regra Fundamental

```text
┌─────────────────────────────────────────────────────────┐
│                    REGRA DE OURO                        │
│                                                         │
│  LEITURA  → Sempre do SQLite (local)                    │
│  ESCRITA  → Sempre no SQLite primeiro                   │
│  SYNC     → SQLite ↔ Firestore em segundo plano         │
│  UI       → Nunca depende de rede para exibir dados     │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Quando usar cada banco

### 2.1. SQLite (Local)

| Operação              | Exemplo                                            |
|-----------------------|----------------------------------------------------|
| Ler dados para UI     | Listar animais, buscar vacinas, mostrar ficha      |
| Salvar dados novos    | Cadastrar animal, registrar vacina                 |
| Atualizar dados       | Editar animal, atualizar pesagem                   |
| Excluir dados         | Soft delete de animal, remover vacina              |
| Buscar dados          | Filtrar por nome, buscar por ID                    |
| Calcular derivados    | GMD, ECC, idade, dias até parto                    |
| Estado de sync        | sync_status, synced_at                             |

### 2.2. Firestore (Remoto)

| Operação              | Exemplo                                            |
|-----------------------|----------------------------------------------------|
| Backup                | Todos os dados persistidos na nuvem                |
| Sync entre dispositivos| Mesma conta em 2 celulares                        |
| Baixar atualizações   | Pull: dados alterados em outro dispositivo         |
| Enviar atualizações   | Push: dados criados/editados localmente            |
| Autenticação          | Firebase Auth (login, cadastro, sessão)            |
| Convites de membros   | Criar vínculo usuário ↔ propriedade                |

### 2.3. NUNCA fazer

| Operação errada                          | Por quê                                         |
|------------------------------------------|-------------------------------------------------|
| UI lê do Firestore                       | Depende de rede, lento, UX ruim offline         |
| Salvar só no Firestore                   | Se perder conexão, dado se perde                |
| Pular SQLite na escrita                  | Inconsistência entre UI e banco                 |
| Ler Firestore para cada render           | Gasto desnecessário de leituras/cota            |

---

## 3. Fluxo por Tipo de Operação

### 3.1. Criação de dados

```text
Usuário salva
  │
  ├─► SQLite: INSERT (sync_status='novo')
  │
  ├─► UI: atualiza imediatamente (estado local)
  │
  └─► Background: Firestore setDoc() quando online
      └─► SQLite: sync_status='sincronizado'
```

### 3.2. Leitura de dados

```text
Tela abre
  │
  └─► SQLite: SELECT (dados locais)
      │
      └─► UI: renderiza imediatamente
          │
          └─► Background: pull do Firestore (se online)
              └─► SQLite: atualiza registros mudados
                  └─► UI: re-render com dados atualizados
```

### 3.3. Atualização de dados

```text
Usuário edita
  │
  ├─► SQLite: UPDATE (sync_status='modificado', updated_at=agora)
  │
  ├─► UI: atualiza imediatamente
  │
  └─► Background: Firestore updateDoc() quando online
      └─► SQLite: sync_status='sincronizado'
```

### 3.4. Exclusão de dados

```text
Usuário exclui
  │
  ├─► SQLite: UPDATE deleted=1 (soft delete) ou DELETE (hard delete)
  │
  ├─► UI: remove da lista
  │
  └─► Background: Firestore updateDoc(deleted=true) ou deleteDoc()
```

---

## 4. Fonte da Verdade

### 4.1. Durante a sessão (app aberto)

```text
SQLite é a fonte da verdade.

UI ← SQLite ← SyncService ← Firestore
       ↑
   escrita direta
```

### 4.2. Entre dispositivos

```text
Firestore é a fonte da verdade compartilhada.

Dispositivo A ← SQLite A ← Sync ← Firestore → Sync → SQLite B → Dispositivo B
```

### 4.3. Se houver conflito

```text
Quem tem updated_at mais recente vence (LWW).
Se possível, merge por campo.
```

---

## 5. Tabela de Decisão

| Situação                                     | Ação                          |
|----------------------------------------------|-------------------------------|
| Usuário abre o app                           | Pull: Firestore → SQLite      |
| Usuário cadastra animal                      | SQLite → UI → (async) Firestore|
| Usuário edita vacina                         | SQLite → UI → (async) Firestore|
| Usuário lista animais                        | SQLite (somente)              |
| App offline                                  | SQLite funciona normalmente   |
| App reconecta                                | Pull + Push automático        |
| 2 dispositivos editam mesmo registro         | LWW por updated_at            |
| Usuário acessa propriedade pela primeira vez | Pull: Firestore → SQLite      |
| Usuário acessa propriedade já conhecida      | SQLite (já populado) + Pull incremental |

---

## 6. Exemplo Concreto

### Cenário: Cadastrar animal

```javascript
// animalService.criarAnimal()

async function criarAnimal(dados) {
  // 1. Salvar no SQLite (fonte local)
  const uuid = gerarUUID()
  const agora = new Date().toISOString()

  await getDb().executeSql(
    `INSERT INTO animais (uuid, ..., created_at, updated_at, sync_status)
     VALUES (..., ?, ?, 'novo')`,
    [uuid, ..., agora, agora]
  )

  // 2. Marcar para sync
  await syncService.pendenciar('animais', uuid)

  // 3. Retornar para UI atualizar
  return { uuid, ..., sync_status: 'novo' }

  // 4. (async, em background) Push para Firestore
  //    syncService.pushPendentes() faz isso automaticamente
}
```

### Cenário: Listar animais

```javascript
// animalService.listarAnimais()

async function listarAnimais(propriedadeId) {
  // Sempre do SQLite
  const animais = await getDb().executeSql(
    `SELECT * FROM animais WHERE propriedade_uuid = ? AND deleted = 0`,
    [propriedadeId]
  )
  return animais
}
```

### Cenário: Sync pull

```javascript
// syncService.pullDadosPropriedade()

async function pullDadosPropriedade(propriedadeId) {
  // 1. Baixar animais do Firestore
  const animaisRemotos = await firestoreService.listarAnimaisRemoto(propriedadeId)

  // 2. Para cada animal remoto, atualizar SQLite
  for (const remoto of animaisRemotos) {
    const local = await sqlite.buscarAnimal(remoto.uuid)

    if (!local) {
      // Não existe localmente → inserir
      await sqlite.inserirAnimalRemoto(remoto)
    } else if (remoto.updated_at > local.updated_at) {
      // Remoto é mais recente → atualizar local
      await sqlite.atualizarAnimalRemoto(remoto.uuid, remoto)
    }
    // Se local é mais recente → manter local (será pushado depois)
  }
}
```

---

## 7. Resumo Visual

```text
┌─────────────┐        ┌─────────────┐        ┌──────────────┐
│             │        │             │        │              │
│     UI      │◄──────►│   SQLite    │◄──────►│  Firestore   │
│             │  ler/  │             │  sync  │              │
│             │escrever│             │        │              │
└─────────────┘        └─────────────┘        └──────────────┘
   renderiza            fonte da               backup e
   dados                verdade                compartilhamento
   locais               local
```
