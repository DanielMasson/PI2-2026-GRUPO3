import * as sqlite from './sqlite/queries'

export async function registrarMovimentacao(dados) {
  const uuid = await sqlite.inserirMovimentacao(dados)
  return uuid
}

export async function listarMovimentacoes(animalUuid) {
  return await sqlite.listarMovimentacoesAnimal(animalUuid)
}

export async function listarMovimentacoesPropriedade(propriedadeUuid) {
  return await sqlite.listarMovimentacoesPropriedade(propriedadeUuid)
}

export async function buscarUltimaArea(animalUuid) {
  return await sqlite.buscarUltimaLocalizacao(animalUuid)
}

export async function editarMovimentacao(uuid, dados) {
  await sqlite.atualizarMovimentacao(uuid, dados)
}

export async function excluirMovimentacao(uuid) {
  await sqlite.excluirMovimentacao(uuid)
}
