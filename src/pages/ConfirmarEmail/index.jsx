import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import styles from '../Login/Login.module.css'
import Button from '../../components/Button/index.jsx'
import logo from '../../assets/logo.png'

export default function ConfirmarEmailPage() {
  const navigate = useNavigate()
  const { emailVerified, recarregarEmailVerified, reenviarVerificacao, usuario } = useAuth()
  const [enviando, setEnviando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [verificando, setVerificando] = useState(false)

  // Se já verificado, redireciona para dashboard
  useEffect(() => {
    if (emailVerified) navigate('/dashboard', { replace: true })
  }, [emailVerified, navigate])

  // Polling: verifica a cada 5s se o email foi confirmado
  useEffect(() => {
    if (emailVerified) return
    const interval = setInterval(async () => {
      const ok = await recarregarEmailVerified()
      if (ok) navigate('/dashboard', { replace: true })
    }, 5000)
    return () => clearInterval(interval)
  }, [emailVerified, recarregarEmailVerified, navigate])

  const handleReenviar = useCallback(async () => {
    setEnviando(true)
    setMensagem('')
    try {
      await reenviarVerificacao()
      setMensagem('Email de confirmação reenviado! Verifique sua caixa de entrada.')
    } catch {
      setMensagem('Erro ao reenviar. Tente novamente em alguns minutos.')
    } finally {
      setEnviando(false)
    }
  }, [reenviarVerificacao])

  const handleVerificar = useCallback(async () => {
    setVerificando(true)
    const ok = await recarregarEmailVerified()
    if (ok) {
      navigate('/dashboard', { replace: true })
    } else {
      setMensagem('Email ainda não confirmado. Clique no link do email e tente novamente.')
      setVerificando(false)
    }
  }, [recarregarEmailVerified, navigate])

  return (
    <div className={styles.container}>
      <div className={styles.card}>

        <div className={styles.logoWrapper}>
          <img src={logo} alt="Logo" className={styles.logo} />
        </div>

        <h2 style={{ color: '#f0ecff', fontSize: '18px', textAlign: 'center', margin: 0 }}>
          Confirme seu e-mail
        </h2>

        <p style={{ color: '#9b92b8', fontSize: '13px', textAlign: 'center', lineHeight: '1.5', margin: 0 }}>
          Enviamos um link de confirmação para{' '}
          <strong style={{ color: '#c8a97e' }}>{usuario?.email}</strong>.
          Clique no link para ativar sua conta.
        </p>

        {mensagem && (
          <p style={{
            color: mensagem.includes('Erro') ? '#e74c3c' : '#82c341',
            fontSize: '12px',
            textAlign: 'center',
            margin: 0,
          }}>
            {mensagem}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
          <Button onClick={handleVerificar} isLoading={verificando}>
            Já confirmei
          </Button>

          <button
            type="button"
            onClick={handleReenviar}
            disabled={enviando}
            style={{
              background: 'none',
              border: '1px solid rgba(200, 169, 126, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              color: '#c8a97e',
              fontSize: '14px',
              fontWeight: '600',
              cursor: enviando ? 'not-allowed' : 'pointer',
              opacity: enviando ? 0.5 : 1,
              fontFamily: 'var(--font-family)',
            }}
          >
            {enviando ? 'Reenviando...' : 'Reenviar email'}
          </button>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.footerLink}
            onClick={() => navigate('/login')}
          >
            Voltar para o login
          </button>
        </div>

      </div>
    </div>
  )
}
