import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { usePropriedade } from '../../contexts/PropriedadeContext'
import * as propriedadeService from '../../services/propriedadeService'
import styles from './Dashboard.module.css'
import BottomNav from '../../components/BottomNav'

function Dashboard() {
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()
  const { selecionarPropriedade } = usePropriedade()
  const [busca, setBusca] = useState('')
  const [propriedades, setPropriedades] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [novaProp, setNovaProp] = useState({ nome: '', localizacao: '', tamanho_ha: '' })

  // Carregar propriedades do banco
  useEffect(() => {
    if (!usuario) return
    propriedadeService.listarPropriedades(usuario.uuid)
      .then(lista => setPropriedades(lista || []))
      .catch(() => setPropriedades([]))
      .finally(() => setCarregando(false))
  }, [usuario])

  const propriedadesFiltradas = propriedades.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.localizacao.toLowerCase().includes(busca.toLowerCase())
  )

  async function handleAbrirPropriedade(uuid) {
    await selecionarPropriedade(uuid)
    navigate(`/propriedade/${uuid}`)
  }

  async function handleExcluir(e, uuid) {
    e.stopPropagation()
    await propriedadeService.excluirPropriedade(uuid)
    setPropriedades(prev => prev.filter(p => p.uuid !== uuid))
  }

  function handleEditar(e, uuid) {
    e.stopPropagation()
    alert(`Editar propriedade: ${uuid}`)
  }

  async function handleAdicionarPropriedade() {
    if (!novaProp.nome.trim() || !novaProp.localizacao.trim()) return
    const prop = await propriedadeService.criarPropriedade({
      nome: novaProp.nome,
      localizacao: novaProp.localizacao,
      tamanho_ha: novaProp.tamanho_ha ? Number(novaProp.tamanho_ha) : null,
      dono_uuid: usuario.uuid,
    })
    setPropriedades(prev => [...prev, prop])
    setNovaProp({ nome: '', localizacao: '', tamanho_ha: '' })
    setMostrarModal(false)
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className={styles.screen}>
      {/* ─── Topbar ─── */}
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <h1 className={styles.appTitle}>Propriedade Inteligente</h1>
          <p className={styles.appSubtitle}>Gestão Individual de Rebanho</p>
        </div>
        <div className={styles.topbarActions}>
          <button className={styles.iconBtn} onClick={() => navigate('/configuracoes')} aria-label="Configurações">
            ⚙️
          </button>
          <button className={styles.iconBtn} onClick={handleLogout} aria-label="Sair">
            🚪
          </button>
        </div>
      </header>

      {/* ─── Corpo ─── */}
      <main className={styles.body}>
        {/* Search */}
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar propriedade..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        {/* Lista */}
        <div className={styles.list}>
          {carregando && <p className={styles.emptyMsg}>Carregando...</p>}
          {!carregando && propriedadesFiltradas.length === 0 && (
            <p className={styles.emptyMsg}>Nenhuma propriedade encontrada.</p>
          )}

          {propriedadesFiltradas.map(prop => (
            <div
              key={prop.uuid}
              className={styles.card}
              onClick={() => handleAbrirPropriedade(prop.uuid)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && handleAbrirPropriedade(prop.uuid)}
            >
              <div className={styles.cardLeft}>
                <span className={styles.cardIcon}>🏡</span>
                <div className={styles.cardInfo}>
                  <span className={styles.cardName}>{prop.nome}</span>
                  <span className={styles.cardMeta}>{prop.localizacao}</span>
                  <span className={styles.cardTag}>
                    {prop.tamanho_ha ? `${prop.tamanho_ha} ha` : 'Sem área informada'}
                  </span>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button
                  className={`${styles.actionBtn} ${styles.editBtn}`}
                  onClick={e => handleEditar(e, prop.uuid)}
                  aria-label="Editar"
                >
                  ✏️
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  onClick={e => handleExcluir(e, prop.uuid)}
                  aria-label="Excluir"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal adicionar propriedade */}
        {mostrarModal && (
          <div style={{ padding: '1rem', borderTop: '1px solid #333' }}>
            <p className={styles.sectionTitle} style={{ marginBottom: '0.5rem' }}>Nova propriedade</p>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Nome da propriedade"
              value={novaProp.nome}
              onChange={e => setNovaProp(prev => ({ ...prev, nome: e.target.value }))}
              style={{ marginBottom: '0.5rem' }}
            />
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Localização (cidade, UF)"
              value={novaProp.localizacao}
              onChange={e => setNovaProp(prev => ({ ...prev, localizacao: e.target.value }))}
              style={{ marginBottom: '0.5rem' }}
            />
            <input
              className={styles.searchInput}
              type="number"
              placeholder="Tamanho (hectares)"
              value={novaProp.tamanho_ha}
              onChange={e => setNovaProp(prev => ({ ...prev, tamanho_ha: e.target.value }))}
              style={{ marginBottom: '0.5rem' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className={`${styles.actionBtn} ${styles.editBtn}`}
                onClick={handleAdicionarPropriedade}
                style={{ flex: 1, padding: '0.75rem', background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: '8px' }}
              >
                Salvar
              </button>
              <button
                className={styles.actionBtn}
                onClick={() => setMostrarModal(false)}
                style={{ flex: 1, padding: '0.75rem', background: '#444', color: '#fff', border: 'none', borderRadius: '8px' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ─── Bottom Nav ─── */}
      <BottomNav
        activeTab="home"
        onHome={() => {}}
        onAdd={() => setMostrarModal(true)}
        onSettings={() => navigate('/configuracoes')}
      />
    </div>
  )
}

export default Dashboard
