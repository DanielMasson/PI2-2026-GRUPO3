import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from '../Login/Login.module.css'
import Button from '../../components/Button/index.jsx'
import Input from '../../components/Input/index.jsx'

// Validação separada da UI — fácil de testar e reutilizar
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

  // Estado do formulário
  const [fields, setFields] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setFields(prev => ({ ...prev, [name]: value }))
    // Limpa o erro do campo ao digitar
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
      // Aqui vai a chamada à API futuramente:
      // await authService.login(fields.email, fields.password)
      await new Promise(r => setTimeout(r, 1000)) // Simulação
      navigate('/dashboard')
    } catch (err) {
      setFormError('E-mail ou senha incorretos.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Bem-vindo</h1>
          <p className={styles.subtitle}>Entre com suas credenciais</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {formError && <p className={styles.formError}>{formError}</p>}

          <Input
            id="email"
            name="email"
            type="email"
            label="E-mail"
            placeholder="seu@email.com"
            value={fields.email}
            onChange={handleChange}
            error={errors.email}
            autoComplete="email"
            inputMode="email"  /* Abre teclado correto no mobile */
          />

          <Input
            id="password"
            name="password"
            type="password"
            label="Senha"
            placeholder="••••••••"
            value={fields.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="current-password"
          />

          <a href="#" className={styles.forgotPassword}>
            Esqueci minha senha
          </a>

          <Button type="submit" isLoading={isLoading}>
            Entrar
          </Button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage