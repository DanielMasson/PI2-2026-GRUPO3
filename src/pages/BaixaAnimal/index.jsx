import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAnimal } from '../../hooks/useAnimal'
import { useBaixas } from '../../hooks/useBaixas'
import { TIPOS_BAIXA } from '../../constants/sync'
import styles from './BaixaAnimal.module.css'

function validarForm({ tipo, valor_recebido, data }) {
  const erros = {}
  if (!tipo) erros.tipo = 'Selecione o tipo de baixa'
  if (!data) erros.data = 'Data é obrigatória'
  if (tipo === 'venda') {
    if (valor_recebido === '' || valor_recebido === undefined) {
      erros.valor_recebido = 'Valor recebido é obrigatório para venda'
    } else if (Number(valor_recebido) < 0) {
      erros.valor_recebido = 'Valor deve ser positivo'
    }
  }
  return erros
}

function BaixaAnimal() {
  const { propriedadeId, animalId } = useParams()
  const navigate = useNavigate()
  const { animal, carregando: carregandoAnimal, erro: erroAnimal } = useAnimal(animalId)
  const { registrarBaixa } = useBaixas(propriedadeId)

  const [fields, setFields] = useState({
    tipo: '',
    valor_recebido: '',
    data: new Date().toISOString().split('T')[0],
    motivo: '',
  })
  const [erros, setErros] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [submitErro, setSubmitErro] = useState(null)

  function handleChange(e) {
    const { name, value } = e.target
    setFields(prev => ({ ...prev, [name]: value }))
    if (erros[name]) setErros(prev => ({ ...prev, [name]: '' }))
    setSucesso(false)
    setSubmitErro(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSucesso(false)
    setSubmitErro(null)

    const errosValidacao = validarForm(fields)
    if (Object.keys(errosValidacao).length > 0) {
      setErros(errosValidacao)
      return
    }

    setIsLoading(true)
    try {
      await registrarBaixa({
        animal_uuid: animalId,
        tipo: fields.tipo,
        valor_recebido: fields.tipo === 'venda' ? Number(fields.valor_recebido) : 0,
        data: fields.data,
        motivo: fields.motivo || null,
      })
      setSucesso(true)
      setTimeout(() => {
        navigate(`/propriedade/${propriedadeId}/animal/${animalId}`)
      }, 1500)
    } catch (err) {
      setSubmitErro(err.message || 'Erro ao registrar baixa.')
    } finally {
      setIsLoading(false)
    }
  }

  if (carregandoAnimal) {
    return (
      <div className={styles.screen}>
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button className={styles.backBtn} onClick={() => navigate(-1)}>←</button>
            <div className={styles.topbarTitle}>Carregando...</div>
          </div>
        </div>
      </div>
    )
  }

  if (erroAnimal || !animal) {
    return (
      <div className={styles.screen}>
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button className={styles.backBtn} onClick={() => navigate(-1)}>←</button>
            <div className={styles.topbarTitle}>Erro</div>
          </div>
        </div>
        <div className={styles.scrollArea}>
          <div className={styles.erroBox}>{erroAnimal || 'Animal não encontrado'}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.screen}>
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>←</button>
          <div>
            <div className={styles.topbarTitle}>Registrar Baixa</div>
            <div className={styles.topbarSub}>{animal.nome || animal.id_fisico}</div>
          </div>
        </div>
      </div>

      <div className={styles.scrollArea}>
        <div className={styles.cardAnimal}>
          <span className={styles.animalNome}>{animal.nome || '—'}</span>
          <span className={styles.animalDetalhe}>{animal.especie} · {animal.raca} · {animal.id_fisico || '—'}</span>
        </div>

        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <p className={styles.aviso}>
            A baixa irá alterar o status do animal para <strong>{fields.tipo === 'venda' ? 'vendido' : fields.tipo === 'morte' ? 'morto' : 'consumido'}</strong>.
          </p>

          {/* Tipo de baixa */}
          <div className={styles.campoGroup}>
            <label className={styles.label}>Tipo de baixa *</label>
            <div className={styles.radioGroup}>
              {TIPOS_BAIXA.map(t => (
                <label key={t} className={`${styles.radioLabel} ${fields.tipo === t ? styles.radioAtivo : ''}`}>
                  <input
                    type="radio"
                    name="tipo"
                    value={t}
                    checked={fields.tipo === t}
                    onChange={handleChange}
                    className={styles.radioInput}
                  />
                  <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                </label>
              ))}
            </div>
            {erros.tipo && <span className={styles.errorMsg}>{erros.tipo}</span>}
          </div>

          {/* Data */}
          <div className={styles.campo}>
            <label className={styles.label} htmlFor="data">Data da baixa *</label>
            <input
              id="data"
              type="date"
              name="data"
              value={fields.data}
              onChange={handleChange}
              className={`${styles.input} ${erros.data ? styles.inputError : ''}`}
            />
            {erros.data && <span className={styles.errorMsg}>{erros.data}</span>}
          </div>

          {/* Valor recebido (apenas para venda) */}
          {fields.tipo === 'venda' && (
            <div className={styles.campo}>
              <label className={styles.label} htmlFor="valor_recebido">Valor recebido (R$) *</label>
              <input
                id="valor_recebido"
                type="number"
                step="0.01"
                min="0"
                name="valor_recebido"
                value={fields.valor_recebido}
                onChange={handleChange}
                placeholder="0,00"
                className={`${styles.input} ${erros.valor_recebido ? styles.inputError : ''}`}
              />
              {erros.valor_recebido && <span className={styles.errorMsg}>{erros.valor_recebido}</span>}
            </div>
          )}

          {/* Motivo */}
          <div className={styles.campo}>
            <label className={styles.label} htmlFor="motivo">Motivo / Observação</label>
            <textarea
              id="motivo"
              name="motivo"
              value={fields.motivo}
              onChange={handleChange}
              placeholder="Ex: Venda para frigorífico, Doença, Consumo próprio..."
              rows={3}
              className={styles.textarea}
            />
          </div>

          {submitErro && <div className={styles.erroBox}>{submitErro}</div>}
          {sucesso && <div className={styles.sucessoBox}>Baixa registrada com sucesso!</div>}

          <button
            type="submit"
            disabled={isLoading || !fields.tipo}
            className={styles.btnConfirmar}
          >
            {isLoading ? 'Registrando...' : 'Confirmar Baixa'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default BaixaAnimal
