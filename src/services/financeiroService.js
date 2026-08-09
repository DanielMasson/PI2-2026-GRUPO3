// Financeiro — Sprint 10
// Service layer fino que só delega para sqlite/queries (padrão producaoLeiteService.js).
// Mantém surface simples para hooks/pages dependerem dele sem acoplar a sqlite direto.

import * as sqlite from './sqlite/queries'

export async function listarCategorias() {
  return await sqlite.listarCategorias()
}

export async function buscarCategoriaPorNome(nome) {
  return await sqlite.buscarCategoriaPorNome(nome)
}

export async function registrarTransacao(dados) {
  const uuid = await sqlite.inserirTransacaoFinanceira(dados)
  return await sqlite.buscarTransacao(uuid)
}

export async function buscarTransacao(uuid) {
  return await sqlite.buscarTransacao(uuid)
}

export async function listarPorPropriedade(propriedadeUuid, filtros) {
  return await sqlite.listarTransacoesPropriedade(propriedadeUuid, filtros)
}

export async function listarPorAnimal(animalUuid) {
  return await sqlite.listarTransacoesAnimal(animalUuid)
}

export async function excluirTransacao(uuid) {
  return await sqlite.excluirTransacao(uuid)
}

export async function resumoPropriedade(propriedadeUuid) {
  return await sqlite.saldoPropriedade(propriedadeUuid)
}

export async function resumoPorCategoria(propriedadeUuid, dataInicio, dataFim) {
  return await sqlite.resumoPorCategoria(propriedadeUuid, dataInicio, dataFim)
}

export async function resumoPorAnimal(propriedadeUuid, dataInicio, dataFim) {
  return await sqlite.resumoPorAnimal(propriedadeUuid, dataInicio, dataFim)
}

export async function serieMensal(propriedadeUuid, meses) {
  return await sqlite.serieMensalPropriedade(propriedadeUuid, meses)
}
