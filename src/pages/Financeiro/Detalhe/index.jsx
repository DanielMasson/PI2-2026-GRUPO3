import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAnimais } from '../../../hooks/useAnimais'
import { useTransacao } from '../../../hooks/useFinanceiro'
import SubpageLayout from '../_SubpageLayout'
import styles from '../Financeiro.module.css'

function formatarDataParaInput(d) {
  if (!d) return ''
  return d.length > 10 ? d.slice(0, 10) : d
}

export default function FinanceiroDetalhe() {
  const { propriedadeId, transacaoId } = useParams()
  const navigate = useNavigate()
  const { animais } = useAnimais(propriedadeId)
  const { transacao, categorias, carregando, erro, atualizar } = useTransacao(transacaoId)

  const [tipo, setTipo] = useState('')
  const [categoriaUuid, setCategoriaUuid] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState('')
  const [animalUuid, setAnimalUuid] = useState('')
  const [inicializado, setInicializado] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [erroForm, setErroForm] = useState('')

  useEffect(() => {
    if (transacao && !inicializado) {
      setTipo(transacao.tipo || 'despesa')
      setCategoriaUuid(transacao.categoria_uuid || '')
      setDescricao(transacao.descricao || '')
      setValor(String(transacao.valor || ''))
      setData(formatarDataParaInput(transacao.data))
      setAnimalUuid(transacao.animal_uuid || '')
      setInicializado(true)
    }
  }, [transacao, inicializado])

  const categoriasDoTipo = useMemo(() => {
    return (categorias || []).filter(c => c.tipo === tipo)
  }, [categorias, tipo])

  function trocarTipo(novoTipo) {
    setTipo(novoTipo)
    const aindaExiste = categorias.some(c => c.uuid === categoriaUuid && c.tipo === novoTipo)
    if (!aindaExiste) setCategoriaUuid('')
  }

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
      await atualizar({
        tipo,
        categoria_uuid: categoriaUuid,
        descricao: descricao.trim() || null,
        valor: valorNum,
        data,
        animal_uuid: animalUuid || null,
      })
      setSucesso('Transação atualizada com sucesso')
      setTimeout(() => setSucesso(''), 3000)
    } catch (err) {
      setErroForm(err.message || 'Erro ao atualizar transação')
    } finally {
      setSalvando(false)
    }
  }

  function formatarData(d) {
    if (!d) return '—'
    const [ano, mes, dia] = d.split('-')
    return `${dia}/${mes}/${ano}`
  }

  return (
    <SubpageLayout activeTab="listar">
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.sectionTitle}>Editar Transação</div>
          <div className={styles.pageSubtitle}>
            {transacao ? `${formatarData(transacao.data)} — ${transacao.categoria_rotulo || transacao.categoria_nome || ''}` : 'Carregando...'}
          </div>
        </div>
        <button
          className={styles.cancelarBtn}
          type="button"
          onClick={() => navigate(`/propriedade/${propriedadeId}/financeiro/listar`)}
        >
          ← Voltar
        </button>
      </div>

      {carregando ? (
        <div className={styles.loadingMsg}>Carregando transação…</div>
      ) : erro ? (
        <div className={styles.errorToast}>{erro}</div>
      ) : !transacao ? (
        <div className={styles.emptyState}>Transação não encontrada.</div>
      ) : (
        <>
          {sucesso && <div className={styles.successToast}>{sucesso}</div>}
          {erroForm && <div className={styles.errorToast}>{erroForm}</div>}

          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle} style={{ marginTop: 0 }}>Dados da transação</h3>

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
                  {salvando ? 'Salvando...' : 'Salvar alterações'}
                </button>
                <button
                  className={styles.cancelarBtn}
                  type="button"
                  onClick={() => navigate(`/propriedade/${propriedadeId}/financeiro/listar`)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>

          <div className={styles.sectionCard} style={{ marginTop: 16 }}>
            <h3 className={styles.sectionTitle} style={{ marginTop: 0 }}>Detalhes</h3>
            <div className={styles.categoriaLista}>
              <div className={styles.categoriaLinha}>
                <span className={styles.categoriaNome}>Tipo</span>
                <span className={styles.categoriaValor}>{transacao.tipo === 'receita' ? 'Receita' : 'Despesa'}</span>
              </div>
              <div className={styles.categoriaLinha}>
                <span className={styles.categoriaNome}>Criado em</span>
                <span className={styles.categoriaValor}>{formatarData(transacao.created_at)}</span>
              </div>
              <div className={styles.categoriaLinha}>
                <span className={styles.categoriaNome}>Atualizado em</span>
                <span className={styles.categoriaValor}>{formatarData(transacao.updated_at)}</span>
              </div>
              <div className={styles.categoriaLinha}>
                <span className={styles.categoriaNome}>Status sync</span>
                <span className={styles.categoriaValor}>{transacao.sync_status || '—'}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </SubpageLayout>
  )
}
