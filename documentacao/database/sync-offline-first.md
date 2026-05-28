# Estratégia de Sincronização Offline-First

> Como o **Propriedade Inteligente** funciona sem internet e sincroniza dados com o Firestore.
> Decisões: Timestamp-based (Last Write Wins), sync híbrida (auto + manual), soft delete por entidade.

---

## 1. Princípios Fundamentais

1. **O app funciona 100% offline.** Todas as operações (CRUD) são persistidas no SQLite local primeiro.
2. **SQLite é a fonte da verdade para o dispositivo.** O app sempre lê/escreve no SQLite.
3. **Firestore é o backup na nuvem.** Dados são enviados ao Firestore em segundo plano.
4. **O usuário nunca perde dados.** Se a sync falhar, os dados ficam no SQLite até serem enviados.
5. **Last Write Wins (LWW).** Em caso de conflito, o registro com `updated_at` mais recente vence.

---

## 2. Colunas de Controle em Cada Tabela

Todas as 9 tabelas possuem as seguintes colunas de metadados:

```sql
created_at     TEXT NOT NULL       -- ISO 8601, definido na criação
updated_at     TEXT NOT NULL       -- ISO 8601, atualizado a cada modificação
synced_at      TEXT                -- ISO 8601, última sync bem-sucedida (NULL = nunca sincronizado)
sync_status    TEXT DEFAULT 'novo' -- 'novo' | 'modificado' | 'sincronizado'
```

### Estados de `sync_status`

| Estado         | Significado                                          | Quando ocorre                    |
|----------------|------------------------------------------------------|----------------------------------|
| `novo`         | Registro criado localmente, nunca enviado ao Firestore | INSERT no SQLite                |
| `modificado`   | Registro alterado localmente após última sync         | UPDATE no SQLite                 |
| `sincronizado` | Dados locais e remotos idênticos                      | Após sync bem-sucedida           |

### Fluxo de Estados

```text
         INSERT                 UPDATE                  SYNC OK
  ┌──────────────┐      ┌──────────────────┐      ┌─────────────────┐
  │              │      │                  │      │                 │
  │     novo     │─────►│    modificado    │─────►│  sincronizado   │
  │              │      │                  │      │                 │
  └──────────────┘      └──────────────────┘      └─────────────────┘
         │                                               │
         │              UPDATE                           │
         └───────────────────────────────────────────────┘
```

---

## 3. Estratégia de Sincronização: Timestamp-based (LWW)

### Como funciona

1. Cada registro tem `updated_at` (quando foi modificado localmente) e `synced_at` (quando foi enviado à nuvem).
2. Um registro é considerado **pendente** quando `sync_status != 'sincronizado'`.
3. Na sincronização, o app compara `updated_at` do local com `updated_at` do Firestore.
4. **O registro com `updated_at` mais recente vence.**

### Pseudocódigo da sincronização

```javascript
async function sincronizarTabela(nomeTabela) {
  // 1. Buscar registros pendentes no SQLite local
  const pendentes = await db.query(
    `SELECT * FROM ${nomeTabela} WHERE sync_status IN ('novo', 'modificado')`
  );
  
  // 2. Para cada registro pendente, enviar ao Firestore
  for (const registro of pendentes) {
    const remoto = await firestore.get(`${caminho}/${registro.uuid}`);
    
    if (!remoto) {
      // Registro não existe no remoto → criar
      await firestore.set(`${caminho}/${registro.uuid}`, registro);
      await db.run(
        `UPDATE ${nomeTabela} SET sync_status = 'sincronizado', synced_at = ? WHERE uuid = ?`,
        [new Date().toISOString(), registro.uuid]
      );
    } else if (new Date(registro.updated_at) > new Date(remoto.updated_at)) {
      // Local é mais recente → atualizar remoto
      await firestore.update(`${caminho}/${registro.uuid}`, registro);
      await db.run(
        `UPDATE ${nomeTabela} SET sync_status = 'sincronizado', synced_at = ? WHERE uuid = ?`,
        [new Date().toISOString(), registro.uuid]
      );
    } else {
      // Remoto é mais recente → atualizar local
      await db.run(
        `UPDATE ${nomeTabela} SET ...remoto, sync_status = 'sincronizado', synced_at = ? WHERE uuid = ?`,
        [new Date().toISOString(), registro.uuid]
      );
    }
  }
}
```

### Limitações do LWW

- **Edições simultâneas:** Se dois dispositivos editam o mesmo registro ao mesmo tempo, a edição mais recente sobrescreve a outra.
- **Mitigação:** Para o contexto deste projeto (pequenos produtores, 1-2 dispositivos), o risco é baixo. Se necessário no futuro, pode-se implementar CRDTs ou merge manual.

---

## 4. Tipos de Sincronização

### 4.1. Sincronização Automática (Background)

**Quando:** O app detecta que há conexão com a internet (Wi-Fi ou dados móveis).

```javascript
// Hook useSincronizacao.js
useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable) {
      sincronizarTudo();
    }
  });
  return () => unsubscribe();
}, []);
```

**Comportamento:**
- Executa a cada 5 minutos quando online (debounce para evitar excesso de requests).
- Processa registros na ordem de `updated_at` (mais antigos primeiro).
- Atualiza `sync_status` para `'sincronizado'` após sucesso.
- Exibe badge/ícone de status na interface.

### 4.2. Sincronização Manual (Pull-to-Refresh)

**Quando:** O usuário puxa a tela para baixo (pull-to-refresh) ou clica no botão de sync.

```javascript
// Em qualquer tela com lista
async function handleRefresh() {
  setIsSyncing(true);
  await sincronizarTudo();
  await carregarDados(); // Recarrega dados do SQLite
  setIsSyncing(false);
}
```

**Comportamento:**
- Força uma sincronização imediata, independente do estado da conexão.
- Se offline, exibe mensagem: "Sem conexão. Dados serão sincronizados quando houver internet."
- Se online, sincroniza e recarrega os dados na tela.

### 4.3. Fluxo Híbrido

```text
┌──────────────────────────────────────────────────────────────────────┐
│                        USUÁRIO INTERAGE                              │
│                   (cria/edita/exclui registro)                       │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
                       ▼
            ┌─────────────────────┐
            │   SALVAR NO SQLITE  │  ← Sempre imediato
            │   (sync_status=novo │
            │    ou modificado)   │
            └──────────┬──────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
           ▼                       ▼
  ┌─────────────────┐    ┌──────────────────┐
  │  AUTO (background)│    │  MANUAL (refresh) │
  │  A cada 5 min    │    │  Quando usuário   │
  │  quando online   │    │  puxa a tela      │
  └────────┬────────┘    └────────┬─────────┘
           │                       │
           ▼                       ▼
  ┌──────────────────────────────────────────┐
  │         ENVIAR AO FIRESTORE              │
  │  (registros com sync_status != sincron.) │
  └──────────────────┬───────────────────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │  sync_status =      │
          │  'sincronizado'     │
          │  synced_at = NOW()  │
          └─────────────────────┘
```

---

## 5. Soft Delete por Entidade

Nem todas as tabelas usam soft delete. A decisão depende da necessidade de preservar histórico.

### Tabela de decisão

| Tabela           | Soft Delete? | Justificativa                                           |
|------------------|:------------:|---------------------------------------------------------|
| `usuarios`       | Não          | Usuário deletado é removido do Firebase Auth            |
| `propriedades`   | Não          | Exclui cascata de animais (confirmar com usuário)       |
| `prop_membros`   | Não          | Vínculo simples, removido diretamente                   |
| `animais`        | **Sim**      | Histórico financeiro e genealógico deve ser preservado  |
| `vacinas`        | Não          | Registros históricos de saúde, podem ser corrigidos     |
| `medicamentos`   | Não          | Registros de carência precisam persistir                |
| `ocorrencias`    | Não          | Histórico clínico do animal                             |
| `pesagens`       | Não          | Dados de desempenho para cálculo de GMD                 |
| `reproducao`     | Não          | Ciclo reprodutivo completo deve ser mantido             |

### Como funciona o soft delete (animais)

```sql
-- Soft delete: marca como deletado
UPDATE animais
SET deleted = 1, updated_at = datetime('now'), sync_status = 'modificado'
WHERE uuid = ?;

-- Na listagem, filtrar deletados
SELECT * FROM animais WHERE deleted = 0;

-- No Firestore, marcar como deletado
updateDoc(doc(db, 'propriedade', propId, 'animais', animalId), {
  deleted: true,
  updated_at: serverTimestamp()
});
```

### Hard delete (outras tabelas)

```sql
-- Hard delete: remove permanentemente
DELETE FROM vacinas WHERE uuid = ?;

-- No Firestore, deletar o documento
deleteDoc(doc(db, 'propriedade', propId, 'animais', animalId, 'vacinas', vacinaId));
```

---

## 6. Indicadores de Status na Interface

### Ícones/Badges de sincronização

| Status         | Ícone | Cor    | Texto tooltip               |
|----------------|-------|--------|-----------------------------|
| `sincronizado` | ☁️✅  | Verde  | "Dados sincronizados"       |
| `modificado`   | ☁️⏳  | Amarelo | "Alterações pendentes"     |
| `novo`         | ☁️📤  | Azul   | "Aguardando sincronização"  |
| Offline        | ☁️❌  | Cinza  | "Sem conexão"               |

### Exemplo de componente

```jsx
function SyncBadge({ syncStatus, isOnline }) {
  if (!isOnline) {
    return <span className={styles.offline}>☁️❌ Sem conexão</span>;
  }

  switch (syncStatus) {
    case 'sincronizado':
      return <span className={styles.synced}>☁️✅ Sincronizado</span>;
    case 'modificado':
      return <span className={styles.pending}>☁️⏳ Alterações pendentes</span>;
    case 'novo':
      return <span className={styles.new}>☁️📤 Aguardando sync</span>;
    default:
      return null;
  }
}
```

---

## 7. Tratamento de Erros

### Erros durante a sincronização

| Erro                                    | Ação                                           |
|-----------------------------------------|------------------------------------------------|
| Sem conexão                             | Fila mantida, tenta novamente depois           |
| Timeout (>30s)                          | Logar erro, manter na fila                     |
| Permissão negada (Firestore rules)      | Logar erro, notificar usuário                  |
| Documento muito grande (>1MB)           | Logar erro, alertar usuário                    |
| Conflito (remoto mais recente)          | Atualizar local com dados remotos              |

### Log de erros

```sql
-- Tabela de log de erros (opcional, pós-MVP)
CREATE TABLE sync_log (
    uuid           TEXT PRIMARY KEY,
    tabela         TEXT NOT NULL,       -- Nome da tabela
    registro_uuid  TEXT NOT NULL,       -- UUID do registro que falhou
    operacao       TEXT NOT NULL,       -- 'push' | 'pull'
    erro           TEXT NOT NULL,       -- Mensagem de erro
    tentativas     INTEGER DEFAULT 1,   -- Número de tentativas
    created_at     TEXT NOT NULL
);
```

---

## 8. Configurações do Usuário

### Preferências de sincronização

```javascript
// Armazenado em SharedPreferences (Android) ou localStorage (web)
const SYNC_PREFERENCES = {
  syncAutomatica: true,        // Sincronizar automaticamente
  syncApenasWifi: false,        // Sincronizar apenas em Wi-Fi
  intervaloSync: 300000,        // 5 minutos em milissegundos
  notificarSync: true,          // Exibir notificação de sync
};
```

---

## 9. Sequência de Inicialização

Ao abrir o app:

```javascript
async function inicializarApp() {
  // 1. Verificar autenticação Firebase
  const user = await firebaseAuth.getCurrentUser();
  if (!user) return navigate('/login');

  // 2. Carregar dados do SQLite local (imediato)
  const dados = await carregarDadosLocais();
  renderizarUI(dados);

  // 3. Verificar conexão
  const netInfo = await NetInfo.fetch();
  
  if (netInfo.isConnected) {
    // 4a. Online: sincronizar pendentes + baixar atualizações
    await sincronizarTudo();
    await baixarAtualizacoes();
  } else {
    // 4b. Offline: exibir badge de offline
    mostrarBadgeOffline();
  }
}
```

---

## 10. Resumo das Decisões

| Decisão                          | Escolha                                  |
|----------------------------------|------------------------------------------|
| Estratégia de conflito           | Timestamp-based (Last Write Wins)        |
| IDs                              | UUID v4 gerado localmente                |
| Controle de sync                 | Colunas de metadados em cada tabela      |
| Soft delete                      | Apenas em `animais` (preserva histórico)  |
| Sync automática                  | Sim, a cada 5 min quando online          |
| Sync manual                      | Pull-to-refresh + botão de sync          |
| Cache Firestore SDK              | Desabilitado (SQLite é o cache local)    |
| Resolução de conflitos           | `updated_at` mais recente vence          |
