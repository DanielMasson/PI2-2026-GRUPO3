import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styles from './HealthModule.module.css'
import Button from '../../components/Button/index.jsx'
import Input from '../../components/Input/index.jsx'

// ─── Dados iniciais (mock) ──────────────────────────────────────────────────
const VACINAS_PADRAO = [
  { id: 1, nome: 'Febre Aftosa', proxima: '2025-07-15', ciclo: 180, obrigatoria: true },
  { id: 2, nome: 'Brucelose', proxima: '2025-08-01', ciclo: 365, obrigatoria: true },
  { id: 3, nome: 'Clostridioses', proxima: '2025-06-20', ciclo: 180, obrigatoria: false },
  { id: 4, nome: 'Raiva', proxima: '2025-09-10', ciclo: 365, obrigatoria: false },
]

const ANIMAIS_MOCK = ['Mimosa (BR-00142)', 'Trovão (BR-00201)', 'Estrela (BR-00310)', 'Gaúcho (BR-00415)']

function diasAte(dataStr) {
  const hoje = new Date()
  const alvo = new Date(dataStr + 'T00:00:00')
  return Math.ceil((alvo - hoje) / 86400000)
}

function formatarData(dataStr) {
  return new Date(dataStr + 'T00:00:00').toLocaleDateString('pt-BR')
}

// ─── Componente Principal ───────────────────────────────────────────────────
function HealthModule() {
  const navigate = useNavigate()
  const { propriedadeId } = useParams()
  const [abaAtiva, setAbaAtiva] = useState('vacinas')

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        {/* Topbar */}
        <div className={styles.topbar}>
          <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>←</button>
          <div>
            <h1 className={styles.pageTitle}>Módulo de Saúde</h1>
            <p className={styles.pageSubtitle}>Propriedade: <strong>{propriedadeId}</strong></p>
          </div>
        </div>

        {/* Abas */}
        <div className={styles.tabs}>
          {[
            { id: 'vacinas',      label: 'Vacinas',       icon: '💉' },
            { id: 'medicamentos', label: 'Medicamentos',  icon: '💊' },
            { id: 'ocorrencias',  label: 'Ocorrências',   icon: '🩺' },
            { id: 'localizacao',  label: 'Localização',   icon: '📍' },
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
        <div className={styles.content}>
          {abaAtiva === 'vacinas'      && <AbaVacinas />}
          {abaAtiva === 'medicamentos' && <AbaMedicamentos />}
          {abaAtiva === 'ocorrencias'  && <AbaOcorrencias />}
          {abaAtiva === 'localizacao'  && <AbaLocalizacao />}
        </div>
      </div>
    </div>
  )
}

// ─── ABA VACINAS ────────────────────────────────────────────────────────────
function AbaVacinas() {
  const [vacinas] = useState(VACINAS_PADRAO)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [registros, setRegistros] = useState([])
  const [form, setForm] = useState({ vacinaId: '', animal: '', data: '', lote: '', responsavel: '' })
  const [erros, setErros] = useState({})
  const [sucesso, setSucesso] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (erros[name]) setErros(prev => ({ ...prev, [name]: '' }))
    setSucesso(false)
  }

  function handleRegistrar(e) {
    e.preventDefault()
    const errsLocal = {}
    if (!form.vacinaId) errsLocal.vacinaId = 'Selecione a vacina'
    if (!form.animal) errsLocal.animal = 'Selecione o animal'
    if (!form.data) errsLocal.data = 'Informe a data'
    if (!form.lote.trim()) errsLocal.lote = 'Informe o lote'
    if (!form.responsavel.trim()) errsLocal.responsavel = 'Informe o responsável'
    if (Object.keys(errsLocal).length) { setErros(errsLocal); return }

    const vacina = vacinas.find(v => v.id === Number(form.vacinaId))
    setRegistros(prev => [
      {
        id: Date.now(),
        vacina: vacina?.nome,
        animal: form.animal,
        data: form.data,
        lote: form.lote,
        responsavel: form.responsavel,
      },
      ...prev,
    ])
    setForm({ vacinaId: '', animal: '', data: '', lote: '', responsavel: '' })
    setErros({})
    setSucesso(true)
    setMostrarForm(false)
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

        <div className={styles.vacinaList}>
          {vacinas.map(v => {
            const dias = diasAte(v.proxima)
            const urgencia = dias < 0 ? 'vencida' : dias <= 7 ? 'urgente' : dias <= 30 ? 'proxima' : 'ok'
            return (
              <div key={v.id} className={`${styles.vacinaItem} ${styles[urgencia]}`}>
                <div className={styles.vacinaInfo}>
                  <span className={styles.vacinaNome}>{v.nome}</span>
                  <span className={styles.vacinaMeta}>
                    Ciclo: {v.ciclo} dias &nbsp;·&nbsp; Próxima dose: {formatarData(v.proxima)}
                  </span>
                </div>
                <div className={styles.vacinaRight}>
                  {v.obrigatoria && <span className={styles.badge}>Obrigatória</span>}
                  <span className={`${styles.diasBadge} ${styles[urgencia]}`}>
                    {dias < 0 ? `${Math.abs(dias)}d atraso` : dias === 0 ? 'Hoje!' : `${dias}d`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Formulário de registro */}
      {mostrarForm && (
        <div className={styles.card} style={{ marginTop: 16 }}>
          <p className={styles.cardTitle}>Registrar Aplicação</p>
          <form onSubmit={handleRegistrar} noValidate>
            <div className={styles.formGrid}>
              <div>
                <label className={styles.selectLabel}>Vacina</label>
                <select name="vacinaId" className={`${styles.select} ${erros.vacinaId ? styles.selectError : ''}`} value={form.vacinaId} onChange={handleChange}>
                  <option value="" disabled>Selecione</option>
                  {VACINAS_PADRAO.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
                </select>
                {erros.vacinaId && <span className={styles.errorMsg}>{erros.vacinaId}</span>}
              </div>
              <div>
                <label className={styles.selectLabel}>Animal</label>
                <select name="animal" className={`${styles.select} ${erros.animal ? styles.selectError : ''}`} value={form.animal} onChange={handleChange}>
                  <option value="" disabled>Selecione</option>
                  {ANIMAIS_MOCK.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                {erros.animal && <span className={styles.errorMsg}>{erros.animal}</span>}
              </div>
              <Input id="data" name="data" type="date" label="Data de aplicação" value={form.data} onChange={handleChange} error={erros.data} />
              <Input id="lote" name="lote" label="Lote da vacina" placeholder="Ex: LT-2024-001" value={form.lote} onChange={handleChange} error={erros.lote} />
              <div className={styles.formGridFull}>
                <Input id="responsavel" name="responsavel" label="Responsável" placeholder="Nome do aplicador" value={form.responsavel} onChange={handleChange} error={erros.responsavel} />
              </div>
            </div>
            <div className={styles.formActions}>
              <Button type="button" variant="ghost" onClick={() => setMostrarForm(false)}>Cancelar</Button>
              <Button type="submit">Salvar Registro</Button>
            </div>
          </form>
        </div>
      )}

      {sucesso && <p className={styles.successToast}>✓ Aplicação registrada com sucesso!</p>}

      {/* Histórico */}
      {registros.length > 0 && (
        <div className={styles.card} style={{ marginTop: 16 }}>
          <p className={styles.cardTitle}>Histórico de Aplicações ({registros.length})</p>
          <div className={styles.logList}>
            {registros.map(r => (
              <div key={r.id} className={styles.logItem}>
                <div className={styles.logInfo}>
                  <span className={styles.logTitle}>{r.vacina}</span>
                  <span className={styles.logMeta}>{r.animal} · Lote: {r.lote} · {formatarData(r.data)}</span>
                  <span className={styles.logMeta}>Responsável: {r.responsavel}</span>
                </div>
                <span className={styles.tagVerde}>Aplicada</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ABA MEDICAMENTOS ───────────────────────────────────────────────────────
function AbaMedicamentos() {
  const [registros, setRegistros] = useState([])
  const [form, setForm] = useState({ animal: '', tipo: '', produto: '', dose: '', data: '', carencia: '', responsavel: '', observacao: '' })
  const [erros, setErros] = useState({})
  const [mostrarForm, setMostrarForm] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (erros[name]) setErros(prev => ({ ...prev, [name]: '' }))
    setSucesso(false)
  }

  function handleSalvar(e) {
    e.preventDefault()
    const errsLocal = {}
    if (!form.animal) errsLocal.animal = 'Selecione o animal'
    if (!form.tipo) errsLocal.tipo = 'Selecione o tipo'
    if (!form.produto.trim()) errsLocal.produto = 'Informe o produto'
    if (!form.dose.trim()) errsLocal.dose = 'Informe a dose'
    if (!form.data) errsLocal.data = 'Informe a data'
    if (!form.carencia) errsLocal.carencia = 'Informe a carência (dias)'
    if (Object.keys(errsLocal).length) { setErros(errsLocal); return }

    const dataAplicacao = new Date(form.data + 'T00:00:00')
    const dataLiberacao = new Date(dataAplicacao)
    dataLiberacao.setDate(dataLiberacao.getDate() + Number(form.carencia))

    setRegistros(prev => [{
      id: Date.now(),
      ...form,
      dataLiberacao: dataLiberacao.toISOString().split('T')[0],
    }, ...prev])

    setForm({ animal: '', tipo: '', produto: '', dose: '', data: '', carencia: '', responsavel: '', observacao: '' })
    setErros({})
    setSucesso(true)
    setMostrarForm(false)
  }

  function statusCarencia(dataLiberacao) {
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

        {registros.length === 0 && !mostrarForm && (
          <div className={styles.emptyState}>Nenhum tratamento registrado. Clique em "+ Novo Tratamento" para começar.</div>
        )}

        {registros.length > 0 && (
          <div className={styles.logList}>
            {registros.map(r => {
              const st = statusCarencia(r.dataLiberacao)
              return (
                <div key={r.id} className={styles.logItem}>
                  <div className={styles.logInfo}>
                    <span className={styles.logTitle}>{r.produto} <em style={{ fontWeight: 400, fontSize: '0.85em' }}>({r.tipo})</em></span>
                    <span className={styles.logMeta}>{r.animal} · {r.dose} · Aplicado: {formatarData(r.data)}</span>
                    <span className={styles.logMeta}>Liberação: {formatarData(r.dataLiberacao)}{r.responsavel ? ` · ${r.responsavel}` : ''}</span>
                    {r.observacao && <span className={styles.logObs}>{r.observacao}</span>}
                  </div>
                  <span className={`${styles[st.cls]}`}>{st.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {mostrarForm && (
        <div className={styles.card} style={{ marginTop: 16 }}>
          <p className={styles.cardTitle}>Registrar Tratamento</p>
          <form onSubmit={handleSalvar} noValidate>
            <div className={styles.formGrid}>
              <div>
                <label className={styles.selectLabel}>Animal</label>
                <select name="animal" className={`${styles.select} ${erros.animal ? styles.selectError : ''}`} value={form.animal} onChange={handleChange}>
                  <option value="" disabled>Selecione</option>
                  {ANIMAIS_MOCK.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                {erros.animal && <span className={styles.errorMsg}>{erros.animal}</span>}
              </div>
              <div>
                <label className={styles.selectLabel}>Tipo</label>
                <select name="tipo" className={`${styles.select} ${erros.tipo ? styles.selectError : ''}`} value={form.tipo} onChange={handleChange}>
                  <option value="" disabled>Selecione</option>
                  <option>Antibiótico</option>
                  <option>Vermífugo</option>
                  <option>Anti-inflamatório</option>
                  <option>Suplemento</option>
                  <option>Antiparasitário</option>
                  <option>Outro</option>
                </select>
                {erros.tipo && <span className={styles.errorMsg}>{erros.tipo}</span>}
              </div>
              <Input id="produto" name="produto" label="Produto / Medicamento" placeholder="Ex: Ivermectina 1%" value={form.produto} onChange={handleChange} error={erros.produto} />
              <Input id="dose" name="dose" label="Dose aplicada" placeholder="Ex: 5ml" value={form.dose} onChange={handleChange} error={erros.dose} />
              <Input id="data" name="data" type="date" label="Data de aplicação" value={form.data} onChange={handleChange} error={erros.data} />
              <Input id="carencia" name="carencia" type="number" label="Período de carência (dias)" placeholder="Ex: 30" value={form.carencia} onChange={handleChange} error={erros.carencia} inputMode="numeric" />
              <Input id="responsavel" name="responsavel" label="Responsável (opcional)" placeholder="Nome" value={form.responsavel} onChange={handleChange} />
              <div className={styles.formGridFull}>
                <label className={styles.selectLabel}>Observações (opcional)</label>
                <textarea name="observacao" className={styles.textarea} placeholder="Motivo do tratamento, reações observadas..." value={form.observacao} onChange={handleChange} rows={3} />
              </div>
            </div>
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
function AbaOcorrencias() {
  const [ocorrencias, setOcorrencias] = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState({ animal: '', data: '', sintomas: '', tratamento: '', resultado: '', veterinario: '' })
  const [erros, setErros] = useState({})
  const [sucesso, setSucesso] = useState(false)
  const [expandido, setExpandido] = useState(null)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (erros[name]) setErros(prev => ({ ...prev, [name]: '' }))
    setSucesso(false)
  }

  function handleSalvar(e) {
    e.preventDefault()
    const errsLocal = {}
    if (!form.animal) errsLocal.animal = 'Selecione o animal'
    if (!form.data) errsLocal.data = 'Informe a data'
    if (!form.sintomas.trim()) errsLocal.sintomas = 'Descreva os sintomas'
    if (Object.keys(errsLocal).length) { setErros(errsLocal); return }

    setOcorrencias(prev => [{ id: Date.now(), ...form }, ...prev])
    setForm({ animal: '', data: '', sintomas: '', tratamento: '', resultado: '', veterinario: '' })
    setErros({})
    setSucesso(true)
    setMostrarForm(false)
  }

  const RESULTADOS = { Recuperado: 'tagVerde', 'Em tratamento': 'tagAmarelo', Óbito: 'tagVermelho', 'Aguardando avaliação': 'tagCinza' }

  return (
    <div>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>🩺 Ocorrências Clínicas</span>
          <button className={styles.addBtn} onClick={() => setMostrarForm(v => !v)}>
            {mostrarForm ? '✕ Fechar' : '+ Nova Ocorrência'}
          </button>
        </div>

        {ocorrencias.length === 0 && !mostrarForm && (
          <div className={styles.emptyState}>Nenhuma ocorrência registrada.</div>
        )}

        {ocorrencias.length > 0 && (
          <div className={styles.logList}>
            {ocorrencias.map(oc => {
              const cls = RESULTADOS[oc.resultado] || 'tagCinza'
              const aberto = expandido === oc.id
              return (
                <div key={oc.id} className={styles.ocorrenciaItem}>
                  <div className={styles.ocorrenciaHeader} onClick={() => setExpandido(aberto ? null : oc.id)}>
                    <div className={styles.logInfo}>
                      <span className={styles.logTitle}>{oc.animal}</span>
                      <span className={styles.logMeta}>{formatarData(oc.data)}{oc.veterinario ? ` · Dr(a). ${oc.veterinario}` : ''}</span>
                      <span className={styles.logObs}>{oc.sintomas.substring(0, 80)}{oc.sintomas.length > 80 ? '…' : ''}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                      {oc.resultado && <span className={styles[cls]}>{oc.resultado}</span>}
                      <span className={styles.expandBtn}>{aberto ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {aberto && (
                    <div className={styles.ocorrenciaBody}>
                      <div className={styles.ocorrenciaField}><strong>Sintomas:</strong> {oc.sintomas}</div>
                      {oc.tratamento && <div className={styles.ocorrenciaField}><strong>Tratamento:</strong> {oc.tratamento}</div>}
                      {oc.resultado && <div className={styles.ocorrenciaField}><strong>Resultado:</strong> {oc.resultado}</div>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {mostrarForm && (
        <div className={styles.card} style={{ marginTop: 16 }}>
          <p className={styles.cardTitle}>Registrar Ocorrência</p>
          <form onSubmit={handleSalvar} noValidate>
            <div className={styles.formGrid}>
              <div>
                <label className={styles.selectLabel}>Animal</label>
                <select name="animal" className={`${styles.select} ${erros.animal ? styles.selectError : ''}`} value={form.animal} onChange={handleChange}>
                  <option value="" disabled>Selecione</option>
                  {ANIMAIS_MOCK.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                {erros.animal && <span className={styles.errorMsg}>{erros.animal}</span>}
              </div>
              <Input id="data" name="data" type="date" label="Data da ocorrência" value={form.data} onChange={handleChange} error={erros.data} />
              <Input id="veterinario" name="veterinario" label="Veterinário (opcional)" placeholder="Nome do profissional" value={form.veterinario} onChange={handleChange} />
              <div>
                <label className={styles.selectLabel}>Resultado</label>
                <select name="resultado" className={styles.select} value={form.resultado} onChange={handleChange}>
                  <option value="">Aguardando avaliação</option>
                  <option>Em tratamento</option>
                  <option>Recuperado</option>
                  <option>Óbito</option>
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

function AbaLocalizacao() {
  const [movimentacoes, setMovimentacoes] = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState({ animal: '', area: '', areaCustom: '', tipo: 'sono', data: '', hora: '', observacao: '' })
  const [erros, setErros] = useState({})
  const [sucesso, setSucesso] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (erros[name]) setErros(prev => ({ ...prev, [name]: '' }))
    setSucesso(false)
  }

  function handleSalvar(e) {
    e.preventDefault()
    const errsLocal = {}
    if (!form.animal) errsLocal.animal = 'Selecione o animal'
    if (!form.area && !form.areaCustom.trim()) errsLocal.area = 'Selecione ou informe a área'
    if (!form.data) errsLocal.data = 'Informe a data'
    if (Object.keys(errsLocal).length) { setErros(errsLocal); return }

    setMovimentacoes(prev => [{
      id: Date.now(),
      animal: form.animal,
      area: form.areaCustom.trim() || form.area,
      tipo: form.tipo,
      data: form.data,
      hora: form.hora,
      observacao: form.observacao,
    }, ...prev])

    setForm({ animal: '', area: '', areaCustom: '', tipo: 'sono', data: '', hora: '', observacao: '' })
    setErros({})
    setSucesso(true)
    setMostrarForm(false)
  }

  const TIPO_LABELS = { sono: { label: '🌙 Sono', cls: 'tagCinza' }, alimentacao: { label: '🌿 Alimentação', cls: 'tagVerde' }, pastagem: { label: '☀️ Pastagem', cls: 'tagAmarelo' }, tratamento: { label: '💊 Tratamento', cls: 'tagVermelho' }, outro: { label: '📌 Outro', cls: 'tagCinza' } }

  // Agrupar por animal para visão de onde cada um está
  const porAnimal = movimentacoes.reduce((acc, m) => {
    if (!acc[m.animal]) acc[m.animal] = []
    acc[m.animal].push(m)
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
          <button className={styles.addBtn} onClick={() => setMostrarForm(v => !v)}>
            {mostrarForm ? '✕ Fechar' : '+ Registrar Movimentação'}
          </button>
        </div>

        {movimentacoes.length === 0 && !mostrarForm && (
          <div className={styles.emptyState}>Nenhuma movimentação registrada.</div>
        )}

        {movimentacoes.length > 0 && (
          <div className={styles.logList}>
            {movimentacoes.map(m => {
              const t = TIPO_LABELS[m.tipo] || TIPO_LABELS.outro
              return (
                <div key={m.id} className={styles.logItem}>
                  <div className={styles.logInfo}>
                    <span className={styles.logTitle}>{m.animal}</span>
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
                <select name="animal" className={`${styles.select} ${erros.animal ? styles.selectError : ''}`} value={form.animal} onChange={handleChange}>
                  <option value="" disabled>Selecione</option>
                  {ANIMAIS_MOCK.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                {erros.animal && <span className={styles.errorMsg}>{erros.animal}</span>}
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
              <Input id="areaCustom" name="areaCustom" label="Ou informe área personalizada" placeholder="Ex: Piquete 7-B" value={form.areaCustom} onChange={handleChange} />
              <Input id="data" name="data" type="date" label="Data" value={form.data} onChange={handleChange} error={erros.data} />
              <Input id="hora" name="hora" type="time" label="Hora (opcional)" value={form.hora} onChange={handleChange} />
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
