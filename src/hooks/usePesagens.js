import { useState, useEffect, useCallback } from 'react'
import * as pesagemService from '../services/pesagemService'

function calcularGMD(pesagens) {
  if (!pesagens || pesagens.length < 2) return { valor: 0, status: 'sem_dados', cor: 'cinza' }

  const ordenadas = [...pesagens].sort((a, b) => new Date(b.data) - new Date(a.data))
  const [atual, anterior] = ordenadas
  const dias = (new Date(atual.data) - new Date(anterior.data)) / (1000 * 60 * 60 * 24)
  if (dias <= 0) return { valor: 0, status: 'sem_dados', cor: 'cinza' }

  const valor = (atual.peso - anterior.peso) / dias

  if (valor >= 1.0) return { valor, status: 'otimo', cor: 'verde' }
  if (valor >= 0.5) return { valor, status: 'bom', cor: 'verde' }
  if (valor >= 0.1) return { valor, status: 'regular', cor: 'amarelo' }
  if (valor >= 0) return { valor, status: 'estavel', cor: 'cinza' }
  return { valor, status: 'perda', cor: 'vermelho' }
}

export function usePesagens(animalUuid) {
  const [pesagens, setPesagens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!animalUuid) return
    setCarregando(true)
    setErro(null)
    try {
      const dados = await pesagemService.listarPesagens(animalUuid)
      setPesagens(dados)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [animalUuid])

  useEffect(() => { carregar() }, [carregar])

  const pesoAtual = pesagens.length > 0
    ? [...pesagens].sort((a, b) => new Date(b.data) - new Date(a.data))[0]?.peso
    : null

  const gmd = calcularGMD(pesagens)

  const ecc = pesagens.length > 0
    ? (() => {
        const ultimo = [...pesagens].sort((a, b) => new Date(b.data) - new Date(a.data))[0]
        if (!ultimo?.ecc) return { valor: null, label: 'Sem dados', cor: 'cinza' }
        const v = ultimo.ecc
        if (v >= 4) return { valor: v, label: 'Acima do ideal', cor: 'amarelo' }
        if (v >= 3) return { valor: v, label: 'Ideal', cor: 'verde' }
        if (v >= 2) return { valor: v, label: 'Abaixo do ideal', cor: 'amarelo' }
        return { valor: v, label: 'Muito baixo', cor: 'vermelho' }
      })()
    : { valor: null, label: 'Sem dados', cor: 'cinza' }

  async function registrarPesagem(dados) {
    const resultado = await pesagemService.registrarPesagem(dados)
    await carregar()
    return resultado
  }

  return {
    pesagens,
    pesoAtual,
    gmd,
    ecc,
    carregando,
    erro,
    registrarPesagem,
    recarregar: carregar,
  }
}
