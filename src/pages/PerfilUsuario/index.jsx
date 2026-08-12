import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import styles from '../Configuracoes/Configuracoes.module.css'
import Button from '../../components/Button/index.jsx'
import Input from '../../components/Input/index.jsx'

export default function PerfilUsuario() {
  const navigate = useNavigate()
  const { usuario, atualizarPerfil } = useAuth()

  const [nome, setNome] = useState(usuario?.nome || '')
  const [telefone, setTelefone] = useState(usuario?.telefone || '')
  const [fotoUrl, setFotoUrl] = useState(usuario?.foto_url || '')
  const [erros, setErros] = useState({})
  const [sucesso, setSucesso] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErros({})
    setSucesso('')

    const errs = {}
    if (!nome.trim()) errs.nome = 'Nome é obrigatório'
    if (Object.keys(errs).length) { setErros(errs); return }

    setSalvando(true)
    try {
      await atualizarPerfil({
        nome: nome.trim(),
        telefone: telefone.trim() || null,
        foto_url: fotoUrl.trim() || null,
      })
      setSucesso('Perfil atualizado com sucesso!')
    } catch {
      setErros({ geral: 'Erro ao salvar. Tente novamente.' })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>←</button>
        <h1 className={styles.pageTitle}>Meu Perfil</h1>
      </header>

      <div className={styles.inner}>
        {sucesso && <div className={styles.successToast}>{sucesso}</div>}
        {erros.geral && (
          <p style={{ color: '#e74c3c', fontSize: '12px', textAlign: 'center', marginBottom: '12px' }}>
            {erros.geral}
          </p>
        )}

        {/* Avatar */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          {fotoUrl ? (
            <img
              src={fotoUrl}
              alt={nome}
              style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, margin: '0 auto',
            }}>
              👤
            </div>
          )}
          <p style={{ color: '#9b92b8', fontSize: '12px', marginTop: '8px' }}>
            {usuario?.email}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Dados pessoais</div>
            <div className={styles.sectionCard}>
              <div style={{ padding: '16px' }}>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  error={erros.nome}
                  autoComplete="name"
                />
                <div style={{ height: '12px' }} />
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="Telefone (opcional)"
                  value={telefone}
                  onChange={e => setTelefone(e.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                />
                <div style={{ height: '12px' }} />
                <Input
                  id="fotoUrl"
                  type="url"
                  placeholder="URL da foto (opcional)"
                  value={fotoUrl}
                  onChange={e => setFotoUrl(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Button type="submit" isLoading={salvando}>
            Salvar alterações
          </Button>
        </form>
      </div>
    </div>
  )
}
