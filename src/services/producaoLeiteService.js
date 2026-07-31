import * as sqlite from './sqlite/queries'

export async function listarPorAnimal(animalUuid) {
  return await sqlite.listarProducaoLeite(animalUuid)
}

export async function listarPorPropriedade(propriedadeUuid) {
  return await sqlite.listarProducaoLeitePropriedade(propriedadeUuid)
}

export async function registrarOrdenha(dados) {
  const uuid = await sqlite.inserirProducaoLeite(dados)
  return await sqlite.buscarAnimal(dados.animal_uuid)
}

export async function excluirOrdenha(uuid) {
  return await sqlite.excluirProducaoLeite(uuid)
}

export async function resumoPorAnimal(propriedadeUuid) {
  return await sqlite.buscarResumoProducaoLeite(propriedadeUuid)
}
