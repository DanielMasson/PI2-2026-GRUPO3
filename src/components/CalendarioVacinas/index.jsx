import { useState, useEffect, useMemo } from 'react'
import * as vacinaService from '../../services/vacinaService'
import styles from './CalendarioVacinas.module.css'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function CalendarioVacinas({ propriedadeUuid }) {
  const [vacinas, setVacinas] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [referencia, setReferencia] = useState(() => {
    const h = new Date()
    return new Date(h.getFullYear(), h.getMonth(), 1)
  })

  async function carregar() {
    if (!propriedadeUuid) return
    setCarregando(true)
    try {
      const proximas = await vacinaService.listarVacinasProximas(propriedadeUuid, 365)
      setVacinas(Array.isArray(proximas) ? proximas : [])
    } catch (e) {
      // silencioso: falha de leitura não deve quebrar UI
      setVacinas([])
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [propriedadeUuid])

  // Indexa vacinas por dia do mês de referência
  const vacinasPorDia = useMemo(() => {
    const idx = {}
    for (const v of vacinas) {
      const data = v.proxima_dose || v.data_aplicacao
      if (!data) continue
      const d = new Date(data + 'T00:00:00')
      if (d.getFullYear() !== referencia.getFullYear() ||
          d.getMonth() !== referencia.getMonth()) continue
      const dia = d.getDate()
      if (!idx[dia]) idx[dia] = []
      idx[dia].push(v)
    }
    return idx
  }, [vacinas, referencia])

  // Resumo do mês
  const totalMes = Object.values(vacinasPorDia).reduce((acc, lista) => acc + lista.length, 0)

  // Grid de dias
  const primeiroDia = new Date(referencia.getFullYear(), referencia.getMonth(), 1)
  const ultimoDia = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 0)
  const offsetSemana = primeiroDia.getDay()
  const totalDias = ultimoDia.getDate()

  function proximoMes() {
    setReferencia(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }
  function mesAnterior() {
    setReferencia(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }
  function hoje() {
    const h = new Date()
    setReferencia(new Date(h.getFullYear(), h.getMonth(), 1))
  }

  const hojeNumero = (() => {
    const h = new Date()
    if (h.getFullYear() === referencia.getFullYear() &&
        h.getMonth() === referencia.getMonth()) return h.getDate()
    return null
  })()

  return (
    <div className={styles.container}>
      <div className={styles.cabecalho}>
        <button type="button" className={styles.navBtn} onClick={mesAnterior}>‹</button>
        <div className={styles.mesTitulo}>
          {MESES[referencia.getMonth()]} {referencia.getFullYear()}
        </div>
        <button type="button" className={styles.navBtn} onClick={proximoMes}>›</button>
      </div>

      <div className={styles.controles}>
        <button type="button" className={styles.btnHoje} onClick={hoje}>Hoje</button>
        <span className={styles.resumo}>{totalMes} doses no mês</span>
      </div>

      {carregando ? (
        <div className={styles.empty}>Carregando...</div>
      ) : (
        <div className={styles.grid}>
          {DIAS_SEMANA.map(d => (
            <div key={d} className={styles.diaSemana}>{d}</div>
          ))}
          {Array.from({ length: offsetSemana }, (_, i) => (
            <div key={`v-${i}`} className={styles.diaVazio} />
          ))}
          {Array.from({ length: totalDias }, (_, i) => i + 1).map(dia => {
            const lista = vacinasPorDia[dia] || []
            const ehHoje = dia === hojeNumero
            return (
              <div
                key={dia}
                className={`${styles.dia} ${ehHoje ? styles.diaHoje : ''} ${lista.length > 0 ? styles.diaComDose : ''}`}
              >
                <span className={styles.diaNumero}>{dia}</span>
                {lista.length > 0 && (
                  <div className={styles.bolinhas}>
                    {lista.slice(0, 3).map((v, idx) => (
                      <div key={idx} className={styles.bolinha} title={`${v.nome_animal || 'Animal'}: ${v.nome_vacina}`}>
                        {v.nome_vacina?.[0] || '?'}
                      </div>
                    ))}
                    {lista.length > 3 && <div className={styles.bolinha}>+{lista.length - 3}</div>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {Object.keys(vacinasPorDia).length > 0 && (
        <div className={styles.listaDoses}>
          <h4 className={styles.listaTitulo}>Próximas doses do mês</h4>
          {Object.entries(vacinasPorDia)
            .sort(([a], [b]) => Number(a) - Number(b))
            .flatMap(([dia, lista]) =>
              lista.map((v, idx) => (
                <div key={`${dia}-${idx}`} className={styles.doseItem}>
                  <span className={styles.doseDia}>{dia}</span>
                  <span className={styles.doseInfo}>
                    {v.nome_vacina} — {v.nome_animal || 'Animal'}
                  </span>
                </div>
              ))
            )}
        </div>
      )}
    </div>
  )
}

export default CalendarioVacinas
