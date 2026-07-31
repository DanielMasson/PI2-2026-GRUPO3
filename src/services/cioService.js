import * as sqlite from './sqlite/queries'

export async function listarCios(propriedadeUuid) {
  return await sqlite.listarCios(propriedadeUuid)
}

export async function registrarCio(dados) {
  const uuid = await sqlite.inserirCio(dados)
  return uuid
}

export async function excluirCio(uuid) {
  return await sqlite.excluirCio(uuid)
}

export async function listarAnimaisEmCio(propriedadeUuid) {
  const cios = await sqlite.listarCios(propriedadeUuid)
  const agrupado = {}
  for (const c of cios) {
    if (!agrupado[c.animal_uuid]) {
      agrupado[c.animal_uuid] = { ...c, total: 1 }
    } else {
      agrupado[c.animal_uuid].total += 1
    }
  }
  return Object.values(agrupado)
}
