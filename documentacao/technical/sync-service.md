# Serviço de Sincronização

> Orquestra a sincronização entre **SQLite (local)** e **Firestore (remoto)**.
> 3 modos: pull (remoto→local), push (local→remoto), sync completa.

---

## 1. Estrutura de Arquivos

```text
src/services/sync/
├── syncService.js       # Orquestrador principal
├── pullService.js       # Baixar dados remotos → local
└── pushService.js       # Enviar dados locais → remoto
```

---

## 2. syncService.js (orquestrador)

```javascript
// services/sync/syncService.js
import * as pull from './pullService'
import * as push from './pushService'
import * as sqlite from '../sqlite/queries'
import { useOffline } from '../../contexts/OfflineContext'

// ── Sincronização completa ──
export async function sincronizar() {
  await pull.pullDados()
  await push.pushPendentes()
}

// ── Marcar registro como pendente ──
export async function pendenciar(tabela, uuid) {
  await sqlite.atualizarSyncStatus(tabela, uuid, 'novo')
}

// ── Contar registros pendentes ──
export async function contarPendentes() {
  const tabelas = ['propriedades', 'animais', 'vacinas', 'medicamentos',
                   'ocorrencias', 'pesagens', 'reproducao', 'propriedade_membros']
  let total = 0
  for (const tabela of tabelas) {
    const count = await sqlite.contarPendentes(tabela)
    total += count
  }
  return total
}

// ── Pull de dados (remoto → local) ──
export async function pullDados() {
  await pull.pullDados()
}

// ── Push de pendências (local → remoto) ──
export async function pushPendentes() {
  await push.pushPendentes()
}
```

---

## 3. pullService.js (remoto → local)

### Pull no login (propriedades + membros)

```javascript
// services/sync/pullService.js
import * as firestore from '../firebase/firestore'
import * as sqlite from '../sqlite/queries'
import { auth } from '../firebase/config'

export async function pullDados() {
  const user = auth.currentUser
  if (!user) return

  // 1. Pull propriedades do usuário
  await pullPropriedades(user.uid)

  // 2. Pull dados detalhados de cada propriedade (background)
  const propriedades = await sqlite.listarPropriedades(user.uid)
  for (const prop of propriedades) {
    await pullDadosPropriedade(prop.uuid)
  }
}

async function pullPropriedades(usuarioUid) {
  // Buscar propriedades do Firestore onde o usuário é membro
  const remotos = await firestore.listarPropriedadesRemoto(usuarioUid)

  for (const remoto of remotos) {
    const local = await sqlite.buscarPropriedade(remoto.uuid)

    if (!local) {
      // Nova propriedade → inserir localmente
      await sqlite.inserirPropriedadeRemota(remoto)
    } else if (remoto.updated_at > local.updated_at) {
      // Remoto mais recente → atualizar local
      await sqlite.atualizarPropriedadeRemota(remoto.uuid, remoto)
    }
    // Se local é mais recente → será pushado depois
  }

  // Pull membros de cada propriedade
  for (const remoto of remotos) {
    await pullMembros(remoto.uuid)
  }
}

async function pullMembros(propriedadeId) {
  const remotos = await firestore.listarMembrosRemoto(propriedadeId)

  for (const remoto of remotos) {
    const local = await sqlite.buscarMembro(remoto.uuid, propriedadeId)

    if (!local) {
      await sqlite.inserirMembroRemoto(remoto)
    } else if (remoto.updated_at > local.updated_at) {
      await sqlite.atualizarMembroRemoto(remoto.uuid, remoto)
    }
  }
}

async function pullDadosPropriedade(propriedadeId) {
  // Pull animais
  await pullAnimais(propriedadeId)

  // Pull subcoleções de cada animal
  const animais = await sqlite.listarAnimais(propriedadeId)
  for (const animal of animais) {
    await pullVacinas(propriedadeId, animal.uuid)
    await pullMedicamentos(propriedadeId, animal.uuid)
    await pullOcorrencias(propriedadeId, animal.uuid)
    await pullPesagens(propriedadeId, animal.uuid)
    await pullReproducao(propriedadeId, animal.uuid)
  }
}

async function pullAnimais(propriedadeId) {
  const remotos = await firestore.listarAnimaisRemoto(propriedadeId)

  for (const remoto of remotos) {
    const local = await sqlite.buscarAnimal(remoto.uuid)

    if (!local) {
      await sqlite.inserirAnimalRemoto(remoto)
    } else if (local.sync_status === 'sincronizado' && remoto.updated_at > local.updated_at) {
      // Só atualiza se local não tem mudanças pendentes
      await sqlite.atualizarAnimalRemoto(remoto.uuid, remoto)
    }
    // Se local tem sync_status='novo' ou 'modificado' → manter local
  }
}

// Funções similares para pullVacinas, pullMedicamentos, etc.
// Seguem o mesmo padrão: comparar updated_at, inserir ou atualizar
```

### Padrão de pull para subcoleções

```javascript
async function pullVacinas(propriedadeId, animalId) {
  const remotos = await firestore.listarVacinasRemoto(propriedadeId, animalId)

  for (const remoto of remotos) {
    const local = await sqlite.buscarVacina(remoto.uuid)

    if (!local) {
      await sqlite.inserirVacinaRemota(remoto)
    } else if (local.sync_status === 'sincronizado' && remoto.updated_at > local.updated_at) {
      await sqlite.atualizarVacinaRemota(remoto.uuid, remoto)
    }
  }
}
```

---

## 4. pushService.js (local → remoto)

```javascript
// services/sync/pushService.js
import * as firestore from '../firebase/firestore'
import * as sqlite from '../sqlite/queries'
import { auth } from '../firebase/config'

export async function pushPendentes() {
  const tabelas = [
    { nome: 'propriedades', push: pushPropriedade },
    { nome: 'animais', push: pushAnimal },
    { nome: 'vacinas', push: pushVacina },
    { nome: 'medicamentos', push: pushMedicamento },
    { nome: 'ocorrencias', push: pushOcorrencia },
    { nome: 'pesagens', push: pushPesagem },
    { nome: 'reproducao', push: pushReproducao },
    { nome: 'propriedade_membros', push: pushMembro },
  ]

  for (const { nome, push } of tabelas) {
    const pendentes = await sqlite.listarPendentes(nome)

    for (const registro of pendentes) {
      try {
        await push(registro)
        await sqlite.marcarSincronizado(nome, registro.uuid)
      } catch (erro) {
        console.error(`Erro ao sincronizar ${nome}/${registro.uuid}:`, erro)
        // Manter como pendente para tentar novamente depois
      }
    }
  }
}

async function pushPropriedade(registro) {
  if (registro.deleted) {
    // Propriedade foi excluída → marcar como deletada no Firestore
    await firestore.atualizarPropriedadeRemoto(registro.uuid, {
      deleted: true,
      updated_at: registro.updated_at,
    })
  } else {
    // Verificar se existe no remoto
    const remoto = await firestore.buscarPropriedadeRemoto(registro.uuid)

    if (!remoto) {
      // Não existe → criar
      await firestore.salvarPropriedadeRemoto(registro)
    } else if (registro.updated_at > remoto.updated_at) {
      // Local mais recente → atualizar remoto
      await firestore.atualizarPropriedadeRemoto(registro.uuid, registro)
    }
    // Se remoto é mais recente → já tratado no pull
  }
}

async function pushAnimal(registro) {
  const propriedadeId = registro.propriedade_uuid

  if (registro.deleted) {
    await firestore.atualizarAnimalRemoto(propriedadeId, registro.uuid, {
      deleted: true,
      updated_at: registro.updated_at,
    })
  } else {
    const remoto = await firestore.buscarAnimalRemoto(propriedadeId, registro.uuid)

    if (!remoto) {
      await firestore.salvarAnimalRemoto(propriedadeId, registro)
    } else if (registro.updated_at > remoto.updated_at) {
      await firestore.atualizarAnimalRemoto(propriedadeId, registro.uuid, registro)
    }
  }
}

// Funções similares para pushVacina, pushMedicamento, etc.
// Seguem o mesmo padrão: verificar existência, criar ou atualizar
```

---

## 5. Quando a Sync Acontece

### 5.1. Sync no login

```javascript
// SyncContext.jsx — useEffect
useEffect(() => {
  if (autenticado) {
    syncService.pullDados() // Pull propriedades + dados básicos
  }
}, [autenticado])
```

### 5.2. Sync ao acessar propriedade

```javascript
// PropriedadeContext.jsx — selecionarPropriedade
async function selecionarPropriedade(uuid) {
  // Buscar do SQLite (imediato)
  const prop = await propriedadeService.buscarPropriedade(uuid)

  // Pull dados detalhados em background
  syncService.pullDadosPropriedade(uuid)

  return prop
}
```

### 5.3. Sync periódica (a cada 5 min)

```javascript
// SyncContext.jsx — useEffect
useEffect(() => {
  if (!autenticado || !isOnline) return

  const intervalo = setInterval(async () => {
    await syncService.sincronizar() // pull + push
  }, 5 * 60 * 1000) // 5 minutos

  return () => clearInterval(intervalo)
}, [autenticado, isOnline])
```

### 5.4. Sync ao reconectar

```javascript
// SyncContext.jsx — useEffect
useEffect(() => {
  if (isOnline && autenticado) {
    syncService.sincronizar()
  }
}, [isOnline])
```

### 5.5. Sync manual (pull-to-refresh)

```javascript
// Em qualquer tela com lista
async function handleRefresh() {
  setIsRefreshing(true)
  await syncService.sincronizar()
  await carregarDados() // Recarregar do SQLite
  setIsRefreshing(false)
}
```

---

## 6. Verificação de Mudanças (Optimização)

Para evitar baixar dados desnecessários, comparar `updated_at`:

```javascript
async function pullAnimais(propriedadeId) {
  // 1. Buscar apenas registros atualizados desde última sync
  const ultimaSync = await sqlite.obterUltimaSync('animais', propriedadeId)

  const remotos = await firestore.listarAnimaisAtualizados(propriedadeId, ultimaSync)

  // 2. Aplicar apenas mudanças
  for (const remoto of remotos) {
    const local = await sqlite.buscarAnimal(remoto.uuid)

    if (!local) {
      await sqlite.inserirAnimalRemoto(remoto)
    } else if (local.sync_status === 'sincronizado') {
      await sqlite.atualizarAnimalRemoto(remoto.uuid, remoto)
    }
  }

  // 3. Atualizar timestamp de última sync
  await sqlite.atualizarUltimaSync('animais', propriedadeId, new Date().toISOString())
}
```

---

## 7. Tratamento de Erros na Sync

```javascript
async function pushAnimal(registro) {
  try {
    const remoto = await firestore.buscarAnimalRemoto(
      registro.propriedade_uuid,
      registro.uuid
    )

    if (!remoto) {
      await firestore.salvarAnimalRemoto(registro.propriedade_uuid, registro)
    } else {
      await firestore.atualizarAnimalRemoto(
        registro.propriedade_uuid,
        registro.uuid,
        registro
      )
    }

    await sqlite.marcarSincronizado('animais', registro.uuid)

  } catch (erro) {
    // Logar erro mas não parar sync
    console.error(`Falha ao pushar animal ${registro.uuid}:`, erro)

    // Classificar erro
    if (erro.code === 'permission-denied') {
      // Usuário não tem permissão → alertar
      registrarErro('animais', registro.uuid, 'permissao', erro.message)
    } else if (erro.code === 'unavailable') {
      // Sem conexão → tentar depois
      registrarErro('animais', registro.uuid, 'conexao', erro.message)
    } else {
      // Erro desconhecido → logar
      registrarErro('animais', registro.uuid, 'desconhecido', erro.message)
    }
  }
}
```

---

## 8. Resumo dos Modos de Sync

| Modo           | Quando                          | O que faz                    |
|----------------|---------------------------------|------------------------------|
| **Pull login** | Ao logar                        | Baixa propriedades + membros |
| **Pull prop.** | Ao acessar propriedade          | Baixa animais + subcoleções  |
| **Periódica**  | A cada 5 min (se online)        | Pull incremental + push      |
| **Reconexão**  | Ao detectar internet            | Pull + push automático       |
| **Manual**     | Pull-to-refresh ou botão        | Pull + push forçado          |
| **Push**       | Após cada escrita local         | Envia pendências ao remoto   |
