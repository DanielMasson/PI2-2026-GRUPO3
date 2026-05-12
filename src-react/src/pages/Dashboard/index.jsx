import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Dashboard.module.css'
import BottomNav from '../../components/BottomNav'

const PROPRIEDADES_INICIAIS = [
  {
    id: 'fazenda-norte',
    brinco: 'Prop 001',
    nome: 'Fazenda Norte',
    localizacao: 'Sorriso, MT',
    totalAnimais: 240,
    lotes: 8,
  },
  {
    id: 'sitio-bela-vista',
    brinco: 'Prop 002',
    nome: 'Sítio Bela Vista',
    localizacao: 'Rio Verde, GO',
    totalAnimais: 85,
    lotes: 3,
  },
  {
    id: 'estancia-sul',
    brinco: 'Prop 003',
    nome: 'Estância Sul',
    localizacao: 'Bagé, RS',
    totalAnimais: 412,
    lotes: 14,
  },
  {
    id: 'fazenda-dois-irmaos',
    brinco: 'Prop 004',
    nome: 'Fazenda Dois Irmãos',
    localizacao: 'Uberaba, MG',
    totalAnimais: 130,
    lotes: 5,
  },
]

function Dashboard() {
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [propriedades, setPropriedades] = useState(PROPRIEDADES_INICIAIS)

  const propriedadesFiltradas = propriedades.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.brinco.toLowerCase().includes(busca.toLowerCase()) ||
    p.localizacao.toLowerCase().includes(busca.toLowerCase())
  )

  function handleAbrirPropriedade(id) {
    navigate(`/propriedade/${id}/cadastro-animal`)
  }

  function handleExcluir(e, id) {
    e.stopPropagation()
    setPropriedades(prev => prev.filter(p => p.id !== id))
  }

  function handleEditar(e, id) {
    e.stopPropagation()
    // Futuramente: abrir modal de edição
    alert(`Editar propriedade: ${id}`)
  }

  function handleAdicionarPropriedade() {
    // Futuramente: abrir modal/tela de criação
    alert('Adicionar nova propriedade')
  }

  function handleLogout() {
    navigate('/login')
  }

  return (
    <div className={styles.screen}>
      {/* ─── Header verde ─── */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.appTitle}>Propriedade Inteligente</h1>
            <p className={styles.appSubtitle}>Gestão Individual de Rebanho</p>
          </div>
          <button className={styles.bellBtn} onClick={handleLogout} aria-label="Sair">
            {/* Bell icon — futuramente: notificações */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ─── Corpo ─── */}
      <main className={styles.body}>
        {/* Search */}
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
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
          {propriedadesFiltradas.length === 0 && (
            <p className={styles.emptyMsg}>Nenhuma propriedade encontrada.</p>
          )}

          {propriedadesFiltradas.map(prop => (
            <div
              key={prop.id}
              className={styles.card}
              onClick={() => handleAbrirPropriedade(prop.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && handleAbrirPropriedade(prop.id)}
            >
              <div className={styles.cardLeft}>
                <span className={styles.brincoTag}>{prop.brinco}</span>
                <div className={styles.cardInfo}>
                  <span className={styles.cardName}>{prop.nome}</span>
                  <span className={styles.cardMeta}>
                    {prop.localizacao} &nbsp;·&nbsp; {prop.totalAnimais} animais
                  </span>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button
                  className={`${styles.actionBtn} ${styles.editBtn}`}
                  onClick={e => handleEditar(e, prop.id)}
                  aria-label="Editar"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  onClick={e => handleExcluir(e, prop.id)}
                  aria-label="Excluir"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ─── Bottom Nav ─── */}
      <BottomNav
        activeTab="home"
        onHome={() => {}}
        onAdd={handleAdicionarPropriedade}
        onSettings={() => alert('Ajustes — em breve')}
      />
    </div>
  )
}

export default Dashboard
