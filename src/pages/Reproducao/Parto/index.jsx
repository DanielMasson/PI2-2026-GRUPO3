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

  // Apenas gestações confirmadas sem parto registrado
  const elegiveis = registros.filter(r => r.prenhez_confirmada && !r.data_parto && !r.motivo_cancelamento)
  const historico = registros.filter(r => r.data_parto)

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  async function handleRegistrarParto(registro) {
    const dataParto = prompt('Data do parto (AAAA-MM-DD)', new Date().toISOString().slice(0, 10))
    if (!dataParto) return

    const querCriarCria = confirm('Deseja cadastrar a cria agora?')
    let payloadCria = null
    if (querCriarCria) {
      const sexo = prompt('Sexo da cria (macho/femea)', 'femea')
      if (!sexo) return
      const brinco = prompt('Brinco da cria (opcional)', '') || null
      const peso = prompt('Peso ao nascer em kg (opcional)', '') || null
      payloadCria = {
        sexo: sexo.toLowerCase(),
        brincoFilhote: brinco,
        pesoFilhote: peso ? Number(peso) : null,
      }
    }

    setSalvando(true)
    setErro('')
    try {
      await registrarParto(registro.uuid, dataParto, payloadCria)
      setSucesso('Parto registrado.')
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
          <h1 className={pageStyles.pageTitle}>🐄 Registro de Parto</h1>
          <p className={pageStyles.pageSubtitle}>Confirmar nascimento e cadastrar cria</p>
        </div>
      </header>

      <div className={pageStyles.inner}>
        {erro && <div className={styles.erroBanner}>{erro}</div>}
        {sucesso && <div className={styles.sucessoBanner}>{sucesso}</div>}

        <h2 className={styles.secaoTitulo}>Gestantes prontas para parto ({elegiveis.length})</h2>

        {carregando ? (
          <div className={pageStyles.emptyState}>Carregando...</div>
        ) : elegiveis.length === 0 ? (
          <div className={pageStyles.emptyState}>
            Nenhuma gestante confirmada. Confirme uma prenhez primeiro.
          </div>
        ) : (
          <div className={pageStyles.gestacoesList}>
            {elegiveis.map(r => {
              const femea = animalPorUuid.get(r.animal_uuid)
              const dias = diasAteParto(r.data_previa_parto)
              return (
                <div
                  key={r.uuid}
                  className={pageStyles.gestacaoCard}
                  style={{ borderLeft: `4px solid ${STATUS_CORES.prenhez_confirmada}` }}
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
                          <span>Previsto: {formatarData(r.data_previa_parto)}</span>
                        </>
                      )}
                      {dias !== null && (
                        <>
                          <span className={pageStyles.metaSep}>·</span>
                          <span style={{ color: dias < 0 ? '#ef4444' : dias <= 7 ? '#f59e0b' : '#22c55e' }}>
                            {dias < 0 ? `${Math.abs(dias)}d atrasado` : `${dias}d restantes`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.btnAcao}
                    onClick={() => handleRegistrarParto(r)}
                    disabled={salvando}
                  >
                    Registrar parto
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <h2 className={styles.secaoTitulo}>Histórico de partos ({historico.length})</h2>

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
                      {femea?.nome || 'Animal'} ({femea?.id_fisico || femea?.id_interno || 's/brinco'})
                    </div>
                    <div className={pageStyles.gestacaoMeta}>
                      <span>Parto: {formatarData(r.data_parto)}</span>
                      <span className={pageStyles.metaSep}>·</span>
                      <span>Cobertura: {formatarData(r.data_cobertura)}</span>
                    </div>
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

export default Parto
