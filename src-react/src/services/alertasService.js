import * as sqlite from './sqlite/queries'

export async function listarAlertasSanitarios(propriedadeUuid) {
  const [obrigatorias, vencidas, futuras] = await Promise.all([
    sqlite.listarObrigatoriasComUltimaAplicacao(propriedadeUuid),
    sqlite.listarVacinasVencidasPropriedade(propriedadeUuid),
    sqlite.listarVacinasFuturasPropriedade(propriedadeUuid),
  ])

  // Cálculo de atraso para obrigatórias.
  // "atrasada"   = ultima_aplicacao IS NULL → nunca aplicada, conta como atrasada se data de hoje > seed_date_unix
  //                (para obligatórias simples, se nunca foi aplicada ainda → status = pendente)
  // "vencida"    = ultima_aplicacao != NULL e (hoje - ultima_aplicacao) > ciclo_dias
  // "ok"         = última aplicação dentro do ciclo_dias
  const hoje = new Date()
  obrigatorias.forEach(o => {
    if (!o.ultima_aplicacao) {
      o.status = 'nunca_aplicada'
      o.atraso_dias = null
    } else {
      const ultima = new Date(o.ultima_aplicacao + 'T00:00:00')
      const prevista = new Date(ultima)
      prevista.setDate(prevista.getDate() + Number(o.ciclo_dias || 365))
      o.prevista = prevista.toISOString().slice(0, 10)
      const diffDias = Math.floor((hoje - prevista) / 86400000)
      o.atraso_dias = diffDias
      o.status = diffDias > 0 ? 'atrasada' : 'ok'
    }
  })

  return {
    obrigatorias,
    vacinasVencidas: vencidas,
    vacinasProximas: futuras,
  }
}
