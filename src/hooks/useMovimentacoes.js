import { useState, useEffect, useCallback } from 'react'
import * as movimentacaoService from '../services/movimentacaoService'

export function useMovimentacoes(animalUuid) {
  const [movimentacoes, setMovimentacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!animalUuid) return
    setCarregando(true)
    setErro(null)
    try {
      const dados = await movimentacaoService.listarMovimentacoes(animalUuid)
      setMovimentacoes(dados)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [animalUuid])

  useEffect(() => { carregar() }, [carregar])

  async function registrarMovimentacao(dados) {
    const resultado = await movimentacaoService.registrarMovimentacao(dados)
    await carregar()
    return resultado
  }

  async function editarMovimentacao(uuid, dados) {
    await movimentacaoService.editarMovimentacao(uuid, dados)
    await carregar()
  }

  async function excluirMovimentacao(uuid) {
    await movimentacaoService.excluirMovimentacao(uuid)
    await carregar()
  }

  return {
    movimentacoes,
    carregando,
    erro,
    registrarMovimentacao,
    editarMovimentacao,
    excluirMovimentacao,
    recarregar: carregar,
  }
}
