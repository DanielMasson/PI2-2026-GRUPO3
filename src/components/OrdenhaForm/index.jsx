import { useState } from 'react'
import { useProducaoLeite } from '../../hooks/useProducaoLeite'
import styles from './OrdenhaForm.module.css'

function OrdenhaForm({ animalUuid, propriedadeUuid, onAtualizar }) {
  const { ordenhas, carregando, registrarOrdenha, excluirOrdenha } = useProducaoLeite(animalUuid)
  const [form, setForm] = useState({
    data: new Date().toISOString().slice(0, 10),
    manha_litros: 0,
    tarde_litros: 0,
    ccs: '',
    observacao: '',
  })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  async function handleRegistrar(e) {
    e.preventDefault()
    if (Number(form.manha_litros) === 0 && Number(form.tarde_litros) === 0) {
      setErro('Informe ao menos um valor de ordenha (manhã ou tarde)')
      return
    }
    setErro('')
    setSalvando(true)
    try {
      await registrarOrdenha({
        ...form,
        propriedade_uuid: propriedadeUuid,
      })
      setSucesso('Ordenha registrada.')
      setForm(prev => ({
        ...prev,
        ccs: '',
        observacao: '',
      }))
      onAtualizar?.()
      setTimeout(() => setSucesso(''), 3000)
    } catch (err) {
      setErro(err.message || String(err))
    } finally {
      setSalvando(false)
    }
  }

  async function handleExcluir(uuid) {
    if (!confirm('Excluir este registro de ordenha?')) return
    try {
      await excluirOrdenha(uuid)
      onAtualizar?.()
    } catch (err) {
      setErro(err.message || String(err))
    }
  }

  const total = Number(form.manha_litros || 0) + Number(form.tarde_litros || 0)

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleRegistrar}>
        {erro && <div className={styles.erro}>{erro}</div>}
        {sucesso && <div className={styles.sucesso}>{sucesso}</div>}

        <div className={styles.grid}>
          <label className={styles.label}>
            <span>Data</span>
            <input
              type="date"
              className={styles.input}
              value={form.data}
              onChange={e => setForm(prev => ({ ...prev, data: e.target.value }))}
              required
            />
          </label>

          <label className={styles.label}>
            <span>Manhã (L)</span>
            <input
              type="number"
              step="0.1"
              min="0"
              className={styles.input}
              value={form.manha_litros}
              onChange={e => setForm(prev => ({ ...prev, manha_litros: e.target.value }))}
            />
          </label>

          <label className={styles.label}>
            <span>Tarde (L)</span>
            <input
              type="number"
              step="0.1"
              min="0"
              className={styles.input}
              value={form.tarde_litros}
              onChange={e => setForm(prev => ({ ...prev, tarde_litros: e.target.value }))}
            />
          </label>

          <label className={styles.label}>
            <span>CCS</span>
            <input
              type="number"
              className={styles.input}
              placeholder="opcional"
              value={form.ccs}
              onChange={e => setForm(prev => ({ ...prev, ccs: e.target.value }))}
            />
          </label>
        </div>

        <label className={styles.label}>
          <span>Observação</span>
          <textarea
            className={styles.input}
            rows={2}
            value={form.observacao}
            onChange={e => setForm(prev => ({ ...prev, observacao: e.target.value }))}
          />
        </label>

        {total > 0 && (
          <div className={styles.total}>Total do dia: <strong>{total.toFixed(1)} L</strong></div>
        )}

        <button type="submit" className={styles.btnPrimario} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Registrar ordenha'}
        </button>
      </form>

      <h4 className={styles.titulo}>Histórico de ordenhas ({ordenhas.length})</h4>

      {carregando ? (
        <div className={styles.empty}>Carregando...</div>
      ) : ordenhas.length === 0 ? (
        <div className={styles.empty}>Nenhuma ordenha registrada.</div>
      ) : (
        <ul className={styles.lista}>
          {ordenhas.map(o => {
            const total = Number(o.manha_litros || 0) + Number(o.tarde_litros || 0)
            return (
              <li key={o.uuid} className={styles.item}>
                <div>
                  <strong>{o.data}</strong>
                  <span className={styles.meta}>
                    Manhã {Number(o.manha_litros || 0).toFixed(1)} L · Tarde {Number(o.tarde_litros || 0).toFixed(1)} L · Total {total.toFixed(1)} L
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.btnExcluir}
                  onClick={() => handleExcluir(o.uuid)}
                >
                  Excluir
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default OrdenhaForm
