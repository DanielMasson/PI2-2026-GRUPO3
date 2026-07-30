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
  return uuid
}

export async function atualizarAnimal(uuid, dados) {
  const db = getDb()
  const timestamp = agora()
  const campos = []
  const params = []

  const editaveis = ['nome', 'id_interno', 'id_fisico', 'especie', 'raca', 'sexo', 'data_nascimento', 'peso_inicial', 'pelagem', 'genetica', 'origem', 'mae_uuid', 'pai_uuid', 'status']
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
