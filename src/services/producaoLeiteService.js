import * as sqlite from './sqlite/queries'

export async function listarPorAnimal(animalUuid) {
  return await sqlite.listarProducaoLeite(animalUuid)
}

export async function listarPorPropriedade(propriedadeUuid) {
  return await sqlite.listarProducaoLeitePropriedade(propriedadeUuid)
}

export async function registrarOrdenha(dados) {
  const uuid = await sqlite.inserirProducaoLeite(dados)
  return await sqlite.buscarProducaoLeite(uuid)
}

export async function excluirOrdenha(uuid) {
  return await sqlite.excluirProducaoLeite(uuid)
}

export async function resumoPorAnimal(propriedadeUuid) {
  return await sqlite.buscarResumoProducaoLeite(propriedadeUuid)
}

// === ANÁLISE — DESEMPENHO LEITEIRO (Sprint 8) ===

export async function serieAnimal(animalUuid, propriedadeUuid, dias) {
  return await sqlite.serieAnimal(animalUuid, propriedadeUuid, dias)
}

export async function seriePropriedade(propriedadeUuid, dias) {
  return await sqlite.seriePropriedade(propriedadeUuid, dias)
}

export async function comparativoAnimais(propriedadeUuid, dias) {
  return await sqlite.comparativoAnimais(propriedadeUuid, dias)
}

export async function mediaHistoricaPropriedade(propriedadeUuid) {
  return await sqlite.mediaHistoricaPropriedade(propriedadeUuid)
}

export async function alertasQuedaLeite(propriedadeUuid) {
  return await sqlite.alertasQuedaLeite(propriedadeUuid)
}
