import { useNavigate } from 'react-router-dom'
import styles from './Dashboard.module.css'

// Propriedades mockadas — substitua por dados reais futuramente
const PROPRIEDADES = [
  {
    id: 'fazenda-norte',
    nome: 'Fazenda Norte',
    localizacao: 'Sorriso, MT',
    totalAnimais: 240,
    lotes: 8,
  },
  {
    id: 'sitio-bela-vista',
    nome: 'Sítio Bela Vista',
    localizacao: 'Rio Verde, GO',
    totalAnimais: 85,
    lotes: 3,
  },
  {
    id: 'estancia-sul',
    nome: 'Estância Sul',
    localizacao: 'Bagé, RS',
    totalAnimais: 412,
    lotes: 14,
  },
  {
    id: 'fazenda-dois-irmaos',
    nome: 'Fazenda Dois Irmãos',
    localizacao: 'Uberaba, MG',
    totalAnimais: 130,
    lotes: 5,
  },
]

function Dashboard() {
  const navigate = useNavigate()

  function handleSelecionarPropriedade(id) {
    navigate(`/propriedade/${id}/cadastro-animal`)
  }

  function handleLogout() {
    navigate('/login')
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.greeting}>
          <span className={styles.greetingLabel}>Painel de controle</span>
          <h1 className={styles.greetingTitle}>Suas Propriedades</h1>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Sair
        </button>
      </header>

      <section className={styles.section}>
        <p className={styles.sectionTitle}>Selecione uma propriedade para acessar</p>

        <div className={styles.grid}>
          {PROPRIEDADES.map((prop) => (
            <div
              key={prop.id}
              className={styles.card}
              onClick={() => handleSelecionarPropriedade(prop.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleSelecionarPropriedade(prop.id)}
            >
              <div className={styles.cardIcon}>🌾</div>

              <div>
                <p className={styles.cardName}>{prop.nome}</p>
                <p className={styles.cardLocation}>{prop.localizacao}</p>
              </div>

              <div className={styles.cardStats}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{prop.totalAnimais}</span>
                  <span className={styles.statLabel}>Animais</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{prop.lotes}</span>
                  <span className={styles.statLabel}>Lotes</span>
                </div>
              </div>

              <div className={styles.cardArrow}>→</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Dashboard
