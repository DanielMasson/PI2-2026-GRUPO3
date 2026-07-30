import * as sqlite from './sqlite/queries'

export async function registrarVacina(dados) {
  const uuid = await sqlite.inserirVacina(dados)
  return await sqlite.buscarVacina(uuid)
}

export async function listarVacinas(animalUuid) {
  return await sqlite.listarVacinas(animalUuid)
}

export async function listarVacinasPropriedade(propriedadeUuid) {
  return await sqlite.listarVacinasPropriedade(propriedadeUuid)
}

export async function listarVacinasProximas(propriedadeUuid, diasLimite = 30) {
  return await sqlite.listarVacinasProximas(propriedadeUuid, diasLimite)
}

export async function editarVacina(uuid, dados) {
  await sqlite.atualizarVacina(uuid, dados)
}

export async function excluirVacina(uuid) {
  await sqlite.excluirVacina(uuid)
}
