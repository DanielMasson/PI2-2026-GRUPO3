// Validação de CPF conforme algoritmo da Receita Federal (Lei 8.213/91).

// Sequências de todos díguos iguais são inválidas (000.000.000-00, 111.111.111-11, etc.)
const CPF_INVALIDOS = new Set([
  '00000000000', '11111111111', '22222222222', '33333333333',
  '44444444444', '55555555555', '66666666666', '77777777777',
  '88888888888', '99999999999',
])

/**
 * Extrai apenas dígitos de uma string.
 */
export function somenteDigitos(valor) {
  return String(valor).replace(/\D/g, '')
}

/**
 * Valida um CPF (11 dígitos, dígitos verificadores).
 * @param {string} cpf — CPF com ou sem formatação
 * @returns {boolean}
 */
export function validarCpf(cpf) {
  const digitos = somenteDigitos(cpf)

  if (digitos.length !== 11) return false
  if (CPF_INVALIDOS.has(digitos)) return false

  // Primeiro dígito verificador
  let soma = 0
  for (let i = 0; i < 9; i++) {
    soma += parseInt(digitos[i], 10) * (10 - i)
  }
  let resto = (soma * 10) % 11
  if (resto === 10) resto = 0
  if (resto !== parseInt(digitos[9], 10)) return false

  // Segundo dígito verificador
  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += parseInt(digitos[i], 10) * (11 - i)
  }
  resto = (soma * 10) % 11
  if (resto === 10) resto = 0
  if (resto !== parseInt(digitos[10], 10)) return false

  return true
}

/**
 * Formata CPF como 000.000.000-00.
 * @param {string} cpf
 * @returns {string}
 */
export function formatarCpf(cpf) {
  const d = somenteDigitos(cpf).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}
