import { getDb } from './database'
import { gerarUUID } from '../../utils/uuid'

// ─── Helpers ───

function agora() {
  return new Date().toISOString()
}

function rowsToArray(resultSet) {
  const items = []
  for (let i = 0; i < resultSet.rows.length; i++) {
    items.push(resultSet.rows.item(i))
  }
  return items
}

function executar(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.transaction(
      tx => {
        tx.executeSql(
          sql,
          params,
          (_, result) => resolve(result),
          (_, err) => { reject(err); return false },
        )
      },
      reject,
    )
  })
}

// ─── PROPRIEDADES ───

export async function listarPropriedades(usuarioUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT p.* FROM propriedades p
     INNER JOIN propriedade_membros pm ON p.uuid = pm.propriedade_uuid
     WHERE pm.usuario_uuid = ?
     ORDER BY p.nome ASC`,
    [usuarioUuid],
  )
  return rowsToArray(result)
}

export async function buscarPropriedade(uuid) {
  const db = getDb()
  const result = await executar(
    db,
    'SELECT * FROM propriedades WHERE uuid = ?',
    [uuid],
  )
  return result.rows.length > 0 ? result.rows.item(0) : null
}

export async function inserirPropriedade(dados) {
  const db = getDb()
  const uuid = dados.uuid || gerarUUID()
  const timestamp = agora()
  await executar(
    db,
    `INSERT INTO propriedades (uuid, nome, localizacao, tamanho_ha, dono_uuid, created_at, updated_at, synced_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, null, 'novo')`,
    [uuid, dados.nome, dados.localizacao || null, dados.tamanho_ha || null, dados.dono_uuid, timestamp, timestamp],
  )
  return uuid
}

export async function atualizarPropriedade(uuid, dados) {
  const db = getDb()
  const timestamp = agora()
  await executar(
    db,
    `UPDATE propriedades SET nome = ?, localizacao = ?, tamanho_ha = ?, updated_at = ?, sync_status = 'modificado'
     WHERE uuid = ?`,
    [dados.nome, dados.localizacao || null, dados.tamanho_ha || null, timestamp, uuid],
  )
}

export async function excluirPropriedade(uuid) {
  const db = getDb()
  await executar(db, 'DELETE FROM propriedade_membros WHERE propriedade_uuid = ?', [uuid])
  await executar(db, 'DELETE FROM propriedades WHERE uuid = ?', [uuid])
}

// ─── PROPRIEDADE MEMBROS ───

export async function listarMembros(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT pm.*, u.nome, u.email, u.telefone
     FROM propriedade_membros pm
     LEFT JOIN usuarios u ON pm.usuario_uuid = u.uuid
     WHERE pm.propriedade_uuid = ?
     ORDER BY pm.cargo ASC, u.nome ASC`,
    [propriedadeUuid],
  )
  return rowsToArray(result)
}

export async function inserirMembro(dados) {
  const db = getDb()
  const uuid = dados.uuid || gerarUUID()
  const timestamp = agora()
  await executar(
    db,
    `INSERT INTO propriedade_membros (uuid, propriedade_uuid, usuario_uuid, cargo, created_at, updated_at, synced_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, null, 'novo')`,
    [uuid, dados.propriedade_uuid, dados.usuario_uuid, dados.cargo || 'peao', timestamp, timestamp],
  )
  return uuid
}

export async function excluirMembro(uuid) {
  const db = getDb()
  await executar(db, 'DELETE FROM propriedade_membros WHERE uuid = ?', [uuid])
}

// ─── ANIMAIS ───

export async function listarAnimais(propriedadeUuid, filtros = {}) {
  const db = getDb()
  let sql = 'SELECT * FROM animais WHERE propriedade_uuid = ? AND deleted = 0'
  const params = [propriedadeUuid]

  if (filtros.especie) {
    sql += ' AND especie = ?'
    params.push(filtros.especie)
  }
  if (filtros.sexo) {
    sql += ' AND sexo = ?'
    params.push(filtros.sexo)
  }
  if (filtros.status) {
    sql += ' AND status = ?'
    params.push(filtros.status)
  }
  if (filtros.busca) {
    sql += ' AND (nome LIKE ? OR id_fisico LIKE ? OR id_interno LIKE ?)'
    const termo = `%${filtros.busca}%`
    params.push(termo, termo, termo)
  }

  sql += ' ORDER BY nome ASC'

  const result = await executar(db, sql, params)
  return rowsToArray(result)
}

export async function buscarAnimal(uuid) {
	const db = getDb()
	const result = await executar(
		db,
		`SELECT a.*, p.nome as nome_pai, m.nome as nome_mae
		 FROM animais a
		 LEFT JOIN animais p ON a.pai_uuid = p.uuid
		 LEFT JOIN animais m ON a.mae_uuid = m.uuid
		 WHERE a.uuid = ?`,
		[uuid],
	)
	return result.rows.length > 0 ? result.rows.item(0) : null
}

export async function inserirAnimal(dados) {
  const db = getDb()
  const uuid = dados.uuid || gerarUUID()
  const timestamp = agora()
  await executar(
    db,
    `INSERT INTO animais (uuid, propriedade_uuid, id_interno, id_fisico, nome, especie, raca, sexo, data_nascimento, peso_inicial, pelagem, genetica, origem, mae_uuid, pai_uuid, status, deleted, created_at, updated_at, synced_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ativo', 0, ?, ?, null, 'novo')`,
    [
      uuid,
      dados.propriedade_uuid,
      dados.id_interno || null,
      dados.id_fisico || null,
      dados.nome,
      dados.especie,
      dados.raca,
      dados.sexo,
      dados.data_nascimento || dados.dataNascimento || null,
      dados.peso_inicial || dados.peso || null,
      dados.pelagem || null,
      dados.genetica || null,
      dados.origem || null,
      dados.mae_uuid || null,
      dados.pai_uuid || null,
      timestamp,
      timestamp,
    ],
  )
  // Atualiza valor_compra separadamente (coluna adicionada via migration)
  if (dados.valor_compra !== undefined) {
    await executar(db, 'UPDATE animais SET valor_compra = ? WHERE uuid = ?', [dados.valor_compra, uuid])
  }
  return uuid
}

export async function atualizarAnimal(uuid, dados) {
  const db = getDb()
  const timestamp = agora()
  const campos = []
  const params = []

  const editaveis = ['nome', 'id_interno', 'id_fisico', 'especie', 'raca', 'sexo', 'data_nascimento', 'peso_inicial', 'pelagem', 'genetica', 'origem', 'mae_uuid', 'pai_uuid', 'status', 'peso_abate_estimado', 'data_abate_estimada', 'valor_compra']
  editaveis.forEach(campo => {
    if (dados[campo] !== undefined) {
      campos.push(`${campo} = ?`)
      params.push(dados[campo])
    }
  })

  if (campos.length === 0) return

  campos.push("updated_at = ?", "sync_status = 'modificado'")
  params.push(timestamp, uuid)

  await executar(
    db,
    `UPDATE animais SET ${campos.join(', ')} WHERE uuid = ?`,
    params,
  )
}

export async function excluirAnimal(uuid) {
  const db = getDb()
  const timestamp = agora()
  // Soft delete
  await executar(
    db,
    `UPDATE animais SET deleted = 1, status = 'removido', updated_at = ?, sync_status = 'modificado' WHERE uuid = ?`,
    [timestamp, uuid],
  )
}

// ─── VACINAS ───

export async function listarVacinas(animalUuid) {
  const db = getDb()
  const result = await executar(
    db,
    'SELECT * FROM vacinas WHERE animal_uuid = ? ORDER BY data_aplicacao DESC',
    [animalUuid],
  )
  return rowsToArray(result)
}

export async function buscarVacina(uuid) {
  const db = getDb()
  const result = await executar(db, 'SELECT * FROM vacinas WHERE uuid = ?', [uuid])
  return result.rows.length > 0 ? result.rows.item(0) : null
}

export async function listarVacinasPropriedade(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT v.*, a.nome AS nome_animal, a.id_fisico
     FROM vacinas v
     INNER JOIN animais a ON v.animal_uuid = a.uuid
     WHERE v.propriedade_uuid = ? AND a.deleted = 0
     ORDER BY v.proxima_dose ASC`,
    [propriedadeUuid],
  )
  return rowsToArray(result)
}

export async function inserirVacina(dados) {
  const db = getDb()
  const uuid = dados.uuid || gerarUUID()
  const timestamp = agora()
  await executar(
    db,
    `INSERT INTO vacinas (uuid, animal_uuid, propriedade_uuid, nome_vacina, data_aplicacao, proxima_dose, ciclo_dias, obrigatoria, lote, responsavel, observacao, created_at, updated_at, synced_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, 'novo')`,
    [
      uuid, dados.animal_uuid, dados.propriedade_uuid, dados.nome_vacina,
      dados.data_aplicacao, dados.proxima_dose || null, dados.ciclo_dias || null,
      dados.obrigatoria ? 1 : 0, dados.lote || null, dados.responsavel || null,
      dados.observacao || null, timestamp, timestamp,
    ],
  )
  return uuid
}

export async function atualizarVacina(uuid, dados) {
  const db = getDb()
  const timestamp = agora()
  const campos = []
  const params = []

  const editaveis = ['nome_vacina', 'data_aplicacao', 'proxima_dose', 'ciclo_dias', 'obrigatoria', 'lote', 'responsavel', 'observacao']
  editaveis.forEach(campo => {
    if (dados[campo] !== undefined) {
      campos.push(`${campo} = ?`)
      params.push(dados[campo])
    }
  })

  if (campos.length === 0) return

  campos.push("updated_at = ?", "sync_status = 'modificado'")
  params.push(timestamp, uuid)

  await executar(
    db,
    `UPDATE vacinas SET ${campos.join(', ')} WHERE uuid = ?`,
    params,
  )
}

export async function excluirVacina(uuid) {
  const db = getDb()
  await executar(db, 'DELETE FROM vacinas WHERE uuid = ?', [uuid])
}

// ─── MEDICAMENTOS ───

export async function listarMedicamentos(animalUuid) {
  const db = getDb()
  const result = await executar(
    db,
    'SELECT * FROM medicamentos WHERE animal_uuid = ? ORDER BY data_aplicacao DESC',
    [animalUuid],
  )
  return rowsToArray(result)
}

export async function buscarMedicamento(uuid) {
  const db = getDb()
  const result = await executar(db, 'SELECT * FROM medicamentos WHERE uuid = ?', [uuid])
  return result.rows.length > 0 ? result.rows.item(0) : null
}

export async function inserirMedicamento(dados) {
  const db = getDb()
  const uuid = dados.uuid || gerarUUID()
  const timestamp = agora()
  await executar(
    db,
    `INSERT INTO medicamentos (uuid, animal_uuid, propriedade_uuid, tipo, produto, dose, data_aplicacao, carencia_dias, data_liberacao, responsavel, observacao, created_at, updated_at, synced_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, 'novo')`,
    [
      uuid, dados.animal_uuid, dados.propriedade_uuid, dados.tipo,
      dados.produto, dados.dose || null, dados.data_aplicacao,
      dados.carencia_dias || 0, dados.data_liberacao || null,
      dados.responsavel || null, dados.observacao || null, timestamp, timestamp,
    ],
  )
  return uuid
}

export async function atualizarMedicamento(uuid, dados) {
  const db = getDb()
  const timestamp = agora()
  const campos = []
  const params = []

  const editaveis = ['tipo', 'produto', 'dose', 'data_aplicacao', 'carencia_dias', 'data_liberacao', 'responsavel', 'observacao']
  editaveis.forEach(campo => {
    if (dados[campo] !== undefined) {
      campos.push(`${campo} = ?`)
      params.push(dados[campo])
    }
  })

  if (campos.length === 0) return

  campos.push("updated_at = ?", "sync_status = 'modificado'")
  params.push(timestamp, uuid)

  await executar(
    db,
    `UPDATE medicamentos SET ${campos.join(', ')} WHERE uuid = ?`,
    params,
  )
}

export async function excluirMedicamento(uuid) {
  const db = getDb()
  await executar(db, 'DELETE FROM medicamentos WHERE uuid = ?', [uuid])
}

// ─── OCORRÊNCIAS ───

export async function listarOcorrencias(animalUuid) {
  const db = getDb()
  const result = await executar(
    db,
    'SELECT * FROM ocorrencias WHERE animal_uuid = ? ORDER BY data DESC',
    [animalUuid],
  )
  return rowsToArray(result)
}

export async function buscarOcorrencia(uuid) {
  const db = getDb()
  const result = await executar(db, 'SELECT * FROM ocorrencias WHERE uuid = ?', [uuid])
  return result.rows.length > 0 ? result.rows.item(0) : null
}

export async function inserirOcorrencia(dados) {
  const db = getDb()
  const uuid = dados.uuid || gerarUUID()
  const timestamp = agora()
  await executar(
    db,
    `INSERT INTO ocorrencias (uuid, animal_uuid, propriedade_uuid, data, sintomas, tratamento, resultado, veterinario, created_at, updated_at, synced_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, 'novo')`,
    [
      uuid, dados.animal_uuid, dados.propriedade_uuid, dados.data,
      dados.sintomas, dados.tratamento || null,
      dados.resultado || 'aguardando', dados.veterinario || null,
      timestamp, timestamp,
    ],
  )
  return uuid
}

export async function atualizarOcorrencia(uuid, dados) {
  const db = getDb()
  const timestamp = agora()
  const campos = []
  const params = []

  const editaveis = ['data', 'sintomas', 'tratamento', 'resultado', 'veterinario']
  editaveis.forEach(campo => {
    if (dados[campo] !== undefined) {
      campos.push(`${campo} = ?`)
      params.push(dados[campo])
    }
  })

  if (campos.length === 0) return

  campos.push("updated_at = ?", "sync_status = 'modificado'")
  params.push(timestamp, uuid)

  await executar(
    db,
    `UPDATE ocorrencias SET ${campos.join(', ')} WHERE uuid = ?`,
    params,
  )
}

export async function excluirOcorrencia(uuid) {
  const db = getDb()
  await executar(db, 'DELETE FROM ocorrencias WHERE uuid = ?', [uuid])
}

// ─── PESAGENS ───

export async function listarPesagens(animalUuid) {
  const db = getDb()
  const result = await executar(
    db,
    'SELECT * FROM pesagens WHERE animal_uuid = ? ORDER BY data DESC',
    [animalUuid],
  )
  return rowsToArray(result)
}

export async function buscarPesagem(uuid) {
  const db = getDb()
  const result = await executar(db, 'SELECT * FROM pesagens WHERE uuid = ?', [uuid])
  return result.rows.length > 0 ? result.rows.item(0) : null
}

export async function inserirPesagem(dados) {
  const db = getDb()
  const uuid = dados.uuid || gerarUUID()
  const timestamp = agora()
  await executar(
    db,
    `INSERT INTO pesagens (uuid, animal_uuid, propriedade_uuid, data, peso, ecc, observacao, created_at, updated_at, synced_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, null, 'novo')`,
    [
      uuid, dados.animal_uuid, dados.propriedade_uuid, dados.data,
      dados.peso, dados.ecc || null, dados.observacao || null,
      timestamp, timestamp,
    ],
  )
  return uuid
}

export async function atualizarPesagem(uuid, dados) {
  const db = getDb()
  const timestamp = agora()
  const campos = []
  const params = []

  const editaveis = ['data', 'peso', 'ecc', 'observacao']
  editaveis.forEach(campo => {
    if (dados[campo] !== undefined) {
      campos.push(`${campo} = ?`)
      params.push(dados[campo])
    }
  })

  if (campos.length === 0) return

  campos.push("updated_at = ?", "sync_status = 'modificado'")
  params.push(timestamp, uuid)

  await executar(
    db,
    `UPDATE pesagens SET ${campos.join(', ')} WHERE uuid = ?`,
    params,
  )
}

export async function excluirPesagem(uuid) {
  const db = getDb()
  await executar(db, 'DELETE FROM pesagens WHERE uuid = ?', [uuid])
}

// ─── REPRODUÇÃO ───

export async function listarReproducao(animalUuid) {
  const db = getDb()
  const result = await executar(
    db,
    'SELECT * FROM reproducao WHERE animal_uuid = ? ORDER BY data_cobertura DESC',
    [animalUuid],
  )
  return rowsToArray(result)
}

export async function buscarReproducao(uuid) {
  const db = getDb()
  const result = await executar(
    db,
    'SELECT * FROM reproducao WHERE uuid = ?',
    [uuid],
  )
  const rows = rowsToArray(result)
  return rows[0] || null
}

export async function listarGestantes(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT r.*, a.nome AS nome_animal, a.id_fisico AS brinco_animal, a.especie,
            t.nome AS touro_nome, t.id_fisico AS touro_brinco
     FROM reproducao r
     INNER JOIN animais a ON r.animal_uuid = a.uuid
     LEFT JOIN animais t ON r.touro_uuid = t.uuid
     WHERE r.propriedade_uuid = ? AND a.deleted = 0
     AND r.prenhez_confirmada = 1 AND r.data_parto IS NULL
     AND (r.resultado = 'positiva' OR r.resultado IS NULL)
     ORDER BY r.data_previa_parto ASC`,
    [propriedadeUuid],
  )
  return rowsToArray(result)
}

export async function listarCoberturasRep(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT r.*, a.nome AS nome_animal, a.id_fisico AS brinco_animal, a.especie,
            t.nome AS touro_nome, t.id_fisico AS touro_brinco
     FROM reproducao r
     INNER JOIN animais a ON r.animal_uuid = a.uuid
     LEFT JOIN animais t ON r.touro_uuid = t.uuid
     WHERE r.propriedade_uuid = ? AND a.deleted = 0
     AND r.prenhez_confirmada = 0 AND r.data_parto IS NULL
     AND (r.resultado = 'pendente' OR r.resultado IS NULL)
     ORDER BY r.data_cobertura DESC`,
    [propriedadeUuid],
  )
  return rowsToArray(result)
}

// Sprint 7: tri-state — listar coberturas que falharam (diagnóstico negativo)
export async function listarFalhasRep(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT r.*, a.nome AS nome_animal, a.id_fisico AS brinco_animal, a.especie,
            t.nome AS touro_nome, t.id_fisico AS touro_brinco
     FROM reproducao r
     INNER JOIN animais a ON r.animal_uuid = a.uuid
     LEFT JOIN animais t ON r.touro_uuid = t.uuid
     WHERE r.propriedade_uuid = ? AND a.deleted = 0
     AND r.resultado = 'negativa'
     ORDER BY r.data_cobertura DESC`,
    [propriedadeUuid],
  )
  return rowsToArray(result)
}

// Sprint 7: tri-state — listar gestações finalizadas (paridas)
export async function listarParidasRep(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT r.*, a.nome AS nome_animal, a.id_fisico AS brinco_animal, a.especie,
            t.nome AS touro_nome, t.id_fisico AS touro_brinco
     FROM reproducao r
     INNER JOIN animais a ON r.animal_uuid = a.uuid
     LEFT JOIN animais t ON r.touro_uuid = t.uuid
     WHERE r.propriedade_uuid = ? AND a.deleted = 0
     AND r.data_parto IS NOT NULL AND r.resultado = 'parida'
     ORDER BY r.data_parto DESC`,
    [propriedadeUuid],
  )
  return rowsToArray(result)
}

export async function inserirReproducao(dados) {
  const db = getDb()
  const uuid = dados.uuid || gerarUUID()
  const timestamp = agora()
  await executar(
    db,
    `INSERT INTO reproducao (uuid, animal_uuid, propriedade_uuid, tipo_cobertura, data_cobertura, touro_uuid, prenhez_confirmada, data_confirmacao, data_previa_parto, data_secagem, data_parto, observacao, resultado, created_at, updated_at, synced_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, 'novo')`,
    [
      uuid, dados.animal_uuid, dados.propriedade_uuid, dados.tipo_cobertura,
      dados.data_cobertura, dados.touro_uuid || null,
      dados.prenhez_confirmada ? 1 : 0, dados.data_confirmacao || null,
      dados.data_previa_parto || null, dados.data_secagem || null,
      dados.data_parto || null, dados.observacao || null,
      dados.resultado || 'pendente',
      timestamp, timestamp,
    ],
  )
  return uuid
}

export async function atualizarReproducao(uuid, dados) {
  const db = getDb()
  const timestamp = agora()
  const campos = []
  const params = []

  const editaveis = [
    'tipo_cobertura', 'data_cobertura', 'touro_uuid',
    'prenhez_confirmada', 'data_confirmacao', 'data_previa_parto',
    'data_secagem', 'data_parto', 'observacao', 'resultado',
  ]
  editaveis.forEach(campo => {
    if (dados[campo] !== undefined) {
      campos.push(`${campo} = ?`)
      params.push(dados[campo])
    }
  })

  if (campos.length === 0) return

  campos.push("updated_at = ?", "sync_status = 'modificado'")
  params.push(timestamp, uuid)

  await executar(
    db,
    `UPDATE reproducao SET ${campos.join(', ')} WHERE uuid = ?`,
    params,
  )
}

export async function confirmarPrenhez(uuid, dataConfirmacao) {
  const db = getDb()
  const timestamp = agora()
  await executar(
    db,
    `UPDATE reproducao SET prenhez_confirmada = 1, data_confirmacao = ?, resultado = 'positiva', updated_at = ?, sync_status = 'modificado' WHERE uuid = ?`,
    [dataConfirmacao, timestamp, uuid],
  )
}

export async function registrarParto(uuid, dataParto) {
  const db = getDb()
  const timestamp = agora()
  await executar(
    db,
    `UPDATE reproducao SET data_parto = ?, resultado = 'parida', updated_at = ?, sync_status = 'modificado' WHERE uuid = ?`,
    [dataParto, timestamp, uuid],
  )
}

// Sprint 7: tri-state — encerrar cobertura como falha/abortada (negativa)
export async function cancelarCobertura(uuid, motivo) {
  const db = getDb()
  const timestamp = agora()
  const observacao = motivo ? `[CANCELADA] ${motivo}` : null
  // prenhez_confirmada=0 mantém a SQL legada coerente; resultado='negativa'
  // é a fonte de verdade para filtro (listarFalhasRep).
  await executar(
    db,
    `UPDATE reproducao SET prenhez_confirmada = 0, resultado = 'negativa', observacao = COALESCE(?, observacao), updated_at = ?, sync_status = 'modificado' WHERE uuid = ?`,
    [observacao, timestamp, uuid],
  )
}

// ─── SYNC METADATA ───

export async function listarPendentes(tabela) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT * FROM ${tabela} WHERE sync_status IN ('novo', 'modificado') ORDER BY updated_at ASC`,
    [],
  )
  return rowsToArray(result)
}

export async function marcarSincronizado(tabela, uuid) {
  const db = getDb()
  const timestamp = agora()
  await executar(
    db,
    `UPDATE ${tabela} SET sync_status = 'sincronizado', synced_at = ? WHERE uuid = ?`,
    [timestamp, uuid],
  )
}

export async function contarPendentes() {
  // Soma registros com sync_status='novo' ou 'modificado' em todas as
  // tabelas replicadas. Soft-deletes têm sync_status='modificado' também,
  // então contam aqui — correto, pois o push precisa replicá-los.
  const db = getDb()
  const tabelas = [
    'usuarios',
    'propriedades',
    'propriedade_membros',
    'animais',
    'vacinas',
    'pesagens',
    'medicamentos',
    'ocorrencias',
    'movimentacoes_local',
    'reproducao',
    'producao_leite',
    'notificacoes',
    'transacoes_financeiras',
    'baixas',
  ]
  let total = 0
  for (const tabela of tabelas) {
    const result = await executar(
      db,
      `SELECT COUNT(*) AS n FROM ${tabela} WHERE sync_status IN ('novo', 'modificado')`,
      [],
    )
    const rows = rowsToArray(result)
    total += rows[0]?.n ?? 0
  }
  return total
}

// ─── _SYNC_META KEY/VALUE ───

export async function obterMeta(key) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT value FROM _sync_meta WHERE key = ?`,
    [key],
  )
  const rows = rowsToArray(result)
  return rows[0]?.value ?? null
}

export async function definirMeta(key, value) {
  const db = getDb()
  const timestamp = agora()
  // UPSERT: INSERT ou REPLACE — chave é PK, então substituir é seguro.
  await executar(
    db,
    `INSERT OR REPLACE INTO _sync_meta (key, value, updated_at) VALUES (?, ?, ?)`,
    [key, String(value), timestamp],
  )
}

// ─── USUÁRIOS ───

export async function buscarUsuario(firebaseUid) {
  const db = getDb()
  const result = await executar(
    db,
    'SELECT * FROM usuarios WHERE firebase_uid = ?',
    [firebaseUid],
  )
  return result.rows.length > 0 ? result.rows.item(0) : null
}

export async function buscarUsuarioPorUuid(uuid) {
  const db = getDb()
  const result = await executar(
    db,
    'SELECT * FROM usuarios WHERE uuid = ?',
    [uuid],
  )
  return result.rows.length > 0 ? result.rows.item(0) : null
}

export async function buscarUsuarioPorEmail(email) {
  const db = getDb()
  const result = await executar(
    db,
    'SELECT * FROM usuarios WHERE email = ?',
    [email],
  )
  return result.rows.length > 0 ? result.rows.item(0) : null
}

export async function inserirUsuario(dados) {
  const db = getDb()
  const uuid = dados.uuid || gerarUUID()
  const timestamp = agora()
  try {
    await executar(
      db,
      `INSERT INTO usuarios (uuid, firebase_uid, nome, email, telefone, foto_url, cpf, cargo, created_at, updated_at, synced_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, 'novo')`,
      [
        uuid, dados.firebase_uid || null, dados.nome, dados.email,
        dados.telefone || null, dados.foto_url || null,
        dados.cpf || null,
        dados.cargo || 'dono', timestamp, timestamp,
      ],
    )
  } catch (err) {
    // Bug #1: race entre `cadastrar` e o listener `onAuthStateChanged` pode
    // gerar dois INSERTs concorrentes com o mesmo `firebase_uid`. A coluna
    // tem UNIQUE (`migrations.js:5`) então capturamos aqui e retornamos
    // a linha já existente — idempotente.
    const existente = await buscarUsuario(dados.firebase_uid)
    if (existente) return existente
    throw err
  }
  return uuid
}

export async function atualizarUsuario(uuid, dados) {
  const db = getDb()
  const timestamp = agora()
  const campos = []
  const params = []

  const editaveis = ['nome', 'email', 'telefone', 'foto_url', 'cpf']
  editaveis.forEach(campo => {
    if (dados[campo] !== undefined) {
      campos.push(`${campo} = ?`)
      params.push(dados[campo])
    }
  })

  if (campos.length === 0) return

  campos.push("updated_at = ?", "sync_status = 'modificado'")
  params.push(timestamp, uuid)

  await executar(
    db,
    `UPDATE usuarios SET ${campos.join(', ')} WHERE uuid = ?`,
    params,
  )
}

export async function buscarMembro(propriedadeUuid, usuarioUuid) {
  const db = getDb()
  const result = await executar(
    db,
    'SELECT * FROM propriedade_membros WHERE propriedade_uuid = ? AND usuario_uuid = ?',
    [propriedadeUuid, usuarioUuid],
  )
  return result.rows.length > 0 ? result.rows.item(0) : null
}

// ─── CONSULTAS PROPERTY-SCOPED ───

export async function listarVacinasProximas(propriedadeUuid, diasLimite = 30) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT v.*, a.nome AS nome_animal, a.id_fisico
     FROM vacinas v
     INNER JOIN animais a ON v.animal_uuid = a.uuid
     WHERE v.propriedade_uuid = ? AND a.deleted = 0
     AND v.proxima_dose IS NOT NULL
     AND date(v.proxima_dose) <= date('now', '+' || ? || ' days')
     ORDER BY v.proxima_dose ASC`,
    [propriedadeUuid, diasLimite],
  )
  return rowsToArray(result)
}

export async function listarMedicamentosPropriedade(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT m.*, a.nome AS nome_animal, a.id_fisico
     FROM medicamentos m
     INNER JOIN animais a ON m.animal_uuid = a.uuid
     WHERE m.propriedade_uuid = ? AND a.deleted = 0
     ORDER BY m.data_aplicacao DESC`,
    [propriedadeUuid],
  )
  return rowsToArray(result)
}

export async function listarEmCarencia(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT m.*, a.nome AS nome_animal, a.id_fisico
     FROM medicamentos m
     INNER JOIN animais a ON m.animal_uuid = a.uuid
     WHERE m.propriedade_uuid = ? AND a.deleted = 0
     AND m.data_liberacao IS NOT NULL
     AND date(m.data_liberacao) >= date('now')
     ORDER BY m.data_liberacao ASC`,
    [propriedadeUuid],
  )
  return rowsToArray(result)
}

export async function listarOcorrenciasPropriedade(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT o.*, a.nome AS nome_animal, a.id_fisico
     FROM ocorrencias o
     INNER JOIN animais a ON o.animal_uuid = a.uuid
     WHERE o.propriedade_uuid = ? AND a.deleted = 0
     ORDER BY o.data DESC`,
    [propriedadeUuid],
  )
  return rowsToArray(result)
}

export async function listarPesagensPropriedade(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT p.*, a.nome AS nome_animal, a.id_fisico
     FROM pesagens p
     INNER JOIN animais a ON p.animal_uuid = a.uuid
     WHERE p.propriedade_uuid = ? AND a.deleted = 0
     ORDER BY p.data DESC`,
    [propriedadeUuid],
  )
  return rowsToArray(result)
}

export async function listarReproducaoPropriedade(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT r.*, a.nome AS nome_animal, a.id_fisico AS brinco_animal, a.especie,
            t.nome AS touro_nome, t.id_fisico AS touro_brinco
     FROM reproducao r
     INNER JOIN animais a ON r.animal_uuid = a.uuid
     LEFT JOIN animais t ON r.touro_uuid = t.uuid
     WHERE r.propriedade_uuid = ? AND a.deleted = 0
     ORDER BY r.data_cobertura DESC`,
    [propriedadeUuid],
  )
  return rowsToArray(result)
}

// ─── CÁLCULOS ───

export async function calcularGMD(animalUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT peso, data FROM pesagens WHERE animal_uuid = ? ORDER BY data DESC LIMIT 2`,
    [animalUuid],
  )
  if (result.rows.length < 2) return null
  const atual = result.rows.item(0)
  const anterior = result.rows.item(1)
  const dias = (new Date(atual.data) - new Date(anterior.data)) / (1000 * 60 * 60 * 24)
  if (dias <= 0) return null
  return {
    valor: (atual.peso - anterior.peso) / dias,
    pesoAtual: atual.peso,
    pesoAnterior: anterior.peso,
    diasEntre: dias,
  }
}

// ─── BUSCAS AUXILIARES ───

export async function buscarAnimalPorIdFisico(idFisico) {
  const db = getDb()
  const result = await executar(
    db,
    'SELECT * FROM animais WHERE id_fisico = ? AND deleted = 0',
    [idFisico],
  )
  return result.rows.length > 0 ? result.rows.item(0) : null
}

export async function contarAnimaisPropriedade(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT
     COUNT(*) as total,
     SUM(CASE WHEN sexo = 'macho' THEN 1 ELSE 0 END) as machos,
     SUM(CASE WHEN sexo = 'femea' THEN 1 ELSE 0 END) as femeas,
     SUM(CASE WHEN especie = 'bovino' THEN 1 ELSE 0 END) as bovinos,
     SUM(CASE WHEN especie = 'ovino' THEN 1 ELSE 0 END) as ovinos,
     SUM(CASE WHEN especie = 'suino' THEN 1 ELSE 0 END) as suinos
     FROM animais WHERE propriedade_uuid = ? AND deleted = 0`,
    [propriedadeUuid],
  )
  return result.rows.length > 0 ? result.rows.item(0) : { total: 0 }
}

export async function contarAnimaisPorEspecie(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT especie, COUNT(*) as total FROM animais WHERE propriedade_uuid = ? AND deleted = 0 GROUP BY especie`,
    [propriedadeUuid],
  )
  return rowsToArray(result)
}

export async function contarAnimais(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT especie, sexo, COUNT(*) as total
     FROM animais
     WHERE propriedade_uuid = ? AND deleted = 0
     GROUP BY especie, sexo`,
    [propriedadeUuid],
  )
  return rowsToArray(result)
}

export async function contarGestantes(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT COUNT(*) as total FROM reproducao r
     INNER JOIN animais a ON r.animal_uuid = a.uuid
     LEFT JOIN animais t ON r.touro_uuid = t.uuid
     WHERE r.propriedade_uuid = ? AND a.deleted = 0
     AND r.prenhez_confirmada = 1 AND r.data_parto IS NULL`,
    [propriedadeUuid],
  )
  return result.rows.length > 0 ? result.rows.item(0).total : 0
}

// ─── SPRINT 6 EIXO 1: Movimentações persistentes ───

export async function listarMovimentacoesAnimal(animalUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT * FROM movimentacoes_local
     WHERE animal_uuid = ? AND deleted = 0
     ORDER BY data DESC, hora DESC`,
    [animalUuid],
  )
  return rowsToArray(result)
}

export async function listarMovimentacoesPropriedade(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT m.*, a.nome AS nome_animal, a.id_fisico
     FROM movimentacoes_local m
     INNER JOIN animais a ON m.animal_uuid = a.uuid
     WHERE m.propriedade_uuid = ? AND m.deleted = 0 AND a.deleted = 0
     ORDER BY m.data DESC, m.hora DESC`,
    [propriedadeUuid],
  )
  return rowsToArray(result)
}

export async function inserirMovimentacao(dados) {
  const db = getDb()
  const uuid = dados.uuid || gerarUUID()
  const timestamp = agora()
  await executar(
    db,
    `INSERT INTO movimentacoes_local (uuid, animal_uuid, propriedade_uuid, data, hora, tipo, area, observacao, deleted, created_at, updated_at, synced_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, null, 'novo')`,
    [
      uuid, dados.animal_uuid, dados.propriedade_uuid,
      dados.data, dados.hora || null,
      dados.tipo || 'sono', dados.area, dados.observacao || null,
      timestamp, timestamp,
    ],
  )
  return uuid
}

export async function atualizarMovimentacao(uuid, dados) {
  const db = getDb()
  const timestamp = agora()
  const campos = []
  const params = []

  const editaveis = ['data', 'hora', 'tipo', 'area', 'observacao']
  editaveis.forEach(campo => {
    if (dados[campo] !== undefined) {
      campos.push(`${campo} = ?`)
      params.push(dados[campo])
    }
  })

  if (campos.length === 0) return

  campos.push("updated_at = ?", "sync_status = 'modificado'")
  params.push(timestamp, uuid)

  await executar(
    db,
    `UPDATE movimentacoes_local SET ${campos.join(', ')} WHERE uuid = ?`,
    params,
  )
}

export async function excluirMovimentacao(uuid) {
  const db = getDb()
  const timestamp = agora()
  await executar(
    db,
    `UPDATE movimentacoes_local SET deleted = 1, updated_at = ?, sync_status = 'modificado' WHERE uuid = ?`,
    [timestamp, uuid],
  )
}

export async function buscarUltimaLocalizacao(animalUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT * FROM movimentacoes_local
     WHERE animal_uuid = ? AND deleted = 0
     ORDER BY data DESC, hora DESC LIMIT 1`,
    [animalUuid],
  )
  const rows = rowsToArray(result)
  return rows[0] || null
}

// ─── SPRINT 6 EIXO 1: Vacinas obrigatórias por propriedade ───

const VACINAS_OBRIGATORIAS_PADRAO = [
  { nome: 'Febre Aftosa', especie: 'bovino', ciclo_dias: 180 },
  { nome: 'Brucelose',    especie: 'bovino', ciclo_dias: 365, sexo: 'femea' },
  { nome: 'Raiva',        especie: null,    ciclo_dias: 365 },
  { nome: 'Clostridiose', especie: 'bovino', ciclo_dias: 365 },
]

// Seed idempotente: só insere defaults que ainda não existem para a propriedade.
// Compara por (propriedade_uuid, nome_vacina) — INSERT OR IGNORE-style.
export async function seedVacinasObrigatorias(propriedadeUuid) {
  const db = getDb()
  const timestamp = agora()
  for (const v of VACINAS_OBRIGATORIAS_PADRAO) {
    await executar(
      db,
      `INSERT INTO propriedade_vacinas_obrigatorias
       (uuid, propriedade_uuid, nome_vacina, especie, sexo, ciclo_dias, ativo, created_at, updated_at, synced_at, sync_status)
     SELECT ?, ?, ?, ?, ?, ?, 1, ?, ?, null, 'novo'
     WHERE NOT EXISTS (
       SELECT 1 FROM propriedade_vacinas_obrigatorias
       WHERE propriedade_uuid = ? AND nome_vacina = ?
     )`,
      [
        gerarUUID(), propriedadeUuid, v.nome, v.especie || null, v.sexo || null,
        v.ciclo_dias, timestamp, timestamp,
        propriedadeUuid, v.nome,
      ],
    )
  }
}

export async function listarVacinasObrigatorias(propriedadeUuid) {
  await seedVacinasObrigatorias(propriedadeUuid)
  const db = getDb()
  const result = await executar(
    db,
    `SELECT * FROM propriedade_vacinas_obrigatorias
     WHERE propriedade_uuid = ? AND ativo = 1
     ORDER BY nome_vacina ASC`,
    [propriedadeUuid],
  )
  return rowsToArray(result)
}

// Filtra por especie + sexo do animal. Obrigatórias com especie=NULL aplicam-se a todas as espécies.
// Se sexo='femea' (ou qualquer valor), obrigatórias com sexo=NULL aplicam-se a ambos os sexos.
// Recebe especie/sexo como argumento (caller = hook que já buscou animal).
export async function listarVacinasObrigatoriasParaAnimal(propriedadeUuid, especie, sexo) {
  await seedVacinasObrigatorias(propriedadeUuid)
  const db = getDb()
  const result = await executar(
    db,
    `SELECT * FROM propriedade_vacinas_obrigatorias
     WHERE propriedade_uuid = ? AND ativo = 1
       AND (especie IS NULL OR especie = ?)
       AND (sexo    IS NULL OR sexo    = ?)
     ORDER BY nome_vacina ASC`,
    [propriedadeUuid, especie || '', sexo || ''],
  )
  return rowsToArray(result)
}

export async function inserirVacinaObrigatoria(dados) {
  const db = getDb()
  const uuid = dados.uuid || gerarUUID()
  const timestamp = agora()
  await executar(
    db,
    `INSERT INTO propriedade_vacinas_obrigatorias (uuid, propriedade_uuid, nome_vacina, especie, sexo, ciclo_dias, ativo, created_at, updated_at, synced_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, null, 'novo')`,
    [
      uuid, dados.propriedade_uuid, dados.nome_vacina,
      dados.especie || null, dados.sexo || null,
      dados.ciclo_dias || 365, dados.ativo === false ? 0 : 1,
      timestamp, timestamp,
    ],
  )
  return uuid
}

export async function atualizarVacinaObrigatoria(uuid, dados) {
  const db = getDb()
  const timestamp = agora()
  const campos = []
  const params = []

  const editaveis = ['nome_vacina', 'especie', 'sexo', 'ciclo_dias', 'ativo']
  editaveis.forEach(campo => {
    if (dados[campo] !== undefined) {
      campos.push(`${campo} = ?`)
      params.push(dados[campo])
    }
  })

  if (campos.length === 0) return

  campos.push("updated_at = ?", "sync_status = 'modificado'")
  params.push(timestamp, uuid)

  await executar(
    db,
    `UPDATE propriedade_vacinas_obrigatorias SET ${campos.join(', ')} WHERE uuid = ?`,
    params,
  )
}

export async function excluirVacinaObrigatoria(uuid) {
  const db = getDb()
  const timestamp = agora()
  await executar(
    db,
    `UPDATE propriedade_vacinas_obrigatorias SET ativo = 0, updated_at = ?, sync_status = 'modificado' WHERE uuid = ?`,
    [timestamp, uuid],
  )
}

// ─── SPRINT 6 EIXO 3: Contadores para Dashboard ───

export async function contarMovimentacoesRecentes(propriedadeUuid, dias = 7) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT COUNT(*) AS total FROM movimentacoes_local
     WHERE propriedade_uuid = ? AND deleted = 0
       AND date(data) >= date('now', ?)`,
    [propriedadeUuid, `-${dias} days`],
  )
  return result.rows.length > 0 ? result.rows.item(0).total : 0
}

// ─── SPRINT 6 EIXO 4: Cálculo de obrigatórias × últimas aplicações ───
// JOIN: para cada obrigatória da propriedade, busca a última vacina registrada
// para esse nome_vacina. LEFT JOIN para manter obrigatórias sem aplicação no resultado.
// Resultado: nome_vacina, especie, sexo, ciclo_dias, ultima_aplicacao (null se nunca aplicado).
export async function listarObrigatoriasComUltimaAplicacao(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT
       o.uuid AS obrigatoria_uuid,
       o.nome_vacina,
       o.especie,
       o.sexo,
       o.ciclo_dias,
       o.ativo,
       MAX(v.data_aplicacao) AS ultima_aplicacao
     FROM propriedade_vacinas_obrigatorias o
     LEFT JOIN vacinas v
       ON v.propriedade_uuid = o.propriedade_uuid
       AND v.nome_vacina = o.nome_vacina
       AND v.deleted = 0
     WHERE o.propriedade_uuid = ? AND o.ativo = 1
     GROUP BY o.uuid, o.nome_vacina, o.especie, o.sexo, o.ciclo_dias, o.ativo
     ORDER BY o.nome_vacina ASC`,
    [propriedadeUuid],
  )
  return rowsToArray(result)
}

// Lista vacinas (registradas na tabela `vacinas`) da propriedade com próxima dose
// vencida (vencidas) ou dentro de 7 dias (proximas). Já separadas em 2 categorias.
// Vencidas: proxima_dose < hoje (ou <= hoje menos 1d) — usar hoje SQLite padrão.
export async function listarVacinasVencidasPropriedade(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT v.uuid, v.nome_vacina, v.proxima_dose, v.data_aplicacao, v.animal_uuid,
            a.nome AS nome_animal, a.id_fisico
     FROM vacinas v
     INNER JOIN animais a ON v.animal_uuid = a.uuid
     WHERE v.propriedade_uuid = ?
       AND v.deleted = 0
       AND a.deleted = 0
       AND v.proxima_dose IS NOT NULL
       AND date(v.proxima_dose) < date('now')
     ORDER BY v.proxima_dose ASC`,
    [propriedadeUuid],
  )
  return rowsToArray(result)
}

export async function listarVacinasFuturasPropriedade(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT v.uuid, v.nome_vacina, v.proxima_dose, v.data_aplicacao, v.animal_uuid,
            a.nome AS nome_animal, a.id_fisico
     FROM vacinas v
     INNER JOIN animais a ON v.animal_uuid = a.uuid
     WHERE v.propriedade_uuid = ?
       AND v.deleted = 0
       AND a.deleted = 0
       AND v.proxima_dose IS NOT NULL
       AND date(v.proxima_dose) >= date('now')
       AND date(v.proxima_dose) <= date('now', '+7 days')
     ORDER BY v.proxima_dose ASC`,
    [propriedadeUuid],
  )
  return rowsToArray(result)
}

// ─── CIOS (Sprint 7) ───

export async function listarCios(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT c.*, a.nome AS nome_animal, a.id_fisico
     FROM ci_os c
     INNER JOIN animais a ON c.animal_uuid = a.uuid
     WHERE c.propriedade_uuid = ? AND a.deleted = 0
     ORDER BY c.data DESC`,
    [propriedadeUuid],
  )
  return rowsToArray(result)
}

export async function inserirCio(dados) {
  const db = getDb()
  const uuid = dados.uuid || gerarUUID()
  const timestamp = agora()
  await executar(
    db,
    `INSERT INTO ci_os (uuid, animal_uuid, propriedade_uuid, data, sintomas, intensidade, observacao, created_at, updated_at, synced_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, null, 'novo')`,
    [
      uuid, dados.animal_uuid, dados.propriedade_uuid, dados.data,
      dados.sintomas || null, dados.intensidade || null, dados.observacao || null,
      timestamp, timestamp,
    ],
  )
  return uuid
}

export async function excluirCio(uuid) {
  const db = getDb()
  await executar(db, 'DELETE FROM ci_os WHERE uuid = ?', [uuid])
}

// ─── PRODUÇÃO DE LEITE (Sprint 6) ───

export async function listarProducaoLeite(animalUuid) {
  const db = getDb()
  const result = await executar(
    db,
    'SELECT * FROM producao_leite WHERE animal_uuid = ? ORDER BY data DESC',
    [animalUuid],
  )
  return rowsToArray(result)
}

export async function listarProducaoLeitePropriedade(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT pl.*, a.nome AS nome_animal, a.id_fisico
     FROM producao_leite pl
     INNER JOIN animais a ON pl.animal_uuid = a.uuid
     WHERE pl.propriedade_uuid = ? AND a.deleted = 0
     ORDER BY pl.data DESC`,
    [propriedadeUuid],
  )
  return rowsToArray(result)
}

export async function inserirProducaoLeite(dados) {
  const db = getDb()
  const uuid = dados.uuid || gerarUUID()
  const timestamp = agora()
  await executar(
    db,
    `INSERT INTO producao_leite (uuid, animal_uuid, propriedade_uuid, data, manha_litros, tarde_litros, ccs, observacao, created_at, updated_at, synced_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, 'novo')`,
    [
      uuid, dados.animal_uuid, dados.propriedade_uuid, dados.data,
      dados.manha_litros || 0, dados.tarde_litros || 0,
      dados.ccs || null, dados.observacao || null,
      timestamp, timestamp,
    ],
  )
  return uuid
}

export async function excluirProducaoLeite(uuid) {
  const db = getDb()
  await executar(db, 'DELETE FROM producao_leite WHERE uuid = ?', [uuid])
}

export async function buscarProducaoLeite(uuid) {
  const db = getDb()
  const result = await executar(db, 'SELECT * FROM producao_leite WHERE uuid = ?', [uuid])
  return rowsToArray(result)
}

export async function buscarResumoProducaoLeite(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT pl.animal_uuid, a.nome AS nome_animal, a.id_fisico,
            COUNT(pl.uuid) AS total_registros,
            COALESCE(SUM(pl.manha_litros + pl.tarde_litros), 0) AS total_litros,
            COALESCE(AVG(pl.manha_litros + pl.tarde_litros), 0) AS media_diaria,
            MAX(pl.data) AS ultima_ordenha
     FROM producao_leite pl
     INNER JOIN animais a ON pl.animal_uuid = a.uuid
     WHERE pl.propriedade_uuid = ? AND a.deleted = 0
     GROUP BY pl.animal_uuid
     ORDER BY ultima_ordenha DESC`,
    [propriedadeUuid],
  )
  return rowsToArray(result)
}

// === ANÁLISE — DESEMPENHO LEITEIRO (Sprint 8) ===
// Todas filtram especie='bovino' AND sexo='femea' (vacas em lactação aptas).
// date('now', ?) usa UTC — documentado como limitação em documentacao/modules/milk.md.

// Q1 — Série temporal por animal (último N dias)
export async function serieAnimal(animalUuid, propriedadeUuid, dias) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT pl.data AS dia,
            COALESCE(SUM(pl.manha_litros + pl.tarde_litros), 0) AS total_litros
     FROM producao_leite pl
     INNER JOIN animais a ON pl.animal_uuid = a.uuid
     WHERE pl.animal_uuid = ?
       AND pl.propriedade_uuid = ?
       AND a.especie = 'bovino' AND a.sexo = 'femea' AND a.deleted = 0
       AND pl.data >= date('now', ?)
     GROUP BY pl.data
     ORDER BY pl.data ASC`,
    [animalUuid, propriedadeUuid, `-${dias} days`],
  )
  return rowsToArray(result)
}

// Q2 — Série temporal agregada por propriedade (último N dias)
export async function seriePropriedade(propriedadeUuid, dias) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT pl.data AS dia,
            COALESCE(SUM(pl.manha_litros + pl.tarde_litros), 0) AS total_litros,
            COUNT(DISTINCT pl.animal_uuid) AS vacas_ordenhadas
     FROM producao_leite pl
     INNER JOIN animais a ON pl.animal_uuid = a.uuid
     WHERE pl.propriedade_uuid = ?
       AND a.especie = 'bovino' AND a.sexo = 'femea' AND a.deleted = 0
       AND pl.data >= date('now', ?)
     GROUP BY pl.data
     ORDER BY pl.data ASC`,
    [propriedadeUuid, `-${dias} days`],
  )
  return rowsToArray(result)
}

// Q3 — Comparativo entre animais (janela recente vs janela anterior equivalente)
// JS calcula delta = total_recente - total_anterior e pct = delta / NULLIF(total_anterior, 0) * 100
export async function comparativoAnimais(propriedadeUuid, dias) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT a.uuid, a.nome, a.id_fisico,
            COALESCE(SUM(CASE WHEN pl.data >= date('now', ?)
                              THEN pl.manha_litros + pl.tarde_litros ELSE 0 END), 0) AS total_recente,
            COALESCE(SUM(CASE WHEN pl.data >= date('now', ?) AND pl.data < date('now', ?)
                              THEN pl.manha_litros + pl.tarde_litros ELSE 0 END), 0) AS total_anterior
     FROM animais a
     LEFT JOIN producao_leite pl ON pl.animal_uuid = a.uuid
     WHERE a.propriedade_uuid = ?
       AND a.especie = 'bovino' AND a.sexo = 'femea' AND a.deleted = 0
     GROUP BY a.uuid
     HAVING total_recente > 0 OR total_anterior > 0
     ORDER BY total_recente DESC`,
    [`-${dias} days`, `-${dias * 2} days`, `-${dias} days`, propriedadeUuid],
  )
  return rowsToArray(result)
}

// Q4 — Média histórica por propriedade (móvel 7/30/90 dias em uma query)
export async function mediaHistoricaPropriedade(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT
       (SELECT COALESCE(AVG(total_dia), 0) FROM (
          SELECT pl.data, SUM(pl.manha_litros + pl.tarde_litros) AS total_dia
          FROM producao_leite pl
          INNER JOIN animais a ON pl.animal_uuid = a.uuid
          WHERE pl.propriedade_uuid = ? AND a.especie = 'bovino' AND a.sexo = 'femea' AND a.deleted = 0
            AND pl.data >= date('now', '-7 days')
          GROUP BY pl.data
       )) AS media_7d,
       (SELECT COUNT(DISTINCT pl.data) FROM producao_leite pl
          INNER JOIN animais a ON pl.animal_uuid = a.uuid
          WHERE pl.propriedade_uuid = ? AND a.especie = 'bovino' AND a.sexo = 'femea' AND a.deleted = 0
            AND pl.data >= date('now', '-7 days')) AS dias_7d,
       (SELECT COALESCE(AVG(total_dia), 0) FROM (
          SELECT pl.data, SUM(pl.manha_litros + pl.tarde_litros) AS total_dia
          FROM producao_leite pl
          INNER JOIN animais a ON pl.animal_uuid = a.uuid
          WHERE pl.propriedade_uuid = ? AND a.especie = 'bovino' AND a.sexo = 'femea' AND a.deleted = 0
            AND pl.data >= date('now', '-30 days')
          GROUP BY pl.data
       )) AS media_30d,
       (SELECT COUNT(DISTINCT pl.data) FROM producao_leite pl
          INNER JOIN animais a ON pl.animal_uuid = a.uuid
          WHERE pl.propriedade_uuid = ? AND a.especie = 'bovino' AND a.sexo = 'femea' AND a.deleted = 0
            AND pl.data >= date('now', '-30 days')) AS dias_30d,
       (SELECT COALESCE(AVG(total_dia), 0) FROM (
          SELECT pl.data, SUM(pl.manha_litros + pl.tarde_litros) AS total_dia
          FROM producao_leite pl
          INNER JOIN animais a ON pl.animal_uuid = a.uuid
          WHERE pl.propriedade_uuid = ? AND a.especie = 'bovino' AND a.sexo = 'femea' AND a.deleted = 0
            AND pl.data >= date('now', '-90 days')
          GROUP BY pl.data
       )) AS media_90d,
       (SELECT COUNT(DISTINCT pl.data) FROM producao_leite pl
          INNER JOIN animais a ON pl.animal_uuid = a.uuid
          WHERE pl.propriedade_uuid = ? AND a.especie = 'bovino' AND a.sexo = 'femea' AND a.deleted = 0
            AND pl.data >= date('now', '-90 days')) AS dias_90d`,
    [propriedadeUuid, propriedadeUuid, propriedadeUuid, propriedadeUuid, propriedadeUuid, propriedadeUuid],
  )
  return rowsToArray(result)[0] || { media_7d: 0, dias_7d: 0, media_30d: 0, dias_30d: 0, media_90d: 0, dias_90d: 0 }
}

// Q5 — Alertas de queda brusca de produção
// Critério: variacao_dia_dia <= -20% (ontem vs hoje) OU variacao_7d <= -30% (média semana atual vs anterior)
// "hoje" = data mais recente com registro, "ante" = dia anterior ao mais recente
export async function alertasQuedaLeite(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `WITH ultima_data AS (
        SELECT MAX(pl.data) AS dia FROM producao_leite pl
        INNER JOIN animais a ON pl.animal_uuid = a.uuid
        WHERE pl.propriedade_uuid = ? AND a.especie = 'bovino' AND a.sexo = 'femea' AND a.deleted = 0
     ),
     hoje AS (
        SELECT pl.animal_uuid, SUM(pl.manha_litros + pl.tarde_litros) AS total
        FROM producao_leite pl, ultima_data
        WHERE pl.propriedade_uuid = ? AND pl.data = ultima_data.dia
        GROUP BY pl.animal_uuid
     ),
     ante AS (
        SELECT pl.animal_uuid, SUM(pl.manha_litros + pl.tarde_litros) AS total
        FROM producao_leite pl, ultima_data
        WHERE pl.propriedade_uuid = ? AND pl.data = date(ultima_data.dia, '-1 day')
        GROUP BY pl.animal_uuid
     ),
     seteA AS (
        SELECT pl.animal_uuid, AVG(pl.manha_litros + pl.tarde_litros) AS media
        FROM producao_leite pl, ultima_data
        WHERE pl.propriedade_uuid = ? AND pl.data >= date(ultima_data.dia, '-7 days') AND pl.data < ultima_data.dia
        GROUP BY pl.animal_uuid
     ),
     seteAnt AS (
        SELECT pl.animal_uuid, AVG(pl.manha_litros + pl.tarde_litros) AS media
        FROM producao_leite pl, ultima_data
        WHERE pl.propriedade_uuid = ? AND pl.data >= date(ultima_data.dia, '-14 days') AND pl.data < date(ultima_data.dia, '-7 days')
        GROUP BY pl.animal_uuid
     )
     SELECT a.uuid, a.nome, a.id_fisico,
            h.total AS total_dia,
            ant.total AS total_dia_anterior,
            CASE WHEN ant.total > 0 THEN ROUND((h.total - ant.total) * 100.0 / ant.total, 1) END AS variacao_dia_dia,
            s7.media AS media_7d,
            s7a.media AS media_7d_anterior,
            CASE WHEN s7a.media > 0 THEN ROUND((s7.media - s7a.media) * 100.0 / s7a.media, 1) END AS variacao_7d
     FROM animais a
     JOIN hoje h ON h.animal_uuid = a.uuid
     LEFT JOIN ante ant ON ant.animal_uuid = a.uuid
     LEFT JOIN seteA s7 ON s7.animal_uuid = a.uuid
     LEFT JOIN seteAnt s7a ON s7a.animal_uuid = a.uuid
     WHERE a.propriedade_uuid = ?
       AND a.especie = 'bovino' AND a.sexo = 'femea' AND a.deleted = 0
       AND (variacao_dia_dia IS NOT NULL AND variacao_dia_dia <= -20
            OR variacao_7d IS NOT NULL AND variacao_7d <= -30)
     ORDER BY COALESCE(variacao_7d, 9999) ASC, COALESCE(variacao_dia_dia, 9999) ASC`,
    [propriedadeUuid, propriedadeUuid, propriedadeUuid, propriedadeUuid, propriedadeUuid, propriedadeUuid],
  )
  return rowsToArray(result)
}

// ─── DESEMPENHO DE CORTE (machos bovinos + ovinos/caprinos) ────────────────
// Filtros: (a.especie='bovino' AND a.sexo='macho') OR a.especie IN ('ovino','caprino')
// date('now', ?) usa UTC — limitação documentada em documentacao/modules/corte.md.

// Q1 — série temporal de peso por animal
export async function seriePesoAnimal(animalUuid, propriedadeUuid, dias) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT p.data AS dia, p.peso, p.ecc
     FROM pesagens p
     INNER JOIN animais a ON p.animal_uuid = a.uuid
     WHERE p.animal_uuid = ?
       AND p.propriedade_uuid = ?
       AND p.deleted = 0
       AND a.deleted = 0
       AND ((a.especie = 'bovino' AND a.sexo = 'macho')
            OR a.especie IN ('ovino', 'caprino'))
       AND p.data >= date('now', ?)
     ORDER BY p.data ASC`,
    [animalUuid, propriedadeUuid, `-${dias} days`],
  )
  return rowsToArray(result)
}

// Q2 — série temporal agregada por propriedade (peso médio + animais pesados)
export async function seriePesoPropriedade(propriedadeUuid, dias) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT p.data AS dia,
            AVG(p.peso) AS peso_medio,
            COUNT(DISTINCT p.animal_uuid) AS animais_pesados
     FROM pesagens p
     INNER JOIN animais a ON p.animal_uuid = a.uuid
     WHERE p.propriedade_uuid = ?
       AND p.deleted = 0
       AND a.deleted = 0
       AND ((a.especie = 'bovino' AND a.sexo = 'macho')
            OR a.especie IN ('ovino', 'caprino'))
       AND p.data >= date('now', ?)
     GROUP BY p.data
     ORDER BY p.data ASC`,
    [propriedadeUuid, `-${dias} days`],
  )
  return rowsToArray(result)
}

// Q3 — Ranking de animais por GMD (kg/dia) na janela
// Calcula GMD usando primeira e última pesagem dentro da janela por animal.
export async function rankingGmdAnimais(propriedadeUuid, dias) {
  const db = getDb()
  const result = await executar(
    db,
    `WITH pesagens_janela AS (
       SELECT p.animal_uuid, p.data, p.peso,
              ROW_NUMBER() OVER (PARTITION BY p.animal_uuid ORDER BY p.data ASC) AS rn_asc,
              ROW_NUMBER() OVER (PARTITION BY p.animal_uuid ORDER BY p.data DESC) AS rn_desc,
              COUNT(*) OVER (PARTITION BY p.animal_uuid) AS total_pesagens
       FROM pesagens p
       INNER JOIN animais a ON p.animal_uuid = a.uuid
       WHERE p.propriedade_uuid = ?
         AND p.deleted = 0
         AND a.deleted = 0
         AND ((a.especie = 'bovino' AND a.sexo = 'macho')
              OR a.especie IN ('ovino', 'caprino'))
         AND p.data >= date('now', ?)
     )
     SELECT a.uuid,
            a.nome,
            a.id_fisico,
            a.peso_abate_estimado,
            MAX(CASE WHEN pj.rn_desc = 1 THEN pj.peso END) AS peso_atual,
            MAX(CASE WHEN pj.rn_asc = 1 THEN pj.peso END) AS peso_anterior,
            MAX(pj.total_pesagens) AS total_pesagens,
            CASE
              WHEN MAX(pj.total_pesagens) >= 2 THEN
                ROUND(
                  (MAX(CASE WHEN pj.rn_desc = 1 THEN pj.peso END)
                   - MAX(CASE WHEN pj.rn_asc = 1 THEN pj.peso END))
                  / MAX(julianday(MAX(CASE WHEN pj.rn_desc = 1 THEN pj.data END)
                       - julianday(MAX(CASE WHEN pj.rn_asc = 1 THEN pj.data END))),
                  3
                )
              ELSE NULL
            END AS gmd
     FROM animais a
     INNER JOIN pesagens_janela pj ON pj.animal_uuid = a.uuid
     WHERE a.deleted = 0
       AND ((a.especie = 'bovino' AND a.sexo = 'macho')
            OR a.especie IN ('ovino', 'caprino'))
     GROUP BY a.uuid, a.nome, a.id_fisico, a.peso_abate_estimado
     ORDER BY gmd DESC`,
    [propriedadeUuid, `-${dias} days`],
  )
  return rowsToArray(result)
}

// Q4 — Média histórica de GMD + ECC médio em janelas 7/30/90 dias
// gmd_dias_Nd = número de animais com ≥2 pesagens na janela (aptos a calcular GMD)
export async function mediaHistoricaGmdPropriedade(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT
       (SELECT COALESCE(ROUND(AVG(gmd_animal), 3), 0)
        FROM (
          SELECT
            (MAX(CASE WHEN rn_desc = 1 THEN peso END)
             - MAX(CASE WHEN rn_asc = 1 THEN peso END))
            / MAX(julianday(MAX(CASE WHEN rn_desc = 1 THEN data END)
                 - julianday(MAX(CASE WHEN rn_asc = 1 THEN data END)))) AS gmd_animal
          FROM (
            SELECT p.animal_uuid, p.data, p.peso,
                   ROW_NUMBER() OVER (PARTITION BY p.animal_uuid ORDER BY p.data ASC) AS rn_asc,
                   ROW_NUMBER() OVER (PARTITION BY p.animal_uuid ORDER BY p.data DESC) AS rn_desc,
                   COUNT(*) OVER (PARTITION BY p.animal_uuid) AS total
            FROM pesagens p
            INNER JOIN animais a ON p.animal_uuid = a.uuid
            WHERE p.propriedade_uuid = ?
              AND p.deleted = 0
              AND a.deleted = 0
              AND ((a.especie = 'bovino' AND a.sexo = 'macho')
                   OR a.especie IN ('ovino', 'caprino'))
              AND p.data >= date('now', '-7 days')
          )
          GROUP BY animal_uuid
          HAVING MAX(total) >= 2
        )) AS gmd_media_7d,
       (SELECT COUNT(*)
        FROM (
          SELECT animal_uuid, COUNT(*) AS total
          FROM pesagens p
          INNER JOIN animais a ON p.animal_uuid = a.uuid
          WHERE p.propriedade_uuid = ?
            AND p.deleted = 0 AND a.deleted = 0
            AND ((a.especie = 'bovino' AND a.sexo = 'macho')
                 OR a.especie IN ('ovino', 'caprino'))
            AND p.data >= date('now', '-7 days')
          GROUP BY animal_uuid
          HAVING total >= 2
        )) AS gmd_dias_7d,
       (SELECT COALESCE(ROUND(AVG(gmd_animal), 3), 0)
        FROM (
          SELECT
            (MAX(CASE WHEN rn_desc = 1 THEN peso END)
             - MAX(CASE WHEN rn_asc = 1 THEN peso END))
            / MAX(julianday(MAX(CASE WHEN rn_desc = 1 THEN data END)
                 - julianday(MAX(CASE WHEN rn_asc = 1 THEN data END)))) AS gmd_animal
          FROM (
            SELECT p.animal_uuid, p.data, p.peso,
                   ROW_NUMBER() OVER (PARTITION BY p.animal_uuid ORDER BY p.data ASC) AS rn_asc,
                   ROW_NUMBER() OVER (PARTITION BY p.animal_uuid ORDER BY p.data DESC) AS rn_desc,
                   COUNT(*) OVER (PARTITION BY p.animal_uuid) AS total
            FROM pesagens p
            INNER JOIN animais a ON p.animal_uuid = a.uuid
            WHERE p.propriedade_uuid = ?
              AND p.deleted = 0
              AND a.deleted = 0
              AND ((a.especie = 'bovino' AND a.sexo = 'macho')
                   OR a.especie IN ('ovino', 'caprino'))
              AND p.data >= date('now', '-30 days')
          )
          GROUP BY animal_uuid
          HAVING MAX(total) >= 2
        )) AS gmd_media_30d,
       (SELECT COUNT(*)
        FROM (
          SELECT animal_uuid, COUNT(*) AS total
          FROM pesagens p
          INNER JOIN animais a ON p.animal_uuid = a.uuid
          WHERE p.propriedade_uuid = ?
            AND p.deleted = 0 AND a.deleted = 0
            AND ((a.especie = 'bovino' AND a.sexo = 'macho')
                 OR a.especie IN ('ovino', 'caprino'))
            AND p.data >= date('now', '-30 days')
          GROUP BY animal_uuid
          HAVING total >= 2
        )) AS gmd_dias_30d,
       (SELECT COALESCE(ROUND(AVG(gmd_animal), 3), 0)
        FROM (
          SELECT
            (MAX(CASE WHEN rn_desc = 1 THEN peso END)
             - MAX(CASE WHEN rn_asc = 1 THEN peso END))
            / MAX(julianday(MAX(CASE WHEN rn_desc = 1 THEN data END)
                 - julianday(MAX(CASE WHEN rn_asc = 1 THEN data END)))) AS gmd_animal
          FROM (
            SELECT p.animal_uuid, p.data, p.peso,
                   ROW_NUMBER() OVER (PARTITION BY p.animal_uuid ORDER BY p.data ASC) AS rn_asc,
                   ROW_NUMBER() OVER (PARTITION BY p.animal_uuid ORDER BY p.data DESC) AS rn_desc,
                   COUNT(*) OVER (PARTITION BY p.animal_uuid) AS total
            FROM pesagens p
            INNER JOIN animais a ON p.animal_uuid = a.uuid
            WHERE p.propriedade_uuid = ?
              AND p.deleted = 0
              AND a.deleted = 0
              AND ((a.especie = 'bovino' AND a.sexo = 'macho')
                   OR a.especie IN ('ovino', 'caprino'))
              AND p.data >= date('now', '-90 days')
          )
          GROUP BY animal_uuid
          HAVING MAX(total) >= 2
        )) AS gmd_media_90d,
       (SELECT COUNT(*)
        FROM (
          SELECT animal_uuid, COUNT(*) AS total
          FROM pesagens p
          INNER JOIN animais a ON p.animal_uuid = a.uuid
          WHERE p.propriedade_uuid = ?
            AND p.deleted = 0 AND a.deleted = 0
            AND ((a.especie = 'bovino' AND a.sexo = 'macho')
                 OR a.especie IN ('ovino', 'caprino'))
            AND p.data >= date('now', '-90 days')
          GROUP BY animal_uuid
          HAVING total >= 2
        )) AS gmd_dias_90d,
       (SELECT COALESCE(ROUND(AVG(p.ecc), 2), 0)
        FROM pesagens p
        INNER JOIN animais a ON p.animal_uuid = a.uuid
        WHERE p.propriedade_uuid = ?
          AND p.deleted = 0 AND a.deleted = 0
          AND p.ecc IS NOT NULL
          AND ((a.especie = 'bovino' AND a.sexo = 'macho')
               OR a.especie IN ('ovino', 'caprino'))
          AND p.data >= date('now', '-90 days')) AS ecc_medio_90d`,
    [propriedadeUuid, propriedadeUuid, propriedadeUuid, propriedadeUuid, propriedadeUuid, propriedadeUuid, propriedadeUuid],
  )
  return rowsToArray(result).length > 0 ? rowsToArray(result)[0] : {
    gmd_media_7d: 0, gmd_dias_7d: 0,
    gmd_media_30d: 0, gmd_dias_30d: 0,
    gmd_media_90d: 0, gmd_dias_90d: 0,
    ecc_medio_90d: 0,
  }
}

// Q5 — Alertas de Corte (3 categorias)
// perda: GMD janela-7d < 0
// estagnacao: 0 <= GMD < 0.3 E >= 3 pesagens na janela
// pronto_abate: última pesagem >= 95% do peso_abate_estimado
export async function alertasCortePropriedade(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `WITH pesagens_janela AS (
       SELECT p.animal_uuid, p.data, p.peso,
              ROW_NUMBER() OVER (PARTITION BY p.animal_uuid ORDER BY p.data ASC) AS rn_asc,
              ROW_NUMBER() OVER (PARTITION BY p.animal_uuid ORDER BY p.data DESC) AS rn_desc,
              COUNT(*) OVER (PARTITION BY p.animal_uuid) AS total
       FROM pesagens p
       INNER JOIN animais a ON p.animal_uuid = a.uuid
       WHERE p.propriedade_uuid = ?
         AND p.deleted = 0 AND a.deleted = 0
         AND ((a.especie = 'bovino' AND a.sexo = 'macho')
              OR a.especie IN ('ovino', 'caprino'))
         AND p.data >= date('now', '-7 days')
     ),
     gmd_janela AS (
       SELECT animal_uuid,
              MAX(total) AS total_pesagens,
              MAX(CASE WHEN rn_desc = 1 THEN peso END) AS peso_atual,
              MAX(CASE WHEN rn_asc = 1 THEN peso END) AS peso_anterior,
              CASE
                WHEN MAX(total) >= 2 THEN
                  (MAX(CASE WHEN rn_desc = 1 THEN peso END)
                   - MAX(CASE WHEN rn_asc = 1 THEN peso END))
                  / MAX(julianday(MAX(CASE WHEN rn_desc = 1 THEN data END)
                       - julianday(MAX(CASE WHEN rn_asc = 1 THEN data END))))
                ELSE NULL
              END AS gmd
       FROM pesagens_janela
       GROUP BY animal_uuid
     ),
     ultima_pesagem AS (
       SELECT p.animal_uuid, p.peso AS peso_atual_global
       FROM pesagens p
       INNER JOIN animais a ON p.animal_uuid = a.uuid
       WHERE p.propriedade_uuid = ?
         AND p.deleted = 0 AND a.deleted = 0
         AND ((a.especie = 'bovino' AND a.sexo = 'macho')
              OR a.especie IN ('ovino', 'caprino'))
         AND p.data = (
           SELECT MAX(p2.data) FROM pesagens p2
           WHERE p2.animal_uuid = p.animal_uuid AND p2.deleted = 0
         )
     )
     SELECT a.uuid,
            a.nome,
            a.id_fisico,
            a.peso_abate_estimado,
            up.peso_atual_global AS peso_atual,
            gj.gmd,
            gj.total_pesagens,
            CASE
              WHEN up.peso_atual_global IS NOT NULL
                   AND a.peso_abate_estimado IS NOT NULL
                   AND a.peso_abate_estimado > 0
                   AND up.peso_atual_global >= (a.peso_abate_estimado * 0.95)
                THEN 'pronto_abate'
              WHEN gj.gmd IS NOT NULL AND gj.gmd < 0 THEN 'perda'
              WHEN gj.gmd IS NOT NULL AND gj.gmd >= 0 AND gj.gmd < 0.3
                   AND gj.total_pesagens >= 3 THEN 'estagnacao'
              ELSE NULL
            END AS tipo_alerta,
            CASE
              WHEN up.peso_atual_global IS NOT NULL
                   AND a.peso_abate_estimado IS NOT NULL
                   AND a.peso_abate_estimado > 0
                THEN ROUND(100.0 * up.peso_atual_global / a.peso_abate_estimado, 1)
              ELSE NULL
            END AS pct_abate
     FROM animais a
     LEFT JOIN gmd_janela gj ON gj.animal_uuid = a.uuid
     LEFT JOIN ultima_pesagem up ON up.animal_uuid = a.uuid
     WHERE a.propriedade_uuid = ?
       AND a.deleted = 0
       AND ((a.especie = 'bovino' AND a.sexo = 'macho')
            OR a.especie IN ('ovino', 'caprino'))
       AND (tipo_alerta IS NOT NULL)
     ORDER BY
       CASE tipo_alerta
         WHEN 'pronto_abate' THEN 1
         WHEN 'perda' THEN 2
         WHEN 'estagnacao' THEN 3
       END,
       a.nome ASC`,
    [propriedadeUuid, propriedadeUuid, propriedadeUuid],
  )
  return rowsToArray(result)
}

// ─── TRANSACOES FINANCEIRAS (Sprint 10) ───

// Categorias fixas (catálogo seed via SQL_MIGRACOES)
export async function listarCategorias() {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT * FROM categorias_financeiras ORDER BY tipo ASC, ordem ASC`,
    [],
  )
  return rowsToArray(result)
}

export async function buscarCategoriaPorNome(nome) {
  const db = getDb()
  const result = await executar(
    db,
    'SELECT * FROM categorias_financeiras WHERE nome = ?',
    [nome],
  )
  return result.rows.length > 0 ? result.rows.item(0) : null
}

// Inserir transação financeira (receita ou despesa)
export async function inserirTransacaoFinanceira(dados) {
  const db = getDb()
  const uuid = dados.uuid || gerarUUID()
  const timestamp = agora()
  await executar(
    db,
    `INSERT INTO transacoes_financeiras
     (uuid, propriedade_uuid, animal_uuid, categoria_uuid, tipo, descricao, valor, data,
      created_at, updated_at, synced_at, sync_status, deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, 'novo', 0)`,
    [
      uuid,
      dados.propriedade_uuid,
      dados.animal_uuid || null,
      dados.categoria_uuid,
      dados.tipo,
      dados.descricao || null,
      dados.valor,
      dados.data,
      timestamp,
      timestamp,
    ],
  )
  return uuid
}

export async function buscarTransacao(uuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT t.*, c.rotulo AS categoria_rotulo, c.nome AS categoria_nome
     FROM transacoes_financeiras t
     LEFT JOIN categorias_financeiras c ON t.categoria_uuid = c.uuid
     WHERE t.uuid = ?`,
    [uuid],
  )
  return result.rows.length > 0 ? result.rows.item(0) : null
}

// Listar transações da propriedade com filtros opcionais (dataInicio, dataFim, categoriaUuid, tipo, animalUuid)
export async function listarTransacoesPropriedade(propriedadeUuid, filtros = {}) {
  const db = getDb()
  const where = ['t.propriedade_uuid = ?', 't.deleted = 0']
  const params = [propriedadeUuid]
  if (filtros.dataInicio) {
    where.push('t.data >= ?')
    params.push(filtros.dataInicio)
  }
  if (filtros.dataFim) {
    where.push('t.data <= ?')
    params.push(filtros.dataFim)
  }
  if (filtros.categoriaUuid) {
    where.push('t.categoria_uuid = ?')
    params.push(filtros.categoriaUuid)
  }
  if (filtros.tipo) {
    where.push('t.tipo = ?')
    params.push(filtros.tipo)
  }
  if (filtros.animalUuid) {
    where.push('t.animal_uuid = ?')
    params.push(filtros.animalUuid)
  }
  const result = await executar(
    db,
    `SELECT t.*, c.rotulo AS categoria_rotulo, c.nome AS categoria_nome,
            a.nome AS animal_nome
     FROM transacoes_financeiras t
     LEFT JOIN categorias_financeiras c ON t.categoria_uuid = c.uuid
     LEFT JOIN animais a ON t.animal_uuid = a.uuid
     WHERE ${where.join(' AND ')}
     ORDER BY t.data DESC, t.created_at DESC`,
    params,
  )
  return rowsToArray(result)
}

// Listar transações vinculadas a um animal específico
export async function listarTransacoesAnimal(animalUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT t.*, c.rotulo AS categoria_rotulo, c.nome AS categoria_nome
     FROM transacoes_financeiras t
     LEFT JOIN categorias_financeiras c ON t.categoria_uuid = c.uuid
     WHERE t.animal_uuid = ? AND t.deleted = 0
     ORDER BY t.data DESC, t.created_at DESC`,
    [animalUuid],
  )
  return rowsToArray(result)
}

// Excluir transação (soft delete + marcar como modificado para sync)
export async function excluirTransacao(uuid) {
  const db = getDb()
  const timestamp = agora()
  await executar(
    db,
    `UPDATE transacoes_financeiras
     SET deleted = 1, updated_at = ?, sync_status = 'modificado'
     WHERE uuid = ?`,
    [timestamp, uuid],
  )
}

// Saldo total da propriedade: { receitas, despesas, saldo }
export async function saldoPropriedade(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT
       COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) AS receitas,
       COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) AS despesas
     FROM transacoes_financeiras
     WHERE propriedade_uuid = ? AND deleted = 0`,
    [propriedadeUuid],
  )
  const row = result.rows.length > 0 ? result.rows.item(0) : { receitas: 0, despesas: 0 }
  return {
    receitas: row.receitas || 0,
    despesas: row.despesas || 0,
    saldo: (row.receitas || 0) - (row.despesas || 0),
  }
}

// Resumo por categoria em um período
export async function resumoPorCategoria(propriedadeUuid, dataInicio, dataFim) {
  const db = getDb()
  const where = ['t.propriedade_uuid = ?', 't.deleted = 0']
  const params = [propriedadeUuid]
  if (dataInicio) {
    where.push('t.data >= ?')
    params.push(dataInicio)
  }
  if (dataFim) {
    where.push('t.data <= ?')
    params.push(dataFim)
  }
  const result = await executar(
    db,
    `SELECT t.categoria_uuid, c.nome AS categoria, c.rotulo, c.tipo,
            SUM(t.valor) AS total
     FROM transacoes_financeiras t
     INNER JOIN categorias_financeiras c ON t.categoria_uuid = c.uuid
     WHERE ${where.join(' AND ')}
     GROUP BY t.categoria_uuid, c.nome, c.rotulo, c.tipo
     ORDER BY c.tipo ASC, total DESC`,
    params,
  )
  return rowsToArray(result)
}

// Resumo por animal em um período (receitas - despesas vinculadas)
export async function resumoPorAnimal(propriedadeUuid, dataInicio, dataFim) {
  const db = getDb()
  const where = ['t.propriedade_uuid = ?', 't.deleted = 0', 't.animal_uuid IS NOT NULL']
  const params = [propriedadeUuid]
  if (dataInicio) {
    where.push('t.data >= ?')
    params.push(dataInicio)
  }
  if (dataFim) {
    where.push('t.data <= ?')
    params.push(dataFim)
  }
  const result = await executar(
    db,
    `SELECT a.uuid AS animal_uuid, a.nome, a.id_fisico,
            COALESCE(SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END), 0) AS receitas,
            COALESCE(SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor ELSE 0 END), 0) AS despesas
     FROM transacoes_financeiras t
     INNER JOIN animais a ON t.animal_uuid = a.uuid
     WHERE ${where.join(' AND ')}
     GROUP BY a.uuid, a.nome, a.id_fisico
     ORDER BY (receitas - despesas) DESC`,
    params,
  )
  const rows = rowsToArray(result)
  return rows.map(r => ({
    ...r,
    saldo: (r.receitas || 0) - (r.despesas || 0),
  }))
}

// Série mensal (últimos N meses): [{ mes, receitas, despesas, saldo }]
export async function serieMensalPropriedade(propriedadeUuid, meses = 12) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT strftime('%Y-%m', t.data) AS mes,
            COALESCE(SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END), 0) AS receitas,
            COALESCE(SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor ELSE 0 END), 0) AS despesas
     FROM transacoes_financeiras t
     WHERE t.propriedade_uuid = ?
       AND t.deleted = 0
       AND t.data >= date('now', ?)
     GROUP BY strftime('%Y-%m', t.data)
     ORDER BY mes ASC`,
    [propriedadeUuid, `-${meses - 1} months`],
  )
  const rows = rowsToArray(result)
  return rows.map(r => ({
    ...r,
    saldo: (r.receitas || 0) - (r.despesas || 0),
  }))
}

// Sync helpers genéricos (listarPendentes, marcarSincronizado, upsertLocal) em queries.js
// já cobrem transacoes_financeiras por nome de tabela — não precisamos de wrappers específicos.
// Ver pullEngine.js:69 (upsertLocal) e queries.js:699 (listarPendentes).

// Atualizar transação existente (mantém sync_status='modificado' para push)
export async function atualizarTransacao(uuid, dados) {
  const db = getDb()
  const timestamp = agora()
  const campos = []
  const params = []
  if (dados.categoria_uuid !== undefined) { campos.push('categoria_uuid = ?'); params.push(dados.categoria_uuid) }
  if (dados.tipo !== undefined) { campos.push('tipo = ?'); params.push(dados.tipo) }
  if (dados.descricao !== undefined) { campos.push('descricao = ?'); params.push(dados.descricao || null) }
  if (dados.valor !== undefined) { campos.push('valor = ?'); params.push(dados.valor) }
  if (dados.data !== undefined) { campos.push('data = ?'); params.push(dados.data) }
  if (dados.animal_uuid !== undefined) { campos.push('animal_uuid = ?'); params.push(dados.animal_uuid || null) }
  if (campos.length === 0) return
  campos.push('updated_at = ?', "sync_status = 'modificado'")
  params.push(timestamp, uuid)
  await executar(
    db,
    `UPDATE transacoes_financeiras SET ${campos.join(', ')} WHERE uuid = ?`,
    params,
  )
}

// ─── NOTIFICACOES (Sprint 11) ───────────────────────────────────────────────

export async function inserirNotificacao(dados) {
  const db = getDb()
  const uuid = dados.uuid || gerarUUID()
  const timestamp = agora()
  await executar(
    db,
    `INSERT OR IGNORE INTO notificacoes
     (uuid, propriedade_uuid, usuario_uuid, tipo, titulo, descricao, nivel,
      modulo, referencia_uuid, lida, created_at, updated_at, sync_status, deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'novo', 0)`,
    [
      uuid,
      dados.propriedade_uuid,
      dados.usuario_uuid,
      dados.tipo,
      dados.titulo,
      dados.descricao || null,
      dados.nivel,
      dados.modulo,
      dados.referencia_uuid || null,
      timestamp,
      timestamp,
    ],
  )
  return uuid
}

export async function buscarNotificacao(uuid) {
  const db = getDb()
  const result = await executar(
    db,
    'SELECT * FROM notificacoes WHERE uuid = ?',
    [uuid],
  )
  return result.rows.length > 0 ? result.rows.item(0) : null
}

export async function listarNaoLidasPropriedade(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT * FROM notificacoes
     WHERE propriedade_uuid = ? AND lida = 0 AND deleted = 0
     ORDER BY created_at DESC`,
    [propriedadeUuid],
  )
  return rowsToArray(result)
}

export async function listarTodasPropriedade(propriedadeUuid, filtros = {}) {
  const db = getDb()
  const where = ['propriedade_uuid = ?', 'deleted = 0']
  const params = [propriedadeUuid]
  if (filtros.modulo) {
    where.push('modulo = ?')
    params.push(filtros.modulo)
  }
  if (filtros.nivel) {
    where.push('nivel = ?')
    params.push(filtros.nivel)
  }
  if (filtros.lida !== undefined && filtros.lida !== null) {
    where.push('lida = ?')
    params.push(filtros.lida ? 1 : 0)
  }
  const result = await executar(
    db,
    `SELECT * FROM notificacoes
     WHERE ${where.join(' AND ')}
     ORDER BY created_at DESC`,
    params,
  )
  return rowsToArray(result)
}

export async function contarNaoLidasPropriedade(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT COUNT(*) AS total FROM notificacoes
     WHERE propriedade_uuid = ? AND lida = 0 AND deleted = 0`,
    [propriedadeUuid],
  )
  const row = result.rows.length > 0 ? result.rows.item(0) : { total: 0 }
  return row.total || 0
}

export async function marcarNotificacaoLida(uuid) {
  const db = getDb()
  const timestamp = agora()
  await executar(
    db,
    `UPDATE notificacoes
     SET lida = 1, updated_at = ?, sync_status = 'modificado'
     WHERE uuid = ?`,
    [timestamp, uuid],
  )
}

export async function marcarTodasNotificacoesLidas(propriedadeUuid) {
  const db = getDb()
  const timestamp = agora()
  await executar(
    db,
    `UPDATE notificacoes
     SET lida = 1, updated_at = ?, sync_status = 'modificado'
     WHERE propriedade_uuid = ? AND lida = 0 AND deleted = 0`,
    [timestamp, propriedadeUuid],
  )
}

export async function excluirNotificacao(uuid) {
  const db = getDb()
  const timestamp = agora()
  await executar(
    db,
    `UPDATE notificacoes
     SET deleted = 1, updated_at = ?, sync_status = 'modificado'
     WHERE uuid = ?`,
    [timestamp, uuid],
  )
}

export async function buscarNotificacaoPorTipoRef(propriedadeUuid, tipo, referenciaUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT * FROM notificacoes
     WHERE propriedade_uuid = ? AND tipo = ? AND referencia_uuid = ? AND deleted = 0`,
    [propriedadeUuid, tipo, referenciaUuid],
  )
  return result.rows.length > 0 ? result.rows.item(0) : null
}

export async function excluirNotificacoesPorTipoRef(propriedadeUuid, tipo, referenciaUuid) {
  const db = getDb()
  const timestamp = agora()
  await executar(
    db,
    `UPDATE notificacoes
     SET deleted = 1, updated_at = ?, sync_status = 'modificado'
     WHERE propriedade_uuid = ? AND tipo = ? AND referencia_uuid = ? AND deleted = 0`,
    [timestamp, propriedadeUuid, tipo, referenciaUuid],
  )
}

// ─── BAIXAS (Sprint 10: registro de venda/morte/consumo — RF08) ──────────

export async function inserirBaixa(dados) {
  const db = getDb()
  const uuid = dados.uuid || gerarUUID()
  const timestamp = agora()
  const statusMap = { venda: 'vendido', morte: 'morto', consumo: 'consumido' }
  const novoStatus = statusMap[dados.tipo] || 'ativo'

  await executar(
    db,
    `INSERT INTO baixas
     (uuid, animal_uuid, propriedade_uuid, tipo, valor_recebido, data, motivo,
      created_at, updated_at, synced_at, sync_status, deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, null, 'novo', 0)`,
    [
      uuid,
      dados.animal_uuid,
      dados.propriedade_uuid,
      dados.tipo,
      dados.valor_recebido || 0,
      dados.data,
      dados.motivo || null,
      timestamp,
      timestamp,
    ],
  )

  // Atualiza o status do animal
  await executar(
    db,
    `UPDATE animais SET status = ?, updated_at = ?, sync_status = 'modificado'
     WHERE uuid = ?`,
    [novoStatus, timestamp, dados.animal_uuid],
  )

  return uuid
}

export async function buscarBaixa(uuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT b.*, a.nome AS animal_nome, a.id_fisico
     FROM baixas b
     LEFT JOIN animais a ON b.animal_uuid = a.uuid
     WHERE b.uuid = ?`,
    [uuid],
  )
  return result.rows.length > 0 ? result.rows.item(0) : null
}

export async function listarBaixasPropriedade(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT b.*, a.nome AS animal_nome, a.id_fisico
     FROM baixas b
     LEFT JOIN animais a ON b.animal_uuid = a.uuid
     WHERE b.propriedade_uuid = ? AND b.deleted = 0
     ORDER BY b.data DESC`,
    [propriedadeUuid],
  )
  return rowsToArray(result)
}

export async function excluirBaixa(uuid) {
  const db = getDb()
  const timestamp = agora()
  await executar(
    db,
    `UPDATE baixas
     SET deleted = 1, updated_at = ?, sync_status = 'modificado'
     WHERE uuid = ?`,
    [timestamp, uuid],
  )
}

// ─── CUSTO ACUMULADO E LUCRATIVIDADE (RF08) ──────────────────────────────

// Custo acumulado de um animal: valor_compra + soma de vacinas + soma de medicamentos
export async function custoAcumuladoAnimal(animalUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT a.valor_compra,
            COALESCE((SELECT COUNT(*) FROM vacinas v WHERE v.animal_uuid = a.uuid), 0) AS qtd_vacinas,
            COALESCE((SELECT COUNT(*) FROM medicamentos m WHERE m.animal_uuid = a.uuid), 0) AS qtd_medicamentos
     FROM animais a
     WHERE a.uuid = ?`,
    [animalUuid],
  )
  if (result.rows.length === 0) return null
  const row = result.rows.item(0)
  return {
    valor_compra: row.valor_compra || 0,
    qtd_vacinas: row.qtd_vacinas,
    qtd_medicamentos: row.qtd_medicamentos,
  }
}

// Custo acumulado para todos os animais da propriedade (para relatório)
export async function custoAcumuladoPropriedade(propriedadeUuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT a.uuid AS animal_uuid, a.nome, a.id_fisico, a.valor_compra,
            COALESCE(vac.total, 0) AS qtd_vacinas,
            COALESCE(med.total, 0) AS qtd_medicamentos
     FROM animais a
     LEFT JOIN (
       SELECT animal_uuid, COUNT(*) AS total
       FROM vacinas
       GROUP BY animal_uuid
     ) vac ON a.uuid = vac.animal_uuid
     LEFT JOIN (
       SELECT animal_uuid, COUNT(*) AS total
       FROM medicamentos
       GROUP BY animal_uuid
     ) med ON a.uuid = med.animal_uuid
     WHERE a.propriedade_uuid = ? AND a.deleted = 0 AND a.status = 'ativo'
     ORDER BY COALESCE(a.valor_compra, 0) DESC`,
    [propriedadeUuid],
  )
  return rowsToArray(result)
}

// Resumo financeiro completo por animal: valor_compra + receitas/despesas vinculadas + lucratividade
export async function lucratividadePropriedade(propriedadeUuid, cotacaoKg) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT a.uuid AS animal_uuid, a.nome, a.id_fisico, a.valor_compra,
            (SELECT MAX(p.peso) FROM pesagens p WHERE p.animal_uuid = a.uuid) AS peso_atual,
            COALESCE(vac.total, 0) AS qtd_vacinas,
            COALESCE(med.total, 0) AS qtd_medicamentos,
            COALESCE(rec.receitas, 0) AS receitas_vinculadas,
            COALESCE(des.despesas, 0) AS despesas_vinculadas
     FROM animais a
     LEFT JOIN (
       SELECT animal_uuid, COUNT(*) AS total
       FROM vacinas
       GROUP BY animal_uuid
     ) vac ON a.uuid = vac.animal_uuid
     LEFT JOIN (
       SELECT animal_uuid, COUNT(*) AS total
       FROM medicamentos
       GROUP BY animal_uuid
     ) med ON a.uuid = med.animal_uuid
     LEFT JOIN (
       SELECT animal_uuid, SUM(valor) AS receitas
       FROM transacoes_financeiras
       WHERE tipo = 'receita' AND deleted = 0
       GROUP BY animal_uuid
     ) rec ON a.uuid = rec.animal_uuid
     LEFT JOIN (
       SELECT animal_uuid, SUM(valor) AS despesas
       FROM transacoes_financeiras
       WHERE tipo = 'despesa' AND deleted = 0
       GROUP BY animal_uuid
     ) des ON a.uuid = des.animal_uuid
     WHERE a.propriedade_uuid = ? AND a.deleted = 0 AND a.status = 'ativo'
     ORDER BY a.nome ASC`,
    [propriedadeUuid],
  )
  const rows = rowsToArray(result)
  const cotacao = cotacaoKg || 0
  return rows.map(r => {
    const valorCompra = r.valor_compra || 0
    const valorMercado = (r.peso_atual || 0) * cotacao
    const receitas = r.receitas_vinculadas || 0
    const despesas = r.despesas_vinculadas || 0
    const lucro = (receitas + valorMercado) - (valorCompra + despesas)
    return {
      ...r,
      custo_acumulado: valorCompra,
      valor_mercado: valorMercado,
      lucro,
      status_lucratividade: lucro > 0 ? 'lucro' : lucro < 0 ? 'prejuizo' : 'empate',
    }
  })
}

