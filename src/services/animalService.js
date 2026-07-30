import * as sqlite from './sqlite/queries'

export async function criarAnimal(dados) {
  const uuid = await sqlite.inserirAnimal(dados)
  return await sqlite.buscarAnimal(uuid)
}

export async function listarAnimais(propriedadeUuid, filtros) {
  return await sqlite.listarAnimais(propriedadeUuid, filtros)
}

export async function buscarAnimal(uuid) {
  return await sqlite.buscarAnimal(uuid)
}

export async function editarAnimal(uuid, dados) {
  await sqlite.atualizarAnimal(uuid, dados)
  return await sqlite.buscarAnimal(uuid)
}

export async function excluirAnimal(uuid) {
  await sqlite.excluirAnimal(uuid)
}

export async function contarAnimais(propriedadeUuid) {
  return await sqlite.contarAnimais(propriedadeUuid)
}

export async function contarAnimaisPropriedade(propriedadeUuid) {
  return await sqlite.contarAnimaisPropriedade(propriedadeUuid)
}

export async function buscarGenealogia(uuid) {
  const animal = await sqlite.buscarAnimal(uuid)
  if (!animal) return null

  const mae = animal.mae_uuid ? await sqlite.buscarAnimal(animal.mae_uuid) : null
  const pai = animal.pai_uuid ? await sqlite.buscarAnimal(animal.pai_uuid) : null

  return { ...animal, mae, pai }
}
