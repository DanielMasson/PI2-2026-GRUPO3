import { useState, useEffect, useCallback } from 'react'
import * as baixaService from '../services/baixaService'

export function useBaixas(propriedadeId) {
  const [baixas, setBaixas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!propriedadeId) return
    setCarregando(true)
    setErro(null)
    try {
      const dados = await baixaService.listarBaixas(propriedadeId)
      setBaixas(dados)
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

  async function registrarBaixa(dados) {
    if (!propriedadeId) throw new Error('propriedadeId ausente')
    const nova = await baixaService.registrarBaixa({ ...dados, propriedade_uuid: propriedadeId })
    setBaixas(prev => [nova, ...prev])
    return nova
  }

  async function excluirBaixa(uuid) {
    await baixaService.excluirBaixa(uuid)
    setBaixas(prev => prev.filter(b => b.uuid !== uuid))
  }

  return {
    baixas,
    carregando,
    erro,
    registrarBaixa,
    excluirBaixa,
    recarregar: carregar,
  }
}

export function useBaixa(uuid) {
  const [baixa, setBaixa] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!uuid) { setCarregando(false); return }
    setCarregando(true)
    setErro(null)
    try {
      const dados = await baixaService.buscarBaixa(uuid)
      setBaixa(dados)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [uuid])

  useEffect(() => { carregar() }, [carregar])

  return { baixa, carregando, erro, recarregar: carregar }
}
