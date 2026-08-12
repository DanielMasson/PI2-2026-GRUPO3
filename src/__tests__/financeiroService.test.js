import * as financeiroService from '../services/financeiroService'
import * as sqlite from '../services/sqlite/queries'

jest.mock('../services/sqlite/queries', () => ({
  listarCategorias: jest.fn(),
  buscarCategoriaPorNome: jest.fn(),
  inserirTransacaoFinanceira: jest.fn(),
  buscarTransacao: jest.fn(),
  listarTransacoesPropriedade: jest.fn(),
  listarTransacoesAnimal: jest.fn(),
  excluirTransacao: jest.fn(),
  atualizarTransacao: jest.fn(),
  saldoPropriedade: jest.fn(),
  resumoPorCategoria: jest.fn(),
  resumoPorAnimal: jest.fn(),
  serieMensalPropriedade: jest.fn(),
  custoAcumuladoAnimal: jest.fn(),
  custoAcumuladoPropriedade: jest.fn(),
  lucratividadePropriedade: jest.fn(),
}))

afterEach(() => {
  jest.clearAllMocks()
})

describe('financeiroService', () => {
  test('listarCategorias delega para sqlite.listarCategorias', async () => {
    const categorias = [{ uuid: 'c1', rotulo: 'Ração' }]
    sqlite.listarCategorias.mockResolvedValue(categorias)

    const result = await financeiroService.listarCategorias()

    expect(sqlite.listarCategorias).toHaveBeenCalledTimes(1)
    expect(result).toBe(categorias)
  })

  test('buscarCategoriaPorNome delega para sqlite.buscarCategoriaPorNome', async () => {
    const cat = { uuid: 'c1', nome: 'racao' }
    sqlite.buscarCategoriaPorNome.mockResolvedValue(cat)

    const result = await financeiroService.buscarCategoriaPorNome('racao')

    expect(sqlite.buscarCategoriaPorNome).toHaveBeenCalledWith('racao')
    expect(result).toBe(cat)
  })

  test('registrarTransacao insere e retorna a transacao buscada', async () => {
    const nova = { propriedade_uuid: 'p1', tipo: 'despesa', valor: 10 }
    const transacaoInserida = { uuid: 't1', tipo: 'despesa', valor: 10 }
    sqlite.inserirTransacaoFinanceira.mockResolvedValue('t1')
    sqlite.buscarTransacao.mockResolvedValue(transacaoInserida)

    const result = await financeiroService.registrarTransacao(nova)

    expect(sqlite.inserirTransacaoFinanceira).toHaveBeenCalledWith(nova)
    expect(sqlite.buscarTransacao).toHaveBeenCalledWith('t1')
    expect(result).toEqual(transacaoInserida)
  })

  test('buscarTransacao delega para sqlite.buscarTransacao', async () => {
    const transacao = { uuid: 't1' }
    sqlite.buscarTransacao.mockResolvedValue(transacao)

    const result = await financeiroService.buscarTransacao('t1')

    expect(sqlite.buscarTransacao).toHaveBeenCalledWith('t1')
    expect(result).toBe(transacao)
  })

  test('listarPorPropriedade passa filtros adiante', async () => {
    const lista = [{ uuid: 't1' }]
    sqlite.listarTransacoesPropriedade.mockResolvedValue(lista)

    const result = await financeiroService.listarPorPropriedade('p1', { tipo: 'receita' })

    expect(sqlite.listarTransacoesPropriedade).toHaveBeenCalledWith('p1', { tipo: 'receita' })
    expect(result).toBe(lista)
  })

  test('listarPorAnimal delega para sqlite.listarTransacoesAnimal', async () => {
    const lista = [{ uuid: 't1' }]
    sqlite.listarTransacoesAnimal.mockResolvedValue(lista)

    const result = await financeiroService.listarPorAnimal('a1')

    expect(sqlite.listarTransacoesAnimal).toHaveBeenCalledWith('a1')
    expect(result).toBe(lista)
  })

  test('excluirTransacao delega para sqlite.excluirTransacao', async () => {
    sqlite.excluirTransacao.mockResolvedValue(undefined)

    await financeiroService.excluirTransacao('t1')

    expect(sqlite.excluirTransacao).toHaveBeenCalledWith('t1')
  })

  test('atualizarTransacao atualiza e retorna a transação buscada', async () => {
    const atualizada = { uuid: 't1', valor: 99 }
    sqlite.atualizarTransacao.mockResolvedValue(undefined)
    sqlite.buscarTransacao.mockResolvedValue(atualizada)

    const result = await financeiroService.atualizarTransacao('t1', { valor: 99 })

    expect(sqlite.atualizarTransacao).toHaveBeenCalledWith('t1', { valor: 99 })
    expect(sqlite.buscarTransacao).toHaveBeenCalledWith('t1')
    expect(result).toEqual(atualizada)
  })

  test('resumoPropriedade delega para sqlite.saldoPropriedade', async () => {
    const saldo = { receitas: 100, despesas: 40, saldo: 60 }
    sqlite.saldoPropriedade.mockResolvedValue(saldo)

    const result = await financeiroService.resumoPropriedade('p1')

    expect(sqlite.saldoPropriedade).toHaveBeenCalledWith('p1')
    expect(result).toBe(saldo)
  })

  test('resumoPorCategoria repassa dataInicio e dataFim', async () => {
    const resumo = [{ categoria_uuid: 'c1', total: 50 }]
    sqlite.resumoPorCategoria.mockResolvedValue(resumo)

    const result = await financeiroService.resumoPorCategoria('p1', '2026-01-01', '2026-12-31')

    expect(sqlite.resumoPorCategoria).toHaveBeenCalledWith('p1', '2026-01-01', '2026-12-31')
    expect(result).toBe(resumo)
  })

  test('resumoPorAnimal repassa dataInicio e dataFim', async () => {
    const resumo = [{ animal_uuid: 'a1', receitas: 10, despesas: 5, saldo: 5 }]
    sqlite.resumoPorAnimal.mockResolvedValue(resumo)

    const result = await financeiroService.resumoPorAnimal('p1', undefined, undefined)

    expect(sqlite.resumoPorAnimal).toHaveBeenCalledWith('p1', undefined, undefined)
    expect(result).toBe(resumo)
  })

  test('serieMensal repassa meses (default 12 se omitido no service)', async () => {
    const serie = [{ mes: '2026-01', receitas: 1, despesas: 0, saldo: 1 }]
    sqlite.serieMensalPropriedade.mockResolvedValue(serie)

    const result = await financeiroService.serieMensal('p1', 6)

    expect(sqlite.serieMensalPropriedade).toHaveBeenCalledWith('p1', 6)
    expect(result).toBe(serie)
  })

  test('custoAcumuladoAnimal delega para sqlite', async () => {
    const custo = { valor_compra: 500, qtd_vacinas: 2, qtd_medicamentos: 1 }
    sqlite.custoAcumuladoAnimal.mockResolvedValue(custo)

    const result = await financeiroService.custoAcumuladoAnimal('a1')

    expect(sqlite.custoAcumuladoAnimal).toHaveBeenCalledWith('a1')
    expect(result).toBe(custo)
  })

  test('custoAcumuladoPropriedade delega para sqlite', async () => {
    const lista = [{ animal_uuid: 'a1' }]
    sqlite.custoAcumuladoPropriedade.mockResolvedValue(lista)

    const result = await financeiroService.custoAcumuladoPropriedade('p1')

    expect(sqlite.custoAcumuladoPropriedade).toHaveBeenCalledWith('p1')
    expect(result).toBe(lista)
  })

  test('lucratividadePropriedade repassa cotacaoKg', async () => {
    const lista = [{ animal_uuid: 'a1', lucro: 100 }]
    sqlite.lucratividadePropriedade.mockResolvedValue(lista)

    const result = await financeiroService.lucratividadePropriedade('p1', 28.5)

    expect(sqlite.lucratividadePropriedade).toHaveBeenCalledWith('p1', 28.5)
    expect(result).toBe(lista)
  })
})
