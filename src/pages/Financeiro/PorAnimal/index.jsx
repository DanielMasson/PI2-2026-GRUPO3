import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import * as financeiroService from '../../../services/financeiroService'
import { useFinanceiroAnimal, useLucratividade } from '../../../hooks/useFinanceiro'
import SubpageLayout from '../_SubpageLayout'
import styles from '../Financeiro.module.css'

// Subrota /financeiro/por-animal — Ranking de saldo por animal (receitas -
// despesas) com filtros de período e drill-down expansível que mostra as
// transações individuais do animal. Espelha pattern Corte.Ranking.
export default function FinanceiroPorAnimal() {
  const { propriedadeId } = useParams()
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [aplicados, setAplicados] = useState({ dataInicio: '', dataFim: '' })
  const [ranking, setRanking] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [expandido, setExpandido] = useState(null) // animal_uuid | null
  const [cotacaoKg, setCotacaoKg] = useState('')
  const { lucratividade, carregando: carregandoLucratividade } = useLucratividade(propriedadeId, Number(cotacaoKg) || 0)

  async function carregar() {
    setCarregando(true)
    setErro(null)
    try {
      const dados = await financeiroService.resumoPorAnimal(
        propriedadeId,
        aplicados.dataInicio || undefined,
        aplicados.dataFim || undefined,
      )
      setRanking(dados)
    } catch (e) {
      setErro(e?.message || 'Falha ao carregar ranking por animal.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aplicados.dataInicio, aplicados.dataFim, propriedadeId])

  function handleAplicar(e) {
    e.preventDefault()
    setAplicados({ dataInicio, dataFim })
    setExpandido(null)
  }

  function handleLimpar() {
    setDataInicio('')
    setDataFim('')
    setAplicados({ dataInicio: '', dataFim: '' })
    setExpandido(null)
  }

  function toggleExpand(uuid) {
    setExpandido(prev => (prev === uuid ? null : uuid))
  }

  const totalReceitas = ranking.reduce((s, r) => s + (r.receitas || 0), 0)
  const totalDespesas = ranking.reduce((s, r) => s + (r.despesas || 0), 0)
  const totalSaldo = totalReceitas - totalDespesas

  function formatarValor(v) {
    return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <SubpageLayout activeTab="por-animal">
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.sectionTitle}>Por Animal</div>
          <div className={styles.pageSubtitle}>
            {ranking.length} animai{ranking.length !== 1 ? 's' : ''} com transação no período
          </div>
        </div>
      </div>

      <form className={styles.filtrosCard} onSubmit={handleAplicar}>
        <div className={styles.filtroField}>
          <label className={styles.formLabel} htmlFor="pa-data-inicio">Data início</label>
          <input
            id="pa-data-inicio"
            type="date"
            className={styles.formInput}
            value={dataInicio}
            onChange={e => setDataInicio(e.target.value)}
          />
        </div>
        <div className={styles.filtroField}>
          <label className={styles.formLabel} htmlFor="pa-data-fim">Data fim</label>
          <input
            id="pa-data-fim"
            type="date"
            className={styles.formInput}
            value={dataFim}
            onChange={e => setDataFim(e.target.value)}
          />
        </div>
        <div className={styles.filtroField}>
          <label className={styles.formLabel} htmlFor="pa-cotacao">Cotação R$/kg</label>
          <input
            id="pa-cotacao"
            type="number"
            step="0.01"
            min="0"
            className={styles.formInput}
            placeholder="Opcional"
            value={cotacaoKg}
            onChange={e => setCotacaoKg(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <button type="submit" className={styles.salvarBtn}>Aplicar</button>
          {(aplicados.dataInicio || aplicados.dataFim) && (
            <button type="button" className={styles.cancelarBtn} onClick={handleLimpar}>
              Limpar
            </button>
          )}
        </div>
      </form>

      {ranking.length > 0 && (
        <div className={styles.saldoGrid}>
          <div className={styles.saldoCard}>
            <div className={styles.saldoLabel}>Total Receitas</div>
            <div className={`${styles.saldoValor} ${styles.saldoValorPositivo}`}>
              {formatarValor(totalReceitas)}
            </div>
          </div>
          <div className={`${styles.saldoCard} ${styles.saldoCardDespesa}`}>
            <div className={styles.saldoLabel}>Total Despesas</div>
            <div className={styles.saldoValorNegativo}>
              {formatarValor(totalDespesas)}
            </div>
          </div>
          <div className={`${styles.saldoCard} ${totalSaldo >= 0 ? styles.saldoCardSaldoPositivo : styles.saldoCardSaldoNegativo}`}>
            <div className={styles.saldoLabel}>Saldo do período</div>
            <div className={`${styles.saldoValor} ${totalSaldo >= 0 ? styles.saldoValorPositivo : styles.saldoValorNegativo}`}>
              {formatarValor(totalSaldo)}
            </div>
          </div>
        </div>
      )}

      {erro && <div className={styles.errorToast}>{erro}</div>}

      {/* Indicadores de Lucratividade (RF08) */}
      {!carregandoLucratividade && lucratividade.length > 0 && cotacaoKg && (
        <div className={styles.lucratividadeSection}>
          <div className={styles.sectionTitleSmall}>Indicadores de Lucratividade</div>
          <div className={styles.lucratividadeGrid}>
            {lucratividade.slice(0, 5).map(l => (
              <div key={l.animal_uuid} className={`${styles.lucratividadeCard} ${l.status_lucratividade === 'lucro' ? styles.lucroCard : l.status_lucratividade === 'prejuizo' ? styles.prejuizoCard : styles.empateCard}`}>
                <div className={styles.lucratividadeNome}>{l.nome || l.id_fisico}</div>
                <div className={styles.lucratividadeValor}>
                  {Number(l.lucro).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <div className={styles.lucratividadeDetalhe}>
                  Custo: {formatarValor(l.custo_acumulado)} · Mercado: {formatarValor(l.valor_mercado)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {carregando ? (
        <div className={styles.loadingMsg}>Carregando ranking…</div>
      ) : ranking.length === 0 ? (
        <div className={styles.emptyState}>
          Nenhum animal com transação {(aplicados.dataInicio || aplicados.dataFim) ? 'no período selecionado.' : 'registrada ainda.'}
        </div>
      ) : (
        <div className={styles.rankingLista}>
          {ranking.map(r => (
            <RankingCard
              key={r.animal_uuid}
              animal={r}
              expandido={expandido === r.animal_uuid}
              onToggle={() => toggleExpand(r.animal_uuid)}
            />
          ))}
        </div>
      )}
    </SubpageLayout>
  )
}

function RankingCard({ animal, expandido, onToggle }) {
  const { transacoes, carregando, erro } = useFinanceiroAnimal(
    expandido ? animal.animal_uuid : null,
  )

  const saldo = animal.saldo || 0
  const cardClass =
    saldo < 0
      ? `${styles.rankingCard} ${styles.rankingCardNegativo}`
      : saldo === 0
        ? `${styles.rankingCard} ${styles.rankingCardNeutro}`
        : styles.rankingCard

  function formatarData(d) {
    if (!d) return '—'
    const [ano, mes, dia] = d.split('-')
    return `${dia}/${mes}/${ano}`
  }
  function formatarValor(v) {
    return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <div className={cardClass}>
      <button className={styles.rankingHeader} onClick={onToggle} type="button">
        <div className={styles.rankingInfo}>
          <div className={styles.rankingNome}>{animal.nome || 'Sem nome'}</div>
          <div className={styles.rankingMeta}>
            {animal.id_fisico ? `ID: ${animal.id_fisico}` : 'Sem ID físico'}
          </div>
        </div>
        <div className={styles.rankingStats}>
          <div className={styles.rankingStat}>
            <div className={styles.rankingStatLabel}>Receitas</div>
            <div className={`${styles.rankingStatValor} ${styles.rankingStatValorPositivo}`}>
              {formatarValor(animal.receitas)}
            </div>
          </div>
          <div className={styles.rankingStat}>
            <div className={styles.rankingStatLabel}>Despesas</div>
            <div className={`${styles.rankingStatValor} ${styles.rankingStatValorNegativo}`}>
              {formatarValor(animal.despesas)}
            </div>
          </div>
          <div className={styles.rankingStat}>
            <div className={styles.rankingStatLabel}>Saldo</div>
            <div className={`${styles.rankingStatValor} ${saldo >= 0 ? styles.rankingStatValorPositivo : styles.rankingStatValorNegativo}`}>
              {formatarValor(saldo)}
            </div>
          </div>
        </div>
        <span className={`${styles.chevron} ${expandido ? styles.chevronAberto : ''}`} aria-hidden>▾</span>
      </button>

      {expandido && (
        <div className={styles.rankingDetalhes}>
          {carregando ? (
            <div className={styles.loadingMsg}>Carregando transações…</div>
          ) : erro ? (
            <div className={styles.errorToast}>{erro}</div>
          ) : transacoes.length === 0 ? (
            <div className={styles.emptyState}>Sem transações para este animal.</div>
          ) : (
            <div className={styles.rankingDetalhesLista}>
              {transacoes.map(t => (
                <div key={t.uuid} className={styles.detalheLinha}>
                  <span className={styles.detalheData}>{formatarData(t.data)}</span>
                  <span className={styles.detalheDesc}>{t.descricao || '—'}</span>
                  {t.categoria_nome && (
                    <span className={styles.detalheCat}>{t.categoria_nome}</span>
                  )}
                  <span className={`${styles.detalheValor} ${t.tipo === 'receita' ? styles.rankingStatValorPositivo : styles.rankingStatValorNegativo}`}>
                    {t.tipo === 'receita' ? '+' : '−'} {formatarValor(t.valor)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
