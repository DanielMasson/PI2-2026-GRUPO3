import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styles from './AnimalRegistration.module.css'
import Button from '../../components/Button/index.jsx'
import Input from '../../components/Input/index.jsx'

// Array em memória — persiste enquanto o app estiver aberto
// Para tornar global entre rotas, eleve este estado para o App.jsx via Context ou prop drilling
const animaisRegistrados = []

function validarForm({ nome, brinco, raca, peso, dataNascimento, sexo }) {
  const erros = {}
  if (!nome.trim()) erros.nome = 'Nome é obrigatório'
  if (!brinco.trim()) erros.brinco = 'Brinco/Tag é obrigatório'
  if (!raca.trim()) erros.raca = 'Raça é obrigatória'
  if (!peso) erros.peso = 'Peso é obrigatório'
  else if (isNaN(Number(peso)) || Number(peso) <= 0) erros.peso = 'Peso inválido'
  if (!dataNascimento) erros.dataNascimento = 'Data de nascimento é obrigatória'
  if (!sexo) erros.sexo = 'Selecione o sexo'
  return erros
}

function CadastroAnimal() {
  const navigate = useNavigate()
  const { propriedadeId } = useParams()

  const [fields, setFields] = useState({
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
  // Lista local renderizada na tela; animaisRegistrados[] é o array "banco"
  const [listaLocal, setListaLocal] = useState([])

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
    await new Promise(r => setTimeout(r, 600)) // Simula latência de API

    const novoAnimal = {
      id: Date.now(),
      propriedadeId,
      ...fields,
      peso: Number(fields.peso),
      cadastradoEm: new Date().toISOString(),
    }

    animaisRegistrados.push(novoAnimal)
    setListaLocal(prev => [...prev, novoAnimal])

    // Reset form
    setFields({ nome: '', brinco: '', raca: '', peso: '', dataNascimento: '', sexo: '' })
    setErros({})
    setSucesso(true)
    setIsLoading(false)
  }

  function handleLimpar() {
    setFields({ nome: '', brinco: '', raca: '', peso: '', dataNascimento: '', sexo: '' })
    setErros({})
    setSucesso(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        {/* Topbar */}
        <div className={styles.topbar}>
          <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
            ←
          </button>
          <div>
            <h1 className={styles.pageTitle}>Cadastro de Animal</h1>
            <p className={styles.pageSubtitle}>
              Propriedade: <strong>{propriedadeId}</strong> &nbsp;·&nbsp; Placeholder — tela de detalhes virá antes
            </p>
          </div>
        </div>

        {/* Formulário */}
        <div className={styles.formCard}>
          <p className={styles.formTitle}>Novo animal</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.formGrid}>
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
        </div>

        {/* Lista de animais registrados nesta sessão */}
        <div className={styles.listSection}>
          <p className={styles.listTitle}>
            Registrados nesta sessão ({listaLocal.length})
          </p>

          {listaLocal.length === 0 ? (
            <div className={styles.emptyState}>
              Nenhum animal cadastrado ainda. Preencha o formulário acima.
            </div>
          ) : (
            <div className={styles.animalList}>
              {listaLocal.map(animal => (
                <div key={animal.id} className={styles.animalItem}>
                  <div className={styles.animalInfo}>
                    <span className={styles.animalName}>{animal.nome}</span>
                    <span className={styles.animalMeta}>
                      {animal.raca} &nbsp;·&nbsp; {animal.peso} kg &nbsp;·&nbsp;{' '}
                      {animal.sexo.charAt(0).toUpperCase() + animal.sexo.slice(1)} &nbsp;·&nbsp;{' '}
                      Nasc. {new Date(animal.dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <span className={styles.animalTag}>{animal.brinco}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CadastroAnimal
