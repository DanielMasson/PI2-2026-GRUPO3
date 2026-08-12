// Baixas — Sprint 10 (RF08: registro de venda/morte/consumo de animal)
// Service layer fino que delega para sqlite/queries.

import * as sqlite from './sqlite/queries'

export async function registrarBaixa(dados) {
  const uuid = await sqlite.inserirBaixa(dados)
  return await sqlite.buscarBaixa(uuid)
}

export async function buscarBaixa(uuid) {
  return await sqlite.buscarBaixa(uuid)
}

export async function listarBaixas(propriedadeUuid) {
  return await sqlite.listarBaixasPropriedade(propriedadeUuid)
}

export async function excluirBaixa(uuid) {
  return await sqlite.excluirBaixa(uuid)
}
