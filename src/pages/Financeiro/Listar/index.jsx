import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAnimais } from '../../../hooks/useAnimais'
import { useFinanceiroPropriedade } from '../../../hooks/useFinanceiro'
import * as financeiroService from '../../../services/financeiroService'
import SubpageLayout from '../_SubpageLayout'
import styles from '../Financeiro.module.css'

function useDebounce(valor, delay = 300) {
  const [debounced, setDebounced] = useState(valor)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(valor), delay)
    return () => clearTimeout(t)
  }, [valor, delay])
  return debounced
}

function AutocompleteAnimal({ animais, valor, onSelect, onClear }) {
  const [termo, setTermo] = useState('')
  const [aberto, setAberto] = useState(false)
  const ref = useRef(null)
  const debouncedTermo = useDebounce(termo, 200)

  useEffect(() => {
    const animal = animais.find(a => a.uuid === valor)
    if (animal) setTermo(animal.nome || animal.id_fisico || '')
  }, [valor, animais])

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setAberto(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtrados = useMemo(() => {
    if (!debouncedTermo) return animais.slice(0, 20)
    const t = debouncedTermo.toLowerCase()
    return animais.filter(a =>
      (a.nome || '').toLowerCase().includes(t) ||
      (a.id_fisico || '').toLowerCase().includes(t)
    ).slice(0, 20)
  }, [animais, debouncedTermo])

  function handleSelect(uuid) {
    const animal = animais.find(a => a.uuid === uuid)
    setTermo(animal ? (animal.nome || animal.id_fisico || '') : '')
    setAberto(false)
    onSelect(uuid)
  }

  function handleClear() {
    setTermo('')
    setAberto(false)
    onClear()
  }

  return (
    <div className={styles.autocompleteWrapper} ref={ref}>
      <input
        type="text"
        className={styles.autocompleteInput}
        placeholder="Buscar animal por nome ou ID..."
        value={termo}
        onChange={e => { setTermo(e.target.value); setAberto(true) }}
        onFocus={() => setAberto(true)}
      />
      {valor && (
        <button
          type="button"
          onClick={handleClear}
          className={styles.autocompleteClear}
          aria-label="Limpar seleção"
        >
          ✕
        </button>
      )}
      {aberto && filtrados.length > 0 && (
        <div className={styles.autocompleteLista}>
          {filtrados.map(a => (
            <div
              key={a.uuid}
              className={styles.autocompleteItem}
              onClick={() => handleSelect(a.uuid)}
            >
              <div>{a.nome || 'Sem nome'}</div>
              {a.id_fisico && (
                <div className={styles.autocompleteItemMeta}>ID: {a.id_fisico}</div>
              )}
            </div>
          ))}
        </div>
      )}
      {aberto && termo && filtrados.length === 0 && (
        <div className={styles.autocompleteLista}>
          <div className={`${styles.autocompleteItem} ${styles.autocompleteItemVazio}`}>
            Nenhum animal encontrado
          </div>
        </div>
      )}
    </div>
  )
}

export default function FinanceiroListar() {
  const { propriedadeId } = useParams()
  const navigate = useNavigate()
  const { animais } = useAnimais(propriedadeId)
  const { categorias, excluir } = useFinanceiroPropriedade(propriedadeId)

  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [tipo, setTipo] = useState('')
  const [categoriaUuid, setCategoriaUuid] = useState('')
  const [animalUuid, setAnimalUuid] = useState('')
  const [aplicados, setAplicados] = useState(null)

  const [transacoes, setTransacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const [excluindoUuid, setExcluindoUuid] = useState(null)
  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const filtros = {}
      if (aplicados) {
        if (aplicados.dataInicio) filtros.dataInicio = aplicados.dataInicio
        if (aplicados.dataFim) filtros.dataFim = aplicados.dataFim
        if (aplicados.tipo) filtros.tipo = aplicados.tipo
        if (aplicados.categoriaUuid) filtros.categoriaUuid = aplicados.categoriaUuid
        if (aplicados.animalUuid) filtros.animalUuid = aplicados.animalUuid
      }
      const dados = await financeiroService.listarPorPropriedade(propriedadeId, filtros)
      setTransacoes(dados || [])
    } catch (e) {
      setErro(e?.message || 'Erro ao carregar transações')
    } finally {
      setCarregando(false)
    }
  }, [propriedadeId, aplicados])

  useEffect(() => { carregar() }, [carregar])

  const filtrosAtivos = aplicados
    ? Object.values(aplicados).some(v => v && v !== '')
    : false

  function handleAplicar(e) {
    e.preventDefault()
    setAplicados({ dataInicio, dataFim, tipo, categoriaUuid, animalUuid })
  }

  function handleLimpar() {
    setDataInicio('')
    setDataFim('')
    setTipo('')
    setCategoriaUuid('')
    setAnimalUuid('')
    setAplicados(null)
  }

  async function confirmarExclusao(uuid) {
    setSalvando(true)
    try {
      await excluir(uuid)
      setExcluindoUuid(null)
      await carregar()
    } catch {
      await carregar()
    } finally {
      setSalvando(false)
    }
  }

  function formatarData(d) {
    if (!d) return '—'
    const [ano, mes, dia] = d.split('-')
    return `${dia}/${mes}/${ano}`
  }

  function formatarValor(v) {
    return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <SubpageLayout activeTab="listar">
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.sectionTitle}>Transações</div>
          <div className={styles.pageSubtitle}>
            {transacoes.length} registro{transacoes.length !== 1 ? 's' : ''} exibido{transacoes.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button
          className={styles.novaBtn}
          type="button"
          onClick={() => navigate(`/propriedade/${propriedadeId}/financeiro`)}
        >
          + Nova
        </button>
      </div>

      <form className={styles.filtrosCard} onSubmit={handleAplicar}>
        <div className={styles.filtroField}>
          <label className={styles.formLabel} htmlFor="filtro-data-inicio">Data início</label>
          <input
            id="filtro-data-inicio"
            type="date"
            className={styles.formInput}
            value={dataInicio}
            onChange={e => setDataInicio(e.target.value)}
          />
        </div>

        <div className={styles.filtroField}>
          <label className={styles.formLabel} htmlFor="filtro-data-fim">Data fim</label>
          <input
            id="filtro-data-fim"
            type="date"
            className={styles.formInput}
            value={dataFim}
            onChange={e => setDataFim(e.target.value)}
          />
        </div>

        <div className={styles.filtroField}>
          <label className={styles.formLabel} htmlFor="filtro-tipo">Tipo</label>
          <select
            id="filtro-tipo"
            className={styles.formSelect}
            value={tipo}
            onChange={e => setTipo(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="receita">Receita</option>
            <option value="despesa">Despesa</option>
          </select>
        </div>

        <div className={styles.filtroField}>
          <label className={styles.formLabel} htmlFor="filtro-categoria">Categoria</label>
          <select
            id="filtro-categoria"
            className={styles.formSelect}
            value={categoriaUuid}
            onChange={e => setCategoriaUuid(e.target.value)}
          >
            <option value="">Todas</option>
            {categorias.map(c => (
              <option key={c.uuid} value={c.uuid}>{c.rotulo || c.nome}</option>
            ))}
          </select>
        </div>

        <div className={styles.filtroField}>
          <label className={styles.formLabel}>Animal</label>
          <AutocompleteAnimal
            animais={animais}
            valor={animalUuid}
            onSelect={setAnimalUuid}
            onClear={() => setAnimalUuid('')}
          />
        </div>

        <div className={styles.filtrosAcoes}>
          <button type="submit" className={styles.salvarBtn}>Aplicar</button>
          {filtrosAtivos && (
            <button type="button" className={styles.cancelarBtn} onClick={handleLimpar}>
              Limpar
            </button>
          )}
        </div>
      </form>

      {erro && <div className={styles.errorToast}>{erro}</div>}

      {carregando ? (
        <div className={styles.loadingMsg}>Carregando transações…</div>
      ) : transacoes.length === 0 ? (
        <div className={styles.emptyState}>
          {filtrosAtivos
            ? 'Nenhuma transação encontrada com os filtros aplicados.'
            : 'Nenhuma transação registrada ainda. Use "+ Nova" para adicionar.'}
        </div>
      ) : (
        <table className={styles.tabelaTransacoes}>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Animal</th>
              <th>Valor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transacoes.map(t => (
              <tr key={t.uuid}>
                <td>{formatarData(t.data)}</td>
                <td>
                  <div className={styles.transacaoDescricao}>{t.descricao || '—'}</div>
                  <div className={styles.transacaoSub}>{t.tipo === 'receita' ? 'Receita' : 'Despesa'}</div>
                </td>
                <td>
                  {t.categoria_rotulo
                    ? <span className={styles.categoriaBadge}>{t.categoria_rotulo}</span>
                    : t.categoria_nome
                      ? <span className={styles.categoriaBadge}>{t.categoria_nome}</span>
                      : '—'}
                </td>
                <td>{t.animal_nome || '—'}</td>
                <td className={t.tipo === 'receita' ? styles.transacaoValorReceita : styles.transacaoValorDespesa}>
                  {t.tipo === 'receita' ? '+' : '−'} {formatarValor(t.valor)}
                </td>
                <td>
                  {excluindoUuid === t.uuid ? (
                    <div className={styles.acaoInline}>
                      <span className={styles.acaoInlineLabel}>Confirmar exclusão?</span>
                      <div className={styles.acaoInlineBotoes}>
                        <button
                          type="button"
                          className={styles.btnPrimario}
                          onClick={() => confirmarExclusao(t.uuid)}
                          disabled={salvando}
                        >
                          {salvando ? 'Excluindo...' : 'Sim, excluir'}
                        </button>
                        <button
                          type="button"
                          className={styles.btnSecundario}
                          onClick={() => setExcluindoUuid(null)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.acaoBotoes}>
                      <button
                        className={styles.btnSecundario}
                        type="button"
                        onClick={() => navigate(`/propriedade/${propriedadeId}/financeiro/detalhe/${t.uuid}`)}
                        aria-label={`Editar transação ${t.descricao || ''}`}
                      >
                        Editar
                      </button>
                      <button
                        className={styles.excluirBtn}
                        type="button"
                        onClick={() => setExcluindoUuid(t.uuid)}
                        aria-label={`Excluir transação ${t.descricao || ''}`}
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </SubpageLayout>
  )
}
