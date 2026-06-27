/**
 * Utilitários para manipulação de datas no formato ISO (YYYY-MM-DD)
 * usado como padrão no banco de dados local SQLite.
 */

/**
 * Retorna a diferença em dias inteiros entre hoje (00:00 local) e a data alvo.
 * Positivo = alvo no futuro, negativo = alvo no passado, 0 = hoje.
 * @param {string} dataIso Data no formato 'YYYY-MM-DD'.
 * @param {Date} base Data de referência (opcional, default = agora).
 * @returns {number} Diferença em dias.
 */
export function diasAte(dataIso, base = new Date()) {
  if (!dataIso) return null
  const alvo = new Date(`${dataIso}T00:00:00`)
  const referencia = new Date(base)
  referencia.setHours(0, 0, 0, 0)
  if (Number.isNaN(alvo.getTime())) return null
  return Math.ceil((alvo - referencia) / (1000 * 60 * 60 * 24))
}

/**
 * Formata uma data ISO (YYYY-MM-DD) para o padrão brasileiro (DD/MM/YYYY).
 * Retorna '—' quando a data é vazia ou inválida.
 * @param {string} dataIso
 * @returns {string}
 */
export function formatarDataBR(dataIso) {
  if (!dataIso) return '—'
  const [ano, mes, dia] = dataIso.split('-')
  if (!ano || !mes || !dia) return dataIso
  return `${dia}/${mes}/${ano}`
}
