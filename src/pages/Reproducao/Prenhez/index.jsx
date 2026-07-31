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

function Prenhez() {
  const navigate = useNavigate()
  const { propriedadeId } = useParams()
  const { animais } = useAnimais(propriedadeId)
  const { registros, carregando, confirmarPrenhez, cancelarCobertura } = useReproducao(propriedadeId)

  const animalPorUuid = new Map(animais.map(a => [a.uuid, a]))

  // Coberturas com diagnóstico ainda não decidido (pendente)
  const pendentes = registros.filter(r =>
    !r.data_parto && !r.prenhez_confirmada && r.resultado === 'pendente' && !r.motivo_cancelamento
  )

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [confirmandoUuid, setConfirmandoUuid] = useState(null)
  const [dataConfirmacao, setDataConfirmacao] = useState(new Date().toISOString().slice(0, 10))
  const [falhandoUuid, setFalhandoUuid] = useState(null)
  const [motivoFalha, setMotivoFalha] = useState('Falha de cobertura — diagnóstico negativo')

  function abrirConfirmar(uuid) {
    setConfirmandoUuid(uuid)
    setDataConfirmacao(new Date().toISOString().slice(0, 10))
  }

  function abrirFalhar(uuid) {
    setFalhandoUuid(uuid)
    setMotivoFalha('Falha de cobertura — diagnóstico negativo')
  }

  async function handleConfirmar(e) {
    e?.preventDefault?.()
    if (!confirmandoUuid || !dataConfirmacao) return
    setSalvando(true)
    setErro('')
    try {
      await confirmarPrenhez(confirmandoUuid, dataConfirmacao)
      setConfirmandoUuid(null)
      setSucesso('Prenhez confirmada.')
      setTimeout(() => setSucesso(''), 3000)
    } catch (err) {
      setErro(err.message || String(err))
    } finally {
      setSalvando(false)
    }
  }

  async function handleFalhar(e) {
    e?.preventDefault?.()
    if (!falhandoUuid) return
    setSalvando(true)
    setErro('')
    try {
      await cancelarCobertura(falhandoUuid, motivoFalha)
      setFalhandoUuid(null)
      setSucesso('Cobertura marcada como falha.')
      setTimeout(() => setSucesso(''), 3000)
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
          <h1 className={pageStyles.pageTitle}>Diagnóstico de Prenhez</h1>
          <p className={pageStyles.pageSubtitle}>{pendentes.length} pendente(s)</p>
        </div>
      </header>

      <div className={pageStyles.inner}>
        {sucesso && <div className={styles.sucessoBanner}>{sucesso}</div>}
        {erro && <div className={styles.erroBanner}>{erro}</div>}

        {carregando ? (
          <div className={pageStyles.emptyState}>Carregando...</div>
        ) : pendentes.length === 0 ? (
          <div className={pageStyles.emptyState}>Nenhum diagnóstico pendente.</div>
        ) : (
          <ul className={pageStyles.cardsList}>
            {pendentes.map(r => {
              const femea = animalPorUuid.get(r.animal_uuid)
              const touro = animalPorUuid.get(r.touro_uuid)
              const status = STATUS_LABELS[r.resultado] || '—'
              const cor = STATUS_CORES[r.resultado] || '#9ca3af'
              return (
                <li key={r.uuid} className={pageStyles.cardAnimalDesempenho}>
                  <div className={pageStyles.cardAnimalHeader}>
                    {femea?.nome || '—'} × {touro?.nome || '(reprodutor)'}
                  </div>
                  <div className={pageStyles.desempenhoGrid}>
                    <div><strong>Cobertura:</strong> {formatarData(r.data_cobertura)}</div>
                    <div><strong>Prev. parto:</strong> {formatarData(r.data_previa_parto)}</div>
                    <div><strong>Status:</strong> <span style={{ color: cor }}>{status}</span></div>
                  </div>

                  {confirmandoUuid === r.uuid ? (
                    <form className={styles.acaoInline} onSubmit={handleConfirmar}>
                      <label className={styles.label}>
                        <span className={styles.acaoInlineLabel}>Data do diagnóstico</span>
                        <input
                          type="date"
                          className={styles.input}
                          value={dataConfirmacao}
                          onChange={e => setDataConfirmacao(e.target.value)}
                          required
                        />
                      </label>
                      <div className={styles.acaoInlineBotoes}>
                        <button type="submit" className={styles.btnPrimario} disabled={salvando}>
                          {salvando ? 'Salvando...' : 'Confirmar prenhez'}
                        </button>
                        <button type="button" className={styles.btnSecundario} onClick={() => setConfirmandoUuid(null)}>
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : falhandoUuid === r.uuid ? (
                    <form className={styles.acaoInline} onSubmit={handleFalhar}>
                      <label className={styles.label}>
                        <span className={styles.acaoInlineLabel}>Motivo da falha</span>
                        <input
                          type="text"
                          className={styles.input}
                          value={motivoFalha}
                          onChange={e => setMotivoFalha(e.target.value)}
                        />
                      </label>
                      <div className={styles.acaoInlineBotoes}>
                        <button type="submit" className={styles.btnPrimario} disabled={salvando}>
                          {salvando ? 'Salvando...' : 'Marcar como falha'}
                        </button>
                        <button type="button" className={styles.btnSecundario} onClick={() => setFalhandoUuid(null)}>
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className={styles.acaoInlineBotoes} style={{ marginTop: '12px' }}>
                      <button type="button" className={styles.btnAcao} onClick={() => abrirConfirmar(r.uuid)}>
                        ✓ Confirmar prenhez
                      </button>
                      <button type="button" className={styles.btnSecundario} onClick={() => abrirFalhar(r.uuid)}>
                        ✗ Marcar falha
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default Prenhez
