import { useState, useEffect, useCallback } from 'react'
import * as cioService from '../services/cioService'

export function useCios(propriedadeUuid) {
  const [cios, setCios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!propriedadeUuid) {
      setCios([])
      setCarregando(false)
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const dados = await cioService.listarCios(propriedadeUuid)
      setCios(Array.isArray(dados) ? dados : [])
    } catch (e) {
      setErro(e.message || String(e))
    } finally {
      setCarregando(false)
    }
  }, [propriedadeUuid])

  useEffect(() => { carregar() }, [carregar])

  async function registrarCio(dados) {
    const resultado = await cioService.registrarCio({
      ...dados,
      propriedade_uuid: dados.propriedade_uuid || propriedadeUuid,
    })
    await carregar()
    return resultado
  }

  async function excluirCio(uuid) {
    await cioService.excluirCio(uuid)
    await carregar()
  }

  return {
    cios,
    carregando,
    erro,
    registrarCio,
    excluirCio,
    recarregar: carregar,
  }
}

export default useCios
