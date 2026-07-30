import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styles from './AnimalRegistration.module.css'
import Button from '../../components/Button/index.jsx'
import Input from '../../components/Input/index.jsx'
import PropertyNav from '../../components/PropertyNav/index.jsx'
import { useAnimais } from '../../hooks/useAnimais'
import { getIdade } from '../../hooks/useAnimal'
import { ESPECIES, SEXOS } from '../../constants/sync'

function validarForm({ nome, brinco, raca, peso, dataNascimento, sexo, especie }) {
  const erros = {}
  if (!especie) erros.especie = 'Selecione a espécie'
  if (!nome.trim()) erros.nome = 'Nome é obrigatório'
  if (!brinco.trim()) erros.brinco = 'Brinco/Tag é obrigatório'
  if (!raca.trim()) erros.raca = 'Raça é obrigatória'
  if (!peso) erros.peso = 'Peso é obrigatório'
  else if (isNaN(Number(peso)) || Number(peso) <= 0) erros.peso = 'Peso inválido'
  if (!dataNascimento) erros.dataNascimento = 'Data de nascimento é obrigatória'
  if (!sexo) erros.sexo = 'Selecione o sexo'
  return erros
}

const INITIAL_FIELDS = {
  especie: '',
  nome: '',
  brinco: '',
  raca: '',
  peso: '',
  dataNascimento: '',
  sexo: '',
  pelagem: '',
  genetica: '',
  origem: '',
	pai_uuid: '',
	mae_uuid: '',
}

function CadastroAnimal() {
  const navigate = useNavigate()
  const { propriedadeId } = useParams()

  const { animais, carregando, criarAnimal } = useAnimais(propriedadeId)

  const [fields, setFields] = useState(INITIAL_FIELDS)
  const [erros, setErros] = useState({})
  const [sucesso, setSucesso] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [submitErro, setSubmitErro] = useState(null)
  const [activeTab, setActiveTab] = useState('animais')
  const [busca, setBusca] = useState('')

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
      const novoAnimal = await criarAnimal({
        nome: fields.nome,
        id_fisico: fields.brinco,
        especie: fields.especie,
        raca: fields.raca,
        sexo: fields.sexo,
        data_nascimento: fields.dataNascimento,
        peso_inicial: Number(fields.peso),
        pelagem: fields.pelagem,
        genetica: fields.genetica,
        origem: fields.origem,
        mae_uuid: fields.mae_uuid || null,
        pai_uuid: fields.pai_uuid || null,
      })

      setFields(INITIAL_FIELDS)
      setErros({})
      setSucesso(true)

      navigate(`/propriedade/${propriedadeId}/animal/${novoAnimal.uuid}`)
    } catch (err) {
      setSubmitErro(err.message || 'Erro ao cadastrar animal.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleLimpar() {
    setFields(INITIAL_FIELDS)
    setErros({})
    setSucesso(false)
    setSubmitErro(null)
  }

  function handleNav(key) {
    if (key === 'inicio') {
      navigate(`/propriedade/${propriedadeId}`)
    } else if (key === 'animais') {
      navigate(`/propriedade/${propriedadeId}/animais`)
    } else if (key === 'reproducao') {
      navigate(`/propriedade/${propriedadeId}/reproducao`)
    } else if (key === 'leite') {
      navigate(`/propriedade/${propriedadeId}/producao-leite`)
    } else {
      setActiveTab(key)
    }
  }

  return (
    <div className={styles.screen}>

      {/* ── Topbar ── */}
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <button className={styles.backBtn} onClick={() => navigate(`/propriedade/${propriedadeId}`)}>
            ←
          </button>
          <div>
            <div className={styles.topbarTitle}>Cadastro de Animal</div>
            <div className={styles.topbarSub}>Propriedade: {propriedadeId}</div>
          </div>
        </div>
        <div className={styles.topbarActions}>
          <button className={styles.iconBtn} title="Notificações">🔔</button>
          <button className={styles.iconBtn} title="Configurações">⚙️</button>
        </div>
      </header>

      {/* ── Conteúdo ── */}
      <main className={styles.scrollArea}>

        {/* ══ Formulário ══ */}
        <section className={styles.formSection}>
          <p className={styles.sectionTitle}>Novo animal</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.formGrid}>
              {/* Espécie */}
              <div>
                <div className={styles.selectWrapper}>
                  <label className={styles.selectLabel} htmlFor="especie">Espécie</label>
                  <select
                    id="especie"
                    name="especie"
                    className={`${styles.select} ${erros.especie ? styles.selectError : ''}`}
                    value={fields.especie}
                    onChange={handleChange}
                  >
                    <option value="" disabled>Selecione</option>
                    {ESPECIES.map(e => (
                      <option key={e} value={e}>
                        {e.charAt(0).toUpperCase() + e.slice(1)}
                      </option>
                    ))}
                  </select>
                  {erros.especie && <span className={styles.errorMsg}>{erros.especie}</span>}
                </div>
              </div>

              {/* Sexo */}
              <div>
                <div className={styles.selectWrapper}>
                  <label className={styles.selectLabel} htmlFor="sexo">Sexo</label>
                  <select
                    id="sexo"
                    name="sexo"
                    className={`${styles.select} ${erros.sexo ? styles.selectError : ''}`}
                    value={fields.sexo}
                    onChange={handleChange}
                  >
                    <option value="" disabled>Selecione</option>
                    {SEXOS.map(s => (
                      <option key={s} value={s}>
                        {s === 'macho' ? 'Macho' : 'Fêmea'}
                      </option>
                    ))}
                  </select>
                  {erros.sexo && <span className={styles.errorMsg}>{erros.sexo}</span>}
                </div>
              </div>

              {/* Nome */}
              <div className={styles.formGridFull}>
                <Input
                  id="nome"
                  name="nome"
                  label="Nome do animal"
                  placeholder="Ex: Mimosa"
                  value={fields.nome}
                  onChange={handleChange}
                  error={erros.nome}
                  variant="dark"
                />
              </div>

              {/* Brinco */}
              <Input
                id="brinco"
                name="brinco"
                label="Brinco / Tag"
                placeholder="Ex: BR-00142"
                value={fields.brinco}
                onChange={handleChange}
                error={erros.brinco}
                variant="dark"
              />

              {/* Raça */}
              <Input
                id="raca"
                name="raca"
                label="Raça"
                placeholder="Ex: Nelore"
                value={fields.raca}
                onChange={handleChange}
                error={erros.raca}
                variant="dark"
              />

              {/* Peso */}
              <Input
                id="peso"
                name="peso"
                type="number"
                label="Peso (kg)"
                placeholder="Ex: 320"
                value={fields.peso}
                onChange={handleChange}
                error={erros.peso}
                inputMode="decimal"
                variant="dark"
              />

              {/* Data de nascimento */}
              <Input
                id="dataNascimento"
                name="dataNascimento"
                type="date"
                label="Data de nascimento"
                value={fields.dataNascimento}
                onChange={handleChange}
                error={erros.dataNascimento}
                variant="dark"
              />

              {/* Pelagem */}
              <Input
                id="pelagem"
                name="pelagem"
                label="Pelagem / Sinais"
                placeholder="Ex: Branca malhada"
                value={fields.pelagem}
                onChange={handleChange}
                variant="dark"
              />

              {/* Genética */}
              <Input
                id="genetica"
                name="genetica"
                label="Genética"
                placeholder="Ex: 3/4 Nelore + 1/4 Angus"
                value={fields.genetica}
                onChange={handleChange}
                variant="dark"
              />

              {/* Origem */}
              <div className={styles.formGridFull}>
                <Input
                  id="origem"
                  name="origem"
                  label="Origem"
                  placeholder="Ex: Comprada na Fazenda São João"
                  value={fields.origem}
                  onChange={handleChange}
                  variant="dark"
                />
              </div>
            </div>

			{/* Pai (Sire) */}
			<div className={styles.formGridFull}>
				<div className={styles.selectWrapper}>
					<label className={styles.selectLabel} htmlFor="pai_uuid">Pai (Sire)</label>
					<select
						id="pai_uuid"
						name="pai_uuid"
						className={styles.select}
						value={fields.pai_uuid}
						onChange={handleChange}
					>
						<option value="">Não informado</option>
						{animais.filter(a => a.sexo === 'macho').map(a => (
							<option key={a.uuid} value={a.uuid}>{a.nome} ({a.id_fisico || a.id_interno || 's/brinco'})</option>
						))}
					</select>
				</div>
			</div>

			{/* Mãe (Dam) */}
			<div className={styles.formGridFull}>
				<div className={styles.selectWrapper}>
					<label className={styles.selectLabel} htmlFor="mae_uuid">Mãe (Dam)</label>
					<select
						id="mae_uuid"
						name="mae_uuid"
						className={styles.select}
						value={fields.mae_uuid}
						onChange={handleChange}
					>
						<option value="">Não informado</option>
						{animais.filter(a => a.sexo === 'femea').map(a => (
							<option key={a.uuid} value={a.uuid}>{a.nome} ({a.id_fisico || a.id_interno || 's/brinco'})</option>
						))}
					</select>
				</div>
			</div>
            <div className={styles.formActions}>
              <Button type="button" variant="ghost" onClick={handleLimpar}>
                Limpar
              </Button>
              <Button type="submit" isLoading={isLoading}>
                Salvar animal
              </Button>
            </div>

            {sucesso && (
              <p className={styles.successToast}>
                ✓ Animal cadastrado com sucesso!
              </p>
            )}

            {submitErro && (
              <p className={styles.errorMsg}>
                {submitErro}
              </p>
            )}
          </form>
        </section>

        {/* ══ Lista de Animais ══ */}
        <section className={styles.listSection}>
          <div className={styles.listHeader}>
            <p className={styles.sectionTitle}>
              Animais cadastrados ({animais.length})
            </p>
            <div className={styles.searchWrapper}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Buscar..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
            </div>
          </div>

          {carregando ? (
            <div className={styles.emptyState}>Carregando animais...</div>
          ) : animais.length === 0 ? (
            <div className={styles.emptyState}>
              Nenhum animal cadastrado ainda.
            </div>
          ) : (
            <div className={styles.animalList}>
              {animais.map(a => (
                <div
                  key={a.uuid}
                  className={styles.animalCard}
                  onClick={() => navigate(`/propriedade/${propriedadeId}/animal/${a.uuid}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && navigate(`/propriedade/${propriedadeId}/animal/${a.uuid}`)}
                >
                  <div className={styles.animalCardLeft}>
                    <span className={styles.animalIcon}>
                      {a.especie === 'ovino' ? '🐑' : a.especie === 'suino' ? '🐷' : '🐄'}
                    </span>
                    <div className={styles.animalInfo}>
                      <span className={styles.animalName}>{a.nome}</span>
                      <span className={styles.animalMeta}>
                        {a.raca} · {a.sexo === 'macho' ? '♂' : '♀'} · {a.data_nascimento ? getIdade(a.data_nascimento) : '—'} · {a.peso_inicial ?? '—'}kg
                      </span>
                    </div>
                  </div>
                  <span className={styles.animalTag}>{a.id_fisico || a.id_interno}</span>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* ── Bottom Nav ── */}
      <PropertyNav activeTab={activeTab} onNav={handleNav} />

    </div>
  )
}

export default CadastroAnimal
