import { DIAS_GESTACAO, DIAS_SECAGEM } from '../constants/sync'

/**
 * Calcula o status consolidado de uma gestação a partir de um registro de reprodução.
 * @param {object} registro - registro da tabela `reproducao` (com `data_cobertura`,
 *                            `data_previa_parto`, `data_parto`, `prenhez_confirmada`, `resultado`)
 * @returns {'vazia'|'pendente'|'gestante'|'prenhez_confirmada'|'parida'|'falhou'|'cancelada'}
 */
export function calcularStatusGestacao(registro) {
  if (!registro) return 'vazia'
  if (registro.motivo_cancelamento) return 'cancelada'
  const resultado = registro.resultado || 'pendente'
  if (resultado === 'negativa') return 'falhou'
  if (resultado === 'parida' || registro.data_parto) return 'parida'
  if (registro.prenhez_confirmada) return 'prenhez_confirmada'
  return 'gestante'
}

/**
 * Calcula o progresso percentual da gestação (0-100) com base em DIAS_GESTACAO.
 * @param {string} dataCobertura - ISO date string
 * @returns {number|null} 0–100, ou null se dataCobertura vazia
 */
export function calcularProgresso(dataCobertura) {
  if (!dataCobertura) return null
  const inicio = new Date(dataCobertura)
  const hoje = new Date()
  const diffMs = hoje.getTime() - inicio.getTime()
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDias <= 0) return 0
  if (diffDias >= DIAS_GESTACAO) return 100
  return Math.round((diffDias / DIAS_GESTACAO) * 100)
}

/**
 * Quantos dias faltam até a data prevista de parto.
 * @param {string} dataPrevista - ISO date string
 * @returns {number|null} dias (positivo = futuro, negativo = atrasado), ou null se vazio
 */
export function diasAteParto(dataPrevista) {
  if (!dataPrevista) return null
  const alvo = new Date(dataPrevista)
  const hoje = new Date()
  const diffMs = alvo.getTime() - hoje.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Calcula a data prevista de parto somando DIAS_GESTACAO à data de cobertura.
 * @param {string} dataCobertura - ISO date string
 * @returns {string|null} ISO date ou null
 */
export function calcularDataPrevistaParto(dataCobertura) {
  if (!dataCobertura) return null
  const inicio = new Date(dataCobertura)
  inicio.setDate(inicio.getDate() + DIAS_GESTACAO)
  return inicio.toISOString().slice(0, 10)
}

/**
 * Calcula a data de secagem (DIAS_SECAGEM antes do parto previsto).
 * @param {string} dataPrevistaParto - ISO date string
 * @returns {string|null} ISO date ou null
 */
export function calcularDataSecagem(dataPrevistaParto) {
  if (!dataPrevistaParto) return null
  const alvo = new Date(dataPrevistaParto)
  alvo.setDate(alvo.getDate() - DIAS_SECAGEM)
  return alvo.toISOString().slice(0, 10)
}

export const STATUS_LABELS = {
  vazia: 'Sem cobertura',
  pendente: 'Aguardando diagnóstico',
  gestante: 'Gestante (não confirmada)',
  prenhez_confirmada: 'Prenhez confirmada',
  parida: 'Parida',
  falhou: 'Falhou / não ficou prenhe',
  cancelada: 'Cancelada',
}

export const STATUS_CORES = {
  vazia: '#6b7280',
  pendente: '#f59e0b',
  gestante: '#fbbf24',
  prenhez_confirmada: '#22c55e',
  parida: '#3b82f6',
  falhou: '#ef4444',
  cancelada: '#9ca3af',
}
