# Camada de Serviços

> Separação em 3 camadas: `sqliteService`, `firestoreService`, `syncService`.
> Funções de negócio orquestram as 3 camadas.

---

## 1. Estrutura de Arquivos

```text
src/services/
├── firebase/
│   ├── config.js              # Inicialização Firebase
│   ├── auth.js                # Funções de autenticação
│   └── firestore.js           # Funções de Firestore (CRUD remoto)
├── sqlite/
│   ├── database.js            # Inicialização do SQLite
│   ├── migrations.js          # Criação de tabelas
│   └── queries.js             # Queries SQL raw
├── sync/
│   ├── syncService.js         # Orquestração de sync
│   ├── pullService.js         # Baixar dados remotos → local
│   └── pushService.js         # Enviar dados locais → remoto
├── animalService.js           # Lógica de negócio: animais
├── vacinaService.js           # Lógica de negócio: vacinas
├── medicamentoService.js      # Lógica de negócio: medicamentos
├── ocorrenciaService.js       # Lógica de negócio: ocorrências
├── pesagemService.js          # Lógica de negócio: pesagens
├── reproducaoService.js       # Lógica de negócio: reprodução
├── propriedadeService.js      # Lógica de negócio: propriedades
└── usuarioService.js          # Lógica de negócio: usuários
```

---

## 2. Princípio de Separação

```text
┌─────────────────────────────────────────────────────────┐
│                    TELAS / UI                           │
│                  (React Components)                      │
└────────────────────────┬────────────────────────────────┘
                         │ chama funções
                         ▼
┌─────────────────────────────────────────────────────────┐
│               SERVICES DE NEGÓCIO                       │
│  animalService / vacinaService / propriedadeService     │
│  (orquestram SQLite + Firestore + Sync)                 │
└───────┬──────────────────────┬──────────────────────────┘
        │                      │
        ▼                      ▼
┌──────────────┐    ┌──────────────────┐    ┌───────────┐
│ sqliteService│    │ firestoreService │    │syncService│
│ (leitura +   │    │ (escrita remota) │    │(pull/push)│
│  escrita     │    │                  │    │           │
│  local)      │    │                  │    │           │
└──────────────┘    └──────────────────┘    └───────────┘
```

**Regra:** Telas NUNCA chamam `sqliteService` ou `firestoreService` diretamente.
Sempre passam pelo service de negócio.

---

## 3. sqliteService

Responsável por toda interação com o banco SQLite local.

### Inicialização

```javascript
// services/sqlite/database.js
let db = null

export async function initDatabase() {
  db = window.sqlitePlugin.openDatabase({
    name: 'propriedade_inteligente.db',
    location: 'default',
  })
  await criarTabelas(db)
  return db
}

export function getDb() {
  if (!db) throw new Error('Banco de dados não inicializado')
  return db
}
```

### Funções CRUD

```javascript
// services/sqlite/queries.js

// ── PROPERTIES ──
export async function listarPropriedades(usuarioUuid) { ... }
export async function buscarPropriedade(uuid) { ... }
export async function inserirPropriedade(dados) { ... }
export async function atualizarPropriedade(uuid, dados) { ... }
export async function excluirPropriedade(uuid) { ... }

// ── ANIMAIS ──
export async function listarAnimais(propriedadeUuid) { ... }
export async function buscarAnimal(uuid) { ... }
export async function inserirAnimal(dados) { ... }
export async function atualizarAnimal(uuid, dados) { ... }
export async function excluirAnimal(uuid) { ... } // soft delete

// ── VACINAS ──
export async function listarVacinas(animalUuid) { ... }
export async function listarVacinasPropriedade(propriedadeUuid) { ... }
export async function inserirVacina(dados) { ... }
export async function atualizarVacina(uuid, dados) { ... }
export async function excluirVacina(uuid) { ... }

// ── MEDICAMENTOS ──
export async function listarMedicamentos(animalUuid) { ... }
export async function inserirMedicamento(dados) { ... }
export async function atualizarMedicamento(uuid, dados) { ... }

// ── OCORRÊNCIAS ──
export async function listarOcorrencias(animalUuid) { ... }
export async function inserirOcorrencia(dados) { ... }
export async function atualizarOcorrencia(uuid, dados) { ... }

// ── PESAGENS ──
export async function listarPesagens(animalUuid) { ... }
export async function inserirPesagem(dados) { ... }
export async function atualizarPesagem(uuid, dados) { ... }

// ── REPRODUÇÃO ──
export async function listarReproducao(animalUuid) { ... }
export async function listarGestantes(propriedadeUuid) { ... }
export async function inserirReproducao(dados) { ... }
export async function atualizarReproducao(uuid, dados) { ... }

// ── MEMBROS ──
export async function listarMembros(propriedadeUuid) { ... }
export async function inserirMembro(dados) { ... }
export async function excluirMembro(uuid, propriedadeUuid) { ... }

// ── SYNC METADATA ──
export async function listarPendentes(tabela) { ... }
export async function marcarSincronizado(tabela, uuid) { ... }
export async function atualizarSyncStatus(tabela, uuid, status) { ... }
```

### Padrão de INSERT

Todo INSERT inclui colunas de metadados:

```javascript
export async function inserirAnimal(dados) {
  const uuid = gerarUUID()
  const agora = new Date().toISOString()

  await getDb().executeSql(
    `INSERT INTO animais (
      uuid, propriedade_uuid, id_interno, id_fisico, nome,
      especie, raca, sexo, data_nascimento, peso_inicial,
      pelagem, genetica, origem, mae_uuid, pai_uuid,
      status, deleted,
      created_at, updated_at, synced_at, sync_status
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      uuid, dados.propriedade_uuid, dados.id_interno, dados.id_fisico, dados.nome,
      dados.especie, dados.raca, dados.sexo, dados.data_nascimento, dados.peso_inicial,
      dados.pelagem, dados.genetica, dados.origem, dados.mae_uuid, dados.pai_uuid,
      'ativo', 0,
      agora, agora, null, 'novo'
    ]
  )

  return uuid
}
```

### Padrão de UPDATE

Todo UPDATE atualiza `updated_at` e `sync_status`:

```javascript
export async function atualizarAnimal(uuid, dados) {
  const agora = new Date().toISOString()

  await getDb().executeSql(
    `UPDATE animais SET nome=?, raca=?, peso_inicial=?, pelagem=?,
     updated_at=?, sync_status='modificado'
     WHERE uuid=?`,
    [dados.nome, dados.raca, dados.peso_inicial, dados.pelagem, agora, uuid]
  )
}
```

---

## 4. firestoreService

Responsável por toda interação com o Firestore remoto.

```javascript
// services/firebase/firestore.js
import { db } from './config'
import {
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, serverTimestamp
} from 'firebase/firestore'

// ── PROPERTIES ──
export async function buscarPropriedadeRemoto(uuid) { ... }
export async function listarPropriedadesRemoto(usuarioUid) { ... }
export async function salvarPropriedadeRemoto(dados) { ... }
export async function atualizarPropriedadeRemoto(uuid, dados) { ... }
export async function excluirPropriedadeRemoto(uuid) { ... }

// ── ANIMAIS ──
export async function listarAnimaisRemoto(propriedadeUuid) { ... }
export async function salvarAnimalRemoto(propriedadeUuid, dados) { ... }
export async function atualizarAnimalRemoto(propriedadeUuid, uuid, dados) { ... }
export async function excluirAnimalRemoto(propriedadeUuid, uuid) { ... }

// ── VACINAS ──
export async function listarVacinasRemoto(propriedadeUuid, animalUuid) { ... }
export async function salvarVacinaRemoto(propriedadeUuid, animalUuid, dados) { ... }
export async function atualizarVacinaRemoto(propriedadeUuid, animalUuid, uuid, dados) { ... }

// ── MEDICAMENTOS ──
export async function listarMedicamentosRemoto(propriedadeUuid, animalUuid) { ... }
export async function salvarMedicamentoRemoto(propriedadeUuid, animalUuid, dados) { ... }

// ── OCORRÊNCIAS ──
export async function listarOcorrenciasRemoto(propriedadeUuid, animalUuid) { ... }
export async function salvarOcorrenciaRemoto(propriedadeUuid, animalUuid, dados) { ... }

// ── PESAGENS ──
export async function listarPesagensRemoto(propriedadeUuid, animalUuid) { ... }
export async function salvarPesagemRemoto(propriedadeUuid, animalUuid, dados) { ... }

// ── REPRODUÇÃO ──
export async function listarReproducaoRemoto(propriedadeUuid, animalUuid) { ... }
export async function salvarReproducaoRemoto(propriedadeUuid, animalUuid, dados) { ... }

// ── MEMBROS ──
export async function listarMembrosRemoto(propriedadeUuid) { ... }
export async function salvarMembroRemoto(propriedadeUuid, dados) { ... }
export async function excluirMembroRemoto(propriedadeUuid, membroUuid) { ... }
```

### Exemplo de implementação

```javascript
export async function listarAnimaisRemoto(propriedadeUuid) {
  const q = query(
    collection(db, 'propriedade', propriedadeUuid, 'animais'),
    where('deleted', '==', false),
    orderBy('nome')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ uuid: doc.id, ...doc.data() }))
}
```

---

## 5. Service de Negócio (orquestrador)

Cada service de negócio orquestra SQLite + Sync.

### Exemplo: animalService.js

```javascript
import * as sqlite from './sqlite/queries'
import * as firestore from './firebase/firestore'
import * as sync from './sync/syncService'

export async function criarAnimal(dados) {
  // 1. Salvar local (imediato)
  const uuid = await sqlite.inserirAnimal(dados)

  // 2. Marcar para sync
  await sync.pendenciar('animais', uuid)

  // 3. Retornar dados para UI atualizar
  return { ...dados, uuid, sync_status: 'novo' }
}

export async function listarAnimais(propriedadeUuid) {
  // Sempre ler do SQLite
  return await sqlite.listarAnimais(propriedadeUuid)
}

export async function editarAnimal(uuid, dados) {
  // 1. Atualizar local
  await sqlite.atualizarAnimal(uuid, dados)

  // 2. Marcar para sync
  await sync.pendenciar('animais', uuid)

  // 3. Retornar dados atualizados
  return await sqlite.buscarAnimal(uuid)
}

export async function excluirAnimal(uuid) {
  // Soft delete local
  await sqlite.excluirAnimal(uuid)
  await sync.pendenciar('animais', uuid)
}

export async function buscarAnimal(uuid) {
  return await sqlite.buscarAnimal(uuid)
}
```

### Exemplo: propriedadeService.js

```javascript
import * as sqlite from './sqlite/queries'
import * as firestore from './firebase/firestore'
import * as sync from './sync/syncService'

export async function criarPropriedade(dados) {
  const uuid = await sqlite.inserirPropriedade(dados)
  await sync.pendenciar('propriedades', uuid)
  return { ...dados, uuid }
}

export async function listarPropriedades(usuarioUuid) {
  // Ler do SQLite (dados já sincronizados no login)
  return await sqlite.listarPropriedades(usuarioUuid)
}

export async function buscarPropriedade(uuid) {
  return await sqlite.buscarPropriedade(uuid)
}

export async function editarPropriedade(uuid, dados) {
  await sqlite.atualizarPropriedade(uuid, dados)
  await sync.pendenciar('propriedades', uuid)
  return await sqlite.buscarPropriedade(uuid)
}

export async function excluirPropriedade(uuid) {
  await sqlite.excluirPropriedade(uuid)
  await sync.pendenciar('propriedades', uuid)
}
```

---

## 6. Padrão de Retorno para UI

Todas as funções de negócio retornam **dados prontos para renderização**:

```javascript
// ✅ Correto — retorna dados locais
const animais = await animalService.listarAnimais(propriedadeId)
setAnimais(animais)

// ❌ Errado — UI nunca chama SQLite diretamente
const animais = await sqliteService.listarAnimais(propriedadeId)

// ❌ Errado — UI nunca chama Firestore para leitura
const animais = await firestoreService.listarAnimaisRemoto(propriedadeId)
```

---

## 7. Fluxo de Escrita Completo

```text
Usuário clica "Salvar"
       │
       ▼
┌─────────────────────┐
│ animalService       │
│ .criarAnimal(dados) │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌─────────┐  ┌──────────────┐
│ SQLite  │  │ syncService  │
│ INSERT  │  │ .pendenciar()│
└────┬────┘  └──────┬───────┘
     │              │
     ▼              ▼
  Retorno       Fila de sync
  para UI       (sync_status = 'novo')
                    │
                    ▼ (quando houver internet)
              ┌───────────┐
              │ Firestore │
              │ setDoc()  │
              └─────┬─────┘
                    │
                    ▼
              sync_status = 'sincronizado'
              synced_at = agora
```
