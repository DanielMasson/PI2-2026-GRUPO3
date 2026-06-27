import { useState, useEffect, useCallback } from 'react'
import * as alertasService from '../services/alertasService'

// Hook que consolida 3 fontes para o Dashboard de alertas:
//   - obrigatorias: lista de obrigatórias da propriedade + status (atrasada/nunca/ok) por cruzamento com MAX(data_aplicacao)
//   - vacinasVencidas: registros de vacina cuja proxima_dose < hoje
//   - vacinasProximas: registros de vacina cuja proxima_dose ∈ [hoje, hoje+7d]
export function useAlertasSanitarios(propriedadeUuid) {
  const [obrigatorias, setObrigatorias] = useState([])
  const [vacinasVencidas, setVacinasVencidas] = useState([])
  const [vacinasProximas, setVacinasProximas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!propriedadeUuid) return
    setCarregando(true)
    setErro(null)
    try {
      const result = await alertasService.listarAlertasSanitarios(propriedadeUuid)
      setObrigatorias(result.obrigatorias || [])
      setVacinasVencidas(result.vacinasVencidas || [])
      setVacinasProximas(result.vacinasProximas || [])
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [propriedadeUuid])

  useEffect(() => { carregar() }, [carregar])

  // Contadores agregados para o card do Dashboard.
  const obrigatoriasPendentes = obrigatorias.filter(o => o.status === 'atrasada' || o.status === 'nunca_aplicada').length

  return {
    obrigatorias,
    vacinasVencidas,
    vacinasProximas,
    obrigatoriasPendentes,
    carregando,
    erro,
    recarregar: carregar,
  }
}
