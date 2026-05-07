import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Login.module.css'
import Button from '../../components/Button/index.jsx'
import Input from '../../components/Input/index.jsx'
import logo from '../../assets/logo.png'

function validateForm({ email, password }) {
  const errors = {}
  if (!email) errors.email = 'E-mail é obrigatório'
  else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'E-mail inválido'
  if (!password) errors.password = 'Senha é obrigatória'
  else if (password.length < 6) errors.password = 'Mínimo de 6 caracteres'
  return errors
}

function LoginPage() {
  const navigate = useNavigate()
  const [fields, setFields] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setFields(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const validationErrors = validateForm(fields)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setIsLoading(true)
    try {
      await new Promise(r => setTimeout(r, 1000))
      navigate('/dashboard')
    } catch {
      setFormError('E-mail ou senha incorretos.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.bbody}>
    <div className={styles.container}>
      <div className={styles.card}>

        <div className={styles.logoWrapper}>
          <img src={logo} alt="Logo" className={styles.logo} />
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {formError && <p className={styles.formError}>{formError}</p>}

          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Insira seu e-mail"
            value={fields.email}
            onChange={handleChange}
            error={errors.email}
            autoComplete="email"
            inputMode="email"
          />

          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Insira sua senha"
            value={fields.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="current-password"
          />

          <Button type="submit" isLoading={isLoading}>
            Log-in
          </Button>

          <button
            type="button"
            className={styles.forgotPassword}
            onClick={() => navigate('/esqueci-senha')}
          >
            Esqueceu a senha? Clique aqui
          </button>
        </form>

        <div className={styles.footer}>
          <span>Ainda não tem uma conta?</span>
          <button
            type="button"
            className={styles.footerLink}
            onClick={() => navigate('/cadastro')}
          >
            Clique aqui
          </button>
        </div>

      </div>
    </div>
    </div>
  )
}

export default LoginPage
