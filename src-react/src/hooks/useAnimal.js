import { useState, useEffect, useCallback } from 'react'
import * as animalService from '../services/animalService'

export function getIdade(dataNascimento) {
  if (!dataNascimento) return ''
  const hoje = new Date()
  const nasc = new Date(dataNascimento + 'T00:00:00')
  const meses = (hoje.getFullYear() - nasc.getFullYear()) * 12 + (hoje.getMonth() - nasc.getMonth())
  if (meses < 0) return ''
  if (meses < 12) return `${meses}m`
  const anos = Math.floor(meses / 12)
  const resto = meses % 12
  return resto > 0 ? `${anos}a ${resto}m` : `${anos}a`
}

function calcularIdade(dataNascimento) {
  if (!dataNascimento) return { texto: '', meses: 0 }
  const hoje = new Date()
  const nasc = new Date(dataNascimento + 'T00:00:00')
  const meses = (hoje.getFullYear() - nasc.getFullYear()) * 12 + (hoje.getMonth() - nasc.getMonth())
  if (meses < 0) return { texto: '', meses: 0 }
  if (meses < 12) return { texto: `${meses}m`, meses }
  const anos = Math.floor(meses / 12)
  const resto = meses % 12
  const texto = resto > 0 ? `${anos}a ${resto}m` : `${anos}a`
  return { texto, meses }
}

export function useAnimal(animalId) {
  const [animal, setAnimal] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!animalId) return
    setCarregando(true)
    setErro(null)
    try {
      const dados = await animalService.buscarAnimal(animalId)
      setAnimal(dados)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [animalId])

  useEffect(() => { carregar() }, [carregar])

  const idade = animal ? calcularIdade(animal.data_nascimento) : { texto: '', meses: 0 }

  async function atualizar(dados) {
    const atualizado = await animalService.editarAnimal(animalId, dados)
    setAnimal(atualizado)
  }

  return {
    animal,
    idade,
    carregando,
    erro,
    recarregar: carregar,
    atualizar,
  }
}
