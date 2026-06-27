import * as sqlite from './sqlite/queries'

export async function listarVacinasObrigatorias(propriedadeUuid) {
  return await sqlite.listarVacinasObrigatorias(propriedadeUuid)
}

export async function listarVacinasObrigatoriasParaAnimal(propriedadeUuid, especie, sexo) {
  return await sqlite.listarVacinasObrigatoriasParaAnimal(propriedadeUuid, especie, sexo)
}

export async function registrarVacinaObrigatoria(dados) {
  const uuid = await sqlite.inserirVacinaObrigatoria(dados)
  return uuid
}

export async function editarVacinaObrigatoria(uuid, dados) {
  await sqlite.atualizarVacinaObrigatoria(uuid, dados)
}

export async function desativarVacinaObrigatoria(uuid) {
  await sqlite.excluirVacinaObrigatoria(uuid)
}
