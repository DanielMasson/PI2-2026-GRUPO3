import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAnimais } from '../../hooks/useAnimais'
import { useGestantes } from '../../hooks/useGestantes'
import { TIPOS_COBERTURA } from '../../constants/sync'
import { calcularStatusGestacao, STATUS_LABELS, STATUS_CORES, diasAteParto } from '../../utils/reproducao'
import styles from './Reproducao.module.css'
import PropertyNav from '../../components/PropertyNav/index.jsx'

function formatarData(dataStr) {
  return new Date(dataStr + 'T00:00:00').toLocaleDateString('pt-BR')
}

function Reproducao() {
  const navigate = useNavigate()
  const { propriedadeId } = useParams()
  const { animais } = useAnimais(propriedadeId)
  const { gestantes, coberturas, falhas, paridas, carregando: carregandoGestantes } = useGestantes(propriedadeId)
  const [activeTab, setActiveTab] = useState('reproducao')

  const femeas = animais.filter(a => a.sexo === 'femea')
  const animalPorUuid = new Map(animais.map(a => [a.uuid, a]))

  const gestacoesAtivas = gestantes.filter(g => !g.data_parto && g.prenhez_confirmada)
  const paridasLista = paridas.length > 0 ? paridas : gestantes.filter(g => g.data_parto)
  const falhasLista = falhas.filter(f => f.resultado === 'negativa')

  return (
    <div className={styles.container}>
      <header className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => navigate(`/propriedade/${propriedadeId}`)}>←</button>
        <div>
          <h1 className={styles.pageTitle}>Controle Reprodutivo</h1>
          <p className={styles.pageSubtitle}>Propriedade: <strong>{propriedadeId}</strong></p>
        </div>
      </header>

      <div className={styles.inner}>
        <div className={styles.dashboardCards}>
          <button
            className={styles.dashboardCard}
            onClick={() => navigate(`/propriedade/${propriedadeId}/reproducao/cio`)}
          >
            <span className={styles.dashboardIcon}>🌸</span>
            <h3 className={styles.dashboardTitle}>Cio</h3>
            <p className={styles.dashboardDesc}>Registrar observação de cio</p>
            <span className={styles.dashboardCount}>{coberturas?.length || 0} <small>em observação</small></span>
          </button>

          <button
            className={styles.dashboardCard}
            onClick={() => navigate(`/propriedade/${propriedadeId}/reproducao/cobertura`)}
          >
            <span className={styles.dashboardIcon}>🐂</span>
            <h3 className={styles.dashboardTitle}>Cobertura</h3>
            <p className={styles.dashboardDesc}>Registrar monta / IA</p>
            <span className={styles.dashboardCount}>{gestacoesAtivas.length} <small>ativas</small></span>
          </button>

          <button
            className={styles.dashboardCard}
            onClick={() => navigate(`/propriedade/${propriedadeId}/reproducao/prenhez`)}
          >
            <span className={styles.dashboardIcon}>✓</span>
            <h3 className={styles.dashboardTitle}>Prenhez</h3>
            <p className={styles.dashboardDesc}>Confirmar diagnóstico</p>
            <span className={styles.dashboardCount}>{coberturas?.length || 0} <small>aguardando</small></span>
          </button>

          <button
            className={styles.dashboardCard}
            onClick={() => navigate(`/propriedade/${propriedadeId}/reproducao/parto`)}
          >
            <span className={styles.dashboardIcon}>🐄</span>
            <h3 className={styles.dashboardTitle}>Parto</h3>
            <p className={styles.dashboardDesc}>Registrar nascimento</p>
            <span className={styles.dashboardCount}>{paridasLista.length} <small>histórico</small></span>
          </button>
        </div>

        <div className={styles.resumoSection}>
          <div className={styles.resumoItem}>
            <span className={styles.resumoValor}>{femeas.length}</span>
            <span className={styles.resumoLabel}>Fêmeas</span>
          </div>
          <div className={styles.resumoItem}>
            <span className={styles.resumoValor}>{gestacoesAtivas.length}</span>
            <span className={styles.resumoLabel}>Gestantes</span>
          </div>
          <div className={styles.resumoItem}>
            <span className={styles.resumoValor}>{paridasLista.length}</span>
            <span className={styles.resumoLabel}>Paridas</span>
          </div>
          <div className={styles.resumoItem}>
            <span className={styles.resumoValor}>{falhasLista.length}</span>
            <span className={styles.resumoLabel}>Falhas</span>
          </div>
        </div>

        {carregandoGestantes ? (
          <div className={styles.emptyState}>Carregando gestações...</div>
        ) : gestacoesAtivas.length === 0 ? (
          <div className={styles.emptyState}>
            Nenhuma gestação ativa. Use os cards acima para começar o controle reprodutivo.
          </div>
        ) : (
          <div className={styles.gestacoesList}>
            {gestacoesAtivas.map(g => (
              <GestacaoResumo
                key={g.uuid}
                gestacao={g}
                animalPorUuid={animalPorUuid}
                onVerDetalhes={() => navigate(`/propriedade/${propriedadeId}/reproducao/cobertura`)}
              />
            ))}
          </div>
        )}
      </div>

      <PropertyNav
        activeTab={activeTab}
        onNav={(tab) => {
          setActiveTab(tab)
          if (tab === 'home') navigate(`/propriedade/${propriedadeId}`)
          else if (tab === 'animais') navigate(`/propriedade/${propriedadeId}/animais`)
          else if (tab === 'saude') navigate(`/propriedade/${propriedadeId}/saude`)
          else if (tab === 'reproducao') navigate(`/propriedade/${propriedadeId}/reproducao`)
          else if (tab === 'leite') navigate(`/propriedade/${propriedadeId}/producao-leite`)
        }}
      />
    </div>
  )
}

function GestacaoResumo({ gestacao: g, animalPorUuid, onVerDetalhes }) {
  const status = calcularStatusGestacao(g)
  const dias = diasAteParto(g.data_previa_parto)
  const nomeAnimal = g.nome_animal || animalPorUuid.get(g.animal_uuid)?.nome || 'Animal'
  const brincoAnimal = g.id_fisico || animalPorUuid.get(g.animal_uuid)?.id_fisico || animalPorUuid.get(g.animal_uuid)?.id_interno || ''

  return (
    <div
      className={styles.gestacaoCard}
      style={{ borderLeft: `4px solid ${STATUS_CORES[status]}` }}
      onClick={onVerDetalhes}
    >
      <div className={styles.gestacaoInfo}>
        <div className={styles.gestacaoAnimal}>{nomeAnimal} ({brincoAnimal || 's/brinco'})</div>
        <div className={styles.gestacaoMeta}>
          <span>{STATUS_LABELS[status]}</span>
          {g.data_previa_parto && (
            <>
              <span className={styles.metaSep}>·</span>
              <span>Parto: {formatarData(g.data_previa_parto)}</span>
            </>
          )}
          {dias !== null && (
            <>
              <span className={styles.metaSep}>·</span>
              <span style={{ color: dias < 0 ? '#ef4444' : dias <= 7 ? '#f59e0b' : '#22c55e' }}>
                {dias < 0 ? `${Math.abs(dias)}d atrasado` : `${dias}d restantes`}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Reproducao
