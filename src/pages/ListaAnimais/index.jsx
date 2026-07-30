import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styles from './ListaAnimais.module.css'
import PropertyNav from '../../components/PropertyNav/index.jsx'
import { useAnimais } from '../../hooks/useAnimais'
import { getIdade } from '../../hooks/useAnimal'
import { useDebounce } from '../../hooks/useDebounce'
import { ESPECIES } from '../../constants/sync'

const ESPECIE_OPTIONS = [
  { key: 'todos', label: 'Todos' },
  ...ESPECIES.map(e => ({ key: e, label: e.charAt(0).toUpperCase() + e.slice(1) })),
]

const ESPECIE_LABELS = {
  bovino: 'Bovino',
  ovino: 'Ovino',
  suino: 'Suíno',
}

function ListaAnimais() {
  const navigate = useNavigate()
  const { propriedadeId } = useParams()

  const { animais, carregando, erro, buscar, filtros, setFiltros, recarregar } = useAnimais(propriedadeId)

  const [busca, setBusca] = useState('')
  const [activeTab, setActiveTab] = useState('animais')

  const buscaDebounced = useDebounce(busca, 300)

  useEffect(() => {
    buscar(buscaDebounced)
  }, [buscaDebounced])

  const filtroEspecie = filtros.especie || 'todos'

  function handleBusca(e) {
    setBusca(e.target.value)
  }

  function handleFiltroEspecie(key) {
    if (key === 'todos') {
      setFiltros(f => ({ ...f, especie: null }))
    } else {
      setFiltros(f => ({ ...f, especie: key }))
    }
  }

  function handleNav(key) {
    if (key === 'inicio') {
      navigate(`/propriedade/${propriedadeId}`)
    } else if (key === 'reproducao') {
      navigate(`/propriedade/${propriedadeId}/reproducao`)
    } else if (key === 'leite') {
      navigate(`/propriedade/${propriedadeId}/producao-leite`)
    } else {
      setActiveTab(key)
    }
  }

  return (
    <div className={styles.screen}>

      {/* ── Topbar ── */}
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <button className={styles.backBtn} onClick={() => navigate(`/propriedade/${propriedadeId}`)}>
            ←
          </button>
          <div>
            <div className={styles.topbarTitle}>Animais</div>
            <div className={styles.topbarSub}>Propriedade: {propriedadeId}</div>
          </div>
        </div>
        <div className={styles.topbarActions}>
          <button
            className={styles.iconBtn}
            onClick={() => navigate(`/propriedade/${propriedadeId}/cadastro-animal`)}
            title="Cadastrar novo animal"
          >
            +
          </button>
        </div>
      </header>

      {/* ── Conteúdo ── */}
      <main className={styles.scrollArea}>
        <div className={styles.inner}>

          {/* Busca */}
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Buscar por nome, brinco..."
              value={busca}
              onChange={handleBusca}
            />
          </div>

          {/* Filtro por espécie */}
          <div className={styles.filtroTabs}>
            {ESPECIE_OPTIONS.map(e => (
              <button
                key={e.key}
                className={`${styles.filtroTab} ${filtroEspecie === e.key ? styles.filtroAtivo : ''}`}
                onClick={() => handleFiltroEspecie(e.key)}
              >
                {e.label}
              </button>
            ))}
          </div>

          {/* Erro */}
          {erro && (
            <div className={styles.emptyState}>
              Erro ao carregar animais: {erro}
              <br />
              <button onClick={recarregar} style={{ marginTop: 8, textDecoration: 'underline', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                Tentar novamente
              </button>
            </div>
          )}

          {/* Carregando */}
          {carregando && !erro && (
            <div className={styles.emptyState}>Carregando animais...</div>
          )}

          {/* Conteúdo carregado */}
          {!carregando && !erro && (
            <>
              {/* Contagem */}
              <p className={styles.contagem}>
                {animais.length} {animais.length === 1 ? 'animal' : 'animais'}
              </p>

              {/* Lista */}
              {animais.length === 0 ? (
                <div className={styles.emptyState}>
                  {busca || filtroEspecie !== 'todos'
                    ? 'Nenhum animal encontrado com esses filtros.'
                    : 'Nenhum animal cadastrado ainda.'}
                </div>
              ) : (
                <div className={styles.animalList}>
                  {animais.map(a => (
                    <div
                      key={a.uuid}
                      className={styles.animalCard}
                      onClick={() => navigate(`/propriedade/${propriedadeId}/animal/${a.uuid}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && navigate(`/propriedade/${propriedadeId}/animal/${a.uuid}`)}
                    >
                      <div className={styles.animalCardLeft}>
                        <span className={styles.animalIcon}>
                          {a.especie === 'ovino' ? '🐑' : a.especie === 'suino' ? '🐷' : '🐄'}
                        </span>
                        <div className={styles.animalInfo}>
                          <span className={styles.animalNome}>{a.nome}</span>
                          <span className={styles.animalMeta}>
                            {ESPECIE_LABELS[a.especie] || a.especie} · {a.raca} · {a.sexo === 'macho' ? '♂ Macho' : '♀ Fêmea'}
                          </span>
                          <span className={styles.animalMeta}>
                            {a.data_nascimento ? `${getIdade(a.data_nascimento)} · ` : ''}{a.peso_inicial ?? '—'} kg
                          </span>
                        </div>
                      </div>
                      <span className={styles.animalTag}>{a.id_fisico || a.id_interno}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </main>

      {/* ── Bottom Nav ── */}
      <PropertyNav activeTab={activeTab} onNav={handleNav} />

    </div>
  )
}

export default ListaAnimais
