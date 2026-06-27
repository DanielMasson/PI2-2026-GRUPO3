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
