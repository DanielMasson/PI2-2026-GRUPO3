import { useState, useEffect, useCallback } from 'react'
import * as vacinaService from '../services/vacinaService'
import * as reproducaoService from '../services/reproducaoService'
import * as sqliteQueries from '../services/sqlite/queries'
import { diasAte } from '../utils/datas'

export function useAlertas(propriedadeId) {
  const [alertas, setAlertas] = useState([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!propriedadeId) return
    setCarregando(true)
    try {
      const lista = []
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)

      // Vacinas vencidas e próximas
      const vacinas = await vacinaService.listarVacinasPropriedade(propriedadeId)
      vacinas.forEach(v => {
        if (!v.proxima_dose) return
        const data = new Date(v.proxima_dose + 'T00:00:00')
        const diff = Math.ceil((data - hoje) / (1000 * 60 * 60 * 24))

        if (diff < 0) {
          lista.push({
            tipo: 'vacina_vencida',
            titulo: `Vacina vencida: ${v.nome_vacina}`,
            descricao: `${v.nome_animal || 'Animal'} — vencida há ${Math.abs(diff)} dia(s)`,
            nivel: 'danger',
            tempo: diff,
          })
        } else if (diff === 0) {
          lista.push({
            tipo: 'vacina_hoje',
            titulo: `Vacina vence hoje: ${v.nome_vacina}`,
            descricao: `${v.nome_animal || 'Animal'} — aplicação prevista para hoje`,
            nivel: 'danger',
            tempo: diff,
          })
        } else if (diff <= 7) {
          lista.push({
            tipo: 'vacina_proxima',
            titulo: `Vacina próxima: ${v.nome_vacina}`,
            descricao: `${v.nome_animal || 'Animal'} — vence em ${diff} dia(s)`,
            nivel: 'warning',
            tempo: diff,
          })
        }
      })

      // Partos próximos e atrasados
      const gestantes = await reproducaoService.listarGestantes(propriedadeId)
      gestantes.forEach(g => {
        if (!g.data_previa_parto) return
        const dias = diasAte(g.data_previa_parto, hoje)

        if (dias !== null && dias < 0) {
          lista.push({
            tipo: 'parto_atrasado',
            titulo: `Parto atrasado: ${g.nome_animal || 'Animal'}`,
            descricao: `Previsto há ${Math.abs(dias)} dia(s) — possível aborto`,
            nivel: 'danger',
            tempo: dias,
          })
        } else if (dias !== null && dias <= 30) {
          lista.push({
            tipo: 'parto_proximo',
            titulo: `Parto próximo: ${g.nome_animal || 'Animal'}`,
            descricao: `Previsto em ${dias} dia(s)`,
            nivel: 'warning',
            tempo: dias,
          })
        }
      })

      // Medicamentos em carência
      try {
        const medicamentos = await sqliteQueries.listarMedicamentosPropriedade(propriedadeId)
        medicamentos.forEach(m => {
          if (!m.data_liberacao) return
          const dataLib = new Date(m.data_liberacao + 'T00:00:00')
          const diff = Math.ceil((dataLib - hoje) / (1000 * 60 * 60 * 24))
          if (diff < 0) {
            lista.push({
              tipo: 'carencia_liberada',
              titulo: `Carência liberada: ${m.produto}`,
              descricao: `${m.nome_animal || 'Animal'} — liberado há ${Math.abs(diff)} dia(s)`,
              nivel: 'info',
              tempo: diff,
            })
          } else if (diff <= 7) {
            lista.push({
              tipo: 'carencia_proxima',
              titulo: `Em carência: ${m.produto}`,
              descricao: `${m.nome_animal || 'Animal'} — libera em ${diff} dia(s)`,
              nivel: 'warning',
              tempo: diff,
            })
          } else {
            lista.push({
              tipo: 'carencia_ativa',
              titulo: `Em carência: ${m.produto}`,
              descricao: `${m.nome_animal || 'Animal'} — libera em ${diff} dia(s)`,
              nivel: 'info',
              tempo: diff,
            })
          }
        })
      } catch {
        // Ignorar — query pode não estar disponível
      }

      // Ordenar por urgência (danger primeiro, depois warning, depois info)
      const ordem = { danger: 0, warning: 1, info: 2 }
      lista.sort((a, b) => (ordem[a.nivel] ?? 3) - (ordem[b.nivel] ?? 3))

      setAlertas(lista)
    } catch {
      setAlertas([])
    } finally {
      setCarregando(false)
    }
  }, [propriedadeId])

  useEffect(() => { carregar() }, [carregar])

  return {
    alertas,
    carregando,
    recarregar: carregar,
  }
}
