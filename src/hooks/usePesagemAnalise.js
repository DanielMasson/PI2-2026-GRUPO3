import { useState, useEffect, useCallback } from 'react'
import * as pesagemService from '../services/pesagemService'

// === HOOKS DE ANÁLISE — DESEMPENHO DE CORTE (Sprint 8.5) ===
// 5 hooks de análise para machos bovinos + ovinos/caprinos.
// Padrão espelha useProducaoLeiteAnalise — useState+useCallback+useEffect+listener sync:atualizado.

// useSeriePesoAnimal — série temporal de peso de um animal (último N dias)
// Retorna { serie: [{dia, peso, ecc}], carregando, erro }
export function useSeriePesoAnimal(animalUuid, propriedadeUuid, dias = 7) {
  const [serie, setSerie] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    if (!animalUuid || !propriedadeUuid) return
    setCarregando(true)
    setErro('')
    try {
      const dados = await pesagemService.seriePesoAnimal(animalUuid, propriedadeUuid, dias)
      setSerie(dados)
    } catch (e) {
      setErro(e.message || 'Erro ao carregar série de peso do animal')
    } finally {
      setCarregando(false)
    }
  }, [animalUuid, propriedadeUuid, dias])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    function onSync() { if (animalUuid && propriedadeUuid) carregar() }
    window.addEventListener('sync:atualizado', onSync)
    return () => window.removeEventListener('sync:atualizado', onSync)
  }, [carregar, animalUuid, propriedadeUuid])

  return { serie, carregando, erro, recarregar: carregar }
}

// useSeriePesoPropriedade — série agregada (peso médio + animais pesados por data)
// Retorna { serie: [{dia, peso_medio, animais_pesados}], carregando, erro }
export function useSeriePesoPropriedade(propriedadeUuid, dias = 7) {
  const [serie, setSerie] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    if (!propriedadeUuid) return
    setCarregando(true)
    setErro('')
    try {
      const dados = await pesagemService.seriePesoPropriedade(propriedadeUuid, dias)
      setSerie(dados)
    } catch (e) {
      setErro(e.message || 'Erro ao carregar série de peso da propriedade')
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

// useRankingGmdAnimais — ranking por GMD (kg/dia) na janela de N dias
// JS não precisa calcular delta — SQL já retorna gmd, peso_atual, peso_anterior, total_ganho
// Retorna { ranking: [{uuid, nome, id_fisico, gmd, peso_atual, peso_anterior, total_ganho}],
//          carregando, erro }
export function useRankingGmdAnimais(propriedadeUuid, dias = 7) {
  const [ranking, setRanking] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    if (!propriedadeUuid) return
    setCarregando(true)
    setErro('')
    try {
      const dados = await pesagemService.rankingGmdAnimais(propriedadeUuid, dias)
      setRanking(dados)
    } catch (e) {
      setErro(e.message || 'Erro ao carregar ranking de GMD')
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

// useMediaHistoricaGmdPropriedade — médias móveis GMD 7/30/90 dias + ECC médio 90d
// Retorna { medias: {gmd_media_7d, gmd_dias_7d, gmd_media_30d, gmd_dias_30d,
//                    gmd_media_90d, gmd_dias_90d, ecc_medio_90d}, carregando, erro }
export function useMediaHistoricaGmdPropriedade(propriedadeUuid) {
  const [medias, setMedias] = useState({
    gmd_media_7d: 0, gmd_dias_7d: 0,
    gmd_media_30d: 0, gmd_dias_30d: 0,
    gmd_media_90d: 0, gmd_dias_90d: 0,
    ecc_medio_90d: 0,
  })
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    if (!propriedadeUuid) return
    setCarregando(true)
    setErro('')
    try {
      const dados = await pesagemService.mediaHistoricaGmdPropriedade(propriedadeUuid)
      setMedias(dados)
    } catch (e) {
      setErro(e.message || 'Erro ao carregar médias históricas de GMD')
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

// useAlertasCortePropriedade — 3 categorias (perda, estagnacao, pronto_abate)
// JS agrupa por tipo_alerta em 3 buckets para a tela de Alertas.
// Retorna { alertas: {perda: [], estagnacao: [], pronto_abate: []}, carregando, erro }
export function useAlertasCortePropriedade(propriedadeUuid) {
  const [alertas, setAlertas] = useState({ perda: [], estagnacao: [], pronto_abate: [] })
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    if (!propriedadeUuid) return
    setCarregando(true)
    setErro('')
    try {
      const dados = await pesagemService.alertasCortePropriedade(propriedadeUuid)
      const grupos = { perda: [], estagnacao: [], pronto_abate: [] }
      for (const a of dados) {
        if (a.tipo_alerta === 'perda') grupos.perda.push(a)
        else if (a.tipo_alerta === 'estagnacao') grupos.estagnacao.push(a)
        else if (a.tipo_alerta === 'pronto_abate') grupos.pronto_abate.push(a)
      }
      setAlertas(grupos)
    } catch (e) {
      setErro(e.message || 'Erro ao carregar alertas de corte')
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
