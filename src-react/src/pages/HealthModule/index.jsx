import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAnimais } from '../../hooks/useAnimais'
import { useVacinas } from '../../hooks/useVacinas'
import { useMedicamentos } from '../../hooks/useMedicamentos'
import { useOcorrencias } from '../../hooks/useOcorrencias'
import { useMovimentacoes } from '../../hooks/useMovimentacoes'
import { useVacinasObrigatorias } from '../../hooks/useVacinasObrigatorias'
import { useDashboardStats } from '../../hooks/useDashboardStats'
import { useAlertasSanitarios } from '../../hooks/useAlertasSanitarios'
import { TIPOS_MEDICAMENTO, RESULTADOS_OCORRENCIA } from '../../constants/sync'
import { diasAte } from '../../utils/datas'
import styles from './HealthModule.module.css'
import Button from '../../components/Button/index.jsx'
import Input from '../../components/Input/index.jsx'
import * as movimentacoesService from '../../services/movimentacaoService'

function formatarData(dataStr) {
  return new Date(dataStr + 'T00:00:00').toLocaleDateString('pt-BR')
}

const TIPOS_MEDICAMENTO_LABELS = {
  antibiotico: 'Antibiótico',
  vermifugo: 'Vermífugo',
  'anti-inflamatorio': 'Anti-inflamatório',
  suplemento: 'Suplemento',
  antiparasitario: 'Antiparasitário',
  outro: 'Outro',
}

const RESULTADOS_OCORRENCIA_LABELS = {
  aguardando: 'Aguardando avaliação',
  em_tratamento: 'Em tratamento',
  recuperado: 'Recuperado',
  obito: 'Óbito',
}

const RESULTADOS_CLS = {
  aguardando: 'tagCinza',
  em_tratamento: 'tagAmarelo',
  recuperado: 'tagVerde',
  obito: 'tagVermelho',
}

// ─── Componente Principal ───────────────────────────────────────────────────
function HealthModule() {
  const navigate = useNavigate()
  const { propriedadeId } = useParams()
  const [searchParams] = useSearchParams()
  const [abaAtiva, setAbaAtiva] = useState(() => {
    const aba = searchParams.get('aba')
    return ['vacinas', 'medicamentos', 'ocorrencias', 'localizacao'].includes(aba) ? aba : 'vacinas'
  })
  const animalParam = searchParams.get('animal') || ''

  return (
    <div className={styles.container}>
      {/* Topbar */}
      <header className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => navigate(`/propriedade/${propriedadeId}`)}>←</button>
        <div>
          <h1 className={styles.pageTitle}>Módulo de Saúde</h1>
          <p className={styles.pageSubtitle}>Propriedade: <strong>{propriedadeId}</strong></p>
        </div>
      </header>

      <div className={styles.inner}>
        {/* Abas */}
        <div className={styles.tabs}>
          {[
            { id: 'vacinas', label: 'Vacinas', icon: '💉' },
            { id: 'medicamentos', label: 'Medicamentos', icon: '💊' },
            { id: 'ocorrencias', label: 'Ocorrências', icon: '🩺' },
            { id: 'localizacao', label: 'Localização', icon: '📍' },
          ].map(aba => (
            <button
              key={aba.id}
              className={`${styles.tab} ${abaAtiva === aba.id ? styles.tabAtiva : ''}`}
              onClick={() => setAbaAtiva(aba.id)}
            >
              <span className={styles.tabIcon}>{aba.icon}</span>
              <span className={styles.tabLabel}>{aba.label}</span>
            </button>
          ))}
        </div>

        {/* Conteúdo das abas */}
        {abaAtiva === 'vacinas' && <AbaVacinas propriedadeId={propriedadeId} animalPreSelecionado={animalParam} />}
        {abaAtiva === 'medicamentos' && <AbaMedicamentos propriedadeId={propriedadeId} animalPreSelecionado={animalParam} />}
        {abaAtiva === 'ocorrencias' && <AbaOcorrencias propriedadeId={propriedadeId} animalPreSelecionado={animalParam} />}
        {abaAtiva === 'localizacao' && <AbaLocalizacao propriedadeId={propriedadeId} animalPreSelecionado={animalParam} />}
      </div>
    </div>
  )
}

// ─── ABA VACINAS ────────────────────────────────────────────────────────────
function AbaVacinas({ propriedadeId, animalPreSelecionado }) {
  const { animais, carregando: carregandoAnimais } = useAnimais(propriedadeId)
  const { vacinas, carregando: carregandoVacinas, registrarVacina, excluirVacina, proximas, vencidas } = useVacinas(propriedadeId, 'propriedade')
  const [mostrarForm, setMostrarForm] = useState(!!animalPreSelecionado)
  const [form, setForm] = useState({
    nome_vacina: '', animal_uuid: animalPreSelecionado || '',
    data_aplicacao: '', proxima_dose: '', ciclo_dias: '',
    obrigatoria: false, lote: '', responsavel: '', observacao: '',
  })
  const [erros, setErros] = useState({})
  const [sucesso, setSucesso] = useState(false)

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (erros[name]) setErros(prev => ({ ...prev, [name]: '' }))
    setSucesso(false)
  }

  async function handleRegistrar(e) {
    e.preventDefault()
    const errsLocal = {}
    if (!form.nome_vacina.trim()) errsLocal.nome_vacina = 'Informe o nome da vacina'
    if (!form.animal_uuid) errsLocal.animal_uuid = 'Selecione o animal'
    if (!form.data_aplicacao) errsLocal.data_aplicacao = 'Informe a data'
    if (Object.keys(errsLocal).length) { setErros(errsLocal); return }

    try {
      await registrarVacina({
        ...form,
        propriedade_uuid: propriedadeId,
        ciclo_dias: form.ciclo_dias ? Number(form.ciclo_dias) : null,
      })
      setForm({ nome_vacina: '', animal_uuid: '', data_aplicacao: '', proxima_dose: '', ciclo_dias: '', obrigatoria: false, lote: '', responsavel: '', observacao: '' })
      setErros({})
      setSucesso(true)
      setMostrarForm(false)
    } catch (err) {
      setErros({ geral: err.message })
    }
  }

  async function handleExcluir(uuid) {
    if (!window.confirm('Excluir esta vacina?')) return
    try {
      await excluirVacina(uuid)
    } catch (err) {
      setErros({ geral: err.message })
    }
  }

  return (
    <div>
      {/* Calendário de vacinas */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>📅 Calendário Sanitário</span>
          <button className={styles.addBtn} onClick={() => setMostrarForm(v => !v)}>
            {mostrarForm ? '✕ Fechar' : '+ Registrar Aplicação'}
          </button>
        </div>

        {carregandoVacinas ? (
          <div className={styles.emptyState}>Carregando vacinas...</div>
        ) : vacinas.length === 0 ? (
          <div className={styles.emptyState}>Nenhuma vacina registrada.</div>
        ) : (
          <div className={styles.vacinaList}>
            {vacinas.map(v => {
              const dias = v.proxima_dose ? diasAte(v.proxima_dose) : null
              const urgencia = dias === null ? 'ok' : dias < 0 ? 'vencida' : dias <= 7 ? 'urgente' : dias <= 30 ? 'proxima' : 'ok'
              return (
                <div key={v.uuid} className={`${styles.vacinaItem} ${styles[urgencia]}`}>
                  <div className={styles.vacinaInfo}>
                    <span className={styles.vacinaNome}>{v.nome_vacina}</span>
                    <span className={styles.vacinaMeta}>
                      {v.nome_animal ? `${v.nome_animal}` : ''}
                      {v.id_fisico ? ` (${v.id_fisico})` : ''}
                      {v.ciclo_dias ? ` · Ciclo: ${v.ciclo_dias} dias` : ''}
                      {v.proxima_dose ? ` · Próxima dose: ${formatarData(v.proxima_dose)}` : ''}
                    </span>
                  </div>
                  <div className={styles.vacinaRight}>
                    {v.obrigatoria && <span className={styles.badge}>Obrigatória</span>}
                    {dias !== null && (
                      <span className={`${styles.diasBadge} ${styles[urgencia]}`}>
                        {dias < 0 ? `${Math.abs(dias)}d atraso` : dias === 0 ? 'Hoje!' : `${dias}d`}
                      </span>
                    )}
                    <button className={styles.deleteBtn} onClick={() => handleExcluir(v.uuid)} title="Excluir">🗑</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Formulário de registro */}
      {mostrarForm && (
        <div className={styles.card} style={{ marginTop: 16 }}>
          <p className={styles.cardTitle}>Registrar Aplicação</p>
          <form onSubmit={handleRegistrar} noValidate>
            <div className={styles.formGrid}>
              <Input id="nome_vacina" name="nome_vacina" label="Nome da vacina" placeholder="Ex: Febre Aftosa" value={form.nome_vacina} onChange={handleChange} error={erros.nome_vacina} variant="dark" />
              <div>
                <label className={styles.selectLabel}>Animal</label>
                <select name="animal_uuid" className={`${styles.select} ${erros.animal_uuid ? styles.selectError : ''}`} value={form.animal_uuid} onChange={handleChange}>
                  <option value="" disabled>Selecione</option>
                  {animais.map(a => <option key={a.uuid} value={a.uuid}>{a.nome} ({a.id_fisico || a.id_interno || 's/brinco'})</option>)}
                </select>
                {erros.animal_uuid && <span className={styles.errorMsg}>{erros.animal_uuid}</span>}
              </div>
              <Input id="data_aplicacao" name="data_aplicacao" type="date" label="Data de aplicação" value={form.data_aplicacao} onChange={handleChange} error={erros.data_aplicacao} variant="dark" />
              <Input id="proxima_dose" name="proxima_dose" type="date" label="Próxima dose (opcional)" value={form.proxima_dose} onChange={handleChange} variant="dark" />
              <Input id="ciclo_dias" name="ciclo_dias" type="number" label="Ciclo em dias (opcional)" placeholder="Ex: 180" value={form.ciclo_dias} onChange={handleChange} inputMode="numeric" variant="dark" />
              <Input id="lote" name="lote" label="Lote da vacina" placeholder="Ex: LT-2024-001" value={form.lote} onChange={handleChange} variant="dark" />
              <div className={styles.formGridFull}>
                <Input id="responsavel" name="responsavel" label="Responsável (opcional)" placeholder="Nome do aplicador" value={form.responsavel} onChange={handleChange} variant="dark" />
              </div>
              <div className={styles.formGridFull}>
                <label className={styles.selectLabel}>
                  <input type="checkbox" name="obrigatoria" checked={form.obrigatoria} onChange={handleChange} style={{ marginRight: 6 }} />
                  Vacina obrigatória
                </label>
              </div>
              <div className={styles.formGridFull}>
                <label className={styles.selectLabel}>Observações (opcional)</label>
                <textarea name="observacao" className={styles.textarea} placeholder="Detalhes adicionais..." value={form.observacao} onChange={handleChange} rows={2} />
              </div>
            </div>
            {erros.geral && <p className={styles.errorMsg}>{erros.geral}</p>}
            <div className={styles.formActions}>
              <Button type="button" variant="ghost" onClick={() => setMostrarForm(false)}>Cancelar</Button>
              <Button type="submit">Salvar Registro</Button>
            </div>
          </form>
        </div>
      )}

      {sucesso && <p className={styles.successToast}>✓ Aplicação registrada com sucesso!</p>}

      <PainelDashboard propriedadeId={propriedadeId} contagensVacinas={{ proximas, vencidas }} />
      <PainelAlertas propriedadeId={propriedadeId} />
      <PainelObrigatorias propriedadeId={propriedadeId} />
    </div>
  )
}

// ─── SPRINT 6 EIXO 3: Dashboard cards + Lista-config opcionalmente reutilizáveis ──
function PainelDashboard({ propriedadeId, contagensVacinas }) {
  const stats = useDashboardStats(propriedadeId, contagensVacinas)
  const { gestantes, movimentacoesRecentes, proximasVacinas, carregando } = stats
  const { obrigatoriasPendentes } = useAlertasSanitarios(propriedadeId)
  const carregandoAlertas = stats.carregando || stats.erro !== null || obrigatoriasPendentes === undefined

  const proximasCls = proximasVacinas > 0 ? styles.dashCardAlerta : ''
  const movCls = movimentacoesRecentes > 0 ? '' : ''
  const alertasCls = obrigatoriasPendentes > 0 ? styles.dashCardAlerta : ''

  return (
    <div className={styles.dashGrid}>
      <div className={`${styles.dashCard} ${proximasCls}`}>
        <span className={styles.dashCardLabel}>Próximas doses</span>
        <span className={styles.dashCardValue}>{carregando ? '…' : proximasVacinas}</span>
        <span className={styles.dashCardHint}>Libera nos próximos 30d ou vencidas</span>
      </div>
      <div className={`${styles.dashCard} ${movCls}`}>
        <span className={styles.dashCardLabel}>Gestantes</span>
        <span className={styles.dashCardValue}>{carregando ? '…' : gestantes}</span>
        <span className={styles.dashCardHint}>Prenhez confirmada, sem parto registrado</span>
      </div>
      <div className={styles.dashCard}>
        <span className={styles.dashCardLabel}>Movimentações últimos 7d</span>
        <span className={styles.dashCardValue}>{carregando ? '…' : movimentacoesRecentes}</span>
        <span className={styles.dashCardHint}>Registros recentes da propriedade</span>
      </div>
      <div className={`${styles.dashCard} ${alertasCls}`}>
        <span className={styles.dashCardLabel}>Alertas sanitários</span>
        <span className={styles.dashCardValue}>{carregandoAlertas ? '…' : obrigatoriasPendentes}</span>
        <span className={styles.dashCardHint}>Obrigatórias atrasadas ou nunca aplicadas</span>
      </div>
    </div>
  )
}

function PainelAlertas({ propriedadeId }) {
  const {
    obrigatorias, vacinasVencidas, vacinasProximas, obrigatoriasPendentes,
    carregando, recarregar,
  } = useAlertasSanitarios(propriedadeId)
  const [aberto, setAberto] = useState(false)

  return (
    <div className={styles.card}>
      <div className={styles.collapseHeader} onClick={() => setAberto(v => !v)}>
        <div>
          <span className={styles.collapseTitle}>🩺 Alertas sanitários</span>
          <span className={styles.collapseHint}>
            {obrigatoriasPendentes > 0
              ? ` ${obrigatoriasPendentes} pendente${obrigatoriasPendentes === 1 ? '' : 's'} · ${vacinasVencidas.length} vencida${vacinasVencidas.length === 1 ? '' : 's'} · ${vacinasProximas.length} próxima${vacinasProximas.length === 1 ? '' : 's'}`
              : ' Tudo em dia conforme ciclo das obrigatórias'}
          </span>
        </div>
        <div className={styles.actionsRow}>
          <button className={styles.addBtn} onClick={(e) => { e.stopPropagation(); recarregar() }}>↻</button>
          <span className={styles.collapseArrow}>{aberto ? '▾' : '▸'}</span>
        </div>
      </div>

      {aberto && (
        <div className={styles.collapseBody}>
          {carregando && <div className={styles.emptyState}>Carregando...</div>}

          {!carregando && (
            <>
              <div>
                <span className={styles.cardTitle}>Obrigatórias pendentes</span>
                {obrigatorias.filter(o => o.status === 'atrasada' || o.status === 'nunca_aplicada').length === 0
                  ? <div className={styles.emptyState}>Nenhuma obrigatória atrasada ou pendente. ✓</div>
                  : (
                    <div className={styles.obrigatoriasList}>
                      {obrigatorias
                        .filter(o => o.status === 'atrasada' || o.status === 'nunca_aplicada')
                        .map(o => (
                          <div key={o.obrigatoria_uuid} className={styles.obrigatoriaItem}>
                            <div className={styles.obrigatoriaInfo}>
                              <span className={styles.obrigatoriaNome}>
                                {o.nome_vacina}
                                {o.atraso_dias ? ` · ${o.atraso_dias}d atrasada` : ' · nunca aplicada'}
                              </span>
                              <span className={styles.obrigatoriaMeta}>
                                {o.especie || 'Todas espécies'} · {o.sexo ? (o.sexo === 'femea' ? 'Fêmeas' : 'Machos') : 'Ambos sexos'} · ciclo {o.ciclo_dias}d
                                {o.ultima_aplicacao ? ` · última: ${o.ultima_aplicacao}` : ''}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
              </div>

              <div>
                <span className={styles.cardTitle}>Vacinas vencidas (próxima dose)</span>
                {vacinasVencidas.length === 0
                  ? <div className={styles.emptyState}>Nenhuma vacina vencida na propriedade. ✓</div>
                  : (
                    <div className={styles.logList}>
                      {vacinasVencidas.map(v => (
                        <div key={v.uuid} className={styles.logItem}>
                          <div className={styles.logInfo}>
                            <span className={styles.logTitle}>{v.nome_animal}{v.id_fisico ? ` (${v.id_fisico})` : ''} · {v.nome_vacina}</span>
                            <span className={styles.logMeta}>Próxima dose prevista: {v.proxima_dose}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              <div>
                <span className={styles.cardTitle}>Próximos 7 dias</span>
                {vacinasProximas.length === 0
                  ? <div className={styles.emptyState}>Nenhuma dose programada para os próximos 7 dias.</div>
                  : (
                    <div className={styles.logList}>
                      {vacinasProximas.map(v => (
                        <div key={v.uuid} className={styles.logItem}>
                          <div className={styles.logInfo}>
                            <span className={styles.logTitle}>{v.nome_animal}{v.id_fisico ? ` (${v.id_fisico})` : ''} · {v.nome_vacina}</span>
                            <span className={styles.logMeta}>Programada para {v.proxima_dose}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function PainelObrigatorias({ propriedadeId }) {
  const {
    vacinas, carregando, registrarVacinaObrigatoria, desativarVacinaObrigatoria, editarVacinaObrigatoria,
  } = useVacinasObrigatorias(propriedadeId)
  const [novo, setNovo] = useState(false)
  const [form, setNovoForm] = useState({ nome_vacina: '', especie: '', sexo: '', ciclo_dias: '365' })
  const [editando, setEditando] = useState(null)
  const [erroForm, setErroForm] = useState('')

  async function handleAdicionar(e) {
    e.preventDefault()
    setErroForm('')
    if (!form.nome_vacina.trim()) { setErroForm('Informe o nome da vacina'); return }
    if (!form.ciclo_dias || Number(form.ciclo_dias) <= 0) { setErroForm('Informe o ciclo em dias válido'); return }
    try {
      await registrarVacinaObrigatoria({
        propriedade_uuid: propriedadeId,
        nome_vacina: form.nome_vacina.trim(),
        especie: ['bovino','equino','suino','ovino','caprino','aves'].includes(form.especie) ? form.especie : null,
        sexo: ['femea','macho'].includes(form.sexo) ? form.sexo : null,
        ciclo_dias: Number(form.ciclo_dias),
        ativo: 1,
      })
      setNovoForm({ nome_vacina: '', especie: '', sexo: '', ciclo_dias: '365' })
      setNovo(false)
    } catch (err) {
      setErroForm(err.message)
    }
  }

  async function toggleAtivo(v) {
    try {
      await editarVacinaObrigatoria(v.uuid, { ativo: v.ativo ? 0 : 1 })
    } catch (err) {
      setErroForm(err.message)
    }
  }

  async function desativar(v) {
    if (!window.confirm(`Remover "${v.nome_vacina}" da lista de obrigatórias?`)) return
    try {
      await desativarVacinaObrigatoria(v.uuid)
    } catch (err) {
      setErroForm(err.message)
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>📋 Vacinas Obrigatórias da Propriedade</span>
        <div className={styles.actionsRow}>
          <button className={styles.addBtn} onClick={() => setNovo(v => !v)}>
            {novo ? '✕ Fechar' : '+ Adicionar'}
          </button>
        </div>
      </div>

      {novo && (
        <form onSubmit={handleAdicionar} noValidate className={styles.formNewOwner} style={{ marginBottom: 12 }}>
          <div className={styles.formGrid}>
            <Input id="ob_nome" name="nome_vacina" label="Nome da vacina" value={form.nome_vacina} onChange={(e) => setNovoForm(p => ({ ...p, [e.target.name]: e.target.value }))} variant="dark" />
            <div>
              <label className={styles.selectLabel}>Espécie (opcional)</label>
              <select name="especie" className={styles.select} value={form.especie} onChange={(e) => setNovoForm(p => ({ ...p, [e.target.name]: e.target.value }))}>
                <option value="">— Todas —</option>
                <option value="bovino">Bovino</option>
                <option value="equino">Equino</option>
                <option value="suino">Suíno</option>
                <option value="ovino">Ovino</option>
                <option value="caprino">Caprino</option>
                <option value="aves">Aves</option>
              </select>
            </div>
            <div>
              <label className={styles.selectLabel}>Sexo (opcional)</label>
              <select name="sexo" className={styles.select} value={form.sexo} onChange={(e) => setNovoForm(p => ({ ...p, [e.target.name]: e.target.value }))}>
                <option value="">— Ambos —</option>
                <option value="femea">Fêmea</option>
                <option value="macho">Macho</option>
              </select>
            </div>
            <Input id="ob_ciclo" name="ciclo_dias" type="number" label="Ciclo (dias)" value={form.ciclo_dias} onChange={(e) => setNovoForm(p => ({ ...p, [e.target.name]: e.target.value }))} variant="dark" />
          </div>
          {erroForm && <p className={styles.errorMsg}>{erroForm}</p>}
          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={() => setNovo(false)}>Cancelar</Button>
            <Button type="submit">Adicionar</Button>
          </div>
        </form>
      )}

      {carregando && <div className={styles.emptyState}>Carregando…</div>}
      {!carregando && vacinas.length === 0 && (
        <div className={styles.emptyState}>Nenhuma vacina obrigatória configurada.</div>
      )}
      {!carregando && vacinas.length > 0 && (
        <div className={styles.obrigatoriasList}>
          {vacinas.map(v => (
            <div key={v.uuid} className={`${styles.obrigatoriaItem} ${!v.ativo ? styles.inativa : ''}`}>
              <div className={styles.obrigatoriaInfo}>
                <span className={styles.obrigatoriaNome}>{v.nome_vacina}</span>
                <span className={styles.obrigatoriaMeta}>
                  {v.especie || 'Todas espécies'} · {v.sexo === 'femea' ? 'Fêmeas' : v.sexo === 'macho' ? 'Machos' : 'Ambos sexos'} · ciclo {v.ciclo_dias}d
                </span>
              </div>
              <div className={styles.obrigatoriaToggle}>
                <label className={styles.selectLabel} style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                  <input type="checkbox" checked={!!v.ativo} onChange={() => toggleAtivo(v)} />
                  {v.ativo ? 'Ativa' : 'Inativa'}
                </label>
                <button className={styles.removeBtn} onClick={() => desativar(v)} title="Remover">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


// ─── ABA MEDICAMENTOS ───────────────────────────────────────────────────────
function AbaMedicamentos({ propriedadeId, animalPreSelecionado }) {
  const { animais } = useAnimais(propriedadeId)
  const { medicamentos, carregando, registrarMedicamento, excluirMedicamento } = useMedicamentos(propriedadeId, 'propriedade')
  const [form, setForm] = useState({
    animal_uuid: animalPreSelecionado || '', tipo: '', produto: '', dose: '',
    data_aplicacao: '', carencia_dias: '', responsavel: '', observacao: '',
  })
  const [erros, setErros] = useState({})
  const [mostrarForm, setMostrarForm] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (erros[name]) setErros(prev => ({ ...prev, [name]: '' }))
    setSucesso(false)
  }

  async function handleSalvar(e) {
    e.preventDefault()
    const errsLocal = {}
    if (!form.animal_uuid) errsLocal.animal_uuid = 'Selecione o animal'
    if (!form.tipo) errsLocal.tipo = 'Selecione o tipo'
    if (!form.produto.trim()) errsLocal.produto = 'Informe o produto'
    if (!form.dose.trim()) errsLocal.dose = 'Informe a dose'
    if (!form.data_aplicacao) errsLocal.data_aplicacao = 'Informe a data'
    if (!form.carencia_dias) errsLocal.carencia_dias = 'Informe a carência (dias)'
    if (Object.keys(errsLocal).length) { setErros(errsLocal); return }

    // Calcular data_liberacao = data_aplicacao + carencia_dias
    const dataAplicacao = new Date(form.data_aplicacao + 'T00:00:00')
    const carenciaDias = Number(form.carencia_dias)
    const dataLiberacao = new Date(dataAplicacao.getTime() + carenciaDias * 86400000)
    const dataLiberacaoStr = dataLiberacao.toISOString().split('T')[0]

    try {
      await registrarMedicamento({
        ...form,
        propriedade_uuid: propriedadeId,
        carencia_dias: carenciaDias,
        data_liberacao: dataLiberacaoStr,
      })
      setForm({ animal_uuid: '', tipo: '', produto: '', dose: '', data_aplicacao: '', carencia_dias: '', responsavel: '', observacao: '' })
      setErros({})
      setSucesso(true)
      setMostrarForm(false)
    } catch (err) {
      setErros({ geral: err.message })
    }
  }

  async function handleExcluir(uuid) {
    if (!window.confirm('Excluir este medicamento?')) return
    try {
      await excluirMedicamento(uuid)
    } catch (err) {
      setErros({ geral: err.message })
    }
  }

  function statusCarencia(dataLiberacao) {
    if (!dataLiberacao) return { label: 'N/A', cls: 'tagCinza' }
    const dias = diasAte(dataLiberacao)
    if (dias < 0) return { label: 'Liberado', cls: 'tagVerde' }
    if (dias === 0) return { label: 'Libera hoje', cls: 'tagAmarelo' }
    return { label: `Carência: ${dias}d`, cls: 'tagVermelho' }
  }

  return (
    <div>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>💊 Controle de Medicamentos</span>
          <button className={styles.addBtn} onClick={() => setMostrarForm(v => !v)}>
            {mostrarForm ? '✕ Fechar' : '+ Novo Tratamento'}
          </button>
        </div>

        {carregando ? (
          <div className={styles.emptyState}>Carregando...</div>
        ) : medicamentos.length === 0 && !mostrarForm ? (
          <div className={styles.emptyState}>Nenhum tratamento registrado. Clique em "+ Novo Tratamento" para começar.</div>
        ) : medicamentos.length > 0 ? (
          <div className={styles.logList}>
            {medicamentos.map(r => {
              const st = statusCarencia(r.data_liberacao)
              const tipoLabel = TIPOS_MEDICAMENTO_LABELS[r.tipo] || r.tipo
              return (
                <div key={r.uuid} className={styles.logItem}>
                  <div className={styles.logInfo}>
                    <span className={styles.logTitle}>{r.produto} <em style={{ fontWeight: 400, fontSize: '0.85em' }}>({tipoLabel})</em></span>
                    <span className={styles.logMeta}>{r.nome_animal || 'Animal'}{r.id_fisico ? ` (${r.id_fisico})` : ''} · {r.dose} · Aplicado: {formatarData(r.data_aplicacao)}</span>
                    <span className={styles.logMeta}>Liberação: {r.data_liberacao ? formatarData(r.data_liberacao) : 'N/A'}{r.responsavel ? ` · ${r.responsavel}` : ''}</span>
                    {r.observacao && <span className={styles.logObs}>{r.observacao}</span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <span className={`${styles[st.cls]}`}>{st.label}</span>
                    <button className={styles.deleteBtn} onClick={() => handleExcluir(r.uuid)} title="Excluir">🗑</button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}
      </div>

      {mostrarForm && (
        <div className={styles.card} style={{ marginTop: 16 }}>
          <p className={styles.cardTitle}>Registrar Tratamento</p>
          <form onSubmit={handleSalvar} noValidate>
            <div className={styles.formGrid}>
              <div>
                <label className={styles.selectLabel}>Animal</label>
                <select name="animal_uuid" className={`${styles.select} ${erros.animal_uuid ? styles.selectError : ''}`} value={form.animal_uuid} onChange={handleChange}>
                  <option value="" disabled>Selecione</option>
                  {animais.map(a => <option key={a.uuid} value={a.uuid}>{a.nome} ({a.id_fisico || a.id_interno || 's/brinco'})</option>)}
                </select>
                {erros.animal_uuid && <span className={styles.errorMsg}>{erros.animal_uuid}</span>}
              </div>
              <div>
                <label className={styles.selectLabel}>Tipo</label>
                <select name="tipo" className={`${styles.select} ${erros.tipo ? styles.selectError : ''}`} value={form.tipo} onChange={handleChange}>
                  <option value="" disabled>Selecione</option>
                  {TIPOS_MEDICAMENTO.map(t => <option key={t} value={t}>{TIPOS_MEDICAMENTO_LABELS[t] || t}</option>)}
                </select>
                {erros.tipo && <span className={styles.errorMsg}>{erros.tipo}</span>}
              </div>
              <Input id="produto" name="produto" label="Produto / Medicamento" placeholder="Ex: Ivermectina 1%" value={form.produto} onChange={handleChange} error={erros.produto} variant="dark" />
              <Input id="dose" name="dose" label="Dose aplicada" placeholder="Ex: 5ml" value={form.dose} onChange={handleChange} error={erros.dose} variant="dark" />
              <Input id="data_aplicacao" name="data_aplicacao" type="date" label="Data de aplicação" value={form.data_aplicacao} onChange={handleChange} error={erros.data_aplicacao} variant="dark" />
              <Input id="carencia_dias" name="carencia_dias" type="number" label="Período de carência (dias)" placeholder="Ex: 30" value={form.carencia_dias} onChange={handleChange} error={erros.carencia_dias} inputMode="numeric" variant="dark" />
              <Input id="responsavel" name="responsavel" label="Responsável (opcional)" placeholder="Nome" value={form.responsavel} onChange={handleChange} variant="dark" />
              <div className={styles.formGridFull}>
                <label className={styles.selectLabel}>Observações (opcional)</label>
                <textarea name="observacao" className={styles.textarea} placeholder="Motivo do tratamento, reações observadas..." value={form.observacao} onChange={handleChange} rows={3} />
              </div>
            </div>
            {erros.geral && <p className={styles.errorMsg}>{erros.geral}</p>}
            <div className={styles.formActions}>
              <Button type="button" variant="ghost" onClick={() => setMostrarForm(false)}>Cancelar</Button>
              <Button type="submit">Salvar Tratamento</Button>
            </div>
          </form>
        </div>
      )}

      {sucesso && <p className={styles.successToast}>✓ Tratamento registrado com sucesso!</p>}
    </div>
  )
}

// ─── ABA OCORRÊNCIAS ────────────────────────────────────────────────────────
function AbaOcorrencias({ propriedadeId, animalPreSelecionado }) {
  const { animais } = useAnimais(propriedadeId)
  const { ocorrencias, carregando, registrarOcorrencia, editarOcorrencia } = useOcorrencias(propriedadeId, 'propriedade')
  const [mostrarForm, setMostrarForm] = useState(!!animalPreSelecionado)
  const [form, setForm] = useState({
    animal_uuid: animalPreSelecionado || '', data: '', sintomas: '',
    tratamento: '', resultado: '', veterinario: '',
  })
  const [erros, setErros] = useState({})
  const [sucesso, setSucesso] = useState(false)
  const [expandido, setExpandido] = useState(null)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (erros[name]) setErros(prev => ({ ...prev, [name]: '' }))
    setSucesso(false)
  }

  async function handleSalvar(e) {
    e.preventDefault()
    const errsLocal = {}
    if (!form.animal_uuid) errsLocal.animal_uuid = 'Selecione o animal'
    if (!form.data) errsLocal.data = 'Informe a data'
    if (!form.sintomas.trim()) errsLocal.sintomas = 'Descreva os sintomas'
    if (Object.keys(errsLocal).length) { setErros(errsLocal); return }

    try {
      await registrarOcorrencia({
        ...form,
        propriedade_uuid: propriedadeId,
      })
      setForm({ animal_uuid: '', data: '', sintomas: '', tratamento: '', resultado: '', veterinario: '' })
      setErros({})
      setSucesso(true)
      setMostrarForm(false)
    } catch (err) {
      setErros({ geral: err.message })
    }
  }

  return (
    <div>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>🩺 Ocorrências Clínicas</span>
          <button className={styles.addBtn} onClick={() => setMostrarForm(v => !v)}>
            {mostrarForm ? '✕ Fechar' : '+ Nova Ocorrência'}
          </button>
        </div>

        {carregando ? (
          <div className={styles.emptyState}>Carregando...</div>
        ) : ocorrencias.length === 0 && !mostrarForm ? (
          <div className={styles.emptyState}>Nenhuma ocorrência registrada.</div>
        ) : ocorrencias.length > 0 ? (
          <div className={styles.logList}>
            {ocorrencias.map(oc => {
              const cls = RESULTADOS_CLS[oc.resultado] || 'tagCinza'
              const resultadoLabel = RESULTADOS_OCORRENCIA_LABELS[oc.resultado] || oc.resultado || 'Aguardando'
              const aberto = expandido === oc.uuid
              return (
                <div key={oc.uuid} className={styles.ocorrenciaItem}>
                  <div className={styles.ocorrenciaHeader} onClick={() => setExpandido(aberto ? null : oc.uuid)}>
                    <div className={styles.logInfo}>
                      <span className={styles.logTitle}>{oc.nome_animal || 'Animal'}{oc.id_fisico ? ` (${oc.id_fisico})` : ''}</span>
                      <span className={styles.logMeta}>{formatarData(oc.data)}{oc.veterinario ? ` · Dr(a). ${oc.veterinario}` : ''}</span>
                      <span className={styles.logObs}>{oc.sintomas.substring(0, 80)}{oc.sintomas.length > 80 ? '…' : ''}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                      <span className={styles[cls]}>{resultadoLabel}</span>
                      <span className={styles.expandBtn}>{aberto ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {aberto && (
                    <div className={styles.ocorrenciaBody}>
                      <div className={styles.ocorrenciaField}><strong>Sintomas:</strong> {oc.sintomas}</div>
                      {oc.tratamento && <div className={styles.ocorrenciaField}><strong>Tratamento:</strong> {oc.tratamento}</div>}
                      {oc.resultado && <div className={styles.ocorrenciaField}><strong>Resultado:</strong> {resultadoLabel}</div>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : null}
      </div>

      {mostrarForm && (
        <div className={styles.card} style={{ marginTop: 16 }}>
          <p className={styles.cardTitle}>Registrar Ocorrência</p>
          <form onSubmit={handleSalvar} noValidate>
            <div className={styles.formGrid}>
              <div>
                <label className={styles.selectLabel}>Animal</label>
                <select name="animal_uuid" className={`${styles.select} ${erros.animal_uuid ? styles.selectError : ''}`} value={form.animal_uuid} onChange={handleChange}>
                  <option value="" disabled>Selecione</option>
                  {animais.map(a => <option key={a.uuid} value={a.uuid}>{a.nome} ({a.id_fisico || a.id_interno || 's/brinco'})</option>)}
                </select>
                {erros.animal_uuid && <span className={styles.errorMsg}>{erros.animal_uuid}</span>}
              </div>
              <Input id="data" name="data" type="date" label="Data da ocorrência" value={form.data} onChange={handleChange} error={erros.data} variant="dark" />
              <Input id="veterinario" name="veterinario" label="Veterinário (opcional)" placeholder="Nome do profissional" value={form.veterinario} onChange={handleChange} variant="dark" />
              <div>
                <label className={styles.selectLabel}>Resultado</label>
                <select name="resultado" className={styles.select} value={form.resultado} onChange={handleChange}>
                  <option value="">Aguardando avaliação</option>
                  {RESULTADOS_OCORRENCIA.map(r => <option key={r} value={r}>{RESULTADOS_OCORRENCIA_LABELS[r] || r}</option>)}
                </select>
              </div>
              <div className={styles.formGridFull}>
                <label className={styles.selectLabel}>Sintomas observados *</label>
                <textarea name="sintomas" className={`${styles.textarea} ${erros.sintomas ? styles.selectError : ''}`} placeholder="Descreva os sintomas em detalhes..." value={form.sintomas} onChange={handleChange} rows={3} />
                {erros.sintomas && <span className={styles.errorMsg}>{erros.sintomas}</span>}
              </div>
              <div className={styles.formGridFull}>
                <label className={styles.selectLabel}>Tratamento aplicado (opcional)</label>
                <textarea name="tratamento" className={styles.textarea} placeholder="Medicamentos, procedimentos realizados..." value={form.tratamento} onChange={handleChange} rows={3} />
              </div>
            </div>
            {erros.geral && <p className={styles.errorMsg}>{erros.geral}</p>}
            <div className={styles.formActions}>
              <Button type="button" variant="ghost" onClick={() => setMostrarForm(false)}>Cancelar</Button>
              <Button type="submit">Registrar</Button>
            </div>
          </form>
        </div>
      )}

      {sucesso && <p className={styles.successToast}>✓ Ocorrência registrada!</p>}
    </div>
  )
}

// ─── ABA LOCALIZAÇÃO ────────────────────────────────────────────────────────
const AREAS_PADRAO = ['Pasto Norte', 'Pasto Sul', 'Curral Central', 'Cocheira', 'Área de Quarentena', 'Bebedouro Leste']

function AbaLocalizacao({ propriedadeId, animalPreSelecionado }) {
  const { animais } = useAnimais(propriedadeId)
  const [movimentacoes, setMovimentacoes] = useState([])
  const [carregandoMov, setCarregandoMov] = useState(true)
  const [historicoAberto, setHistoricoAberto] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState({ animal_uuid: animalPreSelecionado || '', area: '', areaCustom: '', tipo: 'sono', data: '', hora: '', observacao: '' })
  const [erros, setErros] = useState({})
  const [sucesso, setSucesso] = useState(false)

  const carregarMov = useCallback(async () => {
    setCarregandoMov(true)
    try {
      const dados = await movimentacoesService.listarMovimentacoesPropriedade(propriedadeId)
      setMovimentacoes(dados)
    } finally {
      setCarregandoMov(false)
    }
  }, [propriedadeId])

  useEffect(() => { carregarMov() }, [carregarMov])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (erros[name]) setErros(prev => ({ ...prev, [name]: '' }))
    setSucesso(false)
  }

  async function handleSalvar(e) {
    e.preventDefault()
    const errsLocal = {}
    if (!form.animal_uuid) errsLocal.animal_uuid = 'Selecione o animal'
    if (!form.area && !form.areaCustom.trim()) errsLocal.area = 'Selecione ou informe a área'
    if (!form.data) errsLocal.data = 'Informe a data'
    if (Object.keys(errsLocal).length) { setErros(errsLocal); return }

    try {
      await movimentacoesService.registrarMovimentacao({
        animal_uuid: form.animal_uuid,
        propriedade_uuid: propriedadeId,
        data: form.data,
        hora: form.hora || null,
        tipo: form.tipo,
        area: form.areaCustom.trim() || form.area,
        observacao: form.observacao || null,
      })
      await carregarMov()
      setForm({ animal_uuid: '', area: '', areaCustom: '', tipo: 'sono', data: '', hora: '', observacao: '' })
      setErros({})
      setSucesso(true)
      setMostrarForm(false)
    } catch (err) {
      setErros({ geral: err.message })
    }
  }

  const TIPO_LABELS = { sono: { label: '🌙 Sono', cls: 'tagCinza' }, alimentacao: { label: '🌿 Alimentação', cls: 'tagVerde' }, pastagem: { label: '☀️ Pastagem', cls: 'tagAmarelo' }, tratamento: { label: '💊 Tratamento', cls: 'tagVermelho' }, outro: { label: '📌 Outro', cls: 'tagCinza' } }

  const porAnimal = movimentacoes.reduce((acc, m) => {
    const chave = m.nome_animal ? `${m.nome_animal}${m.id_fisico ? ` (${m.id_fisico})` : ''}` : 'Desconhecido'
    if (!acc[chave]) acc[chave] = []
    acc[chave].push(m)
    return acc
  }, {})

  return (
    <div>
      {/* Visão atual */}
      {Object.keys(porAnimal).length > 0 && (
        <div className={styles.card}>
          <p className={styles.cardTitle}>📍 Localização Atual dos Animais</p>
          <div className={styles.locGrid}>
            {Object.entries(porAnimal).map(([animal, movs]) => {
              const ultimo = movs[0]
              const t = TIPO_LABELS[ultimo.tipo] || TIPO_LABELS.outro
              return (
                <div key={animal} className={styles.locCard}>
                  <span className={styles.locAnimal}>{animal}</span>
                  <span className={styles.locArea}>{ultimo.area}</span>
                  <span className={styles[t.cls]}>{t.label}</span>
                  <span className={styles.locData}>{formatarData(ultimo.data)}{ultimo.hora ? ` às ${ultimo.hora}` : ''}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className={styles.card} style={{ marginTop: Object.keys(porAnimal).length > 0 ? 16 : 0 }}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>🔄 Movimentações</span>
          <div className={styles.actionsRow}>
            <button className={styles.addBtn} onClick={() => setHistoricoAberto(v => !v)}>
              {historicoAberto ? '▾ Ocultar histórico' : `▸ Ver histórico (${movimentacoes.length})`}
            </button>
            <button className={styles.addBtn} onClick={() => setMostrarForm(v => !v)}>
              {mostrarForm ? '✕ Fechar' : '+ Registrar Movimentação'}
            </button>
          </div>
        </div>

        {carregandoMov ? (
          <div className={styles.emptyState}>Carregando...</div>
        ) : !historicoAberto ? (
          <div className={styles.emptyState}>
            {movimentacoes.length === 0
              ? 'Nenhuma movimentação registrada. Use o botão acima para começar.'
              : `${movimentacoes.length} registro${movimentacoes.length === 1 ? '' : 's'} persistido${movimentacoes.length === 1 ? '' : 's'} na propriedade. Expanda o histórico para ver detalhes.`}
          </div>
        ) : movimentacoes.length === 0 ? (
          <div className={styles.emptyState}>Nenhuma movimentação registrada.</div>
        ) : (
          <div className={styles.logList}>
            {movimentacoes.map(m => {
              const t = TIPO_LABELS[m.tipo] || TIPO_LABELS.outro
              const animalLabel = m.nome_animal ? `${m.nome_animal}${m.id_fisico ? ` (${m.id_fisico})` : ''}` : 'Desconhecido'
              return (
                <div key={m.uuid || m.id} className={styles.logItem}>
                  <div className={styles.logInfo}>
                    <span className={styles.logTitle}>{animalLabel}</span>
                    <span className={styles.logMeta}>{m.area} · {formatarData(m.data)}{m.hora ? ` às ${m.hora}` : ''}</span>
                    {m.observacao && <span className={styles.logObs}>{m.observacao}</span>}
                  </div>
                  <span className={styles[t.cls]}>{t.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {mostrarForm && (
        <div className={styles.card} style={{ marginTop: 16 }}>
          <p className={styles.cardTitle}>Registrar Movimentação</p>
          <form onSubmit={handleSalvar} noValidate>
            <div className={styles.formGrid}>
              <div>
                <label className={styles.selectLabel}>Animal</label>
                <select name="animal_uuid" className={`${styles.select} ${erros.animal_uuid ? styles.selectError : ''}`} value={form.animal_uuid} onChange={handleChange}>
                  <option value="" disabled>Selecione</option>
                  {animais.map(a => <option key={a.uuid} value={a.uuid}>{a.nome} ({a.id_fisico || a.id_interno || 's/brinco'})</option>)}
                </select>
                {erros.animal_uuid && <span className={styles.errorMsg}>{erros.animal_uuid}</span>}
              </div>
              <div>
                <label className={styles.selectLabel}>Tipo de atividade</label>
                <select name="tipo" className={styles.select} value={form.tipo} onChange={handleChange}>
                  <option value="sono">🌙 Sono / Descanso</option>
                  <option value="alimentacao">🌿 Alimentação</option>
                  <option value="pastagem">☀️ Pastagem</option>
                  <option value="tratamento">💊 Tratamento</option>
                  <option value="outro">📌 Outro</option>
                </select>
              </div>
              <div>
                <label className={styles.selectLabel}>Área da fazenda</label>
                <select name="area" className={`${styles.select} ${erros.area ? styles.selectError : ''}`} value={form.area} onChange={handleChange}>
                  <option value="">Selecione ou preencha abaixo</option>
                  {AREAS_PADRAO.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                {erros.area && <span className={styles.errorMsg}>{erros.area}</span>}
              </div>
              <Input id="areaCustom" name="areaCustom" label="Ou informe área personalizada" placeholder="Ex: Piquete 7-B" value={form.areaCustom} onChange={handleChange} variant="dark" />
              <Input id="data" name="data" type="date" label="Data" value={form.data} onChange={handleChange} error={erros.data} variant="dark" />
              <Input id="hora" name="hora" type="time" label="Hora (opcional)" value={form.hora} onChange={handleChange} variant="dark" />
              <div className={styles.formGridFull}>
                <label className={styles.selectLabel}>Observações (opcional)</label>
                <textarea name="observacao" className={styles.textarea} placeholder="Condição do animal, comportamento observado..." value={form.observacao} onChange={handleChange} rows={2} />
              </div>
            </div>
            <div className={styles.formActions}>
              <Button type="button" variant="ghost" onClick={() => setMostrarForm(false)}>Cancelar</Button>
              <Button type="submit">Registrar</Button>
            </div>
          </form>
        </div>
      )}

      {sucesso && <p className={styles.successToast}>✓ Movimentação registrada!</p>}
    </div>
  )
}

export default HealthModule
