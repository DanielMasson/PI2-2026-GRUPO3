import { useState } from 'react'
import * as vacinaObrigatoriaService from '../../services/vacinaObrigatoriaService'
import styles from './VacinasObrigatoriasForm.module.css'

function VacinasObrigatoriasForm({ propriedadeUuid, onAtualizar }) {
  const [lista, setLista] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({
    nome_vacina: '',
    especie: 'bovino',
    sexo: 'todos',
    ciclo_dias: 365,
  })

  async function carregar() {
    if (!propriedadeUuid) return
    setCarregando(true)
    try {
      const dados = await vacinaObrigatoriaService.listarVacinasObrigatorias(propriedadeUuid)
      setLista(Array.isArray(dados) ? dados : [])
    } catch (e) {
      setErro(e.message || String(e))
    } finally {
      setCarregando(false)
    }
  }

  useState(() => { carregar() }, [])

  async function handleSalvar(e) {
    e.preventDefault()
    if (!form.nome_vacina.trim()) {
      setErro('Informe o nome da vacina')
      return
    }
    setErro('')
    setSalvando(true)
    try {
      const dados = { ...form, propriedade_uuid: propriedadeUuid }
      if (editando) {
        await vacinaObrigatoriaService.editarVacinaObrigatoria(editando, dados)
      } else {
        await vacinaObrigatoriaService.registrarVacinaObrigatoria(dados)
      }
      setSucesso(editando ? 'Vacina atualizada.' : 'Vacina cadastrada.')
      setEditando(null)
      setForm({ nome_vacina: '', especie: 'bovino', sexo: 'todos', ciclo_dias: 365 })
      await carregar()
      onAtualizar?.()
      setTimeout(() => setSucesso(''), 3000)
    } catch (err) {
      setErro(err.message || String(err))
    } finally {
      setSalvando(false)
    }
  }

  async function handleExcluir(uuid) {
    if (!confirm('Desativar esta vacina?')) return
    try {
      await vacinaObrigatoriaService.desativarVacinaObrigatoria(uuid)
      await carregar()
      onAtualizar?.()
    } catch (err) {
      setErro(err.message || String(err))
    }
  }

  function handleEditar(item) {
    setEditando(item.uuid)
    setForm({
      nome_vacina: item.nome_vacina,
      especie: item.especie || 'bovino',
      sexo: item.sexo || 'todos',
      ciclo_dias: item.ciclo_dias,
    })
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.titulo}>Vacinas obrigatórias da propriedade</h3>

      <form className={styles.form} onSubmit={handleSalvar}>
        {erro && <div className={styles.erro}>{erro}</div>}
        {sucesso && <div className={styles.sucesso}>{sucesso}</div>}

        <label className={styles.label}>
          <span>Nome da vacina</span>
          <input
            type="text"
            className={styles.input}
            placeholder="Ex: Febre Aftosa, Brucelose"
            value={form.nome_vacina}
            onChange={e => setForm(prev => ({ ...prev, nome_vacina: e.target.value }))}
            required
          />
        </label>

        <div className={styles.grid2}>
          <label className={styles.label}>
            <span>Espécie</span>
            <select
              className={styles.input}
              value={form.especie}
              onChange={e => setForm(prev => ({ ...prev, especie: e.target.value }))}
            >
              <option value="bovino">Bovino</option>
              <option value="ovino">Ovino</option>
              <option value="ambos">Ambos</option>
            </select>
          </label>

          <label className={styles.label}>
            <span>Sexo</span>
            <select
              className={styles.input}
              value={form.sexo}
              onChange={e => setForm(prev => ({ ...prev, sexo: e.target.value }))}
            >
              <option value="todos">Todos</option>
              <option value="femea">Fêmea</option>
              <option value="macho">Macho</option>
            </select>
          </label>
        </div>

        <label className={styles.label}>
          <span>Ciclo (dias)</span>
          <input
            type="number"
            className={styles.input}
            value={form.ciclo_dias}
            onChange={e => setForm(prev => ({ ...prev, ciclo_dias: Number(e.target.value) }))}
            min="1"
            required
          />
        </label>

        <div className={styles.actions}>
          <button type="submit" className={styles.btnPrimario} disabled={salvando}>
            {salvando ? 'Salvando...' : (editando ? 'Atualizar' : 'Cadastrar')}
          </button>
          {editando && (
            <button
              type="button"
              className={styles.btnSecundario}
              onClick={() => {
                setEditando(null)
                setForm({ nome_vacina: '', especie: 'bovino', sexo: 'todos', ciclo_dias: 365 })
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {carregando ? (
        <div className={styles.empty}>Carregando...</div>
      ) : lista.length === 0 ? (
        <div className={styles.empty}>Nenhuma vacina cadastrada.</div>
      ) : (
        <ul className={styles.lista}>
          {lista.map(v => (
            <li key={v.uuid} className={styles.item}>
              <div>
                <strong>{v.nome_vacina}</strong>
                <span className={styles.meta}>
                  {v.especie || 'bovino'} · {v.sexo || 'todos'} · ciclo {v.ciclo_dias}d
                </span>
              </div>
              <div className={styles.itemActions}>
                <button
                  type="button"
                  className={styles.btnSecundario}
                  onClick={() => handleEditar(v)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className={styles.btnExcluir}
                  onClick={() => handleExcluir(v.uuid)}
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default VacinasObrigatoriasForm
