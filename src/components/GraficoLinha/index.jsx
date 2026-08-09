import styles from './GraficoLinha.module.css'

// Componente SVG artesanal — sem dependências externas
// Props:
//   data: [{dia: 'YYYY-MM-DD', valor: number}]
//   width?: number (default 600) — largura do viewBox
//   height?: number (default 220) — altura do viewBox
//   cor?: string (default '#c8a97e') — cor da linha
//   unidade?: string (default 'L') — rótulo do eixo y
// Comportamento:
//   - Escala linear min..max do valor
//   - polyline ligando pontos
//   - rótulos: primeiro dia (esq) + último dia (dir), mín (embaixo) + máx (topo)
//   - empty state quando data.length < 2
//   - sem animação, sem hover, sem tooltip
export default function GraficoLinha({
  data = [],
  width = 600,
  height = 220,
  cor = '#c8a97e',
  unidade = 'L',
}) {
  if (!data || data.length < 2) {
    return <p className={styles.empty}>Dados insuficientes para o gráfico</p>
  }

  const padLeft = 48
  const padRight = 16
  const padTop = 24
  const padBottom = 32
  const plotW = width - padLeft - padRight
  const plotH = height - padTop - padBottom

  const valores = data.map(d => d.valor)
  const minV = Math.min(...valores)
  const maxV = Math.max(...valores)
  const range = maxV - minV || 1 // evita divisão por 0
  const minDisplay = minV < 0 ? minV : 0 // eixo y partir de 0 quando valores positivos

  const normalize = (v) => {
    const norm = (v - minDisplay) / (maxV - minDisplay || 1)
    return padTop + plotH - norm * plotH
  }

  // Coordenadas dos pontos normalizados
  const pontos = data.map((d, i) => {
    const x = padLeft + (i / (data.length - 1)) * plotW
    const y = normalize(d.valor)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  const primeiroDia = data[0].dia
  const ultimoDia = data[data.length - 1].dia

  const ariaLabel = `Gráfico de ${unidade} por dia. Primeiro registro ${primeiroDia} valor ${minV}. Último registro ${ultimoDia} valor ${maxV}.`

  return (
    <div className={styles.wrapper} role="img" aria-label={ariaLabel}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" preserveAspectRatio="xMidYMid meet">
        {/* Eixo y */}
        <line
          x1={padLeft} y1={padTop}
          x2={padLeft} y2={padTop + plotH}
          stroke="#9b92b8" strokeWidth={1}
        />
        {/* Eixo x */}
        <line
          x1={padLeft} y1={padTop + plotH}
          x2={width - padRight} y2={padTop + plotH}
          stroke="#9b92b8" strokeWidth={1}
        />

        {/* Rótulos y: máx (topo) e mín (embaixo) */}
        <text
          x={padLeft - 6} y={padTop + 4}
          textAnchor="end" className={styles.axisLabel}
        >
          {maxV.toFixed(1)}
        </text>
        <text
          x={padLeft - 6} y={padTop + plotH}
          textAnchor="end" className={styles.axisLabel}
        >
          {minDisplay.toFixed(1)}
        </text>
        <text
          x={padLeft - 6} y={padTop - 8}
          textAnchor="end" className={styles.unitLabel}
        >
          {unidade}
        </text>

        {/* Polyline */}
        <polyline
          points={pontos}
          fill="none"
          stroke={cor}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Marcadores primeiro e último dia */}
        <text
          x={padLeft} y={padTop + plotH + 18}
          textAnchor="start" className={styles.axisLabel}
        >
          {primeiroDia}
        </text>
        <text
          x={width - padRight} y={padTop + plotH + 18}
          textAnchor="end" className={styles.axisLabel}
        >
          {ultimoDia}
        </text>
      </svg>
    </div>
  )
}
