import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from '../Login/Login.module.css'
import Button from '../../components/Button/index.jsx'
import Input from '../../components/Input/index.jsx'
import logo from '../../assets/logo.png'

function CreatePasswordPage() {
  const navigate = useNavigate()
  const [fields, setFields] = useState({ password: '', confirm: '' })
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    const { name, value } = e.target
    setFields(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!fields.password) errs.password = 'Crie uma senha'
    else if (fields.password.length < 6) errs.password = 'Mínimo de 6 caracteres'
    if (fields.confirm !== fields.password) errs.confirm = 'As senhas não coincidem'
    if (Object.keys(errs).length) { setErrors(errs); return }
    // Futuramente: chamada API para salvar nova senha
    navigate('/login')
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>

        <div className={styles.logoWrapper}>
          <img src={logo} alt="Logo" className={styles.logo} />
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
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
            placeholder="Reescreva sua senha"
            value={fields.confirm}
            onChange={handleChange}
            error={errors.confirm}
            autoComplete="new-password"
          />

          <Button type="submit">
            Verificar
          </Button>
        </form>

      </div>
    </div>
  )
}

export default CreatePasswordPage
