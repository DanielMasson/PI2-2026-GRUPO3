import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from '../Login/Login.module.css'
import Button from '../../components/Button/index.jsx'
import Input from '../../components/Input/index.jsx'
import logo from '../../assets/logo.png'

function validateRegister({ name, email, phone, password, confirm }) {
  const errors = {}
  if (!name) errors.name = 'Nome é obrigatório'
  if (!email) errors.email = 'E-mail é obrigatório'
  else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'E-mail inválido'
  if (!phone) errors.phone = 'Telefone é obrigatório'
  if (!password) errors.password = 'Crie uma senha'
  else if (password.length < 6) errors.password = 'Mínimo de 6 caracteres'
  if (confirm !== password) errors.confirm = 'As senhas não coincidem'
  return errors
}

function RegisterPage() {
  const navigate = useNavigate()
  const [fields, setFields] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setFields(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validateRegister(fields)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setIsLoading(true)
    try {
      await new Promise(r => setTimeout(r, 1000))
      // Futuramente: chamada API de cadastro
      navigate('/login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>

        <div className={styles.logoWrapper}>
          <img src={logo} alt="Logo" className={styles.logo} />
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Seu nome completo"
            value={fields.name}
            onChange={handleChange}
            error={errors.name}
            autoComplete="name"
          />

          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Insira seu e-mail"
            value={fields.email}
            onChange={handleChange}
            error={errors.email}
            inputMode="email"
            autoComplete="email"
          />

          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="Insira seu telefone"
            value={fields.phone}
            onChange={handleChange}
            error={errors.phone}
            inputMode="tel"
            autoComplete="tel"
          />

          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Crie uma senha"
            value={fields.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="new-password"
          />

          <Input
            id="confirm"
            name="confirm"
            type="password"
            placeholder="Confirme sua senha"
            value={fields.confirm}
            onChange={handleChange}
            error={errors.confirm}
            autoComplete="new-password"
          />

          <Button type="submit" isLoading={isLoading}>
            Criar Conta
          </Button>
        </form>

        <div className={styles.footer}>
          <span>Já tem uma conta?</span>
          <button
            type="button"
            className={styles.footerLink}
            onClick={() => navigate('/login')}
          >
            Clique aqui
          </button>
        </div>

      </div>
    </div>
  )
}

export default RegisterPage
