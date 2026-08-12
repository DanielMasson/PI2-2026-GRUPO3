import { renderHook, waitFor } from '@testing-library/react'
import * as financeiroService from '../services/financeiroService'

jest.mock('../services/financeiroService', () => ({
  listarPorPropriedade: jest.fn(),
  listarPorAnimal: jest.fn(),
  listarCategorias: jest.fn(),
  buscarTransacao: jest.fn(),
  resumoPropriedade: jest.fn(),
  registrarTransacao: jest.fn(),
  excluirTransacao: jest.fn(),
  atualizarTransacao: jest.fn(),
  custoAcumuladoAnimal: jest.fn(),
  lucratividadePropriedade: jest.fn(),
}))

import {
  useFinanceiroPropriedade,
  useFinanceiroAnimal,
  useTransacao,
  useCustoAnimal,
  useLucratividade,
} from '../hooks/useFinanceiro'

afterEach(() => {
  jest.clearAllMocks()
})

describe('useFinanceiroPropriedade', () => {
  test('carrega transações, categorias e saldo da propriedade', async () => {
    const transacoes = [{ uuid: 't1', valor: 10 }]
    const categorias = [{ uuid: 'c1', rotulo: 'Ração' }]
    const saldo = { receitas: 100, despesas: 40, saldo: 60 }
    financeiroService.listarPorPropriedade.mockResolvedValue(transacoes)
    financeiroService.listarCategorias.mockResolvedValue(categorias)
    financeiroService.resumoPropriedade.mockResolvedValue(saldo)

    const { result } = renderHook(() => useFinanceiroPropriedade('p1'))

    expect(result.current.carregando).toBe(true)

    await waitFor(() => expect(result.current.carregando).toBe(false))

    expect(result.current.transacoes).toEqual(transacoes)
    expect(result.current.categorias).toEqual(categorias)
    expect(result.current.saldo).toEqual(saldo)
    expect(result.current.erro).toBe(null)
  })

  test('sem propriedadeId, não carrega e fica carregando=false', async () => {
    const { result } = renderHook(() => useFinanceiroPropriedade(null))

    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(financeiroService.listarPorPropriedade).not.toHaveBeenCalled()
    expect(result.current.transacoes).toEqual([])
  })

  test('captura erro do service e expõe em `erro`', async () => {
    financeiroService.listarPorPropriedade.mockRejectedValue(new Error('DB fora do ar'))
    financeiroService.listarCategorias.mockResolvedValue([])
    financeiroService.resumoPropriedade.mockResolvedValue({ receitas: 0, despesas: 0, saldo: 0 })

    const { result } = renderHook(() => useFinanceiroPropriedade('p1'))

    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(result.current.erro).toBe('DB fora do ar')
  })

  test('registrar persiste e recarrega a lista', async () => {
    financeiroService.listarPorPropriedade.mockResolvedValue([])
    financeiroService.listarCategorias.mockResolvedValue([])
    financeiroService.resumoPropriedade.mockResolvedValue({ receitas: 0, despesas: 0, saldo: 0 })
    financeiroService.registrarTransacao.mockResolvedValue({ uuid: 'novo' })

    const { result } = renderHook(() => useFinanceiroPropriedade('p1'))
    await waitFor(() => expect(result.current.carregando).toBe(false))

    await result.current.registrar({ tipo: 'despesa', valor: 50 })

    expect(financeiroService.registrarTransacao).toHaveBeenCalledWith({ tipo: 'despesa', valor: 50 })
    // Recarrega após registrar (listarPorPropriedade é chamado novamente)
    expect(financeiroService.listarPorPropriedade.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  test('excluir delega e recarrega', async () => {
    financeiroService.listarPorPropriedade.mockResolvedValue([])
    financeiroService.listarCategorias.mockResolvedValue([])
    financeiroService.resumoPropriedade.mockResolvedValue({ receitas: 0, despesas: 0, saldo: 0 })
    financeiroService.excluirTransacao.mockResolvedValue(undefined)

    const { result } = renderHook(() => useFinanceiroPropriedade('p1'))
    await waitFor(() => expect(result.current.carregando).toBe(false))

    await result.current.excluir('t1')

    expect(financeiroService.excluirTransacao).toHaveBeenCalledWith('t1')
  })
})

describe('useFinanceiroAnimal', () => {
  test('carrega transações vinculadas ao animal', async () => {
    const lista = [{ uuid: 't1', animal_uuid: 'a1' }]
    financeiroService.listarPorAnimal.mockResolvedValue(lista)

    const { result } = renderHook(() => useFinanceiroAnimal('a1'))

    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(financeiroService.listarPorAnimal).toHaveBeenCalledWith('a1')
    expect(result.current.transacoes).toEqual(lista)
  })

  test('sem animalUuid, retorna lista vazia sem chamar o service', async () => {
    const { result } = renderHook(() => useFinanceiroAnimal(null))
    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(financeiroService.listarPorAnimal).not.toHaveBeenCalled()
    expect(result.current.transacoes).toEqual([])
  })
})

describe('useTransacao', () => {
  test('busca transação e categorias', async () => {
    const t = { uuid: 't1', valor: 10 }
    const categorias = [{ uuid: 'c1' }]
    financeiroService.buscarTransacao.mockResolvedValue(t)
    financeiroService.listarCategorias.mockResolvedValue(categorias)

    const { result } = renderHook(() => useTransacao('t1'))

    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(financeiroService.buscarTransacao).toHaveBeenCalledWith('t1')
    expect(result.current.transacao).toEqual(t)
    expect(result.current.categorias).toEqual(categorias)
  })

  test('atualizar delega e atualiza estado local', async () => {
    const t = { uuid: 't1', valor: 10 }
    const atualizada = { uuid: 't1', valor: 99 }
    financeiroService.buscarTransacao.mockResolvedValue(t)
    financeiroService.listarCategorias.mockResolvedValue([])
    financeiroService.atualizarTransacao.mockResolvedValue(atualizada)

    const { result } = renderHook(() => useTransacao('t1'))
    await waitFor(() => expect(result.current.carregando).toBe(false))

    const r = await result.current.atualizar({ valor: 99 })

    expect(financeiroService.atualizarTransacao).toHaveBeenCalledWith('t1', { valor: 99 })
    expect(r).toEqual(atualizada)
    await waitFor(() => expect(result.current.transacao).toEqual(atualizada))
  })
})

describe('useCustoAnimal', () => {
  test('busca custo acumulado do animal', async () => {
    const custo = { valor_compra: 500, qtd_vacinas: 2, qtd_medicamentos: 1 }
    financeiroService.custoAcumuladoAnimal.mockResolvedValue(custo)

    const { result } = renderHook(() => useCustoAnimal('a1'))

    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(financeiroService.custoAcumuladoAnimal).toHaveBeenCalledWith('a1')
    expect(result.current.custo).toEqual(custo)
  })

  test('sem animalUuid, não carrega e custo é null', async () => {
    const { result } = renderHook(() => useCustoAnimal(null))
    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(financeiroService.custoAcumuladoAnimal).not.toHaveBeenCalled()
    expect(result.current.custo).toBe(null)
  })
})

describe('useLucratividade', () => {
  const dadosBase = [{
    animal_uuid: 'a1', nome: 'Mimosa', id_fisico: '001',
    valor_compra: 1000, peso_atual: 500,
    receitas_vinculadas: 200, despesas_vinculadas: 300,
  }]

  test('carrega dados e calcula lucratividade quando cotacao muda', async () => {
    financeiroService.lucratividadePropriedade.mockResolvedValue(dadosBase)

    const { result, rerender } = renderHook(
      ({ cot }) => useLucratividade('p1', cot),
      { initialProps: { cot: 0 } },
    )

    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(financeiroService.lucratividadePropriedade).toHaveBeenCalledWith('p1', 0)

    // Sem cotação: valorMercado = 0, lucro = (200 + 0) - (1000 + 300) = -1100
    expect(result.current.lucratividade[0].lucro).toBe(-1100)
    expect(result.current.lucratividade[0].status_lucratividade).toBe('prejuizo')

    // Re-render com cotação 30: valorMercado = 500*30 = 15000, lucro = (200+15000)-(1000+300) = 13900
    rerender({ cot: 30 })
    expect(result.current.lucratividade[0].lucro).toBe(13900)
    expect(result.current.lucratividade[0].status_lucratividade).toBe('lucro')
    expect(result.current.lucratividade[0].valor_mercado).toBe(15000)
  })

  test('status empate quando lucro = 0', async () => {
    const dados = [{
      animal_uuid: 'a2', nome: 'Estrela', peso_atual: 0,
      valor_compra: 0, receitas_vinculadas: 0, despesas_vinculadas: 0,
    }]
    financeiroService.lucratividadePropriedade.mockResolvedValue(dados)

    const { result } = renderHook(() => useLucratividade('p1', 0))
    await waitFor(() => expect(result.current.carregando).toBe(false))

    expect(result.current.lucratividade[0].lucro).toBe(0)
    expect(result.current.lucratividade[0].status_lucratividade).toBe('empate')
  })

  test('sem propriedadeId, não carrega', async () => {
    const { result } = renderHook(() => useLucratividade(null, 0))
    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(financeiroService.lucratividadePropriedade).not.toHaveBeenCalled()
    expect(result.current.lucratividade).toEqual([])
  })
})
