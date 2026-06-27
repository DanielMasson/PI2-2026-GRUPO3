import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAnimais } from '../../hooks/useAnimais'
import { useGestantes } from '../../hooks/useGestantes'
import * as reproducaoService from '../../services/reproducaoService'
import { DIAS_GESTACAO, DIAS_SECAGEM, TIPOS_COBERTURA } from '../../constants/sync'
import { diasAte } from '../../utils/datas'
import styles from './Reproducao.module.css'
import Button from '../../components/Button/index.jsx'
import Input from '../../components/Input/index.jsx'
import PropertyNav from '../../components/PropertyNav/index.jsx'

function formatarData(dataStr) {
  return new Date(dataStr + 'T00:00:00').toLocaleDateString('pt-BR')
}

function getStatusGestacao(diasRestantes, dataParto, resultado) {
  if (resultado === 'negativa') return { label: 'Não confirmada', cls: 'falhou' }
  if (dataParto || resultado === 'parida') return { label: 'Parida', cls: 'parida' }
  if (diasRestantes < 0) return { label: 'Atrasada', cls: 'atrasada' }
  if (diasRestantes <= 30) return { label: 'Parto próximo', cls: 'partoProximo' }
  if (diasRestantes <= 60) return { label: 'Pré-parto', cls: 'preParto' }
  return { label: 'Gestante', cls: 'gestante' }
}

function calcularProgresso(dataCobertura, dataPreviaParto) {
  const inicio = new Date(dataCobertura + 'T00:00:00').getTime()
  const fim = new Date(dataPreviaParto + 'T00:00:00').getTime()
  const agora = Date.now()
  const total = fim - inicio
  if (total <= 0) return 100
  return Math.min(100, Math.max(0, ((agora - inicio) / total) * 100))
}

// ─── Componente Principal ──────────────────────────────────────────────────
function Reproducao() {
  const navigate = useNavigate()
  const { propriedadeId } = useParams()
  const { animais, carregando: carregandoAnimais } = useAnimais(propriedadeId)
  const { gestantes, coberturas, falhas, paridas, carregando: carregandoGestantes, recarregar } = useGestantes(propriedadeId)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [form, setForm] = useState({
    animal_uuid: '', tipo_cobertura: '', data_cobertura: '', touro_uuid: '', observacao: '',
  })
  const [erros, setErros] = useState({})
 const [activeTab, setActiveTab] = useState('reproducao')

  const femeas = animais.filter(a => a.sexo === 'femea')
  const machos = animais.filter(a => a.sexo === 'macho')

  // Mapa de animais por uuid para resolver nomes/brincos do touro
  const animalPorUuid = new Map(animais.map(a => [a.uuid, a]))

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (erros[name]) setErros(prev => ({ ...prev, [name]: '' }))
    setSucesso('')
  }

  async function handleRegistrar(e) {
    e.preventDefault()
    const errs = {}
    if (!form.animal_uuid) errs.animal_uuid = 'Selecione o animal'
    if (!form.tipo_cobertura) errs.tipo_cobertura = 'Selecione o tipo'
    if (!form.data_cobertura) errs.data_cobertura = 'Informe a data'
    else {
      const hoje = new Date()
      hoje.setHours(23, 59, 59, 999)
      if (new Date(form.data_cobertura) > hoje) errs.data_cobertura = 'Data não pode ser futura'
    }
    if (Object.keys(errs).length) { setErros(errs); return }

    try {
      await reproducaoService.registrarCobertura({
        animal_uuid: form.animal_uuid,
        tipo_cobertura: form.tipo_cobertura,
        data_cobertura: form.data_cobertura,
        touro_uuid: form.touro_uuid || null,
        propriedade_uuid: propriedadeId,
        observacao: form.observacao,
      })
      await recarregar()
      setForm({ animal_uuid: '', tipo_cobertura: '', data_cobertura: '', touro_uuid: '', observacao: '' })
      setMostrarForm(false)
      setSucesso('Cobertura registrada com sucesso!')
      setTimeout(() => setSucesso(''), 3000)
    } catch (err) {
      setErros({ geral: err.message })
    }
  }

  async function confirmarPrenhez(uuid) {
    try {
      await reproducaoService.confirmarPrenhez(uuid, new Date().toISOString().split('T')[0])
      await recarregar()
      setSucesso('Prenhez confirmada!')
      setTimeout(() => setSucesso(''), 3000)
    } catch (err) {
      alert('Erro ao confirmar prenhez: ' + err.message)
    }
  }

  async function handleCancelar(uuid) {
    const motivo = window.prompt('Motivo do cancelamento (ex: não emprenhou, aborto, diagnóstico negativo):', 'Não confirmada')
    if (motivo === null) return
    try {
      await reproducaoService.cancelarCobertura(uuid, motivo || 'Não confirmada')
      await recarregar()
      setSucesso('Cobertura registrada como falha. Movida para o histórico.')
      setTimeout(() => setSucesso(''), 3500)
    } catch (err) {
      alert('Erro ao cancelar cobertura: ' + err.message)
    }
  }

  async function registrarPartoComCria(uuid) {
    const dataParto = window.prompt(
      'Data do parto (AAAA-MM-DD):',
      new Date().toISOString().split('T')[0],
    )
    if (!dataParto) return
    const querCriarCria = window.confirm('Registrar a cria como novo animal nesta propriedade?')
    let payload = { dataParto }
    if (querCriarCria) {
      const sexoFilhote = window.prompt('Sexo da cria (macho / femea):', 'femea')
      if (!sexoFilhote) {
        alert('Sexo é obrigatório para criar a cria.')
        return
      }
      const brincoFilhote = window.prompt('Brinco da cria (opcional):', '') || null
      const pesoFilhoteStr = window.prompt('Peso da cria em kg (opcional):', '')
      const pesoFilhote = pesoFilhoteStr && Number(pesoFilhoteStr) > 0 ? Number(pesoFilhoteStr) : null
      // nome da cria: derivado do brinco (opcional) — service exige { nome } p/ gerar animal
      const nomeCria = brincoFilhote
        ? `Cria de ${new Date().getFullYear()} - ${brincoFilhote}`
        : `Cria de ${new Date().getFullYear()}`
      payload = { ...payload, nome: nomeCria, sexoFilhote, brincoFilhote, pesoFilhote }
    }
    try {
      const resultado = await reproducaoService.registrarParto(uuid, payload)
      await recarregar()
      const criouCria = Boolean(resultado?.criaCriada || resultado?.criaUuid)
      setSucesso(criouCria ? 'Parto + cria registrados!' : 'Parto registrado!')
      setTimeout(() => setSucesso(''), 3000)
    } catch (err) {
      alert('Erro ao registrar parto: ' + err.message)
    }
  }

  // Handler de compat para o botão existente 🐄 Registrar Parto nos cards ativos.
  // Centraliza em `registrarPartoComCria` para evitar duplicação.
  const registrarParto = registrarPartoComCria

  const gestacoesAtivas = gestantes.filter(g => !g.data_parto)
  // Histórico: paridas (data preenchida) + falhas (tri-state negativa)
  // Mantemos fallback de compat para dados legados que não têm `resultado` setado
  const paridasLista = paridas.length > 0
    ? paridas
    : gestantes.filter(g => g.data_parto)
  const falhasLista = falhas.filter(f => f.resultado === 'negativa')

  return (
    <div className={styles.container}>
      <header className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => navigate(`/propriedade/${propriedadeId}`)}>←</button>
        <div>
          <h1 className={styles.pageTitle}>Controle Reprodutivo</h1>
          <p className={styles.pageSubtitle}>Propriedade: <strong>{propriedadeId}</strong></p>
        </div>
      </header>

      <div className={styles.inner}>
        {sucesso && <div className={styles.successToast}>{sucesso}</div>}

        {/* Coberturas em Observação (prenhez ainda não confirmada) */}
        {coberturas && coberturas.length > 0 && (
          <div className={styles.coberturaSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.badgeAguardando}>⏳ Aguardando diagnóstico</span>
                {' '}Coberturas em Observação ({coberturas.length})
              </h2>
            </div>
            <p className={styles.coberturaObs}>
              Coberturas recentes aguardando confirmação de prenhez (normalmente 30–60 dias após a cobertura).
              Toque em <strong>Confirmar Prenhez</strong> quando o diagnóstico for positivo.
            </p>
            <div className={styles.gestacoesList}>
              {coberturas.map(g => (
                <GestacaoCard
                  key={g.uuid}
                  gestacao={{ ...g, _observacao: true }}
                  animalPorUuid={animalPorUuid}
                  onConfirmarPrenhez={() => confirmarPrenhez(g.uuid)}
                  onCancelarCobertura={() => handleCancelar(g.uuid)}
                  onRegistrarParto={() => {}}
                  onVerGenealogia={() => navigate(`/propriedade/${propriedadeId}/animal/${g.animal_uuid}/genealogia`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Header com botão de adicionar */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Gestações Ativas ({gestacoesAtivas.length})</h2>
          <button className={styles.addBtn} onClick={() => { setMostrarForm(!mostrarForm); setSucesso('') }}>
            {mostrarForm ? '✕ Fechar' : '+ Nova Cobertura'}
          </button>
        </div>

        {/* Formulário de nova cobertura */}
        {mostrarForm && (
          <form className={styles.formCard} onSubmit={handleRegistrar}>
            <h3 className={styles.formTitle}>Registrar Cobertura</h3>
            <div className={styles.formGrid}>
              <div>
                <label className={styles.selectLabel}>Animal (fêmea) *</label>
                <select name="animal_uuid" value={form.animal_uuid} onChange={handleChange}
                  className={`${styles.select} ${erros.animal_uuid ? styles.selectError : ''}`}>
                  <option value="">Selecione</option>
                  {femeas.map(f => (
                    <option key={f.uuid} value={f.uuid}>{f.nome} ({f.id_fisico || f.id_interno || 's/brinco'})</option>
                  ))}
                </select>
                {erros.animal_uuid && <span className={styles.errorMsg}>{erros.animal_uuid}</span>}
              </div>

              <div>
                <label className={styles.selectLabel}>Tipo de Cobertura *</label>
                <select name="tipo_cobertura" value={form.tipo_cobertura} onChange={handleChange}
                  className={`${styles.select} ${erros.tipo_cobertura ? styles.selectError : ''}`}>
                  <option value="">Selecione</option>
                  {TIPOS_COBERTURA.map(t => (
                    <option key={t} value={t}>{t === 'monta_natural' ? 'Monta Natural' : t === 'inseminacao_artificial' ? 'Inseminação Artificial' : t}</option>
                  ))}
                </select>
                {erros.tipo_cobertura && <span className={styles.errorMsg}>{erros.tipo_cobertura}</span>}
              </div>

              <div>
                <label className={styles.selectLabel}>Data da Cobertura *</label>
                <Input name="data_cobertura" type="date" value={form.data_cobertura}
                  onChange={handleChange} variant="dark" error={erros.data_cobertura} />
              </div>

              <div>
                <label className={styles.selectLabel}>Touro (opcional)</label>
                <select name="touro_uuid" value={form.touro_uuid} onChange={handleChange} className={styles.select}>
                  <option value="">Selecione</option>
                  {machos.map(t => (
                    <option key={t.uuid} value={t.uuid}>{t.nome} ({t.id_fisico || t.id_interno || 's/brinco'})</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGridFull}>
                <label className={styles.selectLabel}>Observação</label>
                <textarea name="observacao" value={form.observacao} onChange={handleChange}
                  className={styles.textarea} placeholder="Observações sobre a cobertura..." />
              </div>
            </div>

            {erros.geral && <p className={styles.errorMsg}>{erros.geral}</p>}

            <div className={styles.formActions}>
              <Button type="button" variant="ghost" onClick={() => setMostrarForm(false)}>Cancelar</Button>
              <Button type="submit">Registrar Cobertura</Button>
            </div>
          </form>
        )}

        {/* Lista de gestações ativas */}
        {carregandoGestantes ? (
          <div className={styles.emptyState}>Carregando gestações...</div>
        ) : gestacoesAtivas.length === 0 && !mostrarForm ? (
          <div className={styles.emptyState}>
            Nenhuma gestação ativa. Registre uma cobertura para começar.
          </div>
        ) : (
          <div className={styles.gestacoesList}>
            {gestacoesAtivas.map(g => (
              <GestacaoCard
                key={g.uuid}
                gestacao={g}
                animalPorUuid={animalPorUuid}
                onConfirmarPrenhez={() => confirmarPrenhez(g.uuid)}
                onRegistrarParto={() => registrarParto(g.uuid)}
                onCancelarCobertura={() => handleCancelar(g.uuid)}
                onVerGenealogia={() => navigate(`/propriedade/${propriedadeId}/animal/${g.animal_uuid}/genealogia`)}
              />
            ))}
          </div>
        )}

        {/* Paridas (histórico de partos) */}
        {paridasLista.length > 0 && (
          <>
            <div className={styles.sectionHeader} style={{ marginTop: 'var(--space-xl)' }}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.badgeParida}>🐄 Paridas</span>
                {' '}Histórico ({paridasLista.length})
              </h2>
            </div>
            <div className={styles.gestacoesList}>
              {paridasLista.map(g => (
                <GestacaoCard
                  key={g.uuid}
                  gestacao={g}
                  animalPorUuid={animalPorUuid}
                  onConfirmarPrenhez={() => {}}
                  onRegistrarParto={() => {}}
                  onVerGenealogia={() => navigate(`/propriedade/${propriedadeId}/animal/${g.animal_uuid}/genealogia`)}
                  finalizada
                />
              ))}
            </div>
          </>
        )}

        {/* Coberturas com falha (tri-state negativa) */}
        {falhasLista.length > 0 && (
          <>
            <div className={styles.sectionHeader} style={{ marginTop: 'var(--space-xl)' }}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.badgeFalha}>✗ Não confirmadas</span>
                {' '}Coberturas com falha ({falhasLista.length})
              </h2>
            </div>
            <div className={styles.gestacoesList}>
              {falhasLista.map(g => (
                <GestacaoCard
                  key={g.uuid}
                  gestacao={g}
                  animalPorUuid={animalPorUuid}
                  onConfirmarPrenhez={() => {}}
                  onRegistrarParto={() => {}}
                  onVerGenealogia={() => navigate(`/propriedade/${propriedadeId}/animal/${g.animal_uuid}/genealogia`)}
                  finalizada
                />
              ))}
            </div>
          </>
        )}
      </div>
			<PropertyNav
				activeTab={activeTab}
				onNav={(tab) => {
					setActiveTab(tab)
					if (tab === 'home') navigate(`/propriedade/${propriedadeId}`)
					else if (tab === 'animais') navigate(`/propriedade/${propriedadeId}/animais`)
					else if (tab === 'saude') navigate(`/propriedade/${propriedadeId}/saude`)
					else if (tab === 'reproducao') navigate(`/propriedade/${propriedadeId}/reproducao`)
					else if (tab === 'leite') navigate(`/propriedade/${propriedadeId}/producao-leite`)
				}}
			/>
 </div>
  )
}

// ─── Card de Gestação ──────────────────────────────────────────────────────
function GestacaoCard({ gestacao: g, animalPorUuid, onConfirmarPrenhez, onRegistrarParto, onCancelarCobertura, onVerGenealogia, finalizada }) {
  const [expandido, setExpandido] = useState(false)
  const diasRestantes = g.data_previa_parto ? diasAte(g.data_previa_parto) : null
  const status = getStatusGestacao(diasRestantes, g.data_parto, g.resultado)
  const progresso = g.data_cobertura && g.data_previa_parto ? calcularProgresso(g.data_cobertura, g.data_previa_parto) : 0

  // Resolve nome e brinco do animal a partir dos dados do join ou do mapa
  const nomeAnimal = g.nome_animal || animalPorUuid.get(g.animal_uuid)?.nome || 'Animal'
  const brincoAnimal = g.id_fisico || animalPorUuid.get(g.animal_uuid)?.id_fisico || animalPorUuid.get(g.animal_uuid)?.id_interno || ''

  // Resolve nome e brinco do touro a partir do mapa de animais
  const touro = g.touro_uuid ? animalPorUuid.get(g.touro_uuid) : null
  const touroNome = g.nome_touro || touro?.nome || ''
  const touroBrinco = touro?.id_fisico || touro?.id_interno || ''

  const tipoLabel = g.tipo_cobertura === 'monta_natural' ? 'Monta Natural'
    : g.tipo_cobertura === 'inseminacao_artificial' ? 'Inseminação Artificial'
    : g.tipo_cobertura || 'N/A'

  return (
    <div className={`${styles.gestacaoCard} ${styles[status.cls]}`}>
      <div className={styles.gestacaoHeader} onClick={() => setExpandido(!expandido)}>
        <div className={styles.gestacaoInfo}>
          <div className={styles.gestacaoAnimal}>{nomeAnimal} ({brincoAnimal || 's/brinco'})</div>
          <div className={styles.gestacaoMeta}>
            <span>{tipoLabel}</span>
            <span className={styles.metaSep}>·</span>
            <span>Cobertura: {formatarData(g.data_cobertura)}</span>
            {touroNome && (
              <>
                <span className={styles.metaSep}>·</span>
                <span>Touro: {touroNome}</span>
              </>
            )}
          </div>
        </div>
        <div className={styles.gestacaoRight}>
          <span className={`${styles.diasBadge} ${styles[status.cls]}`}>
            {g.data_parto ? formatarData(g.data_parto) : diasRestantes !== null ? `${diasRestantes} dias` : 'N/A'}
          </span>
          <span className={`${styles.statusLabel} ${styles[status.cls]}`}>{status.label}</span>
        </div>
      </div>

      {/* Barra de progresso */}
      {!finalizada && !g.data_parto && g.data_previa_parto && (
        <div className={styles.progressSection}>
          <div className={styles.progressLabel}>
            <span>Cobertura</span>
            <span>Parto previsto: {formatarData(g.data_previa_parto)}</span>
          </div>
          <div className={styles.progressBar}>
            <div className={`${styles.progressFill} ${styles[status.cls]}`} style={{ width: `${progresso}%` }} />
          </div>
        </div>
      )}

      {/* Detalhes expandidos */}
      {expandido && (
        <div className={styles.detalhesSection}>
          <div className={styles.detalhesGrid}>
            <div className={styles.detalheItem}>
              <span className={styles.detalheLabel}>Tipo</span>
              <span className={styles.detalheValor}>{tipoLabel}</span>
            </div>
            <div className={styles.detalheItem}>
              <span className={styles.detalheLabel}>Cobertura</span>
              <span className={styles.detalheValor}>{formatarData(g.data_cobertura)}</span>
            </div>
            <div className={styles.detalheItem}>
              <span className={styles.detalheLabel}>Prenhez Confirmada</span>
              <span className={styles.detalheValor}>{g.prenhez_confirmada ? `Sim (${formatarData(g.data_confirmacao)})` : 'Não'}</span>
            </div>
            <div className={styles.detalheItem}>
              <span className={styles.detalheLabel}>Parto Previsto</span>
              <span className={styles.detalheValor}>{g.data_previa_parto ? formatarData(g.data_previa_parto) : 'N/A'}</span>
            </div>
            {g.data_secagem && (
              <div className={styles.detalheItem}>
                <span className={styles.detalheLabel}>Secagem</span>
                <span className={styles.detalheValor}>{formatarData(g.data_secagem)}</span>
              </div>
            )}
            {touroNome && (
              <div className={styles.detalheItem}>
                <span className={styles.detalheLabel}>Touro</span>
                <span className={styles.detalheValor}>{touroNome} ({touroBrinco || 's/brinco'})</span>
              </div>
            )}
            {g.observacao && (
              <div className={styles.detalheItem} style={{ gridColumn: '1 / -1' }}>
                <span className={styles.detalheLabel}>Observação</span>
                <span className={styles.detalheValor}>{g.observacao}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ações */}
      <div className={styles.gestacaoActions}>
        {!finalizada && !g.prenhez_confirmada && (
          <button className={`${styles.actionBtn} ${styles.primary}`} onClick={onConfirmarPrenhez}>
            ✓ Confirmar Prenhez
          </button>
        )}
        {!finalizada && !g.data_parto && g.prenhez_confirmada && (
          <button className={`${styles.actionBtn} ${styles.primary}`} onClick={onRegistrarParto}>
            🐄 Registrar Parto
          </button>
        )}
        {/* Sprint 7: botão ✗ Falhou aparece em qualquer cobertura ainda ativa (não parida) */}
        {!finalizada && !g.data_parto && g.resultado !== 'negativa' && (
          <button className={`${styles.actionBtn} ${styles.danger}`} onClick={onCancelarCobertura}>
            ✗ Falhou
          </button>
        )}
        <button className={styles.actionBtn} onClick={() => setExpandido(!expandido)}>
          {expandido ? '▲ Menos' : '▼ Detalhes'}
        </button>
        <button className={styles.actionBtn} onClick={onVerGenealogia}>
          🌳 Genealogia
        </button>
      </div>
    </div>
  )
}

export default Reproducao
