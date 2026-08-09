import { useState, useEffect, useCallback } from 'react'
import * as producaoLeiteService from '../services/producaoLeiteService'

export function useProducaoLeite(animalUuid) {
  const [ordenhas, setOrdenhas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!animalUuid) {
      setOrdenhas([])
      setCarregando(false)
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const dados = await producaoLeiteService.listarPorAnimal(animalUuid)
      setOrdenhas(Array.isArray(dados) ? dados : [])
    } catch (e) {
      setErro(e.message || String(e))
    } finally {
      setCarregando(false)
    }
  }, [animalUuid])

  useEffect(() => { carregar() }, [carregar])

  async function registrarOrdenha(dados) {
    const ordenha = await producaoLeiteService.registrarOrdenha({
      ...dados,
      animal_uuid: dados.animal_uuid || animalUuid,
    })
    await carregar()
    return ordenha
  }

  async function excluirOrdenha(uuid) {
    await producaoLeiteService.excluirOrdenha(uuid)
    await carregar()
  }

  return {
    ordenhas,
    carregando,
    erro,
    registrarOrdenha,
    excluirOrdenha,
    recarregar: carregar,
  }
}

export function useProducaoLeitePropriedade(propriedadeUuid) {
  const [ordenhas, setOrdenhas] = useState([])
  const [resumo, setResumo] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!propriedadeUuid) {
      setOrdenhas([])
      setResumo([])
      setCarregando(false)
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const [lista, resumoAnimal] = await Promise.all([
        producaoLeiteService.listarPorPropriedade(propriedadeUuid),
        producaoLeiteService.resumoPorAnimal(propriedadeUuid),
      ])
      setOrdenhas(Array.isArray(lista) ? lista : [])
      setResumo(Array.isArray(resumoAnimal) ? resumoAnimal : [])
    } catch (e) {
      setErro(e.message || String(e))
    } finally {
      setCarregando(false)
    }
  }, [propriedadeUuid])

  useEffect(() => { carregar() }, [carregar])

  return {
    ordenhas,
    resumo,
    carregando,
    erro,
    recarregar: carregar,
  }
}

export default useProducaoLeite
