import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styles from './AnimalRegistration.module.css'
import Button from '../../components/Button/index.jsx'
import Input from '../../components/Input/index.jsx'

// Array em memória — persiste enquanto o app estiver aberto
const animaisRegistrados = []

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

// Dados mock para demonstração
const ANIMAIS_MOCK = [
  { id: 1, nome: 'Mimosa', brinco: 'BR-00142', raca: 'Nelore', peso: 345, sexo: 'femea', especie: 'bovino', dataNascimento: '2023-03-15', cadastradoEm: '2026-01-10' },
  { id: 2, nome: 'Trovão', brinco: 'BR-00201', raca: 'Angus', peso: 410, sexo: 'macho', especie: 'bovino', dataNascimento: '2024-01-20', cadastradoEm: '2026-01-12' },
  { id: 3, nome: 'Estrela', brinco: 'BR-00310', raca: 'Nelore', peso: 380, sexo: 'femea', especie: 'bovino', dataNascimento: '2022-08-10', cadastradoEm: '2026-02-01' },
]

const NAV_ITEMS = [
  { key: 'inicio',   label: 'Início',  icone: '🏠' },
  { key: 'animais',  label: 'Animais', icone: '🐄' },
  { key: 'lotes',    label: 'Lotes',   icone: '🌾' },
  { key: 'tarefas',  label: 'Tarefas', icone: '📋' },
  { key: 'perfil',   label: 'Perfil',  icone: '👤' },
]

function CadastroAnimal() {
  const navigate = useNavigate()
  const { propriedadeId } = useParams()

  const [fields, setFields] = useState({
    especie: '',
    nome: '',
    brinco: '',
    raca: '',
    peso: '',
    dataNascimento: '',
    sexo: '',
  })
  const [erros, setErros] = useState({})
  const [sucesso, setSucesso] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [listaLocal, setListaLocal] = useState(ANIMAIS_MOCK)
  const [activeTab, setActiveTab] = useState('animais')
  const [busca, setBusca] = useState('')

  const animaisFiltrados = listaLocal.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase()) ||
    a.brinco.toLowerCase().includes(busca.toLowerCase())
  )

  function handleChange(e) {
    const { name, value } = e.target
    setFields(prev => ({ ...prev, [name]: value }))
    if (erros[name]) setErros(prev => ({ ...prev, [name]: '' }))
    setSucesso(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSucesso(false)

    const errosValidacao = validarForm(fields)
    if (Object.keys(errosValidacao).length > 0) {
      setErros(errosValidacao)
      return
    }

    setIsLoading(true)
    await new Promise(r => setTimeout(r, 600))

    const novoAnimal = {
      id: Date.now(),
      propriedadeId,
      ...fields,
      peso: Number(fields.peso),
      cadastradoEm: new Date().toISOString(),
    }

    animaisRegistrados.push(novoAnimal)
    setListaLocal(prev => [...prev, novoAnimal])

    setFields({ especie: '', nome: '', brinco: '', raca: '', peso: '', dataNascimento: '', sexo: '' })
    setErros({})
    setSucesso(true)
    setIsLoading(false)
  }

  function handleLimpar() {
    setFields({ especie: '', nome: '', brinco: '', raca: '', peso: '', dataNascimento: '', sexo: '' })
    setErros({})
    setSucesso(false)
  }

  function handleNav(key) {
    if (key === 'inicio') {
      navigate(`/propriedade/${propriedadeId}`)
    } else if (key === 'animais') {
      setActiveTab(key)
    } else {
      setActiveTab(key)
    }
  }

  function getIdade(dataNascimento) {
    const hoje = new Date()
    const nasc = new Date(dataNascimento + 'T00:00:00')
    const meses = (hoje.getFullYear() - nasc.getFullYear()) * 12 + (hoje.getMonth() - nasc.getMonth())
    if (meses < 12) return `${meses}m`
    const anos = Math.floor(meses / 12)
    const resto = meses % 12
    return resto > 0 ? `${anos}a ${resto}m` : `${anos}a`
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
                    <option value="bovino">Bovino</option>
                    <option value="ovino">Ovino</option>
                    <option value="suino">Suíno</option>
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
                    <option value="macho">Macho</option>
                    <option value="femea">Fêmea</option>
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
              />
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
          </form>
        </section>

        {/* ══ Lista de Animais ══ */}
        <section className={styles.listSection}>
          <div className={styles.listHeader}>
            <p className={styles.sectionTitle}>
              Animais cadastrados ({listaLocal.length})
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

          {animaisFiltrados.length === 0 ? (
            <div className={styles.emptyState}>
              {listaLocal.length === 0
                ? 'Nenhum animal cadastrado ainda.'
                : 'Nenhum animal encontrado com esse filtro.'}
            </div>
          ) : (
            <div className={styles.animalList}>
              {animaisFiltrados.map(animal => (
                <div key={animal.id} className={styles.animalCard}>
                  <div className={styles.animalCardLeft}>
                    <span className={styles.animalIcon}>
                      {animal.especie === 'ovino' ? '🐑' : animal.especie === 'suino' ? '🐷' : '🐄'}
                    </span>
                    <div className={styles.animalInfo}>
                      <span className={styles.animalName}>{animal.nome}</span>
                      <span className={styles.animalMeta}>
                        {animal.raca} · {animal.sexo === 'macho' ? '♂' : '♀'} · {getIdade(animal.dataNascimento)} · {animal.peso}kg
                      </span>
                    </div>
                  </div>
                  <span className={styles.animalTag}>{animal.brinco}</span>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* ── Bottom Nav ── */}
      <nav className={styles.bottomNav}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.key}
            className={`${styles.navItem} ${activeTab === item.key ? styles.active : ''}`}
            onClick={() => handleNav(item.key)}
          >
            <span className={styles.navIcon}>{item.icone}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </button>
        ))}
      </nav>

    </div>
  )
}

export default CadastroAnimal
