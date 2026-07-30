import { useState, useEffect, useCallback } from 'react'
import * as dashboardService from '../services/dashboardService'

// Hook com 3 contadores para o Dashboard de Saúde:
//   - proximasVacinas: caller passa { proximas, vencidas } (já separadas por useVacinas)
//   - gestantes: count direto no DB (sqlite.contarGestantes)
//   - movimentacoesRecentes: count DB últimos 7 dias
export function useDashboardStats(propriedadeUuid, contagensVacinas) {
  const [gestantes, setGestantes] = useState(0)
  const [movimentacoesRecentes, setMovimentacoesRecentes] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!propriedadeUuid) return
    setCarregando(true)
    setErro(null)
    try {
      const g = await dashboardService.contarGestantes(propriedadeUuid)
      const mr = await dashboardService.contarMovimentacoesRecentes(propriedadeUuid, 7)
      setGestantes(g)
      setMovimentacoesRecentes(mr)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [propriedadeUuid])

  useEffect(() => { carregar() }, [carregar])

  const proximas = contagensVacinas?.proximas?.length ?? 0
  const vencidas = contagensVacinas?.vencidas?.length ?? 0

  return {
    gestantes,
    movimentacoesRecentes,
    proximasVacinas: proximas + vencidas,
    carregando,
    erro,
    recarregar: carregar,
  }
}
