import { useState, useEffect, useCallback } from 'react'
import * as ocorrenciaService from '../services/ocorrenciaService'

export function useOcorrencias(id, tipo = 'animal') {
  const [ocorrencias, setOcorrencias] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!id) return
    setCarregando(true)
    setErro(null)
    try {
      const dados = tipo === 'propriedade'
        ? await ocorrenciaService.listarOcorrenciasPropriedade(id)
        : await ocorrenciaService.listarOcorrencias(id)
      setOcorrencias(dados)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [id, tipo])

  useEffect(() => { carregar() }, [carregar])

  async function registrarOcorrencia(dados) {
    const resultado = await ocorrenciaService.registrarOcorrencia(dados)
    await carregar()
    return resultado
  }

  async function editarOcorrencia(uuid, dados) {
    const resultado = await ocorrenciaService.editarOcorrencia(uuid, dados)
    await carregar()
    return resultado
  }

  return {
    ocorrencias,
    carregando,
    erro,
    registrarOcorrencia,
    editarOcorrencia,
    recarregar: carregar,
  }
}
