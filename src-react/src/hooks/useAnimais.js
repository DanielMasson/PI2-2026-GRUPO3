import { useState, useEffect, useCallback } from 'react'
import * as animalService from '../services/animalService'

export function useAnimais(propriedadeId) {
  const [animais, setAnimais] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [termoBusca, setTermoBusca] = useState('')
  const [filtros, setFiltros] = useState({ especie: null, sexo: null, status: 'ativo' })

  const carregar = useCallback(async () => {
    if (!propriedadeId) return
    setCarregando(true)
    setErro(null)
    try {
      const dados = await animalService.listarAnimais(propriedadeId)
      setAnimais(dados)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [propriedadeId])

  useEffect(() => { carregar() }, [carregar])

  const animaisFiltrados = animais
    .filter(a => {
      if (!termoBusca) return true
      const termo = termoBusca.toLowerCase()
      return (
        a.nome?.toLowerCase().includes(termo) ||
        a.id_fisico?.toLowerCase().includes(termo) ||
        a.id_interno?.toLowerCase().includes(termo)
      )
    })
    .filter(a => !filtros.especie || a.especie === filtros.especie)
    .filter(a => !filtros.sexo || a.sexo === filtros.sexo)
    .filter(a => !filtros.status || a.status === filtros.status)

  async function criarAnimal(dados) {
    const novo = await animalService.criarAnimal({ ...dados, propriedade_uuid: propriedadeId })
    setAnimais(prev => [...prev, novo])
    return novo
  }

  async function editarAnimal(uuid, dados) {
    const atualizado = await animalService.editarAnimal(uuid, dados)
    setAnimais(prev => prev.map(a => a.uuid === uuid ? atualizado : a))
    return atualizado
  }

  async function excluirAnimal(uuid) {
    await animalService.excluirAnimal(uuid)
    setAnimais(prev => prev.filter(a => a.uuid !== uuid))
  }

  function buscar(termo) {
    setTermoBusca(termo)
  }

  return {
    animais: animaisFiltrados,
    carregando,
    erro,
    buscar,
    criarAnimal,
    editarAnimal,
    excluirAnimal,
    recarregar: carregar,
    filtros,
    setFiltros,
  }
}
