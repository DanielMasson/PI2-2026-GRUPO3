import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { usePropriedade } from '../../contexts/PropriedadeContext'
import * as usuarioService from '../../services/usuarioService'
import SecaoSync from './SecaoSync'
import styles from './Configuracoes.module.css'

function Configuracoes() {
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()
  const { propriedade: propriedadeAtiva, limparPropriedade } = usePropriedade()
  const [sucesso, setSucesso] = useState('')
  const [membros, setMembros] = useState([])
  const [carregandoMembros, setCarregandoMembros] = useState(true)

  // Estado das configurações
  const [notificacoes, setNotificacoes] = useState(true)

  useEffect(() => {
    async function carregarMembros() {
      if (!propriedadeAtiva?.uuid) return
      setCarregandoMembros(true)
      try {
        const lista = await usuarioService.listarMembros(propriedadeAtiva.uuid)
        setMembros(lista)
      } catch (e) {
        console.error('Erro ao carregar membros:', e)
        setMembros([])
      } finally {
        setCarregandoMembros(false)
      }
    }
    carregarMembros()
  }, [propriedadeAtiva?.uuid])

  const totalMembros = membros.length

  async function handleLogout() {
    await logout()
    limparPropriedade()
    navigate('/login')
  }

  return (
    <div className={styles.container}>
      <header className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>←</button>
        <h1 className={styles.pageTitle}>Configurações</h1>
      </header>

      <div className={styles.inner}>
        {sucesso && <div className={styles.successToast}>{sucesso}</div>}

        {/* CONTA */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Conta</div>
          <div className={styles.sectionCard}>
            <div className={styles.profileHeader}>
              {usuario?.foto_url ? (
                <img className={styles.avatar} src={usuario.foto_url} alt={usuario.nome} />
              ) : (
                <span className={styles.avatarPlaceholder}>👤</span>
              )}
              <div className={styles.profileInfo}>
                <span className={styles.profileName}>{usuario?.nome || 'Usuário'}</span>
                <span className={styles.profileEmail}>{usuario?.email || ''}</span>
              </div>
            </div>

            <div className={styles.item} onClick={() => navigate('/configuracoes')}>
              <span className={styles.itemIcon}>✏️</span>
              <div className={styles.itemContent}>
                <span className={styles.itemLabel}>Editar perfil</span>
                <span className={styles.itemDesc}>Nome, e-mail, foto</span>
              </div>
              <span className={styles.itemArrow}>›</span>
            </div>

            <div className={styles.item}>
              <span className={styles.itemIcon}>🔔</span>
              <div className={styles.itemContent}>
                <span className={styles.itemLabel}>Notificações</span>
                <span className={styles.itemDesc}>Alertas de vacinas, partos, etc.</span>
              </div>
              <label className={styles.toggle} onClick={e => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={notificacoes}
                  onChange={e => setNotificacoes(e.target.checked)}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>

            <div className={styles.item} onClick={() => navigate('/esqueci-senha')}>
              <span className={styles.itemIcon}>🔒</span>
              <div className={styles.itemContent}>
                <span className={styles.itemLabel}>Alterar senha</span>
                <span className={styles.itemDesc}>Redefinir senha de acesso</span>
              </div>
              <span className={styles.itemArrow}>›</span>
            </div>
          </div>
        </div>

        {/* PROPRIEDADE */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Propriedade</div>
          <div className={styles.sectionCard}>
            <div className={styles.item}>
              <span className={styles.itemIcon}>🏡</span>
              <div className={styles.itemContent}>
                <span className={styles.itemLabel}>Dados da propriedade</span>
                <span className={styles.itemDesc}>Nome, localização, tamanho</span>
              </div>
              <span className={styles.itemRight}>
                <span className={styles.itemValue}>{propriedadeAtiva?.nome || '—'}</span>
                <span className={styles.itemArrow}>›</span>
              </span>
            </div>

            <div className={styles.item}>
              <span className={styles.itemIcon}>👥</span>
              <div className={styles.itemContent}>
                <span className={styles.itemLabel}>Gerenciar membros</span>
                <span className={styles.itemDesc}>Convidar ou remover peões</span>
              </div>
              <span className={styles.itemRight}>
                <span className={styles.itemValue}>
                  {carregandoMembros ? '...' : `${totalMembros} membro${totalMembros !== 1 ? 's' : ''}`}
                </span>
                <span className={styles.itemArrow}>›</span>
              </span>
            </div>

            <div className={styles.item}>
              <span className={styles.itemIcon}>🌾</span>
              <div className={styles.itemContent}>
                <span className={styles.itemLabel}>Gerenciar lotes/áreas</span>
                <span className={styles.itemDesc}>Cadastrar áreas da fazenda</span>
              </div>
              <span className={styles.itemRight}>
                <span className={styles.itemValue}>— lotes</span>
                <span className={styles.itemArrow}>›</span>
              </span>
            </div>
          </div>
        </div>

        {/* SINCRONIZAÇÃO — usa o hook useSync para dados reais */}
        <SecaoSync />

        {/* SOBRE */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Sobre</div>
          <div className={styles.sectionCard}>
            <div className={styles.item}>
              <span className={styles.itemIcon}>ℹ️</span>
              <div className={styles.itemContent}>
                <span className={styles.itemLabel}>Versão</span>
              </div>
              <span className={styles.itemValue}>1.0.0</span>
            </div>

            <div className={styles.item}>
              <span className={styles.itemIcon}>📄</span>
              <div className={styles.itemContent}>
                <span className={styles.itemLabel}>Termos de uso</span>
                <span className={styles.itemDesc}>Política de privacidade e termos</span>
              </div>
              <span className={styles.itemArrow}>›</span>
            </div>
          </div>
        </div>

        {/* LOGOUT */}
        <button className={styles.logoutBtn} onClick={handleLogout}>
          🚪 Sair da conta
        </button>
      </div>
    </div>
  )
}

export default Configuracoes
