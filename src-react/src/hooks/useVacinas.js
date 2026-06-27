import { useState, useEffect, useCallback } from 'react'
import * as vacinaService from '../services/vacinaService'

export function useVacinas(id, tipo = 'animal') {
  const [vacinas, setVacinas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!id) return
    setCarregando(true)
    setErro(null)
    try {
      const dados = tipo === 'propriedade'
        ? await vacinaService.listarVacinasPropriedade(id)
        : await vacinaService.listarVacinas(id)
      setVacinas(dados)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [id, tipo])

  useEffect(() => { carregar() }, [carregar])

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const proximas = vacinas.filter(v => {
    if (!v.proxima_dose) return false
    const data = new Date(v.proxima_dose + 'T00:00:00')
    const diff = Math.ceil((data - hoje) / (1000 * 60 * 60 * 24))
    return diff >= 0 && diff <= 30
  })

  const vencidas = vacinas.filter(v => {
    if (!v.proxima_dose) return false
    const data = new Date(v.proxima_dose + 'T00:00:00')
    return data < hoje
  })

  async function registrarVacina(dados) {
    const resultado = await vacinaService.registrarVacina(dados)
    await carregar()
    return resultado
  }

  async function editarVacina(uuid, dados) {
    const resultado = await vacinaService.editarVacina(uuid, dados)
    await carregar()
    return resultado
  }

  async function excluirVacina(uuid) {
    await vacinaService.excluirVacina(uuid)
    await carregar()
  }

  return {
    vacinas,
    proximas,
    vencidas,
    carregando,
    erro,
    registrarVacina,
    editarVacina,
    excluirVacina,
    recarregar: carregar,
  }
}
