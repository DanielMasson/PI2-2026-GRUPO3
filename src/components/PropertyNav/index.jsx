import { useNavigate, useParams, useLocation } from 'react-router-dom'
import styles from './PropertyNav.module.css'

const NAV_ITEMS = [
  { key: 'inicio',     label: 'Início',     icone: '🏠' },
  { key: 'animais',    label: 'Animais',    icone: '🐄' },
  { key: 'reproducao', label: 'Reprodução', icone: '🤰' },
  { key: 'leite',      label: 'Leite',      icone: '🥛' },
  { key: 'corte',      label: 'Corte',      icone: '🥩' },
  { key: 'financeiro', label: 'Finanças',   icone: '💰' },
]

const ROTAS = {
  inicio:     (id) => `/propriedade/${id}`,
  animais:    (id) => `/propriedade/${id}/animais`,
  reproducao: (id) => `/propriedade/${id}/reproducao`,
  leite:      (id) => `/propriedade/${id}/producao-leite`,
  corte:      (id) => `/propriedade/${id}/corte`,
  financeiro: (id) => `/propriedade/${id}/financeiro`,
}

// Padrões de URL → key da aba ativa, usados quando activeTab não é passado.
// Ordem importante: caminhos mais específicos primeiro para evitar match errado.
const PATH_PATTERNS = [
  { key: 'animais',    re: /^\/propriedade\/[^/]+\/animais/ },
  { key: 'animais',    re: /^\/propriedade\/[^/]+\/cadastro-animal/ },
  { key: 'animais',    re: /^\/propriedade\/[^/]+\/animal\// },
  { key: 'reproducao', re: /^\/propriedade\/[^/]+\/reproducao/ },
  { key: 'leite',      re: /^\/propriedade\/[^/]+\/producao-leite/ },
  { key: 'corte',      re: /^\/propriedade\/[^/]+\/corte/ },
  { key: 'financeiro', re: /^\/propriedade\/[^/]+\/financeiro/ },
  { key: 'inicio',     re: /^\/propriedade\/[^/]+\/?$/ },
]

function derivarAbaAtiva(pathname) {
  for (const { key, re } of PATH_PATTERNS) {
    if (re.test(pathname)) return key
  }
  return 'inicio'
}

/**
 * PropertyNav — barra de navegação inferior para páginas de propriedade.
 *
 * Props:
 *   activeTab — (opcional) string: qual aba está ativa.
 *               Se não for passada, deriva automaticamente da URL atual.
 *   onNav     — (opcional) callback chamado após navegar (recebe a key).
 *
 * O componente SEMPRE navega via react-router ao clicar em uma aba, usando o
 * propriedadeId obtido de useParams(). Assim a navegação funciona de qualquer
 * página de propriedade, sem depender de cada página implementar seu handler.
 */
function PropertyNav({ activeTab, onNav }) {
  const navigate = useNavigate()
  const { propriedadeId } = useParams()
  const location = useLocation()

  const abaAtiva = activeTab || derivarAbaAtiva(location.pathname)

  function handleNav(key) {
    if (typeof onNav === 'function') onNav(key)
    if (ROTAS[key] && propriedadeId) {
      navigate(ROTAS[key](propriedadeId))
    }
  }

  return (
    <nav className={styles.bottomNav}>
      {NAV_ITEMS.map(item => (
        <button
          key={item.key}
          type="button"
          className={`${styles.navItem} ${abaAtiva === item.key ? styles.active : ''}`}
          onClick={() => handleNav(item.key)}
        >
          <span className={styles.navIcon}>{item.icone}</span>
          <span className={styles.navLabel}>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

export default PropertyNav
