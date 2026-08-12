import { useState, useEffect, useCallback } from 'react'
import * as financeiroService from '../services/financeiroService'

// Hook principal do módulo Financeiro — carrega transações, categorias e saldo
// total da propriedade. Refetch automático ao receber evento `sync:atualizado`
// (padrão espelhado em useAnimais.js).
export function useFinanceiroPropriedade(propriedadeId) {
  const [transacoes, setTransacoes] = useState([])
  const [categorias, setCategorias] = useState([])
  const [saldo, setSaldo] = useState({ receitas: 0, despesas: 0, saldo: 0 })
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!propriedadeId) { setCarregando(false); return }
    setCarregando(true)
    setErro(null)
    try {
      const [t, c, s] = await Promise.all([
        financeiroService.listarPorPropriedade(propriedadeId, {}),
        financeiroService.listarCategorias(),
        financeiroService.resumoPropriedade(propriedadeId),
      ])
      setTransacoes(t || [])
      setCategorias(c || [])
      setSaldo(s)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [propriedadeId])

  useEffect(() => { carregar() }, [carregar])

  // Re-fetch após sync Firestore push+pull (login automático ou botão SyncIndicator).
  useEffect(() => {
    function onSyncAtualizado() {
      if (propriedadeId) carregar()
    }
    window.addEventListener('sync:atualizado', onSyncAtualizado)
    return () => window.removeEventListener('sync:atualizado', onSyncAtualizado)
  }, [carregar, propriedadeId])

  async function registrar(dados) {
    const novo = await financeiroService.registrarTransacao(dados)
    await carregar()
    return novo
  }

  async function excluir(uuid) {
    await financeiroService.excluirTransacao(uuid)
    await carregar()
  }

  return {
    transacoes,
    categorias,
    saldo,
    carregando,
    erro,
    registrar,
    excluir,
    recarregar: carregar,
  }
}

// Hook para drill-down na página Por Animal — carrega todas as transações
// vinculadas a um animal específico.
export function useFinanceiroAnimal(animalUuid) {
  const [transacoes, setTransacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!animalUuid) { setCarregando(false); return }
    setCarregando(true)
    setErro(null)
    try {
      const dados = await financeiroService.listarPorAnimal(animalUuid)
      setTransacoes(dados || [])
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [animalUuid])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    function onSyncAtualizado() {
      if (animalUuid) carregar()
    }
    window.addEventListener('sync:atualizado', onSyncAtualizado)
    return () => window.removeEventListener('sync:atualizado', onSyncAtualizado)
  }, [carregar, animalUuid])

  return { transacoes, carregando, erro, recarregar: carregar }
}

// Hook para buscar e editar uma transação específica (tela Detalhe/Edição).
export function useTransacao(uuid) {
  const [transacao, setTransacao] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!uuid) { setCarregando(false); return }
    setCarregando(true)
    setErro(null)
    try {
      const [t, c] = await Promise.all([
        financeiroService.buscarTransacao(uuid),
        financeiroService.listarCategorias(),
      ])
      setTransacao(t)
      setCategorias(c || [])
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [uuid])

  useEffect(() => { carregar() }, [carregar])

  async function atualizar(dados) {
    const atualizado = await financeiroService.atualizarTransacao(uuid, dados)
    setTransacao(atualizado)
    return atualizado
  }

  return { transacao, categorias, carregando, erro, atualizar, recarregar: carregar }
}

// Hook para custo acumulado de um animal específico
export function useCustoAnimal(animalUuid) {
  const [custo, setCusto] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!animalUuid) { setCarregando(false); return }
    setCarregando(true)
    setErro(null)
    try {
      const dados = await financeiroService.custoAcumuladoAnimal(animalUuid)
      setCusto(dados)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [animalUuid])

  useEffect(() => { carregar() }, [carregar])

  return { custo, carregando, erro, recarregar: carregar }
}

// Hook para lucratividade de todos os animais da propriedade.
// Busca dados do DB uma vez (depende apenas de propriedadeId) e recalcula
// lucratividade em JS quando cotacaoKg muda (evita re-fetch a cada tecla).
export function useLucratividade(propriedadeId, cotacaoKg = 0) {
  const [dadosRaw, setDadosRaw] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!propriedadeId) { setCarregando(false); return }
    setCarregando(true)
    setErro(null)
    try {
      const dados = await financeiroService.lucratividadePropriedade(propriedadeId, 0)
      setDadosRaw(dados || [])
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [propriedadeId])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    function onSyncAtualizado() {
      if (propriedadeId) carregar()
    }
    window.addEventListener('sync:atualizado', onSyncAtualizado)
    return () => window.removeEventListener('sync:atualizado', onSyncAtualizado)
  }, [carregar, propriedadeId])

  // Calcula lucratividade em JS quando cotacaoKg muda
  const lucratividade = dadosRaw.map(r => {
    const valorCompra = r.valor_compra || 0
    const valorMercado = (r.peso_atual || 0) * (cotacaoKg || 0)
    const receitas = r.receitas_vinculadas || 0
    const despesas = r.despesas_vinculadas || 0
    const lucro = (receitas + valorMercado) - (valorCompra + despesas)
    return {
      ...r,
      custo_acumulado: valorCompra,
      valor_mercado: valorMercado,
      lucro,
      status_lucratividade: lucro > 0 ? 'lucro' : lucro < 0 ? 'prejuizo' : 'empate',
    }
  })

  return { lucratividade, carregando, erro, recarregar: carregar }
}
