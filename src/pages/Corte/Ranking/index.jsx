import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useRankingGmdAnimais } from '../../../hooks/usePesagemAnalise'
import SubpageLayout from '../_SubpageLayout'
import styles from '../Corte.module.css'

const PERIODOS = [
  { valor: 7, label: 'Últimos 7 dias' },
  { valor: 30, label: 'Últimos 30 dias' },
]

function gmdBadgeClass(gmd) {
  if (gmd == null) return styles.pctBadgeNeutro
  if (gmd >= 1.0) return styles.pctBadgePositivo
  if (gmd >= 0.5) return styles.pctBadgePositivo
  if (gmd >= 0.1) return styles.pctBadgeAmarelo
  if (gmd >= 0) return styles.pctBadgeNeutro
  return styles.pctBadgeVermelho
}

function formatarKg(v) {
  if (v == null) return '—'
  return `${v.toFixed(2)} kg`
}

function formatarGmd(v) {
  if (v == null) return '—'
  return `${v.toFixed(3)} kg/dia`
}

export default function CorteRanking() {
  const { propriedadeId } = useParams()
  const [dias, setDias] = useState(7)
  const { ranking, carregando, erro } = useRankingGmdAnimais(propriedadeId, dias)

  return (
    <SubpageLayout activeTab="ranking">
      <div className={styles.dataSelector}>
        <label className={styles.dataLabel}>Janela de análise</label>
        <select
          className={styles.dataInput}
          value={dias}
          onChange={(e) => setDias(Number(e.target.value))}
        >
          {PERIODOS.map(p => (
            <option key={p.valor} value={p.valor}>{p.label}</option>
          ))}
        </select>
      </div>

      {erro && <div className={styles.errorToast}>{erro}</div>}
      {carregando && <p className={styles.emptyState}>Carregando...</p>}

      {!carregando && ranking.length === 0 && !erro && (
        <div className={styles.emptyState}>
          Sem dados de pesagem suficientes (mínimo 2 pesagens por animal) no período selecionado.
        </div>
      )}

      {!carregando && ranking.length > 0 && (
        <table className={styles.tabelaComparativo}>
          <thead>
            <tr>
              <th>#</th>
              <th>Animal</th>
              <th>GMD</th>
              <th>Peso atual</th>
              <th>Peso anterior</th>
              <th>Ganho total</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((r, i) => (
              <tr key={r.uuid}>
                <td>{i + 1}</td>
                <td>
                  <div className={styles.cellNome}>{r.nome}</div>
                  {r.id_fisico && <div className={styles.cellSub}>{r.id_fisico}</div>}
                </td>
                <td>
                  <span className={`${styles.pctBadge} ${gmdBadgeClass(r.gmd)}`}>
                    {formatarGmd(r.gmd)}
                  </span>
                </td>
                <td>{formatarKg(r.peso_atual)}</td>
                <td>{formatarKg(r.peso_anterior)}</td>
                <td>{formatarKg(r.total_ganho)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </SubpageLayout>
  )
}
