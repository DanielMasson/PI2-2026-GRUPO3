import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from '../Login/Login.module.css'
import codeStyles from './VerifyCode.module.css'
import logo from '../../assets/logo.png'

function VerifyCodePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const method = location.state?.method || 'email'

  const [digits, setDigits] = useState(['', '', '', ''])
  const refs = [useRef(), useRef(), useRef(), useRef()]

  function handleDigit(index, value) {
    if (!/^\d?$/.test(value)) return
    const next = [...digits]
    next[index] = value
    setDigits(next)
    if (value && index < 3) refs[index + 1].current?.focus()
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs[index - 1].current?.focus()
    }
  }

  function handleVerify() {
    const code = digits.join('')
    if (code.length < 4) return
    // Futuramente: validar código via API
    navigate('/criar-senha')
  }

  const isComplete = digits.every(d => d !== '')

  return (
    <div className={styles.container}>
      <div className={styles.card}>

        <div className={styles.logoWrapper}>
          <img src={logo} alt="Logo" className={styles.logo} />
        </div>

        <p className={codeStyles.instruction}>
          Por favor insira o código que foi<br />
          enviado por {method === 'sms' ? 'SMS' : 'e-mail'}
        </p>

        <div className={codeStyles.codeRow}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              className={codeStyles.codeBox}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
            />
          ))}
        </div>

        {isComplete && (
          <button className={codeStyles.verifyBtn} onClick={handleVerify}>
            Verificar
          </button>
        )}

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

export default VerifyCodePage
