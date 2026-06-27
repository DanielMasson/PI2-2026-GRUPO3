import { useState, useEffect, useCallback } from 'react'
import * as reproducaoService from '../services/reproducaoService'

export function useGestantes(propriedadeId) {
  const [gestantes, setGestantes] = useState([])
  const [coberturas, setCoberturas] = useState([])
  const [falhas, setFalhas] = useState([])
  const [paridas, setParidas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!propriedadeId) return
    setCarregando(true)
    setErro(null)
    try {
      const [gestantesResult, coberturasResult, falhasResult, paridasResult] = await Promise.all([
        reproducaoService.listarGestantes(propriedadeId),
        reproducaoService.listarCoberturas(propriedadeId),
        reproducaoService.listarFalhas(propriedadeId),
        reproducaoService.listarParidas(propriedadeId),
      ])
      setGestantes(gestantesResult)
      setCoberturas(coberturasResult)
      setFalhas(falhasResult)
      setParidas(paridasResult)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [propriedadeId])

  // Marca gestações finalizadas (paridas) — partilhado com o service
  // (Sprint 7 separa por `resultado`, mas por compat com dados legados também
  // caem aqui registros com data_parto preenchida).
  useEffect(() => { carregar() }, [carregar])

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const partosProximos = gestantes.filter(g => {
    if (!g.data_previa_parto || g.data_parto) return false
    const data = new Date(g.data_previa_parto + 'T00:00:00')
    const diff = (data - hoje) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 30
  })

  const partosAtrasados = gestantes.filter(g => {
    if (!g.data_previa_parto || g.data_parto) return false
    const data = new Date(g.data_previa_parto + 'T00:00:00')
    return data < hoje
  })

  return {
    gestantes,
    coberturas,
    falhas,
    paridas,
    partosProximos,
    partosAtrasados,
    carregando,
    erro,
    recarregar: carregar,
  }
}
