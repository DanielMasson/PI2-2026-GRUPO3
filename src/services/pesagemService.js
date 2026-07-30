import * as sqlite from './sqlite/queries'

export async function registrarPesagem(dados) {
  const uuid = await sqlite.inserirPesagem(dados)
  return await sqlite.buscarPesagem(uuid)
}

export async function listarPesagens(animalUuid) {
  return await sqlite.listarPesagens(animalUuid)
}

export async function listarPesagensPropriedade(propriedadeUuid) {
  return await sqlite.listarPesagensPropriedade(propriedadeUuid)
}

export async function editarPesagem(uuid, dados) {
  await sqlite.atualizarPesagem(uuid, dados)
}

export function calcularGMD(pesagens) {
  if (!pesagens || pesagens.length < 2) return null
  const ordenadas = [...pesagens].sort((a, b) => new Date(a.data) - new Date(b.data))
  const primeira = ordenadas[0]
  const ultima = ordenadas[ordenadas.length - 1]
  const dias = (new Date(ultima.data) - new Date(primeira.data)) / (1000 * 60 * 60 * 24)
  if (dias <= 0) return null
  return (ultima.peso - primeira.peso) / dias
}
