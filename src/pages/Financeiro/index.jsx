import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAnimais } from '../../hooks/useAnimais'
import { useFinanceiroPropriedade } from '../../hooks/useFinanceiro'
import GraficoBarra from '../../components/GraficoBarra'
import PropertyNav from '../../components/PropertyNav/index.jsx'
import styles from './Financeiro.module.css'

function formatarData(data) {
  return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
}

function formatarMoeda(v) {
  const n = Number(v || 0)
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function PropertyNavWithRoute({ activeTab, setActiveTab, navigate, propriedadeId }) {
  return (
    <PropertyNav
      activeTab={activeTab}
      onNav={(tab) => {
        setActiveTab(tab)
        if (tab === 'inicio') navigate(`/propriedade/${propriedadeId}`)
        else if (tab === 'animais') navigate(`/propriedade/${propriedadeId}/animais`)
        else if (tab === 'reproducao') navigate(`/propriedade/${propriedadeId}/reproducao`)
        else if (tab === 'leite') navigate(`/propriedade/${propriedadeId}/producao-leite`)
        else if (tab === 'corte') navigate(`/propriedade/${propriedadeId}/corte`)
        else if (tab === 'financeiro') navigate(`/propriedade/${propriedadeId}/financeiro`)
      }}
    />
  )
}

const TABS = [
  { key: 'dashboard', label: 'Dashboard', path: '' },
  { key: 'listar', label: 'Listar', path: 'listar' },
  { key: 'por-animal', label: 'Por Animal', path: 'por-animal' },
]

// ─── Componente Principal — Dashboard Financeiro ───────────────────────────
export default function Financeiro() {
  const navigate = useNavigate()
  const { propriedadeId } = useParams()
  const { animais } = useAnimais(propriedadeId)
  const { transacoes, categorias, saldo, registrar, carregando, erro, carregar } = useFinanceiroPropriedade(propriedadeId)
  const [activeTab, setActiveTab] = useState('financeiro')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [erroForm, setErroForm] = useState('')
  const [salvando, setSalvando] = useState(false)

  // Form state
  const [tipo, setTipo] = useState('despesa')
  const [categoriaUuid, setCategoriaUuid] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [animalUuid, setAnimalUuid] = useState('')

  // Categorias filtradas pelo tipo selecionado
  const categoriasDoTipo = useMemo(() => {
    return (categorias || []).filter(c => c.tipo === tipo)
  }, [categorias, tipo])

  // When changing tipo, reset categoria if not in new tipo
  function trocarTipo(novoTipo) {
    setTipo(novoTipo)
    const aindaExiste = categorias.some(c => c.uuid === categoriaUuid && c.tipo === novoTipo)
    if (!aindaExiste) setCategoriaUuid('')
  }

  // Resumo do mês atual por categoria (top 6)
  const resumoMesAtual = useMemo(() => {
    if (!transacoes || transacoes.length === 0) return { receitas: [], despesas: [] }
    const agora = new Date()
    const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`
    const doMes = transacoes.filter(t => (t.data || '').startsWith(mesAtual))

    const porCat = {}
    for (const t of doMes) {
      const key = t.categoria_nome || 'Sem categoria'
      if (!porCat[key]) porCat[key] = { nome: key, tipo: t.tipo, total: 0 }
      porCat[key].total += Number(t.valor || 0)
    }
    const receitas = Object.values(porCat).filter(c => c.tipo === 'receita').sort((a, b) => b.total - a.total)
    const despesas = Object.values(porCat).filter(c => c.tipo === 'despesa').sort((a, b) => b.total - a.total)
    return { receitas, despesas }
  }, [transacoes])

  async function salvar(e) {
    e?.preventDefault()
    setErroForm('')
    setSucesso('')

    if (!categoriaUuid) {
      setErroForm('Selecione uma categoria')
      return
    }
    const valorNum = Number(String(valor).replace(',', '.'))
    if (!valorNum || valorNum <= 0) {
      setErroForm('Informe um valor válido')
      return
    }
    if (!data) {
      setErroForm('Informe a data')
      return
    }

    setSalvando(true)
    try {
      await registrar({
        propriedade_uuid: propriedadeId,
        animal_uuid: animalUuid || null,
        categoria_uuid: categoriaUuid,
        tipo,
        descricao: descricao.trim() || null,
        valor: valorNum,
        data,
      })
      // Reset form
      setDescricao('')
      setValor('')
      setAnimalUuid('')
      setMostrarForm(false)
      setSucesso(tipo === 'receita' ? 'Receita registrada' : 'Despesa registrada')
      setTimeout(() => setSucesso(''), 3000)
    } catch (err) {
      setErroForm(err.message || 'Erro ao registrar transação')
    } finally {
      setSalvando(false)
    }
  }

  // Determinar cor do card de saldo
  const saldoClasse = (saldo.saldo || 0) >= 0
    ? styles.saldoCardSaldoPositivo
    : styles.saldoCardSaldoNegativo
  const saldoValorClasse = (saldo.saldo || 0) >= 0
    ? styles.saldoValorPositivo
    : styles.saldoValorNegativo

  return (
    <div className={styles.container}>
      <header className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => navigate(`/propriedade/${propriedadeId}`)} aria-label="Voltar">←</button>
        <div>
          <div className={styles.pageTitle}>💰 Finanças</div>
          <div className={styles.pageSubtitle}>Fluxo de caixa e relatórios</div>
        </div>
      </header>

      <nav className={styles.financeiroTabs} aria-label="Seções de Finanças">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`${styles.financeiroTab} ${t.key === 'dashboard' ? styles.financeiroTabActive : ''}`}
            onClick={() => {
              if (t.key === 'dashboard') navigate(`/propriedade/${propriedadeId}/financeiro`)
              else navigate(`/propriedade/${propriedadeId}/financeiro/${t.path}`)
            }}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className={styles.inner}>
        {erro && <div className={styles.errorToast}>{erro}</div>}
        {sucesso && <div className={styles.successToast}>{sucesso}</div>}
        {carregando && <div className={styles.loadingMsg}>Carregando...</div>}

        {!carregando && !erro && (
          <>
            {/* ─── Cards de saldo ──────────────────────────────────────────── */}
            <div className={styles.saldoGrid}>
              <div className={styles.saldoCard}>
                <div className={styles.saldoLabel}>Receitas (total)</div>
                <div className={`${styles.saldoValor} ${styles.saldoValorPositivo}`}>
                  {formatarMoeda(saldo.receitas || 0)}
                </div>
                <div className={styles.saldoSub}>acumulado</div>
              </div>
              <div className={`${styles.saldoCard} ${styles.saldoCardDespesa}`}>
                <div className={styles.saldoLabel}>Despesas (total)</div>
                <div className={styles.saldoValor}>
                  {formatarMoeda(saldo.despesas || 0)}
                </div>
                <div className={styles.saldoSub}>acumulado</div>
              </div>
              <div className={`${styles.saldoCard} ${saldoClasse}`}>
                <div className={styles.saldoLabel}>Saldo atual</div>
                <div className={`${styles.saldoValor} ${saldoValorClasse}`}>
                  {formatarMoeda(saldo.saldo || 0)}
                </div>
                <div className={styles.saldoSub}>
                  {saldo.saldo >= 0 ? 'positivo' : 'negativo'}
                </div>
              </div>
            </div>

            {/* ─── Header com botão Nova ───────────────────────────────────── */}
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Transações</h2>
              {!mostrarForm && (
                <button className={styles.novaBtn} onClick={() => setMostrarForm(true)}>
                  + Nova transação
                </button>
              )}
            </div>

            {/* ─── Form Nova Transação ──────────────────────────────────────── */}
            {mostrarForm && (
              <div className={styles.sectionCard}>
                <h3 className={styles.sectionTitle} style={{ marginTop: 0 }}>Registrar transação</h3>
                {erroForm && <div className={styles.errorToast}>{erroForm}</div>}

                <div className={styles.tipoToggle}>
                  <button
                    type="button"
                    className={`${styles.tipoBtn} ${tipo === 'receita' ? styles.tipoBtnReceitaAtivo : ''}`}
                    onClick={() => trocarTipo('receita')}
                  >
                    ↑ Receita
                  </button>
                  <button
                    type="button"
                    className={`${styles.tipoBtn} ${tipo === 'despesa' ? styles.tipoBtnDespesaAtivo : ''}`}
                    onClick={() => trocarTipo('despesa')}
                  >
                    ↓ Despesa
                  </button>
                </div>

                <form onSubmit={salvar} className={styles.formGrid}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Categoria *</label>
                    <select
                      className={styles.formSelect}
                      value={categoriaUuid}
                      onChange={(e) => setCategoriaUuid(e.target.value)}
                      required
                    >
                      <option value="">Selecione...</option>
                      {categoriasDoTipo.map(c => (
                        <option key={c.uuid} value={c.uuid}>{c.rotulo}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Valor (R$) *</label>
                    <input
                      className={styles.formInput}
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Data *</label>
                    <input
                      className={styles.formInput}
                      type="date"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Animal (opcional)</label>
                    <select
                      className={styles.formSelect}
                      value={animalUuid}
                      onChange={(e) => setAnimalUuid(e.target.value)}
                    >
                      <option value="">Sem vínculo</option>
                      {animais.map(a => (
                        <option key={a.uuid} value={a.uuid}>{a.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <label className={styles.formLabel}>Descrição (opcional)</label>
                    <textarea
                      className={styles.formTextarea}
                      placeholder="Detalhes da transação..."
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                    />
                  </div>

                  <div className={styles.formFieldFull}>
                    <button className={styles.salvarBtn} type="submit" disabled={salvando}>
                      {salvando ? 'Salvando...' : 'Salvar transação'}
                    </button>
                    <button
                      className={styles.cancelarBtn}
                      type="button"
                      onClick={() => {
                        setMostrarForm(false)
                        setErroForm('')
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ─── Gráfico de despesas por categoria (mês atual) ─────────────── */}
            {resumoMesAtual.despesas.length > 0 && (
              <div className={styles.graficoWrapper}>
                <div className={styles.graficoTitle}>Despesas por categoria (mês atual)</div>
                <GraficoBarra dados={resumoMesAtual.despesas} cor="#e74c3c" />
                <div className={styles.categoriaLista}>
                  {resumoMesAtual.despesas.map(c => (
                    <div key={c.nome} className={styles.categoriaLinha}>
                      <span className={styles.categoriaNome}>{c.nome}</span>
                      <span className={`${styles.categoriaValor} ${styles.categoriaValorDespesa}`}>
                        {formatarMoeda(c.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Gráfico de receitas por categoria (mês atual) ─────────────── */}
            {resumoMesAtual.receitas.length > 0 && (
              <div className={styles.graficoWrapper}>
                <div className={styles.graficoTitle}>Receitas por categoria (mês atual)</div>
                <GraficoBarra dados={resumoMesAtual.receitas} cor="#82c341" />
                <div className={styles.categoriaLista}>
                  {resumoMesAtual.receitas.map(c => (
                    <div key={c.nome} className={styles.categoriaLinha}>
                      <span className={styles.categoriaNome}>{c.nome}</span>
                      <span className={styles.categoriaValor}>{formatarMoeda(c.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Empty state ──────────────────────────────────────────────── */}
            {!carregando && transacoes.length === 0 && !mostrarForm && (
              <div className={styles.emptyState}>
                Nenhuma transação registrada ainda. Toque em <strong>Nova transação</strong> para começar.
              </div>
            )}
          </>
        )}
      </main>

      <PropertyNavWithRoute
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        navigate={navigate}
        propriedadeId={propriedadeId}
      />
    </div>
  )
}
