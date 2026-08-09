import { useState, useEffect, useCallback } from 'react'
import * as producaoLeiteService from '../services/producaoLeiteService'

// === HOOKS DE ANÁLISE — DESEMPENHO LEITEIRO (Sprint 8) ===
// 5 hooks de análise num arquivo coeso. Se crescer >200 linhas, splitar.

// useSerieAnimal — série temporal de produção por animal (último N dias)
// Retorna { serie: [{dia, total_litros}], carregando, erro }
export function useSerieAnimal(animalUuid, propriedadeUuid, dias = 7) {
  const [serie, setSerie] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    if (!animalUuid || !propriedadeUuid) return
    setCarregando(true)
    setErro('')
    try {
      const dados = await producaoLeiteService.serieAnimal(animalUuid, propriedadeUuid, dias)
      setSerie(dados)
    } catch (e) {
      setErro(e.message || 'Erro ao carregar série do animal')
    } finally {
      setCarregando(false)
    }
  }, [animalUuid, propriedadeUuid, dias])

  useEffect(() => { carregar() }, [carregar])

  // Reage a syncs pós-pull (mesmo padrão de useAnimais)
  useEffect(() => {
    function onSync() { if (animalUuid && propriedadeUuid) carregar() }
    window.addEventListener('sync:atualizado', onSync)
    return () => window.removeEventListener('sync:atualizado', onSync)
  }, [carregar, animalUuid, propriedadeUuid])

  return { serie, carregando, erro, recarregar: carregar }
}

// useSeriePropriedade — série temporal agregada da propriedade (último N dias)
// Retorna { serie: [{dia, total_litros, vacas_ordenhadas}], carregando, erro }
export function useSeriePropriedade(propriedadeUuid, dias = 7) {
  const [serie, setSerie] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    if (!propriedadeUuid) return
    setCarregando(true)
    setErro('')
    try {
      const dados = await producaoLeiteService.seriePropriedade(propriedadeUuid, dias)
      setSerie(dados)
    } catch (e) {
      setErro(e.message || 'Erro ao carregar série da propriedade')
    } finally {
      setCarregando(false)
    }
  }, [propriedadeUuid, dias])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    function onSync() { if (propriedadeUuid) carregar() }
    window.addEventListener('sync:atualizado', onSync)
    return () => window.removeEventListener('sync:atualizado', onSync)
  }, [carregar, propriedadeUuid])

  return { serie, carregando, erro, recarregar: carregar }
}

// useComparativoAnimais — ranking por total litres (janela recente vs anterior)
// JS calcula delta = total_recente - total_anterior e pct = delta / NULLIF(total_anterior, 0) * 100
// Retorna { ranking: [{uuid, nome, id_fisico, total_recente, total_anterior, delta, pct}],
//          carregando, erro }
export function useComparativoAnimais(propriedadeUuid, dias = 7) {
  const [ranking, setRanking] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    if (!propriedadeUuid) return
    setCarregando(true)
    setErro('')
    try {
      const dados = await producaoLeiteService.comparativoAnimais(propriedadeUuid, dias)
      const comDelta = dados.map(r => {
        const delta = r.total_recente - r.total_anterior
        const pct = r.total_anterior > 0 ? Math.round((delta / r.total_anterior) * 1000) / 10 : null
        return { ...r, delta, pct }
      })
      setRanking(comDelta)
    } catch (e) {
      setErro(e.message || 'Erro ao carregar comparativo')
    } finally {
      setCarregando(false)
    }
  }, [propriedadeUuid, dias])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    function onSync() { if (propriedadeUuid) carregar() }
    window.addEventListener('sync:atualizado', onSync)
    return () => window.removeEventListener('sync:atualizado', onSync)
  }, [carregar, propriedadeUuid])

  return { ranking, carregando, erro, recarregar: carregar }
}

// useMediaHistoricaPropriedade — médias móveis 7/30/90 dias em uma chamada
// Retorna { medias: {media_7d, dias_7d, media_30d, dias_30d, media_90d, dias_90d},
//          carregando, erro }
export function useMediaHistoricaPropriedade(propriedadeUuid) {
  const [medias, setMedias] = useState({
    media_7d: 0, dias_7d: 0,
    media_30d: 0, dias_30d: 0,
    media_90d: 0, dias_90d: 0,
  })
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    if (!propriedadeUuid) return
    setCarregando(true)
    setErro('')
    try {
      const dados = await producaoLeiteService.mediaHistoricaPropriedade(propriedadeUuid)
      setMedias(dados)
    } catch (e) {
      setErro(e.message || 'Erro ao carregar médias históricas')
    } finally {
      setCarregando(false)
    }
  }, [propriedadeUuid])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    function onSync() { if (propriedadeUuid) carregar() }
    window.addEventListener('sync:atualizado', onSync)
    return () => window.removeEventListener('sync:atualizado', onSync)
  }, [carregar, propriedadeUuid])

  return { medias, carregando, erro, recarregar: carregar }
}

// useAlertasQuedaLeite — vacas com queda brusca de produção
// Threshold SQL: variacao_dia_dia <= -20% OU variacao_7d <= -30%
// JS atribui severidade: 'critica' (<= -50% any), 'severa' (<= -30% any), 'moderada' otherwise
export function useAlertasQuedaLeite(propriedadeUuid) {
  const [alertas, setAlertas] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    if (!propriedadeUuid) return
    setCarregando(true)
    setErro('')
    try {
      const dados = await producaoLeiteService.alertasQuedaLeite(propriedadeUuid)
      const comSeveridade = dados.map(a => {
        const pior = Math.min(a.variacao_dia_dia ?? 0, a.variacao_7d ?? 0)
        let severidade = 'moderada'
        if (pior <= -50) severidade = 'critica'
        else if (pior <= -30) severidade = 'severa'
        return { ...a, severidade }
      })
      setAlertas(comSeveridade)
    } catch (e) {
      setErro(e.message || 'Erro ao carregar alertas')
    } finally {
      setCarregando(false)
    }
  }, [propriedadeUuid])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    function onSync() { if (propriedadeUuid) carregar() }
    window.addEventListener('sync:atualizado', onSync)
    return () => window.removeEventListener('sync:atualizado', onSync)
  }, [carregar, propriedadeUuid])

  return { alertas, carregando, erro, recarregar: carregar }
}
