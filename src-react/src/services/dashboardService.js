import * as sqlite from './sqlite/queries'

export async function contarMovimentacoesRecentes(propriedadeUuid, dias = 7) {
  return sqlite.contarMovimentacoesRecentes(propriedadeUuid, dias)
}

export async function contarGestantes(propriedadeUuid) {
  return sqlite.contarGestantes(propriedadeUuid)
}
