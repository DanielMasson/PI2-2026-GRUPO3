import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAnimais } from '../../../hooks/useAnimais'
import { useReproducao } from '../../../hooks/useReproducao'
import { TIPOS_COBERTURA } from '../../../constants/sync'
import { calcularDataPrevistaParto, calcularDataSecagem, calcularProgresso, STATUS_LABELS, STATUS_CORES, diasAteParto } from '../../../utils/reproducao'
import styles from '../Subpage.module.css'
import pageStyles from '../Reproducao.module.css'

function formatarData(dataStr) {
  if (!dataStr) return '—'
  return new Date(dataStr + 'T00:00:00').toLocaleDateString('pt-BR')
}

function Cobertura() {
  const navigate = useNavigate()
  const { propriedadeId } = useParams()
  const { animais } = useAnimais(propriedadeId)
  const { registros, carregando, registrarCobertura, cancelarCobertura } = useReproducao(propriedadeId)

  const femeas = animais.filter(a => a.sexo === 'femea' && a.status === 'ativo')
  const touros = animais.filter(a => a.sexo === 'macho' && a.status === 'ativo')
  const animalPorUuid = new Map(animais.map(a => [a.uuid, a]))

  const dataHoje = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    animal_uuid: '',
    reprodutor_uuid: '',
    data_cobertura: dataHoje,
    tipo_cobertura: 'monta_natural',
    observacao: '',
  })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  const dataPrevistaCalculo = calcularDataPrevistaParto(form.data_cobertura)
  const dataSecagemCalculo = calcularDataSecagem(dataPrevistaCalculo)

  async function handleRegistrar(e) {
    e.preventDefault()
    if (!form.animal_uuid) {
      setErro('Selecione a fêmea coberta')
      return
    }
    setErro('')
    setSalvando(true)
    try {
      await registrarCobertura({
        animal_uuid: form.animal_uuid,
        reprodutor_uuid: form.reprodutor_uuid || null,
        data_cobertura: form.data_cobertura,
        tipo_cobertura: form.tipo_cobertura,
        observacao: form.observacao,
      })
      setSucesso('Cobertura registrada.')
      setForm(prev => ({
        ...prev,
        animal_uuid: '',
        reprodutor_uuid: '',
        observacao: '',
      }))
      setTimeout(() => setSucesso(''), 3000)
    } catch (err) {
      setErro(err.message || String(err))
    } finally {
      setSalvando(false)
    }
  }

  async function handleCancelar(uuid) {
    const motivo = prompt('Motivo do cancelamento?')
    if (!motivo) return
    try {
      await cancelarCobertura(uuid, motivo)
    } catch (err) {
      setErro(err.message || String(err))
    }
  }

  return (
    <div className={pageStyles.container}>
      <header className={pageStyles.topbar}>
        <button className={pageStyles.backBtn} onClick={() => navigate(`/propriedade/${propriedadeId}/reproducao`)}>←</button>
        <div>
          <h1 className={pageStyles.pageTitle}>🐂 Cobertura</h1>
          <p className={pageStyles.pageSubtitle}>Registrar monta natural ou inseminação artificial</p>
        </div>
      </header>

      <div className={pageStyles.inner}>
        <form className={styles.formCard} onSubmit={handleRegistrar}>
          {erro && <div className={styles.erroBanner}>{erro}</div>}
          {sucesso && <div className={styles.sucessoBanner}>{sucesso}</div>}

          <label className={styles.label}>
            <span>Fêmea coberta</span>
            <select
              className={styles.input}
              value={form.animal_uuid}
              onChange={e => setForm(prev => ({ ...prev, animal_uuid: e.target.value }))}
              required
            >
              <option value="">Selecione...</option>
              {femeas.map(a => (
                <option key={a.uuid} value={a.uuid}>
                  {a.nome} ({a.id_fisico || a.id_interno || 's/brinco'})
                </option>
              ))}
            </select>
          </label>

          <label className={styles.label}>
            <span>Reprodutor (opcional)</span>
            <select
              className={styles.input}
              value={form.reprodutor_uuid}
              onChange={e => setForm(prev => ({ ...prev, reprodutor_uuid: e.target.value }))}
            >
              <option value="">Não informado</option>
              {touros.map(a => (
                <option key={a.uuid} value={a.uuid}>
                  {a.nome} ({a.id_fisico || a.id_interno || 's/brinco'})
                </option>
              ))}
            </select>
          </label>

          <label className={styles.label}>
            <span>Data da cobertura</span>
            <input
              type="date"
              className={styles.input}
              value={form.data_cobertura}
              onChange={e => setForm(prev => ({ ...prev, data_cobertura: e.target.value }))}
              required
            />
          </label>

          <label className={styles.label}>
            <span>Tipo</span>
            <select
              className={styles.input}
              value={form.tipo_cobertura}
              onChange={e => setForm(prev => ({ ...prev, tipo_cobertura: e.target.value }))}
            >
              {TIPOS_COBERTURA.map(t => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </label>

          <label className={styles.label}>
            <span>Observação</span>
            <textarea
              className={styles.input}
              rows={2}
              value={form.observacao}
              onChange={e => setForm(prev => ({ ...prev, observacao: e.target.value }))}
            />
          </label>

          {dataPrevistaCalculo && (
            <div className={styles.sucessoBanner}>
              Parto previsto: <strong>{formatarData(dataPrevistaCalculo)}</strong> · Secagem: <strong>{formatarData(dataSecagemCalculo)}</strong>
            </div>
          )}

          <button type="submit" className={styles.btnPrimario} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Registrar cobertura'}
          </button>
        </form>

        <h2 className={styles.secaoTitulo}>Coberturas registradas</h2>

        {carregando ? (
          <div className={pageStyles.emptyState}>Carregando...</div>
        ) : registros.length === 0 ? (
          <div className={pageStyles.emptyState}>Nenhuma cobertura registrada.</div>
        ) : (
          <div className={pageStyles.gestacoesList}>
            {registros.map(r => {
              const femea = animalPorUuid.get(r.animal_uuid)
              const status = r.resultado === 'parida' ? 'parida' : r.prenhez_confirmada ? 'prenhez_confirmada' : r.resultado === 'negativa' ? 'falhou' : r.motivo_cancelamento ? 'cancelada' : 'gestante'
              const dias = diasAteParto(r.data_previa_parto)
              const prog = calcularProgresso(r.data_cobertura)
              const cor = STATUS_CORES[status]
              return (
                <div
                  key={r.uuid}
                  className={pageStyles.gestacaoCard}
                  style={{ borderLeft: `4px solid ${cor}` }}
                >
                  <div className={pageStyles.gestacaoInfo}>
                    <div className={pageStyles.gestacaoAnimal}>
                      {femea?.nome || 'Animal'} ({femea?.id_fisico || femea?.id_interno || 's/brinco'})
                    </div>
                    <div className={pageStyles.gestacaoMeta}>
                      <span>{STATUS_LABELS[status]}</span>
                      <span className={pageStyles.metaSep}>·</span>
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
                          <span>{dias < 0 ? `${Math.abs(dias)}d atrasado` : `${dias}d restantes`}</span>
                        </>
                      )}
                      {prog !== null && (
                        <>
                          <span className={pageStyles.metaSep}>·</span>
                          <span>{prog}% gestação</span>
                        </>
                      )}
                    </div>
                  </div>
                  {status !== 'parida' && status !== 'cancelada' && (
                    <button
                      type="button"
                      className={styles.btnSecundario}
                      onClick={() => handleCancelar(r.uuid)}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Cobertura
