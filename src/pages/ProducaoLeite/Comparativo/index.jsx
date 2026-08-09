import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useComparativoAnimais } from '../../../hooks/useProducaoLeiteAnalise'
import SubpageLayout from '../_SubpageLayout'
import styles from '../ProducaoLeite.module.css'

const PERIODOS = [
  { valor: 7, label: 'Últimos 7 dias' },
  { valor: 30, label: 'Últimos 30 dias' },
]

function badgeClass(pct) {
  if (pct == null) return styles.pctBadgeNeutro
  if (pct > 0) return styles.pctBadgePositivo
  if (pct >= -10) return styles.pctBadgeNeutro
  if (pct >= -20) return styles.pctBadgeAmarelo
  if (pct >= -30) return styles.pctBadgeLaranja
  return styles.pctBadgeVermelho
}

function formatarPct(pct) {
  if (pct == null) return '—'
  const sinal = pct > 0 ? '+' : ''
  return `${sinal}${pct.toFixed(1)}%`
}

function formatarLitros(v) {
  if (v == null) return '—'
  return `${v.toFixed(1)} L`
}

export default function ProducaoLeiteComparativo() {
  const { propriedadeId } = useParams()
  const [dias, setDias] = useState(7)
  const { ranking, carregando, erro } = useComparativoAnimais(propriedadeId, dias)

  return (
    <SubpageLayout activeTab="comparativo">
      <div className={styles.dataSelector}>
        <label className={styles.dataLabel}>Período de comparação</label>
        <select
          className={styles.dataInput}
          value={dias}
          onChange={(e) => setDias(Number(e.target.value))}
        >
          {PERIODOS.map(p => (
            <option key={p.valor} value={p.valor}>{p.label} vs {p.valor * 2} dias anteriores</option>
          ))}
        </select>
      </div>

      {erro && <div className={styles.errorToast}>{erro}</div>}
      {carregando && <p className={styles.emptyState}>Carregando...</p>}

      {!carregando && ranking.length === 0 && !erro && (
        <div className={styles.emptyState}>
          Sem dados de produção no período selecionado.
        </div>
      )}

      {!carregando && ranking.length > 0 && (
        <table className={styles.tabelaComparativo}>
          <thead>
            <tr>
              <th>#</th>
              <th>Animal</th>
              <th>Total atual</th>
              <th>Total anterior</th>
              <th>Variação</th>
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
                <td>{formatarLitros(r.total_recente)}</td>
                <td>{formatarLitros(r.total_anterior)}</td>
                <td>
                  <span className={`${styles.pctBadge} ${badgeClass(r.pct)}`}>
                    {formatarPct(r.pct)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </SubpageLayout>
  )
}
