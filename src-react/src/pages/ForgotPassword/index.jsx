import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from '../Login/Login.module.css'
import Button from '../../components/Button/index.jsx'
import Input from '../../components/Input/index.jsx'
import logo from '../../assets/logo.png'

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [fields, setFields] = useState({ email: '', phone: '' })
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    const { name, value } = e.target
    setFields(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  function validate() {
    const errs = {}
    if (!fields.email && !fields.phone)
      errs.email = 'Informe e-mail ou telefone'
    return errs
  }

  function handleSendEmail() {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    // Futuramente: chamada API de envio por e-mail
    navigate('/verificar-codigo', { state: { method: 'email' } })
  }

  function handleSendSMS() {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    // Futuramente: chamada API de envio por SMS
    navigate('/verificar-codigo', { state: { method: 'sms' } })
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>

        <div className={styles.logoWrapper}>
          <img src={logo} alt="Logo" className={styles.logo} />
        </div>

        <div className={styles.form}>
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

          <Button type="button" onClick={handleSendEmail}>
            Enviar código por e-mail
          </Button>

          <Button type="button" onClick={handleSendSMS}>
            Enviar código por SMS
          </Button>
        </div>

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

export default ForgotPasswordPage
