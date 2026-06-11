import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styles from './AnimalHealthProfile.module.css'
import Button from '../../components/Button/index.jsx'
import Input from '../../components/Input/index.jsx'
import { ANIMAIS_SAUDE, diasAte, formatarData, calcularStatusAnimal } from '../data/healthData.js'

// ─── Utilitários ───────────────────────────────────────────────────────────

function getUrgenciaVacina(proxima) {
  const d = diasAte(proxima)
  if (d < 0) return 'vencida'
  if (d <= 7) return 'urgente'
  if (d <= 30) return 'proxima'
  return 'ok'
}

const STATUS_CONFIG = {
  urgente: { label: 'Urgente', color: '#e74c3c', bg: 'rgba(231,76,60,0.15)' },
  atencao: { label: 'Atenção', color: '#e67e22', bg: 'rgba(230,126,34,0.15)' },
  ok:      { label: 'Ok',      color: '#82c341', bg: 'rgba(130,195,65,0.15)' },
}

// ─── Componente Principal ──────────────────────────────────────────────────

function AnimalHealthProfile() {
  const navigate = useNavigate()
  const { propriedadeId, animalId } = useParams()
  const [abaAtiva, setAbaAtiva] = useState('vacinas')

  const animalBase = ANIMAIS_SAUDE.find(a => a.id === animalId)

  if (!animalBase) {
    return (
      <div style={{ padding: 32, color: '#1a241a', fontFamily: 'Poppins, sans-serif' }}>
        <p>Animal não encontrado.</p>
        <button onClick={() => navigate(`/propriedade/${propriedadeId}/saude`)}>← Voltar</button>
      </div>
    )
  }

  // Estado local para dados editáveis (mock — futuramente via API)
  const [vacinas, setVacinas] = useState(animalBase.vacinas)
  const [medicamentos, setMedicamentos] = useState(animalBase.medicamentos)
  const [ferimentos, setFerimentos] = useState(animalBase.ferimentos)
  const [ocorrencias, setOcorrencias] = useState(animalBase.ocorrencias)

  const status = calcularStatusAnimal({ ...animalBase, vacinas, medicamentos, ferimentos, ocorrencias })
  const cfg = STATUS_CONFIG[status]

  const TABS = [
    { id: 'vacinas',      label: 'Vacinas',      icon: '💉' },
    { id: 'medicamentos', label: 'Medicamentos',  icon: '💊' },
    { id: 'ferimentos',   label: 'Ferimentos',    icon: '🩹' },
    { id: 'ocorrencias',  label: 'Ocorrências',   icon: '🩺' },
    { id: 'historico',    label: 'Histórico',     icon: '📋' },
  ]

  return (
    <div className={styles.screen}>

      {/* ── Topbar ── */}
      <header className={styles.topbar}>
        <button
          className={styles.backBtn}
          onClick={() => navigate(`/propriedade/${propriedadeId}/saude`)}
        >
          ←
        </button>
        <div className={styles.topbarInfo}>
          <div className={styles.animalName}>
            {animalBase.nome}
            <span style={{ fontWeight: 400, fontSize: '0.85em', marginLeft: 8, color: '#9b92b8' }}>
              {animalBase.brinco}
            </span>
          </div>
          <div className={styles.animalMeta}>
            {animalBase.raca} · {animalBase.sexo} · Lote {animalBase.lote}
          </div>
        </div>
        <span
          className={styles.statusBadge}
          style={{ backgroundColor: cfg.bg, color: cfg.color }}
        >
          {cfg.label}
        </span>
      </header>

      {/* ── Info rápida do animal ── */}
      <div className={styles.animalHeader}>
        <div className={styles.headerStat}>
          <span className={styles.headerStatLabel}>Peso</span>
          <span className={styles.headerStatValue}>{animalBase.peso} kg</span>
        </div>
        <div className={styles.headerStat}>
          <span className={styles.headerStatLabel}>Nascimento</span>
          <span className={styles.headerStatValue}>{formatarData(animalBase.dataNascimento)}</span>
        </div>
        <div className={styles.headerStat}>
          <span className={styles.headerStatLabel}>Sexo</span>
          <span className={styles.headerStatValue}>{animalBase.sexo}</span>
        </div>
        <div className={styles.headerStat}>
          <span className={styles.headerStatLabel}>Lote</span>
          <span className={styles.headerStatValue}>{animalBase.lote}</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${abaAtiva === tab.id ? styles.tabAtiva : ''}`}
            onClick={() => setAbaAtiva(tab.id)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Conteúdo ── */}
      <div className={styles.content}>
        {abaAtiva === 'vacinas'      && <AbaVacinas vacinas={vacinas} setVacinas={setVacinas} />}
        {abaAtiva === 'medicamentos' && <AbaMedicamentos medicamentos={medicamentos} setMedicamentos={setMedicamentos} />}
        {abaAtiva === 'ferimentos'   && <AbaFerimentos ferimentos={ferimentos} setFerimentos={setFerimentos} />}
        {abaAtiva === 'ocorrencias'  && <AbaOcorrencias ocorrencias={ocorrencias} setOcorrencias={setOcorrencias} />}
        {abaAtiva === 'historico'    && (
          <AbaHistorico
            vacinas={vacinas}
            medicamentos={medicamentos}
            ferimentos={ferimentos}
            ocorrencias={ocorrencias}
          />
        )}
      </div>

    </div>
  )
}

// ─── ABA VACINAS ────────────────────────────────────────────────────────────

function AbaVacinas({ vacinas, setVacinas }) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState({ nome: '', proxima: '', lote: '', responsavel: '', ciclo: '', obrigatoria: 'nao' })
  const [erros, setErros] = useState({})
  const [sucesso, setSucesso] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (erros[name]) setErros(p => ({ ...p, [name]: '' }))
    setSucesso(false)
  }

  function handleSalvar(e) {
    e.preventDefault()
    const errsLocal = {}
    if (!form.nome.trim()) errsLocal.nome = 'Informe o nome da vacina'
    if (!form.proxima) errsLocal.proxima = 'Informe a próxima dose'
    if (!form.lote.trim()) errsLocal.lote = 'Informe o lote'
    if (!form.responsavel.trim()) errsLocal.responsavel = 'Informe o responsável'
    if (Object.keys(errsLocal).length) { setErros(errsLocal); return }

    setVacinas(prev => [...prev, {
      id: Date.now(),
      nome: form.nome,
      ultimaAplicacao: new Date().toISOString().split('T')[0],
      proxima: form.proxima,
      ciclo: Number(form.ciclo) || 180,
      lote: form.lote,
      responsavel: form.responsavel,
      obrigatoria: form.obrigatoria === 'sim',
    }])
    setForm({ nome: '', proxima: '', lote: '', responsavel: '', ciclo: '', obrigatoria: 'nao' })
    setErros({})
    setSucesso(true)
    setMostrarForm(false)
  }

  return (
    <>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>📅 Calendário de Vacinas</span>
          <button className={styles.addBtn} onClick={() => setMostrarForm(v => !v)}>
            {mostrarForm ? '✕ Fechar' : '+ Registrar'}
          </button>
        </div>

        {vacinas.length === 0 && !mostrarForm && (
          <div className={styles.emptyState}>Nenhuma vacina registrada.</div>
        )}

        <div className={styles.itemList}>
          {vacinas.map(v => {
            const urgencia = getUrgenciaVacina(v.proxima)
            const dias = diasAte(v.proxima)
            return (
              <div key={v.id} className={`${styles.vacinaItem} ${styles[urgencia]}`}>
                <div className={styles.vacinaInfo}>
                  <div className={styles.vacinaNome}>{v.nome}</div>
                  <div className={styles.vacinaMeta}>
                    Próxima: {formatarData(v.proxima)} · Lote: {v.lote} · {v.responsavel}
                  </div>
                  {v.ultimaAplicacao && (
                    <div className={styles.vacinaMeta}>Última: {formatarData(v.ultimaAplicacao)}</div>
                  )}
                </div>
                <div className={styles.vacinaRight}>
                  {v.obrigatoria && <span className={styles.obrigBadge}>Obrig.</span>}
                  <span className={`${styles.diasBadge} ${styles[urgencia]}`}>
                    {dias < 0 ? `${Math.abs(dias)}d atraso` : dias === 0 ? 'Hoje!' : `${dias}d`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {mostrarForm && (
        <div className={styles.card}>
          <p className={styles.cardTitle}>Registrar Vacina</p>
          <form onSubmit={handleSalvar} noValidate className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.formGridFull}>
                <Input id="nome" name="nome" label="Nome da vacina" placeholder="Ex: Febre Aftosa" value={form.nome} onChange={handleChange} error={erros.nome} />
              </div>
              <Input id="proxima" name="proxima" type="date" label="Próxima dose" value={form.proxima} onChange={handleChange} error={erros.proxima} />
              <Input id="ciclo" name="ciclo" type="number" label="Ciclo (dias)" placeholder="Ex: 180" value={form.ciclo} onChange={handleChange} inputMode="numeric" />
              <Input id="lote" name="lote" label="Lote da vacina" placeholder="Ex: LT-2026-001" value={form.lote} onChange={handleChange} error={erros.lote} />
              <Input id="responsavel" name="responsavel" label="Responsável" placeholder="Nome" value={form.responsavel} onChange={handleChange} error={erros.responsavel} />
              <div>
                <label className={styles.selectLabel}>Obrigatória?</label>
                <select name="obrigatoria" className={styles.select} value={form.obrigatoria} onChange={handleChange}>
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </div>
            </div>
            <div className={styles.formActions}>
              <Button type="button" variant="ghost" onClick={() => setMostrarForm(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </div>
      )}

      {sucesso && <p className={styles.successToast}>✓ Vacina registrada com sucesso!</p>}
    </>
  )
}

// ─── ABA MEDICAMENTOS ───────────────────────────────────────────────────────

function AbaMedicamentos({ medicamentos, setMedicamentos }) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState({ produto: '', tipo: '', dose: '', data: '', carencia: '', responsavel: '', observacao: '' })
  const [erros, setErros] = useState({})
  const [sucesso, setSucesso] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (erros[name]) setErros(p => ({ ...p, [name]: '' }))
    setSucesso(false)
  }

  function handleSalvar(e) {
    e.preventDefault()
    const errsLocal = {}
    if (!form.produto.trim()) errsLocal.produto = 'Informe o produto'
    if (!form.tipo) errsLocal.tipo = 'Selecione o tipo'
    if (!form.dose.trim()) errsLocal.dose = 'Informe a dose'
    if (!form.data) errsLocal.data = 'Informe a data'
    if (!form.carencia) errsLocal.carencia = 'Informe a carência'
    if (Object.keys(errsLocal).length) { setErros(errsLocal); return }

    const dataApl = new Date(form.data + 'T00:00:00')
    const dataLib = new Date(dataApl)
    dataLib.setDate(dataLib.getDate() + Number(form.carencia))

    setMedicamentos(prev => [{
      id: Date.now(),
      produto: form.produto,
      tipo: form.tipo,
      dose: form.dose,
      dataAplicacao: form.data,
      dataLiberacao: dataLib.toISOString().split('T')[0],
      carencia: Number(form.carencia),
      responsavel: form.responsavel,
      observacao: form.observacao,
    }, ...prev])
    setForm({ produto: '', tipo: '', dose: '', data: '', carencia: '', responsavel: '', observacao: '' })
    setErros({})
    setSucesso(true)
    setMostrarForm(false)
  }

  function getStatusCarencia(dataLiberacao) {
    const d = diasAte(dataLiberacao)
    if (d < 0) return { label: 'Liberado', cls: styles.tagVerde }
    if (d === 0) return { label: 'Libera hoje', cls: styles.tagAmarelo }
    return { label: `Carência: ${d}d`, cls: styles.tagVermelho }
  }

  return (
    <>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>💊 Medicamentos</span>
          <button className={styles.addBtn} onClick={() => setMostrarForm(v => !v)}>
            {mostrarForm ? '✕ Fechar' : '+ Novo'}
          </button>
        </div>

        {medicamentos.length === 0 && !mostrarForm && (
          <div className={styles.emptyState}>Nenhum medicamento registrado.</div>
        )}

        <div className={styles.itemList}>
          {medicamentos.map(m => {
            const st = getStatusCarencia(m.dataLiberacao)
            return (
              <div key={m.id} className={`${styles.listItem} ${diasAte(m.dataLiberacao) > 0 ? styles.itemAtencao : styles.itemOk}`}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>{m.produto} <em style={{ fontWeight: 400, fontSize: '0.85em' }}>({m.tipo})</em></span>
                  <span className={styles.itemMeta}>{m.dose} · Aplicado: {formatarData(m.dataAplicacao)}</span>
                  <span className={styles.itemMeta}>Liberação: {formatarData(m.dataLiberacao)}{m.responsavel ? ` · ${m.responsavel}` : ''}</span>
                  {m.observacao && <span className={styles.itemObs}>{m.observacao}</span>}
                </div>
                <span className={st.cls}>{st.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {mostrarForm && (
        <div className={styles.card}>
          <p className={styles.cardTitle}>Registrar Medicamento</p>
          <form onSubmit={handleSalvar} noValidate className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.formGridFull}>
                <Input id="produto" name="produto" label="Produto / Medicamento" placeholder="Ex: Ivermectina 1%" value={form.produto} onChange={handleChange} error={erros.produto} />
              </div>
              <div>
                <label className={styles.selectLabel}>Tipo</label>
                <select name="tipo" className={`${styles.select} ${erros.tipo ? styles.selectError : ''}`} value={form.tipo} onChange={handleChange}>
                  <option value="" disabled>Selecione</option>
                  <option>Antibiótico</option>
                  <option>Vermífugo</option>
                  <option>Anti-inflamatório</option>
                  <option>Antiparasitário</option>
                  <option>Suplemento</option>
                  <option>Outro</option>
                </select>
                {erros.tipo && <span className={styles.errorMsg}>{erros.tipo}</span>}
              </div>
              <Input id="dose" name="dose" label="Dose" placeholder="Ex: 5ml" value={form.dose} onChange={handleChange} error={erros.dose} />
              <Input id="data" name="data" type="date" label="Data de aplicação" value={form.data} onChange={handleChange} error={erros.data} />
              <Input id="carencia" name="carencia" type="number" label="Carência (dias)" placeholder="Ex: 30" value={form.carencia} onChange={handleChange} error={erros.carencia} inputMode="numeric" />
              <Input id="responsavel" name="responsavel" label="Responsável (opcional)" placeholder="Nome" value={form.responsavel} onChange={handleChange} />
              <div className={styles.formGridFull}>
                <label className={styles.selectLabel}>Observações (opcional)</label>
                <textarea name="observacao" className={styles.textarea} placeholder="Motivo, reações observadas..." value={form.observacao} onChange={handleChange} rows={3} />
              </div>
            </div>
            <div className={styles.formActions}>
              <Button type="button" variant="ghost" onClick={() => setMostrarForm(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </div>
      )}

      {sucesso && <p className={styles.successToast}>✓ Medicamento registrado!</p>}
    </>
  )
}

// ─── ABA FERIMENTOS ─────────────────────────────────────────────────────────

const GRAVIDADE_LABEL = { leve: { label: 'Leve', cls: 'tagVerde' }, moderado: { label: 'Moderado', cls: 'tagAmarelo' }, grave: { label: 'Grave', cls: 'tagVermelho' } }
const STATUS_FER_LABEL = { aberto: { label: 'Aberto', cls: 'tagVermelho' }, em_tratamento: { label: 'Em tratamento', cls: 'tagAmarelo' }, cicatrizado: { label: 'Cicatrizado', cls: 'tagVerde' } }

function AbaFerimentos({ ferimentos, setFerimentos }) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState({ tipo: '', localizacao: '', gravidade: 'leve', data: '', tratamento: '', status: 'aberto', observacao: '' })
  const [erros, setErros] = useState({})
  const [sucesso, setSucesso] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (erros[name]) setErros(p => ({ ...p, [name]: '' }))
    setSucesso(false)
  }

  function handleSalvar(e) {
    e.preventDefault()
    const errsLocal = {}
    if (!form.tipo.trim()) errsLocal.tipo = 'Informe o tipo de ferimento'
    if (!form.localizacao.trim()) errsLocal.localizacao = 'Informe a localização'
    if (!form.data) errsLocal.data = 'Informe a data'
    if (Object.keys(errsLocal).length) { setErros(errsLocal); return }

    setFerimentos(prev => [{ id: Date.now(), ...form }, ...prev])
    setForm({ tipo: '', localizacao: '', gravidade: 'leve', data: '', tratamento: '', status: 'aberto', observacao: '' })
    setErros({})
    setSucesso(true)
    setMostrarForm(false)
  }

  function handleStatusChange(id, novoStatus) {
    setFerimentos(prev => prev.map(f => f.id === id ? { ...f, status: novoStatus } : f))
  }

  return (
    <>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>🩹 Ferimentos e Lesões</span>
          <button className={styles.addBtn} onClick={() => setMostrarForm(v => !v)}>
            {mostrarForm ? '✕ Fechar' : '+ Registrar'}
          </button>
        </div>

        {ferimentos.length === 0 && !mostrarForm && (
          <div className={styles.emptyState}>Nenhum ferimento registrado.</div>
        )}

        <div className={styles.itemList}>
          {ferimentos.map(f => {
            const grav = GRAVIDADE_LABEL[f.gravidade] || GRAVIDADE_LABEL.leve
            const stf  = STATUS_FER_LABEL[f.status]   || STATUS_FER_LABEL.aberto
            const borderCls = f.status === 'aberto' ? styles.itemUrgente : f.status === 'em_tratamento' ? styles.itemAtencao : styles.itemOk
            return (
              <div key={f.id} className={`${styles.listItem} ${borderCls}`}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>{f.tipo}</span>
                  <span className={styles.itemMeta}>📍 {f.localizacao} · {formatarData(f.data)}</span>
                  {f.tratamento && <span className={styles.itemMeta}>Tratamento: {f.tratamento}</span>}
                  {f.observacao && <span className={styles.itemObs}>{f.observacao}</span>}
                  {/* Alterar status inline */}
                  {f.status !== 'cicatrizado' && (
                    <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                      {f.status === 'aberto' && (
                        <button
                          onClick={() => handleStatusChange(f.id, 'em_tratamento')}
                          style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, border: '1px solid #e67e22', background: 'transparent', color: '#e67e22', cursor: 'pointer', fontFamily: 'var(--font-family)' }}
                        >
                          → Em tratamento
                        </button>
                      )}
                      {f.status === 'em_tratamento' && (
                        <button
                          onClick={() => handleStatusChange(f.id, 'cicatrizado')}
                          style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, border: '1px solid #82c341', background: 'transparent', color: '#82c341', cursor: 'pointer', fontFamily: 'var(--font-family)' }}
                        >
                          → Cicatrizado
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                  <span className={styles[grav.cls]}>{grav.label}</span>
                  <span className={styles[stf.cls]}>{stf.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {mostrarForm && (
        <div className={styles.card}>
          <p className={styles.cardTitle}>Registrar Ferimento</p>
          <form onSubmit={handleSalvar} noValidate className={styles.form}>
            <div className={styles.formGrid}>
              <div>
                <label className={styles.selectLabel}>Tipo de ferimento *</label>
                <select name="tipo" className={`${styles.select} ${erros.tipo ? styles.selectError : ''}`} value={form.tipo} onChange={handleChange}>
                  <option value="" disabled>Selecione</option>
                  <option>Corte</option>
                  <option>Contusão</option>
                  <option>Abrasão</option>
                  <option>Fratura</option>
                  <option>Inchaço</option>
                  <option>Outro</option>
                </select>
                {erros.tipo && <span className={styles.errorMsg}>{erros.tipo}</span>}
              </div>
              <div>
                <label className={styles.selectLabel}>Gravidade</label>
                <select name="gravidade" className={styles.select} value={form.gravidade} onChange={handleChange}>
                  <option value="leve">Leve</option>
                  <option value="moderado">Moderado</option>
                  <option value="grave">Grave</option>
                </select>
              </div>
              <Input id="localizacao" name="localizacao" label="Localização *" placeholder="Ex: Pata traseira direita" value={form.localizacao} onChange={handleChange} error={erros.localizacao} />
              <Input id="data" name="data" type="date" label="Data *" value={form.data} onChange={handleChange} error={erros.data} />
              <div>
                <label className={styles.selectLabel}>Status inicial</label>
                <select name="status" className={styles.select} value={form.status} onChange={handleChange}>
                  <option value="aberto">Aberto</option>
                  <option value="em_tratamento">Em tratamento</option>
                  <option value="cicatrizado">Cicatrizado</option>
                </select>
              </div>
              <div className={styles.formGridFull}>
                <label className={styles.selectLabel}>Tratamento aplicado</label>
                <textarea name="tratamento" className={styles.textarea} placeholder="Descreva o tratamento..." value={form.tratamento} onChange={handleChange} rows={2} />
              </div>
              <div className={styles.formGridFull}>
                <label className={styles.selectLabel}>Observações</label>
                <textarea name="observacao" className={styles.textarea} placeholder="Causa, condição do animal..." value={form.observacao} onChange={handleChange} rows={2} />
              </div>
            </div>
            <div className={styles.formActions}>
              <Button type="button" variant="ghost" onClick={() => setMostrarForm(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </div>
      )}

      {sucesso && <p className={styles.successToast}>✓ Ferimento registrado!</p>}
    </>
  )
}

// ─── ABA OCORRÊNCIAS ────────────────────────────────────────────────────────

const RESULTADO_CLS = { 'Recuperado': 'tagVerde', 'Em tratamento': 'tagAmarelo', 'Óbito': 'tagVermelho', 'Aguardando avaliação': 'tagCinza' }

function AbaOcorrencias({ ocorrencias, setOcorrencias }) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState({ data: '', sintomas: '', tratamento: '', resultado: 'Aguardando avaliação', veterinario: '' })
  const [erros, setErros] = useState({})
  const [sucesso, setSucesso] = useState(false)
  const [expandido, setExpandido] = useState(null)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (erros[name]) setErros(p => ({ ...p, [name]: '' }))
    setSucesso(false)
  }

  function handleSalvar(e) {
    e.preventDefault()
    const errsLocal = {}
    if (!form.data) errsLocal.data = 'Informe a data'
    if (!form.sintomas.trim()) errsLocal.sintomas = 'Descreva os sintomas'
    if (Object.keys(errsLocal).length) { setErros(errsLocal); return }

    setOcorrencias(prev => [{ id: Date.now(), ...form }, ...prev])
    setForm({ data: '', sintomas: '', tratamento: '', resultado: 'Aguardando avaliação', veterinario: '' })
    setErros({})
    setSucesso(true)
    setMostrarForm(false)
  }

  return (
    <>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>🩺 Ocorrências Clínicas</span>
          <button className={styles.addBtn} onClick={() => setMostrarForm(v => !v)}>
            {mostrarForm ? '✕ Fechar' : '+ Nova'}
          </button>
        </div>

        {ocorrencias.length === 0 && !mostrarForm && (
          <div className={styles.emptyState}>Nenhuma ocorrência registrada.</div>
        )}

        <div className={styles.itemList}>
          {ocorrencias.map(oc => {
            const cls = RESULTADO_CLS[oc.resultado] || 'tagCinza'
            const aberto = expandido === oc.id
            return (
              <div
                key={oc.id}
                className={`${styles.listItem} ${oc.resultado === 'Em tratamento' || oc.resultado === 'Aguardando avaliação' ? styles.itemAtencao : oc.resultado === 'Óbito' ? styles.itemUrgente : styles.itemOk}`}
                style={{ cursor: 'pointer', flexDirection: 'column', gap: 0 }}
                onClick={() => setExpandido(aberto ? null : oc.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 8 }}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemMeta}>{formatarData(oc.data)}{oc.veterinario ? ` · Dr(a). ${oc.veterinario}` : ''}</span>
                    <span className={styles.itemObs}>{oc.sintomas.substring(0, 80)}{oc.sintomas.length > 80 ? '…' : ''}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span className={styles[cls]}>{oc.resultado}</span>
                    <span style={{ fontSize: 11, color: '#9b92b8' }}>{aberto ? '▲' : '▼'}</span>
                  </div>
                </div>
                {aberto && (
                  <div style={{ width: '100%', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className={styles.itemMeta}><strong style={{ color: '#c8c3e0' }}>Sintomas:</strong> {oc.sintomas}</div>
                    {oc.tratamento && <div className={styles.itemMeta}><strong style={{ color: '#c8c3e0' }}>Tratamento:</strong> {oc.tratamento}</div>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {mostrarForm && (
        <div className={styles.card}>
          <p className={styles.cardTitle}>Registrar Ocorrência</p>
          <form onSubmit={handleSalvar} noValidate className={styles.form}>
            <div className={styles.formGrid}>
              <Input id="data" name="data" type="date" label="Data *" value={form.data} onChange={handleChange} error={erros.data} />
              <Input id="veterinario" name="veterinario" label="Veterinário (opcional)" placeholder="Nome" value={form.veterinario} onChange={handleChange} />
              <div>
                <label className={styles.selectLabel}>Resultado</label>
                <select name="resultado" className={styles.select} value={form.resultado} onChange={handleChange}>
                  <option>Aguardando avaliação</option>
                  <option>Em tratamento</option>
                  <option>Recuperado</option>
                  <option>Óbito</option>
                </select>
              </div>
              <div className={styles.formGridFull}>
                <label className={styles.selectLabel}>Sintomas observados *</label>
                <textarea name="sintomas" className={`${styles.textarea} ${erros.sintomas ? styles.selectError : ''}`} placeholder="Descreva em detalhes..." value={form.sintomas} onChange={handleChange} rows={3} />
                {erros.sintomas && <span className={styles.errorMsg}>{erros.sintomas}</span>}
              </div>
              <div className={styles.formGridFull}>
                <label className={styles.selectLabel}>Tratamento (opcional)</label>
                <textarea name="tratamento" className={styles.textarea} placeholder="Medicamentos, procedimentos..." value={form.tratamento} onChange={handleChange} rows={2} />
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
    </>
  )
}

// ─── ABA HISTÓRICO ──────────────────────────────────────────────────────────

function AbaHistorico({ vacinas, medicamentos, ferimentos, ocorrencias }) {
  const DOT_COLORS = {
    vacina:      '#82c341',
    medicamento: '#5dade2',
    ferimento:   '#e67e22',
    ocorrencia:  '#e74c3c',
  }

  const eventos = [
    ...vacinas.map(v => ({
      id: `v-${v.id}`,
      tipo: 'vacina',
      titulo: `💉 Vacina: ${v.nome}`,
      meta: `Lote: ${v.lote} · ${v.responsavel}`,
      data: v.ultimaAplicacao || v.proxima,
    })),
    ...medicamentos.map(m => ({
      id: `m-${m.id}`,
      tipo: 'medicamento',
      titulo: `💊 ${m.produto} (${m.tipo})`,
      meta: `${m.dose} · Carência até ${formatarData(m.dataLiberacao)}`,
      data: m.dataAplicacao,
    })),
    ...ferimentos.map(f => ({
      id: `f-${f.id}`,
      tipo: 'ferimento',
      titulo: `🩹 ${f.tipo} — ${f.localizacao}`,
      meta: `Gravidade: ${f.gravidade} · Status: ${f.status.replace('_', ' ')}`,
      data: f.data,
    })),
    ...ocorrencias.map(o => ({
      id: `o-${o.id}`,
      tipo: 'ocorrencia',
      titulo: `🩺 Ocorrência clínica`,
      meta: `${o.resultado}${o.veterinario ? ` · Dr(a). ${o.veterinario}` : ''}`,
      data: o.data,
    })),
  ].filter(e => e.data).sort((a, b) => new Date(b.data) - new Date(a.data))

  if (eventos.length === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.emptyState}>Nenhum evento registrado ainda.</div>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <p className={styles.cardTitle} style={{ marginBottom: 16 }}>📋 Histórico Completo</p>
      <div className={styles.timeline}>
        {eventos.map(ev => (
          <div key={ev.id} className={styles.timelineItem}>
            <div
              className={styles.timelineDot}
              style={{ backgroundColor: DOT_COLORS[ev.tipo] }}
            />
            <div className={styles.timelineBody}>
              <div className={styles.timelineTitle}>{ev.titulo}</div>
              <div className={styles.timelineMeta}>{ev.meta}</div>
              <div className={styles.timelineDate}>{formatarData(ev.data)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AnimalHealthProfile
