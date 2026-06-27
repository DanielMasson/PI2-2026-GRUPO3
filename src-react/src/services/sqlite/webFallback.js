/**
 * Fallback web para cordova-sqlite-storage
 * Permite npm run dev funcionar sem o plugin nativo.
 * Usa localStorage + JSON como persistência temporária.
 * Suporta JOINs com aliases, WHERE com prefixo de tabela,
 * ORDER BY, LIMIT, IS NULL/IS NOT NULL, funções date().
 */

const STORAGE_PREFIX = 'pi_db_'

// Split string by comma, respecting parentheses depth and single-quoted strings
function splitRespectingParens(str) {
  const parts = []
  let depth = 0
  let inQuote = false
  let current = ''
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    if (ch === "'" && !inQuote) inQuote = true
    else if (ch === "'" && inQuote) inQuote = false
    else if (ch === '(' && !inQuote) depth++
    else if (ch === ')' && !inQuote) depth--
    if (ch === ',' && depth === 0 && !inQuote) {
      parts.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  if (current) parts.push(current)
  return parts
}

function getTabela(tabela) {
  const raw = localStorage.getItem(STORAGE_PREFIX + tabela)
  return raw ? JSON.parse(raw) : []
}

function salvarTabela(tabela, dados) {
  localStorage.setItem(STORAGE_PREFIX + tabela, JSON.stringify(dados))
}

function compararValor(registro, coluna, operador, valor) {
  const val = registro[coluna]
  if (val === undefined || val === null) return false
  switch (operador) {
    case '=': return val == valor
    case '!=': return val != valor
    case '>': return val > valor
    case '<': return val < valor
    case '>=': return val >= valor
    case '<=': return val <= valor
    default: return val == valor
  }
}

/**
 * Resolve um nome de coluna com possível prefixo de alias (ex: "v.propriedade_uuid" → "propriedade_uuid")
 */
function resolverColuna(colunaComPrefixo) {
  if (!colunaComPrefixo) return colunaComPrefixo
  const parts = colunaComPrefixo.trim().split('.')
  return parts.length > 1 ? parts[parts.length - 1] : colunaComPrefixo.trim()
}

/**
 * Extrai o alias de tabela de um nome com prefixo (ex: "v.propriedade_uuid" → "v")
 */
function extrairAlias(colunaComPrefixo) {
  const parts = colunaComPrefixo.trim().split('.')
  return parts.length > 1 ? parts[0].trim() : null
}

/**
 * Parseia a cláusula SELECT para determinar quais colunas retornar e seus aliases.
 * Suporta: tabela.*, coluna, alias.coluna, alias.coluna AS nome_alias
 */
function parseSelecionar(selectSql, aliasParaTabela) {
  const cols = selectSql.split(',').map(c => c.trim()).filter(Boolean)
  const resultado = []

  for (const col of cols) {
    // COUNT(*) AS alias ou COUNT(*) as alias
    const countMatch = col.match(/^COUNT\(\s*\*\s*\)\s+AS\s+(\w+)$/i)
    if (countMatch) {
      resultado.push({ tipo: 'count', alias: countMatch[1] })
      continue
      }

      // SUM(CASE WHEN col = 'val' THEN 1 ELSE 0 END) AS alias
      const sumCaseMatch = col.match(/^SUM\(\s*CASE\s+WHEN\s+(\w+)\s*=\s*'([^']+)'\s+THEN\s+(\d+)\s+ELSE\s+(\d+)\s+END\s*\)\s+AS\s+(\w+)$/i)
      if (sumCaseMatch) {
        resultado.push({
          tipo: 'sum_case',
          coluna: sumCaseMatch[1],
          valor: sumCaseMatch[2],
          entao: Number(sumCaseMatch[3]),
          senao: Number(sumCaseMatch[4]),
          alias: sumCaseMatch[5],
        })
        continue
      }

    // tabela.* (ex: v.*, r.*)
    const wildcardMatch = col.match(/^(\w+)\.\*$/)
    if (wildcardMatch) {
      const alias = wildcardMatch[1]
      const tabela = aliasParaTabela[alias]
      if (tabela) {
        resultado.push({ tipo: 'wildcard', alias, tabela })
      }
      continue
    }

    // alias.coluna AS nome_alias (ex: a.nome AS nome_animal)
    const asMatch = col.match(/^(\w+)\.(\w+)\s+AS\s+(\w+)$/i)
    if (asMatch) {
      resultado.push({ tipo: 'alias_coluna', aliasTabela: asMatch[1], coluna: asMatch[2], saida: asMatch[3] })
      continue
    }

    // coluna AS nome_alias (sem prefixo de tabela)
    const asNoPrefixMatch = col.match(/^(\w+)\s+AS\s+(\w+)$/i)
    if (asNoPrefixMatch) {
      resultado.push({ tipo: 'alias_simples', coluna: asNoPrefixMatch[1], saida: asNoPrefixMatch[2] })
      continue
    }

    // alias.coluna (sem AS, ex: a.id_fisico)
    const aliasColMatch = col.match(/^(\w+)\.(\w+)$/)
    if (aliasColMatch) {
      resultado.push({ tipo: 'coluna_prefixada', aliasTabela: aliasColMatch[1], coluna: aliasColMatch[2], saida: aliasColMatch[2] })
      continue
    }

    // coluna simples (sem prefixo, sem AS)
    resultado.push({ tipo: 'simples', coluna: col, saida: col })
  }

  return resultado
}

/**
 * Parseia JOINs: INNER JOIN tabela alias ON alias.col = alias.col
 * Também suporta LEFT JOIN
 */
function parseJoins(sql) {
  const joins = []
  const joinRegex = /(INNER\s+JOIN|LEFT\s+JOIN|JOIN)\s+(\w+)\s+(\w+)\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/gi
  let match
  while ((match = joinRegex.exec(sql)) !== null) {
    joins.push({
      tipo: match[1].toUpperCase().includes('LEFT') ? 'LEFT' : 'INNER', // JOIN and INNER JOIN → INNER
      tabela: match[2],
      alias: match[3],
      esqAlias: match[4],
      esqCol: match[5],
      dirAlias: match[6],
      dirCol: match[7],
    })
  }
  return joins
}

/**
 * Executa JOINs entre registros de múltiplas tabelas
 */
function executarJoin(registros, joins, tabelasDados) {
  for (const join of joins) {
    const joinDados = tabelasDados[join.tabela] || []
    const novosRegistros = []
    for (const reg of registros) {
      const valEsq = reg[join.esqAlias + '_' + join.esqCol] !== undefined ? reg[join.esqAlias + '_' + join.esqCol] : reg[join.esqCol]
      const valDir = joinDados.length > 0 ? (joinDados[0][join.dirCol] !== undefined ? joinDados[0][join.dirCol] : undefined) : undefined
      let encontrou = false
      if (valEsq !== undefined) {
        for (const jReg of joinDados) {
          if (jReg[join.dirCol] == valEsq) {
            novosRegistros.push({ ...reg, ...prefixarRegistro(jReg, join.alias) })
            encontrou = true
            break // INNER/LEFT: primeiro match basta
          }
        }
      } else if (valDir !== undefined) {
        for (const jReg of joinDados) {
          if (jReg[join.esqCol] == valDir) {
            novosRegistros.push({ ...reg, ...prefixarRegistro(jReg, join.alias) })
            encontrou = true
            break
          }
        }
      }

      // LEFT JOIN sem match: manter registro original (sem dados do join)
      if (!encontrou && join.tipo === 'LEFT') {
        novosRegistros.push(reg)
      }
      // INNER JOIN sem match: descartar registro
    }

    registros = novosRegistros
  }
  return registros
}

/**
 * Adiciona prefixo de alias a todas as chaves de um registro
 * Ex: { nome: 'Mimosa', id_fisico: '001' } → { a_nome: 'Mimosa', a_id_fisico: '001' }
 */
function prefixarRegistro(reg, alias) {
  const resultado = {}
  for (const [chave, valor] of Object.entries(reg)) {
    resultado[alias + '_' + chave] = valor
  }
  return resultado
}

/**
 * Aplica o mapeamento SELECT ao registro JOINed, produzindo o formato final
 */
function aplicarSelecionar(registro, selectCols) {
  const resultado = {}

  for (const col of selectCols) {
    switch (col.tipo) {
      case 'count':
        resultado[col.alias] = 1 // Contagem simplificada
        break
      case 'wildcard': {
        // Expandir alias.* para todas as colunas com esse prefixo
        const prefixo = col.alias + '_'
        for (const [chave, valor] of Object.entries(registro)) {
          if (chave.startsWith(prefixo)) {
            resultado[chave.slice(prefixo.length)] = valor
          } else if (!chave.includes('_') || !resultado.hasOwnProperty(chave)) {
            // Colunas sem prefixo (da tabela principal)
            resultado[chave] = valor
          }
        }
        break
      }
      case 'alias_coluna':
        resultado[col.saida] = registro[col.aliasTabela + '_' + col.coluna] !== undefined ? registro[col.aliasTabela + '_' + col.coluna] : registro[col.coluna]
        break
      case 'alias_simples':
        resultado[col.saida] = registro[col.coluna]
        break
      case 'coluna_prefixada':
        resultado[col.saida] = registro[col.aliasTabela + '_' + col.coluna] !== undefined ? registro[col.aliasTabela + '_' + col.coluna] : registro[col.coluna]
        break
      case 'simples':
        resultado[col.saida] = registro[col.coluna]
        break
    }
  }

  return resultado
}

/**
 * Divide a cláusula WHERE em termos AND, respeitando parênteses.
 * Ex: "a = ? AND (b LIKE ? OR c LIKE ?) AND d = 1"
 *   → ["a = ?", "(b LIKE ? OR c LIKE ?)", "d = 1"]
 */
function splitWhereAndTerms(whereSql) {
  const terms = []
  let depth = 0
  let current = ''
  const trimmed = whereSql.trim()
  // Tokenizar por AND fora de parênteses
  const andRegex = /\s+AND\s+/gi
  let lastEnd = 0
  let match
  while ((match = andRegex.exec(trimmed)) !== null) {
    // Verificar se este AND está fora de parênteses
    const segment = trimmed.slice(lastEnd, match.index)
    const openParens = (segment.match(/\(/g) || []).length
    const closeParens = (segment.match(/\)/g) || []).length
    if (openParens === closeParens) {
      // AND fora de parênteses — é um separador real
      terms.push(segment.trim())
      lastEnd = match.index + match[0].length
    }
  }
  terms.push(trimmed.slice(lastEnd).trim())
  return terms.filter(Boolean)
}

/**
 * Avalia uma condição OR agrupada em parênteses.
 * Ex: "(nome LIKE ? OR id_fisico LIKE ? OR id_interno LIKE ?)"
 * Retorna true se QUALQUER condição OR for verdadeira.
 * Também suporta OR sem parênteses (ex: "a = ? OR b = ?").
 */
function avaliarOrGroup(registro, orSql) {
  // Remover parênteses externos se existirem
  let inner = orSql.trim()
  if (inner.startsWith('(') && inner.endsWith(')')) {
    inner = inner.slice(1, -1).trim()
  }
  const orTerms = inner.split(/\s+OR\s+/i)
  return orTerms.some(term => avaliarCondicaoSimples(registro, term.trim()))
}

/**
 * Avalia uma condição simples (sem AND/OR) contra um registro.
 * Suporta: coluna = ?, coluna LIKE ?, coluna = literal, alias.coluna, IS NULL, IS NOT NULL
 * Retorna true se a condição for verdadeira (ou se não conseguir parsear).
 */
function avaliarCondicaoSimples(registro, condicao) {
  const trimmed = condicao.trim()
  if (!trimmed) return true

  // IS NULL
  const isNullMatch = trimmed.match(/^(\w+\.?\w*)\s+IS\s+NULL$/i)
  if (isNullMatch) {
    const coluna = resolverColuna(isNullMatch[1])
    const alias = extrairAlias(isNullMatch[1])
    const val = alias
      ? (registro[alias + '_' + coluna] !== undefined ? registro[alias + '_' + coluna] : registro[coluna])
      : registro[coluna]
    return val === null || val === undefined
  }

  // IS NOT NULL
  const isNotNullMatch = trimmed.match(/^(\w+\.?\w*)\s+IS\s+NOT\s+NULL$/i)
  if (isNotNullMatch) {
    const coluna = resolverColuna(isNotNullMatch[1])
    const alias = extrairAlias(isNotNullMatch[1])
    const val = alias
      ? (registro[alias + '_' + coluna] !== undefined ? registro[alias + '_' + coluna] : registro[coluna])
      : registro[coluna]
    return val !== null && val !== undefined
  }

  // date() — não podemos avaliar, assumir true
  if (/^date\s*\(/i.test(trimmed)) return true

  // coluna IN ('val1', 'val2', ...) — lista de valores literais
  const inMatch = trimmed.match(/^(\w+)\s+IN\s*\(\s*(.+?)\s*\)$/i)
  if (inMatch) {
    const coluna = inMatch[1]
    const valList = inMatch[2].split(',').map(v => {
      v = v.trim()
      if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
        return v.slice(1, -1)
      }
      if (!isNaN(v)) return Number(v)
      return v
    })
    const val = registro[coluna]
    return valList.includes(val)
  }

  // alias.coluna op literal (ex: a.deleted = 0)
  const aliasLiteralMatch = trimmed.match(/^(\w+)\.(\w+)\s*(!=|>=|<=|>|<|=)\s*(.+)$/)
  if (aliasLiteralMatch) {
    const aliasPrefix = aliasLiteralMatch[1]
    const coluna = aliasLiteralMatch[2]
    const op = aliasLiteralMatch[3]
    let valor = aliasLiteralMatch[4].trim()
    if ((valor.startsWith("'") && valor.endsWith("'")) || (valor.startsWith('"') && valor.endsWith('"'))) {
      valor = valor.slice(1, -1)
    } else if (valor !== '?' && !isNaN(valor)) {
      valor = Number(valor)
    }
    if (valor === '?') return true // placeholder — avaliar em executarWhereComParams
    const val = registro[aliasPrefix + '_' + coluna] !== undefined ? registro[aliasPrefix + '_' + coluna] : registro[coluna]
    return compararValor({ [coluna]: val }, coluna, op, valor)
  }

  // coluna op literal (sem prefixo, ex: deleted = 0, status = 'novo')
  const literalMatch = trimmed.match(/^(\w+)\s*(!=|>=|<=|>|<|=)\s*(.+)$/)
  if (literalMatch) {
    const coluna = literalMatch[1]
    const op = literalMatch[2]
    let valor = literalMatch[3].trim()
    if ((valor.startsWith("'") && valor.endsWith("'")) || (valor.startsWith('"') && valor.endsWith('"'))) {
      valor = valor.slice(1, -1)
    } else if (valor !== '?' && !isNaN(valor)) {
      valor = Number(valor)
    }
    if (valor === '?') return true // placeholder — avaliar em executarWhereComParams
    return compararValor(registro, coluna, op, valor)
  }

  return true // não conseguimos parsear, assumir true
}

/**
 * Avalia WHERE sem parâmetros (IS NULL, IS NOT NULL, comparações literais)
 * Suporta prefixo de alias: a.deleted = 0, r.data_parto IS NULL
 * Suporta OR entre parênteses: AND (cond1 OR cond2)
 */
function avaliarWhereSemParams(registro, whereSql) {
  if (!whereSql) return true

  const clausulas = splitWhereAndTerms(whereSql)

  for (const clausula of clausulas) {
    const trimmed = clausula.trim()
    if (trimmed.includes('?')) continue // skip cláusulas com parâmetros

    // OR group (com ou sem parênteses)
    if (trimmed.includes(' OR ') || (trimmed.startsWith('(') && trimmed.endsWith(')'))) {
      if (!avaliarOrGroup(registro, trimmed)) return false
      continue
    }

    // Condição simples — delegar para avaliarCondicaoSimples
    if (!avaliarCondicaoSimples(registro, trimmed)) return false
  }

  return true
}

/**
 * Avalia um grupo OR dentro de parênteses com parâmetros.
 * Ex: (nome LIKE ? OR id_fisico LIKE ? OR id_interno LIKE ?)
 * Retorna true se QUALQUER condição OR for satisfeita.
 * Retorna { pass, paramsConsumed }.
 */
function avaliarGrupoOrComParams(registro, grupoSql, params, paramOffset) {
  // Remover parênteses externas
  const inner = grupoSql.replace(/^\(/, '').replace(/\)$/, '')
  const termos = inner.split(/\s+OR\s+/i)

  let paramIdx = paramOffset

  // Avaliar cada termo OR — registro passa se QUALQUER um for true
  for (const termo of termos) {
    const trimmed = termo.trim()
    const paramCount = (trimmed.match(/\?/g) || []).length
    const subParams = params.slice(paramIdx, paramIdx + paramCount)

    let passou = false

    // coluna LIKE ?
    const likeMatch = trimmed.match(/^(\w+)\s+LIKE\s+\?$/i)
    if (likeMatch && subParams.length > 0) {
      const coluna = likeMatch[1]
      const padrao = String(subParams[0]).replace(/%/g, '.*')
      const regex = new RegExp('^' + padrao + '$', 'i')
      passou = regex.test(String(registro[coluna] || ''))
    }

    // alias.coluna = ?
    const aliasCompMatch = trimmed.match(/^(\w+)\.(\w+)\s*(!=|>=|<=|>|<|=)\s*\?$/i)
    if (!passou && aliasCompMatch && subParams.length > 0) {
      const aliasPrefix = aliasCompMatch[1]
      const coluna = aliasCompMatch[2]
      const op = aliasCompMatch[3]
      const valor = subParams[0]
      const val = registro[aliasPrefix + '_' + coluna] !== undefined ? registro[aliasPrefix + '_' + coluna] : registro[coluna]
      passou = compararValor({ [coluna]: val }, coluna, op, valor)
    }

    // coluna = ? (sem prefixo)
    const compMatch = trimmed.match(/^(\w+)\s*(!=|>=|<=|>|<|=)\s*\?$/i)
    if (!passou && compMatch && subParams.length > 0) {
      const coluna = compMatch[1]
      const op = compMatch[2]
      const valor = subParams[0]
      passou = compararValor(registro, coluna, op, valor)
    }

    paramIdx += paramCount

    // Se qualquer termo OR passou, o grupo inteiro passa
    if (passou) {
      // Consumir params dos termos restantes mesmo sem avaliar
      paramIdx = paramOffset
      for (const t of termos) {
        paramIdx += (t.match(/\?/g) || []).length
      }
      return { pass: true, paramsConsumed: paramIdx - paramOffset }
    }
  }

  // Nenhum termo OR passou
  return { pass: false, paramsConsumed: paramIdx - paramOffset }
}

/**
 * Avalia WHERE com parâmetros (usando ?)
 * Suporta prefixo de alias: v.propriedade_uuid = ?, m.propriedade_uuid = ?
 * Suporta grupos OR entre parênteses: (nome LIKE ? OR id_fisico LIKE ?)
 */
function executarWhereComParams(registros, whereSql, params, paramOffset) {
  if (!whereSql) return { resultado: registros, paramConsumed: 0 }

  let paramIdx = paramOffset
  let resultado = [...registros]

  // Separar grupos OR entre parênteses das cláusulas AND simples
  // Usa splitWhereAndTerms que respeita parênteses
  const termos = splitWhereAndTerms(whereSql)
  const clausulas = termos.map(termo => {
    if (/^\(.*\)$/.test(termo) && /\s+OR\s+/i.test(termo)) {
      return { tipo: 'grupo_or', sql: termo }
    }
    return { tipo: 'simples', sql: termo }
  })

  for (const clausula of clausulas) {
    if (clausula.tipo === 'grupo_or') {
      // Grupo OR: filtrar registros — cada registro passa se qualquer condição OR for true
      const totalParams = (clausula.sql.match(/\?/g) || []).length
      resultado = resultado.filter(r => {
        const { pass } = avaliarGrupoOrComParams(r, clausula.sql, params, paramIdx)
        return pass
      })
      paramIdx += totalParams
      continue
    }

    const trimmed = clausula.sql.trim()

    // Skip cláusulas sem ? (já tratadas em avaliarWhereSemParams)
      if (!trimmed.includes('?')) {
        // coluna IN (valores literais) — filtrar mesmo sem ?
        if (/^\w+\s+IN\s*\(/i.test(trimmed)) {
          resultado = resultado.filter(r => avaliarCondicaoSimples(r, trimmed))
        }
        continue
      }

    // date(coluna) <= date('now', '+' || ? || ' days') — função date com params
    // No fallback, não podemos avaliar funções date(), então ignoramos
    if (/^date\s*\(/i.test(trimmed)) {
      paramIdx += (trimmed.match(/\?/g) || []).length
      continue
    }

    // LOWER(coluna) LIKE ?
    const lowerLikeMatch = trimmed.match(/^LOWER\((\w+)\)\s+LIKE\s+\?$/i)
    if (lowerLikeMatch && paramIdx < params.length) {
      const coluna = lowerLikeMatch[1]
      const padrao = String(params[paramIdx]).toLowerCase().replace(/%/g, '.*')
      const regex = new RegExp('^' + padrao + '$', 'i')
      resultado = resultado.filter(r => regex.test(String(r[coluna] || '').toLowerCase()))
      paramIdx++
      continue
    }

    // coluna LIKE ?
    const likeMatch = trimmed.match(/^(\w+)\s+LIKE\s+\?$/i)
    if (likeMatch && paramIdx < params.length) {
      const coluna = likeMatch[1]
      const padrao = String(params[paramIdx]).replace(/%/g, '.*')
      const regex = new RegExp('^' + padrao + '$', 'i')
      resultado = resultado.filter(r => regex.test(String(r[coluna] || '')))
      paramIdx++
      continue
    }

    // alias.coluna = ? (com prefixo de tabela: v.propriedade_uuid = ?)
    const aliasCompMatch = trimmed.match(/^(\w+)\.(\w+)\s*(!=|>=|<=|>|<|=)\s*\?$/)
    if (aliasCompMatch && paramIdx < params.length) {
      const aliasPrefix = aliasCompMatch[1]
      const coluna = aliasCompMatch[2]
      const op = aliasCompMatch[3]
      const valor = params[paramIdx]
      resultado = resultado.filter(r => {
        const val = r[aliasPrefix + '_' + coluna] !== undefined ? r[aliasPrefix + '_' + coluna] : r[coluna]
        return compararValor({ [coluna]: val }, coluna, op, valor)
      })
      paramIdx++
      continue
    }

    // coluna = ? (sem prefixo)
    const compMatch = trimmed.match(/^(\w+)\s*(!=|>=|<=|>|<|=)\s*\?$/)
    if (compMatch && paramIdx < params.length) {
      const coluna = compMatch[1]
      const op = compMatch[2]
      const valor = params[paramIdx]
      resultado = resultado.filter(r => compararValor(r, coluna, op, valor))
      paramIdx++
      continue
    }
  }

  return { resultado, paramConsumed: paramIdx - paramOffset }
}

function parseOrderBy(orderBySql) {
  if (!orderBySql) return null
  return orderBySql.split(',').map(p => {
    const trimmed = p.trim()
    const desc = trimmed.toUpperCase().endsWith('DESC')
    const col = trimmed.replace(/\s+(ASC|DESC)$/i, '').trim()
    // Resolver alias.coluna para nome de coluna sem prefixo
    return { col: resolverColuna(col), desc }
  })
}

function ordenarRegistros(registros, orderByParts) {
  if (!orderByParts) return registros
  return [...registros].sort((a, b) => {
    for (const { col, desc } of orderByParts) {
      const va = a[col] ?? ''
      const vb = b[col] ?? ''
      let cmp = 0
      if (va < vb) cmp = -1
      else if (va > vb) cmp = 1
      if (desc) cmp = -cmp
      if (cmp !== 0) return cmp
    }
    return 0
  })
}

function criarFallbackWeb() {
  return {
    executeSql(sql, params = []) {
      const sqlTrimmed = sql.trim()
      const sqlLower = sqlTrimmed.toLowerCase()

      // SELECT
      if (sqlLower.startsWith('select')) {
        // Extrair cláusulas do SQL
        const fromMatch = sqlTrimmed.match(/FROM\s+(\w+)(?:\s+(\w+))?/is)
        if (!fromMatch) {
          return { rows: { item: (i) => null, length: 0 }, rowsAffected: 0, insertId: null }
        }
        const tabelaFrom = fromMatch[1]
        const aliasFrom = fromMatch[2] || tabelaFrom

        // Mapear aliases para tabelas
        const aliasParaTabela = { [aliasFrom]: tabelaFrom }

        // Parsear JOINs
        const joins = parseJoins(sqlTrimmed)
        for (const j of joins) {
          aliasParaTabela[j.alias] = j.tabela
        }

        // Carregar dados de todas as tabelas envolvidas
        const tabelasDados = {}
        tabelasDados[tabelaFrom] = getTabela(tabelaFrom)
        for (const j of joins) {
          if (!tabelasDados[j.tabela]) {
            tabelasDados[j.tabela] = getTabela(j.tabela)
          }
        }

        // Prefixar registros da tabela FROM com seu alias
        let registros = getTabela(tabelaFrom).map(r => prefixarRegistro(r, aliasFrom))

        // Executar JOINs
        if (joins.length > 0) {
          registros = executarJoin(registros, joins, tabelasDados)
        } else {
          // Sem JOIN: remover prefixos para select simples
          registros = getTabela(tabelaFrom)
        }

        // WHERE
        const whereMatch = sqlTrimmed.match(/WHERE\s+(.+?)(?:\s+GROUP\s+BY|\s+ORDER|\s+LIMIT|$)/is)
        if (whereMatch) {
          const whereSql = whereMatch[1].replace(/\n/g, ' ').replace(/\n/g, ' ')
          // Primeiro aplicar cláusulas com parâmetros
          const { resultado, paramConsumed } = executarWhereComParams(registros, whereSql, params, 0)
          registros = resultado
          // Depois aplicar cláusulas sem parâmetros
          registros = registros.filter(r => avaliarWhereSemParams(r, whereSql))
        }

        // Parsear SELECT columns para mapear saída
        const selectMatch = sqlTrimmed.match(/^SELECT\s+(.+?)\s+FROM/is)
        const selectCols = selectMatch ? parseSelecionar(selectMatch[1].replace(/\n/g, ' '), aliasParaTabela) : null

        // Se tem JOIN, aplicar mapeamento SELECT
        if (joins.length > 0 && selectCols) {
          registros = registros.map(r => aplicarSelecionar(r, selectCols))
        }
  // GROUP BY
  const groupByMatch = sqlTrimmed.match(/GROUP\s+BY\s+(\w+(?:\s*,\s*\w+)*)/i)
  const hasGroupBy = !!groupByMatch
  const groupByCols = hasGroupBy ? groupByMatch[1].split(/\s*,\s*/) : []

  // Agregacoes (COUNT, SUM CASE) - com ou sem GROUP BY
  const hasAggregate = selectCols && selectCols.some(c => c.tipo === 'count' || c.tipo === 'sum_case')
  if (hasAggregate) {
    if (hasGroupBy) {
      const grupos = {}
      for (const reg of registros) {
        const key = groupByCols.map(c => String(reg[c] ?? '')).join('|')
        if (!grupos[key]) {
          grupos[key] = { regs: [], chave: {} }
          for (const c of groupByCols) grupos[key].chave[c] = reg[c]
        }
        grupos[key].regs.push(reg)
      }
      const resultadoAgregado = Object.values(grupos).map(grupo => {
        const row = { ...grupo.chave }
        for (const col of selectCols) {
          if (col.tipo === 'count') {
            row[col.alias] = grupo.regs.length
          } else if (col.tipo === 'sum_case') {
            row[col.alias] = grupo.regs.reduce((sum, r) => {
              return sum + (String(r[col.coluna]) === col.valor ? col.entao : col.senao)
            }, 0)
          }
        }
        return row
      })
      return {
        rows: { item: (i) => resultadoAgregado[i], length: resultadoAgregado.length, _array: resultadoAgregado },
        rowsAffected: 0, insertId: null,
      }
    } else {
      const row = {}
      for (const col of selectCols) {
        if (col.tipo === 'count') {
          row[col.alias] = registros.length
        } else if (col.tipo === 'sum_case') {
          row[col.alias] = registros.reduce((sum, r) => {
            return sum + (String(r[col.coluna]) === col.valor ? col.entao : col.senao)
          }, 0)
        }
      }
      return {
        rows: { item: (i) => row, length: 1, _array: [row] },
        rowsAffected: 0, insertId: null,
      }
    }
  }

        // ORDER BY
        const orderMatch = sqlTrimmed.match(/ORDER\s+BY\s+(.+?)(?:\s+LIMIT|$)/is)
        if (orderMatch) {
          const orderByParts = parseOrderBy(orderMatch[1].replace(/\n/g, ' '))
          registros = ordenarRegistros(registros, orderByParts)
        }

        // LIMIT
        const limitMatch = sqlTrimmed.match(/LIMIT\s+\?/i)
        if (limitMatch) {
          const whereMatch2 = sqlTrimmed.match(/WHERE/i)
          const wherePlaceholders = whereMatch2
            ? (sqlTrimmed.match(/WHERE\s+(.+?)(?:\s+GROUP\s+BY|\s+ORDER|\s+LIMIT|$)/is)?.[1].replace(/\n/g, ' ').match(/\?/g) || []).length
            : 0
          const limitParamIdx = wherePlaceholders
          if (limitParamIdx < params.length) {
            registros = registros.slice(0, params[limitParamIdx])
          }
        }

        const rowsArray = registros
        return {
          rows: {
            item: (i) => rowsArray[i] || null,
            length: rowsArray.length,
            _array: rowsArray,
          },
          rowsAffected: 0,
          insertId: null,
        }
      }

      // INSERT
      if (sqlLower.startsWith('insert')) {
        const tabelaMatch = sqlTrimmed.match(/INSERT\s+INTO\s+(\w+)/i)
        const tabela = tabelaMatch ? tabelaMatch[1] : 'desconhecida'
        const registros = getTabela(tabela)

        const colunasMatch = sqlTrimmed.match(/\(([^)]+)\)\s+VALUES\s+\((.+)\)/is)
  const colunas = colunasMatch
    ? colunasMatch[1].split(',').map(c => c.trim())
    : []

  // Parse VALUES - distinguish ? placeholders from SQL literals
  const valuesMatch = sqlTrimmed.match(/VALUES\s*\((.+)\)\s*$/is)
  const valores = valuesMatch
    ? splitRespectingParens(valuesMatch[1]).map(v => {
        const trimmed = v.trim()
        if (trimmed === '?') return { isPlaceholder: true, literal: undefined }
        if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
          return { isPlaceholder: false, literal: trimmed.slice(1, -1) }
        }
        if (trimmed.toUpperCase() === 'NULL') return { isPlaceholder: false, literal: null }
        if (!isNaN(trimmed)) return { isPlaceholder: false, literal: Number(trimmed) }
        if (/^(date|datetime)\s*\(/i.test(trimmed)) return { isPlaceholder: false, literal: trimmed }
        return { isPlaceholder: false, literal: trimmed }
      })
    : []

  const registro = {}
  let paramIdx = 0
  colunas.forEach((col, i) => {
    if (i < valores.length) {
      if (valores[i].isPlaceholder) {
        registro[col] = paramIdx < params.length ? params[paramIdx++] : null
      } else {
        registro[col] = valores[i].literal
      }
    } else {
      registro[col] = paramIdx < params.length ? params[paramIdx++] : null
    }
  })

        registros.push(registro)
        salvarTabela(tabela, registros)

        return {
          rows: { item: () => null, length: 0 },
          rowsAffected: 1,
          insertId: registros.length,
        }
      }

      // UPDATE
      if (sqlLower.startsWith('update')) {
        const tabelaMatch = sqlTrimmed.match(/UPDATE\s+(\w+)(?:\s+(\w+))?/i)
        const tabela = tabelaMatch ? tabelaMatch[1] : 'desconhecida'
        const registros = getTabela(tabela)

        const setMatch = sqlTrimmed.match(/SET\s+(.+?)(?:\s+WHERE|$)/is)
        const whereMatch = sqlTrimmed.match(/WHERE\s+(.+?)$/is)

        if (setMatch) {
    // Parsear cada cláusula SET: coluna = ? OU coluna = literal
    const setAssignments = setMatch[1].replace(/\n/g, ' ').split(',').map(s => {
      const eqIdx = s.indexOf('=')
      const col = s.slice(0, eqIdx).trim()
      const val = s.slice(eqIdx + 1).trim()
      const isPlaceholder = val === '?'
      let literal = undefined
      if (!isPlaceholder) {
        if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
          literal = val.slice(1, -1)
        } else if (!isNaN(val)) {
          literal = Number(val)
        } else {
          literal = val
        }
      }
      return { col, isPlaceholder, literal }
    })

    // Contar apenas placeholders (?) no SET para separar params do WHERE
    const setPlaceholderCount = setAssignments.filter(a => a.isPlaceholder).length
    const setParams = params.slice(0, setPlaceholderCount)
    const whereParams = params.slice(setPlaceholderCount)

    let afetados = 0

    if (whereMatch) {
      const whereSql = whereMatch[1].replace(/\n/g, ' ')

      // Encontrar alvos com cláusulas parametrizadas
      const { resultado: alvos } = executarWhereComParams(registros, whereSql, whereParams, 0)
      // Filtrar com cláusulas sem parâmetros
      const alvosFinal = alvos.filter(r => avaliarWhereSemParams(r, whereSql))
      const uuidsAlvo = new Set(alvosFinal.map(r => r.uuid))

      registros.forEach(r => {
        if (uuidsAlvo.has(r.uuid)) {
          let paramIdx = 0
          setAssignments.forEach(a => {
            if (a.isPlaceholder) {
              r[a.col] = setParams[paramIdx++]
            } else {
              r[a.col] = a.literal
            }
          })
          afetados++
        }
      })      } else {
        // UPDATE sem WHERE
        registros.forEach(r => {
          let paramIdx = 0
          setAssignments.forEach(a => {
            if (a.isPlaceholder) {
              r[a.col] = setParams[paramIdx++]
            } else {
              r[a.col] = a.literal
            }
          })
          afetados++
        })
      }

          salvarTabela(tabela, registros)
          return {
            rows: { item: () => null, length: 0 },
            rowsAffected: afetados,
            insertId: null,
          }
        }

        return {
          rows: { item: () => null, length: 0 },
          rowsAffected: 0,
          insertId: null,
        }
      }

      // DELETE
      if (sqlLower.startsWith('delete')) {
        const tabelaMatch = sqlTrimmed.match(/DELETE\s+FROM\s+(\w+)/i)
        const tabela = tabelaMatch ? tabelaMatch[1] : 'desconhecida'
        const registros = getTabela(tabela)

        const whereMatch = sqlTrimmed.match(/WHERE\s+(.+?)$/is)
        if (whereMatch) {
          const whereSql = whereMatch[1].replace(/\n/g, ' ')
          const { resultado: aDeletar } = executarWhereComParams(registros, whereSql, params, 0)
          const deletarFinal = aDeletar.filter(r => avaliarWhereSemParams(r, whereSql))
          const deletarUuids = new Set(deletarFinal.map(r => r.uuid))
          const sobreviventesFinal = registros.filter(r => !deletarUuids.has(r.uuid))

          salvarTabela(tabela, sobreviventesFinal)

          return {
            rows: { item: () => null, length: 0 },
            rowsAffected: deletarUuids.size,
            insertId: null,
          }
        }

        // DELETE sem WHERE — limpa tudo
        const total = registros.length
        salvarTabela(tabela, [])
        return {
          rows: { item: () => null, length: 0 },
          rowsAffected: total,
          insertId: null,
        }
      }

      // Fallback
      return { rows: { item: (i) => null, length: 0 }, rowsAffected: 0, insertId: null }
    },

    transaction(fn) {
      const self = this
      const tx = {
        executeSql(sql, params, success, error) {
          try {
            const result = self.executeSql(sql, params)
            if (success) success(tx, result)
          } catch (e) {
            if (error) error(tx, e)
          }
        },
      }
      fn(tx)
    },

    sqlBatch(statements) {
      for (const stmt of statements) {
        const [sql, params] = Array.isArray(stmt) ? stmt : [stmt, []]
        const sqlLower = sql.trim().toLowerCase()
        if (sqlLower.startsWith('insert') || sqlLower.startsWith('update') || sqlLower.startsWith('delete')) {
          this.executeSql(sql, params)
        }
        // CREATE TABLE/INDEX são ignorados no fallback web
      }
      return Promise.resolve()
    },
  }
}

export { criarFallbackWeb }
