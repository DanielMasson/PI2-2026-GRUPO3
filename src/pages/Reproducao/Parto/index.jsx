import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAnimais } from '../../../hooks/useAnimais'
import { useReproducao } from '../../../hooks/useReproducao'
import { STATUS_LABELS, STATUS_CORES, diasAteParto } from '../../../utils/reproducao'
import styles from '../Subpage.module.css'
import pageStyles from '../Reproducao.module.css'

function formatarData(dataStr) {
  if (!dataStr) return '—'
  return new Date(dataStr + 'T00:00:00').toLocaleDateString('pt-BR')
}

function Parto() {
  const navigate = useNavigate()
  const { propriedadeId } = useParams()
  const { animais } = useAnimais(propriedadeId)
  const { registros, carregando, registrarParto } = useReproducao(propriedadeId)

  const animalPorUuid = new Map(animais.map(a => [a.uuid, a]))

  // Gestações que podem parir (prenhez confirmada, ainda não paridas, não canceladas)
  const elegiveis = registros.filter(r =>
    r.prenhez_confirmada && !r.data_parto && !r.motivo_cancelamento
  )

  // Histórico de partos realizados
  const historico = registros.filter(r => r.data_parto).sort((a, b) =>
    (b.data_parto || '').localeCompare(a.data_parto || '')
  )

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  // Estado do formulário inline por registro
  const [formAberto, setFormAberto] = useState(null) // uuid do registro aberto
  const [dataParto, setDataParto] = useState('')
  const [cadastrarCria, setCadastrarCria] = useState(true)
  const [dadosCria, setDadosCria] = useState({
    nome: '',
    sexo: 'femea',
    peso: '',
    id_fisico: '',
  })

  function abrirForm(registro) {
    setFormAberto(registro.uuid)
    setDataParto(new Date().toISOString().slice(0, 10))
    setCadastrarCria(true)
    setDadosCria({
      nome: registro.nome_femea ? `Cria de ${registro.nome_femea}` : '',
      sexo: 'femea',
      peso: '',
      id_fisico: '',
    })
    setErro('')
    setSucesso('')
  }

  function fecharForm() {
    setFormAberto(null)
    setDataParto('')
    setDadosCria({ nome: '', sexo: 'femea', peso: '', id_fisico: '' })
  }

  async function handleRegistrarParto(e) {
    e.preventDefault()
    if (!formAberto || !dataParto) return
    setSalvando(true)
    setErro('')
    try {
      const payloadCria = cadastrarCria ? {
        nome: dadosCria.nome.trim() || `Cria de ${animalPorUuid.get(
          registros.find(r => r.uuid === formAberto)?.animal_uuid
        )?.nome || 'matriz'}`,
        sexo: dadosCria.sexo,
        peso_nascimento: dadosCria.peso ? Number(dadosCria.peso) : null,
        id_fisico: dadosCria.id_fisico.trim() || null,
        mae_uuid: registros.find(r => r.uuid === formAberto)?.animal_uuid || null,
        pai_uuid: registros.find(r => r.uuid === formAberto)?.touro_uuid || null,
        data_nascimento: dataParto,
      } : null

      await registrarParto(formAberto, dataParto, payloadCria)
      setSucesso(
        cadastrarCria
          ? 'Parto registrado + cria cadastrada no rebanho.'
          : 'Parto registrado.'
      )
      setTimeout(() => setSucesso(''), 3000)
      fecharForm()
    } catch (err) {
      setErro(err.message || String(err))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className={pageStyles.container}>
      <header className={pageStyles.topbar}>
        <button className={pageStyles.backBtn} onClick={() => navigate(`/propriedade/${propriedadeId}/reproducao`)}>←</button>
        <div>
          <h1 className={pageStyles.pageTitle}>🐄 Registro de Parto</h1>
          <p className={pageStyles.pageSubtitle}>
            {elegiveis.length} elegível(eis) · {historico.length} parto(s) registrado(s)
          </p>
        </div>
      </header>

      <div className={pageStyles.inner}>
        {sucesso && <div className={styles.sucessoBanner}>{sucesso}</div>}
        {erro && <div className={styles.erroBanner}>{erro}</div>}

        <h2 className={styles.secaoTitulo}>Matrizes prontas para parir</h2>
        {carregando ? (
          <div className={pageStyles.emptyState}>Carregando...</div>
        ) : elegiveis.length === 0 ? (
          <div className={pageStyles.emptyState}>Nenhuma gestação confirmada aguardando parto.</div>
        ) : (
          <ul className={pageStyles.cardsList}>
            {elegiveis.map(r => {
              const femea = animalPorUuid.get(r.animal_uuid)
              const touro = animalPorUuid.get(r.touro_uuid)
              const dias = diasAteParto(r.data_previa_parto)
              return (
                <li key={r.uuid} className={pageStyles.cardAnimalDesempenho}>
                  <div className={pageStyles.cardAnimalHeader}>
                    {femea?.nome || '—'} × {touro?.nome || '(reprodutor)'}
                  </div>
                  <div className={pageStyles.desempenhoGrid}>
                    <div><strong>Cobertura:</strong> {formatarData(r.data_cobertura)}</div>
                    <div><strong>Prev. parto:</strong> {formatarData(r.data_previa_parto)}</div>
                    <div>
                      <strong>Prazo:</strong>{' '}
                      {dias === null ? '—' : dias < 0 ? `${Math.abs(dias)}d atrasado` : `${dias}d restantes`}
                    </div>
                  </div>

                  {formAberto === r.uuid ? (
                    <form className={styles.acaoInline} onSubmit={handleRegistrarParto}>
                      <label className={styles.label}>
                        <span className={styles.acaoInlineLabel}>Data do parto *</span>
                        <input
                          type="date"
                          className={styles.input}
                          value={dataParto}
                          onChange={e => setDataParto(e.target.value)}
                          required
                        />
                      </label>

                      <label className={styles.checkboxRow}>
                        <input
                          type="checkbox"
                          checked={cadastrarCria}
                          onChange={e => setCadastrarCria(e.target.checked)}
                        />
                        Cadastrar cria no rebanho (vincula à matriz)
                      </label>

                      {cadastrarCria && (
                        <div className={styles.grid}>
                          <label className={styles.label}>
                            <span className={styles.acaoInlineLabel}>Nome da cria</span>
                            <input
                              type="text"
                              className={styles.input}
                              value={dadosCria.nome}
                              onChange={e => setDadosCria(prev => ({ ...prev, nome: e.target.value }))}
                              placeholder="Ex: Bezerra 042"
                            />
                          </label>
                          <label className={styles.label}>
                            <span className={styles.acaoInlineLabel}>Sexo</span>
                            <select
                              className={styles.input}
                              value={dadosCria.sexo}
                              onChange={e => setDadosCria(prev => ({ ...prev, sexo: e.target.value }))}
                            >
                              <option value="femea">Fêmea</option>
                              <option value="macho">Macho</option>
                            </select>
                          </label>
                          <label className={styles.label}>
                            <span className={styles.acaoInlineLabel}>Peso ao nascer (kg)</span>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              className={styles.input}
                              value={dadosCria.peso}
                              onChange={e => setDadosCria(prev => ({ ...prev, peso: e.target.value }))}
                              placeholder="Ex: 32.5"
                            />
                          </label>
                          <label className={styles.label}>
                            <span className={styles.acaoInlineLabel}>Brinco / ID físico</span>
                            <input
                              type="text"
                              className={styles.input}
                              value={dadosCria.id_fisico}
                              onChange={e => setDadosCria(prev => ({ ...prev, id_fisico: e.target.value }))}
                              placeholder="Opcional"
                            />
                          </label>
                        </div>
                      )}

                      <div className={styles.acaoInlineBotoes}>
                        <button type="submit" className={styles.btnPrimario} disabled={salvando}>
                          {salvando ? 'Salvando...' : 'Registrar parto'}
                        </button>
                        <button type="button" className={styles.btnSecundario} onClick={fecharForm}>
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className={styles.acaoInlineBotoes} style={{ marginTop: '12px' }}>
                      <button type="button" className={styles.btnAcao} onClick={() => abrirForm(r)}>
                        🐄 Registrar parto
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        <h2 className={styles.secaoTitulo} style={{ marginTop: '32px' }}>Histórico de partos</h2>
        {historico.length === 0 ? (
          <div className={pageStyles.emptyState}>Nenhum parto registrado.</div>
        ) : (
          <div className={pageStyles.gestacoesList}>
            {historico.map(r => {
              const femea = animalPorUuid.get(r.animal_uuid)
              return (
                <div
                  key={r.uuid}
                  className={pageStyles.gestacaoCard}
                  style={{ borderLeft: `4px solid ${STATUS_CORES.parida}` }}
                >
                  <div className={pageStyles.gestacaoInfo}>
                    <div className={pageStyles.gestacaoAnimal}>
                      {femea?.nome || '—'}
                    </div>
                    <div className={pageStyles.gestacaoMeta}>
                      <span><strong>Parto:</strong> {formatarData(r.data_parto)}</span>
                      <span className={pageStyles.metaSep}>·</span>
                      <span><strong>Cobertura:</strong> {formatarData(r.data_cobertura)}</span>
                    </div>
                    {r.observacao && (
                      <div className={pageStyles.gestacaoMeta} style={{ marginTop: 4 }}>
                        <em>{r.observacao}</em>
                      </div>
                    )}
                  </div>
                  <span className={pageStyles.tagVerde}>PARIDA</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Parto
