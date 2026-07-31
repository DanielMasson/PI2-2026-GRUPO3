import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAnimais } from '../../../hooks/useAnimais'
import { useCios } from '../../../hooks/useCios'
import styles from '../Subpage.module.css'
import pageStyles from '../Reproducao.module.css'

function formatarData(dataStr) {
  return new Date(dataStr + 'T00:00:00').toLocaleDateString('pt-BR')
}

function Cio() {
  const navigate = useNavigate()
  const { propriedadeId } = useParams()
  const { animais } = useAnimais(propriedadeId)
  const { cios, carregando, registrarCio, excluirCio } = useCios(propriedadeId)

  const femeas = animais.filter(a => a.sexo === 'femea' && a.status === 'ativo')
  const animalPorUuid = new Map(animais.map(a => [a.uuid, a]))

  const [form, setForm] = useState({
    animal_uuid: '',
    data: new Date().toISOString().slice(0, 10),
    intensidade: 'leve',
    sintomas: '',
    observacao: '',
  })
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')

  async function handleRegistrar(e) {
    e.preventDefault()
    if (!form.animal_uuid) {
      setErro('Selecione uma fêmea')
      return
    }
    setErro('')
    setSalvando(true)
    try {
      await registrarCio(form)
      setSucesso('Cio registrado.')
      setForm(prev => ({
        ...prev,
        animal_uuid: '',
        sintomas: '',
        observacao: '',
      }))
      setTimeout(() => setSucesso(''), 3000)
    } catch (err) {
      setErro(err.message || String(err))
    } finally {
      setSalvando(false)
    }
  }

  async function handleExcluir(uuid) {
    if (!confirm('Excluir este registro de cio?')) return
    await excluirCio(uuid)
  }

  return (
    <div className={pageStyles.container}>
      <header className={pageStyles.topbar}>
        <button className={pageStyles.backBtn} onClick={() => navigate(`/propriedade/${propriedadeId}/reproducao`)}>←</button>
        <div>
          <h1 className={pageStyles.pageTitle}>🌸 Registro de Cio</h1>
          <p className={pageStyles.pageSubtitle}>Anotar observação de cio antes da cobertura</p>
        </div>
      </header>

      <div className={pageStyles.inner}>
        <form className={styles.formCard} onSubmit={handleRegistrar}>
          {erro && <div className={styles.erroBanner}>{erro}</div>}
          {sucesso && <div className={styles.sucessoBanner}>{sucesso}</div>}

          <label className={styles.label}>
            <span>Fêmea</span>
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
            <span>Intensidade</span>
            <select
              className={styles.input}
              value={form.intensidade}
              onChange={e => setForm(prev => ({ ...prev, intensidade: e.target.value }))}
            >
              <option value="leve">Leve</option>
              <option value="moderada">Moderada</option>
              <option value="intensa">Intensa</option>
            </select>
          </label>

          <label className={styles.label}>
            <span>Sintomas observados</span>
            <input
              type="text"
              className={styles.input}
              placeholder="Ex: monta, muco, inquietação"
              value={form.sintomas}
              onChange={e => setForm(prev => ({ ...prev, sintomas: e.target.value }))}
            />
          </label>

          <label className={styles.label}>
            <span>Observação</span>
            <textarea
              className={styles.input}
              rows={3}
              value={form.observacao}
              onChange={e => setForm(prev => ({ ...prev, observacao: e.target.value }))}
            />
          </label>

          <button type="submit" className={styles.btnPrimario} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Registrar cio'}
          </button>
        </form>

        <h2 className={styles.secaoTitulo}>Cios registrados</h2>

        {carregando ? (
          <div className={pageStyles.emptyState}>Carregando...</div>
        ) : cios.length === 0 ? (
          <div className={pageStyles.emptyState}>Nenhum cio registrado ainda.</div>
        ) : (
          <div className={pageStyles.gestacoesList}>
            {cios.map(c => {
              const animal = animalPorUuid.get(c.animal_uuid)
              const nome = c.nome_animal || animal?.nome || 'Animal'
              const brinco = c.id_fisico || animal?.id_fisico || animal?.id_interno || ''
              return (
                <div key={c.uuid} className={pageStyles.gestacaoCard} style={{ borderLeft: '4px solid #ec4899' }}>
                  <div className={pageStyles.gestacaoInfo}>
                    <div className={pageStyles.gestacaoAnimal}>
                      {nome} ({brinco || 's/brinco'})
                    </div>
                    <div className={pageStyles.gestacaoMeta}>
                      <span>{formatarData(c.data)}</span>
                      <span className={pageStyles.metaSep}>·</span>
                      <span>Intensidade: {c.intensidade || '—'}</span>
                      {c.sintomas && (
                        <>
                          <span className={pageStyles.metaSep}>·</span>
                          <span>{c.sintomas}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.btnSecundario}
                    onClick={() => handleExcluir(c.uuid)}
                  >
                    Excluir
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Cio
