import { useState, useEffect, useCallback } from 'react'
import * as medicamentoService from '../services/medicamentoService'

export function useMedicamentos(id, tipo = 'animal') {
  const [medicamentos, setMedicamentos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!id) return
    setCarregando(true)
    setErro(null)
    try {
      const dados = tipo === 'propriedade'
        ? await medicamentoService.listarMedicamentosPropriedade(id)
        : await medicamentoService.listarMedicamentos(id)
      setMedicamentos(dados)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [id, tipo])

  useEffect(() => { carregar() }, [carregar])

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const emCarencia = medicamentos.filter(m => {
    if (!m.data_liberacao) return false
    const data = new Date(m.data_liberacao + 'T00:00:00')
    return data > hoje
  })

  async function registrarMedicamento(dados) {
    const resultado = await medicamentoService.registrarMedicamento(dados)
    await carregar()
    return resultado
  }

  async function editarMedicamento(uuid, dados) {
    const resultado = await medicamentoService.editarMedicamento(uuid, dados)
    await carregar()
    return resultado
  }

  async function excluirMedicamento(uuid) {
    await medicamentoService.excluirMedicamento(uuid)
    await carregar()
  }

  return {
    medicamentos,
    emCarencia,
    carregando,
    erro,
    registrarMedicamento,
    editarMedicamento,
    excluirMedicamento,
    recarregar: carregar,
  }
}
