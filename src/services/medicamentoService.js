import * as sqlite from './sqlite/queries'

export async function registrarMedicamento(dados) {
  const uuid = await sqlite.inserirMedicamento(dados)
  return await sqlite.buscarMedicamento(uuid)
}

export async function listarMedicamentos(animalUuid) {
  return await sqlite.listarMedicamentos(animalUuid)
}

export async function listarMedicamentosPropriedade(propriedadeUuid) {
  return await sqlite.listarMedicamentosPropriedade(propriedadeUuid)
}

export async function listarEmCarencia(propriedadeUuid) {
  return await sqlite.listarEmCarencia(propriedadeUuid)
}

export async function editarMedicamento(uuid, dados) {
  await sqlite.atualizarMedicamento(uuid, dados)
}

export async function excluirMedicamento(uuid) {
  await sqlite.excluirMedicamento(uuid)
}
