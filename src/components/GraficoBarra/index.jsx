import styles from './GraficoBarra.module.css'

// Componente SVG artesanal — barras verticais — sem dependências externas.
// Props:
//   data: [{ rotulo: string, valor: number }]
//   width?: number (default 600) — largura do viewBox
//   height?: number (default 240) — altura do viewBox
//   cor?: string (default '#c8a97e') — cor das barras
//   corNegativa?: string (default '#e74c3c') — cor quando valor < 0
//   unidade?: string (default 'R$') — rótulo do eixo y
// Comportamento:
//   - Eixo y simétrico passando por 0 (suporta valores negativos)
//   - Barras proporcionais à amplitude absoluta
//   - Rótulo de cada category name embaixo de cada barra
//   - Rótulos de máx (topo) e mín (embaixo) no eixo y
//   - empty state quando data.length === 0
export default function GraficoBarra({
  data = [],
  width = 600,
  height = 240,
  cor = '#c8a97e',
  corNegativa = '#e74c3c',
  unidade = 'R$',
}) {
  if (!data || data.length === 0) {
    return <p className={styles.empty}>Sem dados para exibir o gráfico</p>
  }

  const padLeft = 56
  const padRight = 16
  const padTop = 24
  const padBottom = 40
  const plotW = width - padLeft - padRight
  const plotH = height - padTop - padBottom

  const valores = data.map(d => d.valor)
  const maxV = Math.max(0, ...valores)
  const minV = Math.min(0, ...valores)
  const amplitude = maxV - minV || 1 // evita divisão por 0

  // Posição y do zero (referência das barras)
  const yZero = padTop + plotH - (maxV / amplitude) * plotH

  // Largura de cada barra — gap de 20% entre barras
  const n = data.length
  const slotW = plotW / n
  const barW = Math.max(8, slotW * 0.7)

  const normalizeTopZero = (v) => {
    // Para v >= 0: top da barra em yZero, altura = (v / amplitude) * plotH
    // Para v < 0: top da barra em yZero, altura = (|v| / amplitude) * plotH
    if (v >= 0) {
      const topY = yZero - (v / amplitude) * plotH
      const heightPx = yZero - topY
      return { y: topY, height: Math.max(0, heightPx) }
    }
    const heightPx = (Math.abs(v) / amplitude) * plotH
    return { y: yZero, height: Math.max(0, heightPx) }
  }

  // Formata rótulos y
  const fmtLabel = (v) => {
    if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}k`
    return v.toFixed(0)
  }

  const ariaLabel = `Gráfico de barras de ${unidade} por categoria. ` +
    `Maior valor ${maxV.toFixed(2)}, menor ${minV.toFixed(2)}. ${n} categorias.`

  return (
    <div className={styles.wrapper} role="img" aria-label={ariaLabel}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" preserveAspectRatio="xMidYMid meet">
        {/* Eixo y simétrico — linha horizontal do zero */}
        <line
          x1={padLeft} y1={yZero}
          x2={width - padRight} y2={yZero}
          stroke="#9b92b8" strokeWidth={1}
        />
        {/* Eixo y vertical */}
        <line
          x1={padLeft} y1={padTop}
          x2={padLeft} y2={padTop + plotH}
          stroke="#9b92b8" strokeWidth={1}
        />

        {/* Rótulos y: máx (topo) e mín (embaixo) */}
        <text
          x={padLeft - 6} y={padTop + 4}
          textAnchor="end" className={styles.axisLabel}
        >
          {fmtLabel(maxV)}
        </text>
        <text
          x={padLeft - 6} y={padTop + plotH}
          textAnchor="end" className={styles.axisLabel}
        >
          {fmtLabel(minV)}
        </text>
        <text
          x={padLeft - 6} y={padTop - 8}
          textAnchor="end" className={styles.unitLabel}
        >
          {unidade}
        </text>

        {/* Barras + rótulos x */}
        {data.map((d, i) => {
          const { y, height } = normalizeTopZero(d.valor)
          const x = padLeft + slotW * i + (slotW - barW) / 2
          const fill = d.valor < 0 ? corNegativa : cor
          // Rotaciona o rótulo do eixo x quando há muitas barras (evita sobreposição)
          const rotate = n > 4 || d.rotulo.length > 8
          const labelX = x + barW / 2
          const labelY = padTop + plotH + 8
          const transform = rotate
            ? `rotate(-35 ${labelX} ${labelY})`
            : ''
          return (
            <g key={i}>
              <rect
                x={x} y={y}
                width={barW} height={height}
                fill={fill}
                opacity={0.85}
              />
              <text
                x={labelX} y={labelY}
                textAnchor={rotate ? 'end' : 'middle'}
                className={styles.axisLabel}
                transform={transform}
              >
                {d.rotulo}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
