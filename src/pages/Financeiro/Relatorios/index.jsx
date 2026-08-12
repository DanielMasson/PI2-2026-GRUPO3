import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import * as financeiroService from '../../../services/financeiroService'
import { useLucratividade } from '../../../hooks/useFinanceiro'
import SubpageLayout from '../_SubpageLayout'
import styles from '../Financeiro.module.css'

const PERIODO_OPCOES = [
  { key: '3', label: '3 meses', meses: 3 },
  { key: '6', label: '6 meses', meses: 6 },
  { key: '12', label: '12 meses', meses: 12 },
]

function formatarMes(mesStr) {
  if (!mesStr) return ''
  const [ano, mes] = mesStr.split('-')
  const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${nomes[Number(mes) - 1]}/${ano.slice(2)}`
}

function formatarMoeda(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function GraficoSerieMensual({ dados }) {
  if (!dados || dados.length < 2) {
    return <p style={{ color: '#9b92b8', textAlign: 'center', padding: 16 }}>Dados insuficientes para o gráfico</p>
  }

  const width = 600
  const height = 240
  const padLeft = 56
  const padRight = 16
  const padTop = 24
  const padBottom = 40
  const plotW = width - padLeft - padRight
  const plotH = height - padTop - padBottom

  const todosValores = dados.flatMap(d => [d.receitas, d.despesas])
  const maxV = Math.max(...todosValores, 1)

  const normalize = (v) => {
    const norm = v / maxV
    return padTop + plotH - norm * plotH
  }

  const stepX = plotW / (dados.length - 1)

  const pontosReceitas = dados.map((d, i) => {
    const x = padLeft + i * stepX
    const y = normalize(d.receitas)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  const pontosDespesas = dados.map((d, i) => {
    const x = padLeft + i * stepX
    const y = normalize(d.despesas)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  const pontosSaldo = dados.map((d, i) => {
    const x = padLeft + i * stepX
    const y = normalize(d.saldo >= 0 ? d.saldo : 0)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = padTop + plotH - pct * plotH
          const valor = maxV * pct
          return (
            <g key={i}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              <text x={padLeft - 6} y={y + 4} textAnchor="end" fill="#9b92b8" fontSize={10}>
                {valor >= 1000 ? `${(valor / 1000).toFixed(0)}k` : valor.toFixed(0)}
              </text>
            </g>
          )
        })}

        {/* Eixos */}
        <line x1={padLeft} y1={padTop} x2={padLeft} y2={padTop + plotH} stroke="#9b92b8" strokeWidth={1} />
        <line x1={padLeft} y1={padTop + plotH} x2={width - padRight} y2={padTop + plotH} stroke="#9b92b8" strokeWidth={1} />

        {/* Linha de receitas */}
        <polyline points={pontosReceitas} fill="none" stroke="#82c341" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {/* Linha de despesas */}
        <polyline points={pontosDespesas} fill="none" stroke="#e74c3c" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {/* Linha de saldo */}
        <polyline points={pontosSaldo} fill="none" stroke="#c8a97e" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" strokeDasharray="6 3" />

        {/* Marcadores de meses */}
        {dados.map((d, i) => {
          const x = padLeft + i * stepX
          return (
            <text key={i} x={x} y={padTop + plotH + 18} textAnchor="middle" fill="#9b92b8" fontSize={10}>
              {formatarMes(d.mes)}
            </text>
          )
        })}
      </svg>

      {/* Legenda */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 16, height: 3, backgroundColor: '#82c341', display: 'inline-block', borderRadius: 2 }} />
          <span style={{ fontSize: 12, color: '#9b92b8' }}>Receitas</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 16, height: 3, backgroundColor: '#e74c3c', display: 'inline-block', borderRadius: 2 }} />
          <span style={{ fontSize: 12, color: '#9b92b8' }}>Despesas</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 16, height: 3, backgroundColor: '#c8a97e', display: 'inline-block', borderRadius: 2, borderTop: '1px dashed #c8a97e' }} />
          <span style={{ fontSize: 12, color: '#9b92b8' }}>Saldo</span>
        </div>
      </div>
    </div>
  )
}

export default function FinanceiroRelatorios() {
  const { propriedadeId } = useParams()
  const [periodoKey, setPeriodoKey] = useState('6')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [usarPeriodoCustom, setUsarPeriodoCustom] = useState(false)

  const [serieMensal, setSerieMensal] = useState([])
  const [resumoCategoria, setResumoCategoria] = useState([])
  const [saldo, setSaldo] = useState({ receitas: 0, despesas: 0, saldo: 0 })
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [cotacaoKg, setCotacaoKg] = useState('')
  const { lucratividade, carregando: carregandoLucratividade } = useLucratividade(propriedadeId, Number(cotacaoKg) || 0)

  const meses = PERIODO_OPCOES.find(p => p.key === periodoKey)?.meses || 6

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      let inicio = dataInicio
      let fim = dataFim

      if (!usarPeriodoCustom) {
        const agora = new Date()
        fim = agora.toISOString().split('T')[0]
        const dInicio = new Date(agora.getFullYear(), agora.getMonth() - (meses - 1), 1)
        inicio = dInicio.toISOString().split('T')[0]
      }

      const [s, c, sal] = await Promise.all([
        financeiroService.serieMensal(propriedadeId, meses),
        financeiroService.resumoPorCategoria(propriedadeId, inicio || undefined, fim || undefined),
        financeiroService.resumoPropriedade(propriedadeId),
      ])
      setSerieMensal(s || [])
      setResumoCategoria(c || [])
      setSaldo(sal)
    } catch (e) {
      setErro(e?.message || 'Erro ao carregar relatórios')
    } finally {
      setCarregando(false)
    }
  }, [propriedadeId, meses, dataInicio, dataFim, usarPeriodoCustom])

  useEffect(() => { carregar() }, [carregar])

  const resumoReceitas = useMemo(() =>
    resumoCategoria.filter(c => c.tipo === 'receita').sort((a, b) => b.total - a.total),
  [resumoCategoria])

  const resumoDespesas = useMemo(() =>
    resumoCategoria.filter(c => c.tipo === 'despesa').sort((a, b) => b.total - a.total),
  [resumoCategoria])

  const totalReceitasPeriodo = resumoReceitas.reduce((s, c) => s + (c.total || 0), 0)
  const totalDespesasPeriodo = resumoDespesas.reduce((s, c) => s + (c.total || 0), 0)

  return (
    <SubpageLayout activeTab="relatorios">
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.sectionTitle}>Relatórios</div>
          <div className={styles.pageSubtitle}>Análise temporal e por categoria</div>
        </div>
      </div>

      {/* Seletor de período */}
      <div className={styles.filtrosCard}>
        <div className={styles.filtroField}>
          <label className={styles.formLabel}>Período</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PERIODO_OPCOES.map(p => (
              <button
                key={p.key}
                type="button"
                className={`${styles.tipoBtn} ${periodoKey === p.key && !usarPeriodoCustom ? styles.tipoBtnReceitaAtivo : ''}`}
                onClick={() => { setPeriodoKey(p.key); setUsarPeriodoCustom(false) }}
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              className={`${styles.tipoBtn} ${usarPeriodoCustom ? styles.tipoBtnDespesaAtivo : ''}`}
              onClick={() => setUsarPeriodoCustom(true)}
            >
              Personalizado
            </button>
          </div>
        </div>

        {usarPeriodoCustom && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <div className={styles.filtroField}>
              <label className={styles.formLabel}>Data início</label>
              <input type="date" className={styles.formInput} value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
            </div>
            <div className={styles.filtroField}>
              <label className={styles.formLabel}>Data fim</label>
              <input type="date" className={styles.formInput} value={dataFim} onChange={e => setDataFim(e.target.value)} />
            </div>
          </div>
        )}

        {/* Cotação para cálculo de lucratividade */}
        <div className={styles.filtroField} style={{ marginTop: 8 }}>
          <label className={styles.formLabel}>Cotação R$/kg (para lucratividade)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className={styles.formInput}
            placeholder="Ex: 28.50"
            value={cotacaoKg}
            onChange={e => setCotacaoKg(e.target.value)}
            style={{ maxWidth: 150 }}
          />
        </div>
      </div>

      {erro && <div className={styles.errorToast}>{erro}</div>}

      {carregando ? (
        <div className={styles.loadingMsg}>Carregando relatórios…</div>
      ) : (
        <>
          {/* Cards de saldo */}
          <div className={styles.saldoGrid}>
            <div className={styles.saldoCard}>
              <div className={styles.saldoLabel}>Receitas (período)</div>
              <div className={`${styles.saldoValor} ${styles.saldoValorPositivo}`}>
                {formatarMoeda(totalReceitasPeriodo)}
              </div>
            </div>
            <div className={`${styles.saldoCard} ${styles.saldoCardDespesa}`}>
              <div className={styles.saldoLabel}>Despesas (período)</div>
              <div className={styles.saldoValorNegativo}>
                {formatarMoeda(totalDespesasPeriodo)}
              </div>
            </div>
            <div className={`${styles.saldoCard} ${(totalReceitasPeriodo - totalDespesasPeriodo) >= 0 ? styles.saldoCardSaldoPositivo : styles.saldoCardSaldoNegativo}`}>
              <div className={styles.saldoLabel}>Saldo do período</div>
              <div className={`${styles.saldoValor} ${(totalReceitasPeriodo - totalDespesasPeriodo) >= 0 ? styles.saldoValorPositivo : styles.saldoValorNegativo}`}>
                {formatarMoeda(totalReceitasPeriodo - totalDespesasPeriodo)}
              </div>
            </div>
          </div>

          {/* Gráfico de série temporal */}
          <div className={styles.graficoWrapper}>
            <div className={styles.graficoTitle}>Evolução mensal — Receitas vs Despesas</div>
            <GraficoSerieMensual dados={serieMensal} />
          </div>

          {/* Resumo por categoria — Receitas */}
          {resumoReceitas.length > 0 && (
            <div className={styles.graficoWrapper}>
              <div className={styles.graficoTitle}>Receitas por categoria</div>
              <div className={styles.categoriaLista}>
                {resumoReceitas.map(c => (
                  <div key={c.categoria_uuid} className={styles.categoriaLinha}>
                    <span className={styles.categoriaNome}>{c.rotulo || c.categoria}</span>
                    <span className={styles.categoriaValor}>{formatarMoeda(c.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumo por categoria — Despesas */}
          {resumoDespesas.length > 0 && (
            <div className={styles.graficoWrapper}>
              <div className={styles.graficoTitle}>Despesas por categoria</div>
              <div className={styles.categoriaLista}>
                {resumoDespesas.map(c => (
                  <div key={c.categoria_uuid} className={styles.categoriaLinha}>
                    <span className={styles.categoriaNome}>{c.rotulo || c.categoria}</span>
                    <span className={`${styles.categoriaValor} ${styles.categoriaValorDespesa}`}>{formatarMoeda(c.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumo geral */}
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle} style={{ marginTop: 0 }}>Resumo geral</h3>
            <div className={styles.categoriaLista}>
              <div className={styles.categoriaLinha}>
                <span className={styles.categoriaNome}>Saldo acumulado</span>
                <span className={`${styles.categoriaValor} ${saldo.saldo >= 0 ? styles.saldoValorPositivo : styles.saldoValorNegativo}`}>
                  {formatarMoeda(saldo.saldo)}
                </span>
              </div>
              <div className={styles.categoriaLinha}>
                <span className={styles.categoriaNome}>Total receitas (geral)</span>
                <span className={styles.categoriaValor}>{formatarMoeda(saldo.receitas)}</span>
              </div>
              <div className={styles.categoriaLinha}>
                <span className={styles.categoriaNome}>Total despesas (geral)</span>
                <span className={`${styles.categoriaValor} ${styles.categoriaValorDespesa}`}>{formatarMoeda(saldo.despesas)}</span>
              </div>
            </div>
          </div>

          {/* Custo Acumulado e Lucratividade (RF08) */}
          {!carregandoLucratividade && lucratividade.length > 0 && cotacaoKg && (
            <div className={styles.sectionCard}>
              <h3 className={styles.sectionTitle} style={{ marginTop: 0 }}>Custo Acumulado e Lucratividade</h3>
              <div className={styles.categoriaLista}>
                {lucratividade.map(l => (
                  <div key={l.animal_uuid} className={styles.categoriaLinha}>
                    <span className={styles.categoriaNome}>
                      {l.nome || l.id_fisico}
                      {l.status_lucratividade === 'lucro' && <span style={{ color: '#66bb6a', marginLeft: 6 }}>●</span>}
                      {l.status_lucratividade === 'prejuizo' && <span style={{ color: '#e57373', marginLeft: 6 }}>●</span>}
                      {l.status_lucratividade === 'empate' && <span style={{ color: '#ffb74d', marginLeft: 6 }}>●</span>}
                    </span>
                    <span className={`${styles.categoriaValor} ${l.lucro >= 0 ? styles.saldoValorPositivo : styles.saldoValorNegativo}`}>
                      {formatarMoeda(l.lucro)}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#9b92b8' }}>
                ● Verde = lucro · ● Vermelho = prejuízo · ● Amarelo = empate
              </div>
            </div>
          )}
        </>
      )}
    </SubpageLayout>
  )
}
