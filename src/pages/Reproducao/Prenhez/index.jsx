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

  async function handleConfirmar(uuid) {
    const data = prompt('Data do diagnóstico (AAAA-MM-DD)', new Date().toISOString().slice(0, 10))
    if (!data) return
    setSalvando(true)
    setErro('')
    try {
      await confirmarPrenhez(uuid, data)
    } catch (err) {
      setErro(err.message || String(err))
    } finally {
      setSalvando(false)
    }
  }

  async function handleFalhar(uuid) {
    if (!confirm('Marcar esta cobertura como falha (resultado negativo)?')) return
    try {
      await cancelarCobertura(uuid, 'Falha de cobertura — diagnóstico negativo')
    } catch (err) {
      setErro(err.message || String(err))
    }
  }

  return (
    <div className={pageStyles.container}>
      <header className={pageStyles.topbar}>
        <button className={pageStyles.backBtn} onClick={() => navigate(`/propriedade/${propriedadeId}/reproducao`)}>←</button>
        <div>
          <h1 className={pageStyles.pageTitle}>✓ Diagnóstico de Prenhez</h1>
          <p className={pageStyles.pageSubtitle}>Confirmar ou negar cobertura após diagnóstico</p>
        </div>
      </header>

      <div className={pageStyles.inner}>
        {erro && <div className={styles.erroBanner}>{erro}</div>}

        <h2 className={styles.secaoTitulo}>Aguardando diagnóstico ({pendentes.length})</h2>

        {carregando ? (
          <div className={pageStyles.emptyState}>Carregando...</div>
        ) : pendentes.length === 0 ? (
          <div className={pageStyles.emptyState}>
            Nenhuma cobertura aguardando diagnóstico. Registre uma cobertura primeiro.
          </div>
        ) : (
          <div className={pageStyles.gestacoesList}>
            {pendentes.map(r => {
              const femea = animalPorUuid.get(r.animal_uuid)
              const dias = diasAteParto(r.data_previa_parto)
              return (
                <div
                  key={r.uuid}
                  className={pageStyles.gestacaoCard}
                  style={{ borderLeft: `4px solid ${STATUS_CORES.gestante}` }}
                >
                  <div className={pageStyles.gestacaoInfo}>
                    <div className={pageStyles.gestacaoAnimal}>
                      {femea?.nome || 'Animal'} ({femea?.id_fisico || femea?.id_interno || 's/brinco'})
                    </div>
                    <div className={pageStyles.gestacaoMeta}>
                      <span>Cobertura: {formatarData(r.data_cobertura)}</span>
                      {r.data_previa_parto && (
                        <>
                          <span className={pageStyles.metaSep}>·</span>
                          <span>Parto previsto: {formatarData(r.data_previa_parto)}</span>
                        </>
                      )}
                      {dias !== null && (
                        <>
                          <span className={pageStyles.metaSep}>·</span>
                          <span>{dias}d restantes</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className={styles.btnAcao}
                      onClick={() => handleConfirmar(r.uuid)}
                      disabled={salvando}
                    >
                      Confirmar prenhez
                    </button>
                    <button
                      type="button"
                      className={styles.btnSecundario}
                      onClick={() => handleFalhar(r.uuid)}
                      disabled={salvando}
                    >
                      Falhou
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Prenhez
