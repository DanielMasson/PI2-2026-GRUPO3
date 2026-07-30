import { useState, useEffect, useCallback } from 'react'
import * as reproducaoService from '../services/reproducaoService'
import { DIAS_GESTACAO, DIAS_SECAGEM } from '../constants/sync'

export function useReproducao(animalUuid) {
  const [registros, setRegistros] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!animalUuid) return
    setCarregando(true)
    setErro(null)
    try {
      const dados = await reproducaoService.listarReproducao(animalUuid)
      setRegistros(dados)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [animalUuid])

  useEffect(() => { carregar() }, [carregar])

  const gestacaoAtiva = registros.find(r => !r.data_parto && r.prenhez_confirmada) || null

  const diasRestantes = gestacaoAtiva
    ? reproducaoService.diasAteParto(gestacaoAtiva.data_previa_parto)
    : null

  function statusGestacao() {
    if (!gestacaoAtiva) return null
    const dias = diasRestantes
    if (dias === null) return { label: 'Indefinido', cor: 'cinza' }
    if (dias < 0) return { label: 'Atrasado', cor: 'vermelho' }
    if (dias <= 7) return { label: 'Iminente', cor: 'vermelho' }
    if (dias <= 30) return { label: 'Próximo', cor: 'amarelo' }
    if (dias <= 60) return { label: 'Avançado', cor: 'verde' }
    return { label: 'Início', cor: 'verde' }
  }

  async function registrarCobertura(dados) {
    const resultado = await reproducaoService.registrarCobertura(dados)
    await carregar()
    return resultado
  }

  async function confirmarPrenhez(uuid, dataConfirmacao) {
    const resultado = await reproducaoService.confirmarPrenhez(uuid, dataConfirmacao)
    await carregar()
    return resultado
  }

  async function registrarParto(uuid, dataParto) {
    const resultado = await reproducaoService.registrarParto(uuid, dataParto)
    await carregar()
    return resultado
  }

  return {
    registros,
    gestacaoAtiva,
    diasRestantes,
    statusGestacao,
    carregando,
    erro,
    registrarCobertura,
    confirmarPrenhez,
    registrarParto,
    recarregar: carregar,
  }
}
