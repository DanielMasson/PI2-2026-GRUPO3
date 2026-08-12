const SQL_TABELAS = [
  // ── 1. usuarios ──
  `CREATE TABLE IF NOT EXISTS usuarios (
    uuid TEXT PRIMARY KEY,
    firebase_uid TEXT UNIQUE,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT,
    foto_url TEXT,
    cargo TEXT DEFAULT 'dono',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT,
    sync_status TEXT DEFAULT 'novo'
  )`,

  // ── 2. propriedades ──
  `CREATE TABLE IF NOT EXISTS propriedades (
    uuid TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    localizacao TEXT,
    tamanho_ha REAL,
    dono_uuid TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT,
    sync_status TEXT DEFAULT 'novo'
  )`,

  // ── 3. propriedade_membros ──
  `CREATE TABLE IF NOT EXISTS propriedade_membros (
    uuid TEXT PRIMARY KEY,
    propriedade_uuid TEXT NOT NULL,
    usuario_uuid TEXT NOT NULL,
    cargo TEXT NOT NULL DEFAULT 'peao',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT,
    sync_status TEXT DEFAULT 'novo'
  )`,

  // ── 4. animais ──
  `CREATE TABLE IF NOT EXISTS animais (
    uuid TEXT PRIMARY KEY,
    propriedade_uuid TEXT NOT NULL,
    id_interno TEXT,
    id_fisico TEXT,
    nome TEXT NOT NULL,
    especie TEXT NOT NULL,
    raca TEXT NOT NULL,
    sexo TEXT NOT NULL,
    data_nascimento TEXT NOT NULL,
    peso_inicial REAL,
    pelagem TEXT,
    genetica TEXT,
    origem TEXT,
    mae_uuid TEXT,
    pai_uuid TEXT,
    status TEXT DEFAULT 'ativo',
    deleted INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT,
    sync_status TEXT DEFAULT 'novo'
  )`,

  // ── 5. vacinas ──
  `CREATE TABLE IF NOT EXISTS vacinas (
    uuid TEXT PRIMARY KEY,
    animal_uuid TEXT NOT NULL,
    propriedade_uuid TEXT NOT NULL,
    nome_vacina TEXT NOT NULL,
    data_aplicacao TEXT NOT NULL,
    proxima_dose TEXT,
    ciclo_dias INTEGER,
    obrigatoria INTEGER DEFAULT 0,
    lote TEXT,
    responsavel TEXT,
    observacao TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT,
    sync_status TEXT DEFAULT 'novo'
  )`,

  // ── 6. medicamentos ──
  `CREATE TABLE IF NOT EXISTS medicamentos (
    uuid TEXT PRIMARY KEY,
    animal_uuid TEXT NOT NULL,
    propriedade_uuid TEXT NOT NULL,
    tipo TEXT NOT NULL,
    produto TEXT NOT NULL,
    dose TEXT,
    data_aplicacao TEXT NOT NULL,
    carencia_dias INTEGER DEFAULT 0,
    data_liberacao TEXT,
    responsavel TEXT,
    observacao TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT,
    sync_status TEXT DEFAULT 'novo'
  )`,

  // ── 7. ocorrencias ──
  `CREATE TABLE IF NOT EXISTS ocorrencias (
    uuid TEXT PRIMARY KEY,
    animal_uuid TEXT NOT NULL,
    propriedade_uuid TEXT NOT NULL,
    data TEXT NOT NULL,
    sintomas TEXT NOT NULL,
    tratamento TEXT,
    resultado TEXT DEFAULT 'aguardando',
    veterinario TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT,
    sync_status TEXT DEFAULT 'novo'
  )`,

  // ── 8. pesagens ──
  `CREATE TABLE IF NOT EXISTS pesagens (
    uuid TEXT PRIMARY KEY,
    animal_uuid TEXT NOT NULL,
    propriedade_uuid TEXT NOT NULL,
    data TEXT NOT NULL,
    peso REAL NOT NULL,
    ecc INTEGER,
    observacao TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT,
    sync_status TEXT DEFAULT 'novo'
  )`,

  // ── 9. reproducao ──
  `CREATE TABLE IF NOT EXISTS reproducao (
    uuid TEXT PRIMARY KEY,
    animal_uuid TEXT NOT NULL,
    propriedade_uuid TEXT NOT NULL,
    tipo_cobertura TEXT NOT NULL,
    data_cobertura TEXT NOT NULL,
    touro_uuid TEXT,
    prenhez_confirmada INTEGER DEFAULT 0,
    data_confirmacao TEXT,
    data_previa_parto TEXT,
    data_secagem TEXT,
    data_parto TEXT,
    observacao TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT,
    sync_status TEXT DEFAULT 'novo'
  )`,

  // ── 10. movimentacoes_local ── (Sprint 6: Locação persistente)
  `CREATE TABLE IF NOT EXISTS movimentacoes_local (
    uuid TEXT PRIMARY KEY,
    animal_uuid TEXT NOT NULL,
    propriedade_uuid TEXT NOT NULL,
    data TEXT NOT NULL,
    hora TEXT,
    tipo TEXT NOT NULL DEFAULT 'sono',
    area TEXT NOT NULL,
    observacao TEXT,
    deleted INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT,
    sync_status TEXT DEFAULT 'novo'
  )`,

  // ── 11. propriedade_vacinas_obrigatorias ── (Sprint 6: lista configurável)
  `CREATE TABLE IF NOT EXISTS propriedade_vacinas_obrigatorias (
    uuid TEXT PRIMARY KEY,
    propriedade_uuid TEXT NOT NULL,
    nome_vacina TEXT NOT NULL,
    especie TEXT,
    sexo TEXT,
    ciclo_dias INTEGER NOT NULL DEFAULT 365,
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT,
    sync_status TEXT DEFAULT 'novo'
  )`,

  // ── 12. ci_os ── (Sprint 7: detecção de cio antes da cobertura)
  `CREATE TABLE IF NOT EXISTS ci_os (
    uuid TEXT PRIMARY KEY,
    animal_uuid TEXT NOT NULL,
    propriedade_uuid TEXT NOT NULL,
    data TEXT NOT NULL,
    sintomas TEXT,
    intensidade TEXT,
    observacao TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT,
    sync_status TEXT DEFAULT 'novo'
  )`,

  // ── 13. producao_leite ── (Sprint 6/8: ordenhas)
  `CREATE TABLE IF NOT EXISTS producao_leite (
    uuid TEXT PRIMARY KEY,
    animal_uuid TEXT NOT NULL,
    propriedade_uuid TEXT NOT NULL,
    data TEXT NOT NULL,
    manha_litros REAL DEFAULT 0,
    tarde_litros REAL DEFAULT 0,
    ccs INTEGER,
    observacao TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT,
    sync_status TEXT DEFAULT 'novo'
  )`,

  // ── 14. categorias_financeiras ── (Sprint 10: catálogo fixo de categorias)
  // Apenas SQLite local (não sincroniza). Seed via SQL_MIGRACOES com INSERT OR IGNORE.
  `CREATE TABLE IF NOT EXISTS categorias_financeiras (
    uuid TEXT PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    rotulo TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('receita','despesa')),
    ordem INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  )`,

  // ── 15. transacoes_financeiras ── (Sprint 10: entradas/saídas por categoria)
  // animal_uuid OPCIONAL: vínculo para relatório por animal (ex.: despesa de ração de uma vaca).
  `CREATE TABLE IF NOT EXISTS transacoes_financeiras (
    uuid TEXT PRIMARY KEY,
    propriedade_uuid TEXT NOT NULL,
    animal_uuid TEXT,
    categoria_uuid TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('receita','despesa')),
    descricao TEXT,
    valor REAL NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT,
    sync_status TEXT DEFAULT 'novo',
    deleted INTEGER DEFAULT 0
  )`,

  // ── 16. notificacoes ── (Sprint 11: alertas push-local de eventos)
  `CREATE TABLE IF NOT EXISTS notificacoes (
    uuid TEXT PRIMARY KEY,
    propriedade_uuid TEXT NOT NULL,
    usuario_uuid TEXT,
    tipo TEXT NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    nivel TEXT DEFAULT 'info',
    modulo TEXT,
    referencia_uuid TEXT,
    lida INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT,
    sync_status TEXT DEFAULT 'novo',
    deleted INTEGER DEFAULT 0
  )`,

  // ── 17. baixas ── (Sprint 10: registro de venda/morte/consumo — RF08)
  `CREATE TABLE IF NOT EXISTS baixas (
    uuid TEXT PRIMARY KEY,
    animal_uuid TEXT NOT NULL,
    propriedade_uuid TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('venda','morte','consumo')),
    valor_recebido REAL DEFAULT 0,
    data TEXT NOT NULL,
    motivo TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT,
    sync_status TEXT DEFAULT 'novo',
    deleted INTEGER DEFAULT 0
  )`,
]

const SQL_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_propriedades_dono ON propriedades(dono_uuid)',
  'CREATE INDEX IF NOT EXISTS idx_membros_propriedade ON propriedade_membros(propriedade_uuid)',
  'CREATE INDEX IF NOT EXISTS idx_membros_usuario ON propriedade_membros(usuario_uuid)',
  'CREATE INDEX IF NOT EXISTS idx_animais_propriedade ON animais(propriedade_uuid)',
  'CREATE INDEX IF NOT EXISTS idx_animais_especie ON animais(especie)',
  'CREATE INDEX IF NOT EXISTS idx_animais_sexo ON animais(sexo)',
  'CREATE INDEX IF NOT EXISTS idx_animais_status ON animais(status)',
  'CREATE INDEX IF NOT EXISTS idx_animais_deleted ON animais(deleted)',
  'CREATE INDEX IF NOT EXISTS idx_vacinas_animal ON vacinas(animal_uuid)',
  'CREATE INDEX IF NOT EXISTS idx_vacinas_propriedade ON vacinas(propriedade_uuid)',
  'CREATE INDEX IF NOT EXISTS idx_vacinas_proxima ON vacinas(proxima_dose)',
  'CREATE INDEX IF NOT EXISTS idx_medicamentos_animal ON medicamentos(animal_uuid)',
  'CREATE INDEX IF NOT EXISTS idx_medicamentos_propriedade ON medicamentos(propriedade_uuid)',
  'CREATE INDEX IF NOT EXISTS idx_medicamentos_liberacao ON medicamentos(data_liberacao)',
  'CREATE INDEX IF NOT EXISTS idx_ocorrencias_animal ON ocorrencias(animal_uuid)',
  'CREATE INDEX IF NOT EXISTS idx_ocorrencias_propriedade ON ocorrencias(propriedade_uuid)',
  'CREATE INDEX IF NOT EXISTS idx_pesagens_animal ON pesagens(animal_uuid)',
  'CREATE INDEX IF NOT EXISTS idx_pesagens_data ON pesagens(data)',
  'CREATE INDEX IF NOT EXISTS idx_reproducao_animal ON reproducao(animal_uuid)',
  'CREATE INDEX IF NOT EXISTS idx_reproducao_propriedade ON reproducao(propriedade_uuid)',
  'CREATE INDEX IF NOT EXISTS idx_reproducao_parto ON reproducao(data_previa_parto)',
  // Sprint 6: movimentação persistente (Eixo 1)
  'CREATE INDEX IF NOT EXISTS idx_mov_animal ON movimentacoes_local(animal_uuid)',
  'CREATE INDEX IF NOT EXISTS idx_mov_propriedade ON movimentacoes_local(propriedade_uuid)',
  'CREATE INDEX IF NOT EXISTS idx_mov_data ON movimentacoes_local(data)',
  // Sprint 6: vacinas obrigatórias por propriedade (Eixo 1)
  'CREATE INDEX IF NOT EXISTS idx_obrigatorias_propriedade ON propriedade_vacinas_obrigatorias(propriedade_uuid)',
  // Sprint 10: índices financeiros (transacoes_financeiras)
  'CREATE INDEX IF NOT EXISTS idx_transacoes_propriedade ON transacoes_financeiras(propriedade_uuid, data)',
  'CREATE INDEX IF NOT EXISTS idx_transacoes_animal ON transacoes_financeiras(animal_uuid, data)',
  'CREATE INDEX IF NOT EXISTS idx_transacoes_categoria ON transacoes_financeiras(categoria_uuid)',
  'CREATE INDEX IF NOT EXISTS idx_transacoes_sync ON transacoes_financeiras(sync_status)',
  // Sprint 11: índices de notificações
  'CREATE INDEX IF NOT EXISTS idx_notificacoes_propriedade ON notificacoes(propriedade_uuid, lida)',
  'CREATE INDEX IF NOT EXISTS idx_notificacoes_sync ON notificacoes(sync_status)',
  // Sprint 10: índices de baixas
  'CREATE INDEX IF NOT EXISTS idx_baixas_propriedade ON baixas(propriedade_uuid, data)',
  'CREATE INDEX IF NOT EXISTS idx_baixas_animal ON baixas(animal_uuid)',
  'CREATE INDEX IF NOT EXISTS idx_baixas_sync ON baixas(sync_status)',
]

export async function criarTabelas(db) {
  if (db.sqlBatch) {
    await db.sqlBatch([...SQL_TABELAS, ...SQL_INDEXES])
  } else if (db.transaction) {
    return new Promise((resolve, reject) => {
      db.transaction(
        tx => {
          SQL_TABELAS.forEach(sql => tx.executeSql(sql))
          SQL_INDEXES.forEach(sql => tx.executeSql(sql))
        },
        reject,
        resolve,
      )
    })
  } else {
    // Fallback web — não há schema real
    await db.sqlBatch([])
  }
}

// Migrações aditivas (idempotentes). Rodam após `criarTabelas`
// e toleram colunas já existentes em bancos antigos.
const SQL_MIGRACOES = [
  "ALTER TABLE usuarios ADD COLUMN cpf TEXT",
  // Sprint 7: tri-state cobertura→prenhez→parto. Coluna resultado em reproducao.
  // Valores: 'pendente' (recém-registrada), 'positiva' (prenhez confirmada),
  // 'negativa' (falhou/abortou) ou 'parida' (data_parto preenchida).
  "ALTER TABLE reproducao ADD COLUMN resultado TEXT DEFAULT 'pendente'",
  // Backfill: registros pré-existentes precisam de resultado coerente.
  "UPDATE reproducao SET resultado = 'parida' WHERE data_parto IS NOT NULL AND (resultado IS NULL OR resultado = 'pendente')",
  "UPDATE reproducao SET resultado = 'positiva' WHERE prenhez_confirmada = 1 AND data_parto IS NULL AND (resultado IS NULL OR resultado = 'pendente')",
  // Sprint 6: peso de abate estimado em animais (contagem regressiva no dashboard)
  "ALTER TABLE animais ADD COLUMN peso_abate_estimado REAL",
  "ALTER TABLE animais ADD COLUMN data_abate_estimada TEXT",
  // Sprint 10/RF08: valor de compra do animal para cálculo de lucratividade
  "ALTER TABLE animais ADD COLUMN valor_compra REAL",
  // Sync Firebase: tabela key/value para metadados de sincronização
  // (ex.: last_pull_at). Idempotente: IF NOT EXISTS evita duplicação.
  `CREATE TABLE IF NOT EXISTS _sync_meta (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT
  )`,
  // Sprint 10: seed das 10 categorias financeiras fixas (idempotente).
  // UUIDs fixos por categoria permitem referência cruzada entre dispositivos
  // do mesmo usuário (embora categorias não sincronizem — o seed é idêntico em cada SQLite).
  `INSERT OR IGNORE INTO categorias_financeiras (uuid, nome, rotulo, tipo, ordem, created_at)
   VALUES ('cat-venda-leite', 'venda_leite', 'Venda de Leite', 'receita', 1, datetime('now'))`,
  `INSERT OR IGNORE INTO categorias_financeiras (uuid, nome, rotulo, tipo, ordem, created_at)
   VALUES ('cat-venda-animal', 'venda_animal', 'Venda de Animal', 'receita', 2, datetime('now'))`,
  `INSERT OR IGNORE INTO categorias_financeiras (uuid, nome, rotulo, tipo, ordem, created_at)
   VALUES ('cat-receita-outros', 'receita_outros', 'Outras Receitas', 'receita', 3, datetime('now'))`,
  `INSERT OR IGNORE INTO categorias_financeiras (uuid, nome, rotulo, tipo, ordem, created_at)
   VALUES ('cat-racao', 'racao', 'Ração', 'despesa', 11, datetime('now'))`,
  `INSERT OR IGNORE INTO categorias_financeiras (uuid, nome, rotulo, tipo, ordem, created_at)
   VALUES ('cat-vacinas', 'vacinas', 'Vacinas', 'despesa', 12, datetime('now'))`,
  `INSERT OR IGNORE INTO categorias_financeiras (uuid, nome, rotulo, tipo, ordem, created_at)
   VALUES ('cat-medicamentos', 'medicamentos', 'Medicamentos', 'despesa', 13, datetime('now'))`,
  `INSERT OR IGNORE INTO categorias_financeiras (uuid, nome, rotulo, tipo, ordem, created_at)
   VALUES ('cat-veterinario', 'veterinario', 'Veterinário', 'despesa', 14, datetime('now'))`,
  `INSERT OR IGNORE INTO categorias_financeiras (uuid, nome, rotulo, tipo, ordem, created_at)
   VALUES ('cat-salarios', 'salarios', 'Salários', 'despesa', 15, datetime('now'))`,
  `INSERT OR IGNORE INTO categorias_financeiras (uuid, nome, rotulo, tipo, ordem, created_at)
   VALUES ('cat-combustivel', 'combustivel', 'Combustível', 'despesa', 16, datetime('now'))`,
  `INSERT OR IGNORE INTO categorias_financeiras (uuid, nome, rotulo, tipo, ordem, created_at)
   VALUES ('cat-despesa-outros', 'despesa_outros', 'Outras Despesas', 'despesa', 17, datetime('now'))`,
]

function executarSqlSemErro(db, sql) {
  if (db.sqlBatch) {
    return db.sqlBatch([sql]).catch(() => {})
  }
  if (db.transaction) {
    return new Promise(resolve => {
      db.transaction(
        tx => tx.executeSql(sql, [], () => resolve(), () => resolve()),
        () => resolve(),
        () => resolve(),
      )
    })
  }
  return Promise.resolve()
}

export async function aplicarMigracoes(db) {
  for (const sql of SQL_MIGRACOES) {
    await executarSqlSemErro(db, sql)
  }
}
