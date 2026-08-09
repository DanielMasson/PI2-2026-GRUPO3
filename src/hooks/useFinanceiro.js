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
    if (!propriedadeId) return
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
    if (!animalUuid) return
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
