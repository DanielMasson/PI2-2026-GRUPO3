import * as sqlite from './sqlite/queries'

export async function criarPropriedade(dados) {
  const uuid = await sqlite.inserirPropriedade(dados)
  // Auto-adiciona o dono como membro
  await sqlite.inserirMembro({
    propriedade_uuid: uuid,
    usuario_uuid: dados.dono_uuid,
    cargo: 'dono',
  })
  return await sqlite.buscarPropriedade(uuid)
}

export async function listarPropriedades(usuarioUuid) {
  return await sqlite.listarPropriedades(usuarioUuid)
}

export async function buscarPropriedade(uuid) {
  return await sqlite.buscarPropriedade(uuid)
}

export async function editarPropriedade(uuid, dados) {
  await sqlite.atualizarPropriedade(uuid, dados)
  return await sqlite.buscarPropriedade(uuid)
}

export async function excluirPropriedade(uuid) {
  await sqlite.excluirPropriedade(uuid)
}

export async function listarMembros(propriedadeUuid) {
  return await sqlite.listarMembros(propriedadeUuid)
}

export async function adicionarMembro(dados) {
  const uuid = await sqlite.inserirMembro(dados)
  return uuid
}

export async function removerMembro(uuid) {
  await sqlite.excluirMembro(uuid)
}
