import * as sqlite from './sqlite/queries'

export async function registrarOcorrencia(dados) {
  const uuid = await sqlite.inserirOcorrencia(dados)
  return await sqlite.buscarOcorrencia(uuid)
}

export async function listarOcorrencias(animalUuid) {
  return await sqlite.listarOcorrencias(animalUuid)
}

export async function listarOcorrenciasPropriedade(propriedadeUuid) {
  return await sqlite.listarOcorrenciasPropriedade(propriedadeUuid)
}

export async function editarOcorrencia(uuid, dados) {
  await sqlite.atualizarOcorrencia(uuid, dados)
}
