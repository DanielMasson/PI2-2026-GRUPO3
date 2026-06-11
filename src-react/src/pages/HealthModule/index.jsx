import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styles from './HealthModule.module.css'
import { ANIMAIS_SAUDE, calcularStatusAnimal, getCarenciaAtiva } from '../data/healthData'

const STATUS_CONFIG = {
  urgente: { label: 'Urgente', color: '#e74c3c', bg: 'rgba(231,76,60,0.12)', borderClass: 'statusUrgente' },
  atencao: { label: 'Atenção', color: '#e67e22', bg: 'rgba(230,126,34,0.12)', borderClass: 'statusAtencao' },
  ok:      { label: 'Ok',      color: '#5a9e1a', bg: 'rgba(130,195,65,0.12)', borderClass: 'statusOk' },
}

function HealthModule() {
  const navigate = useNavigate()
  const { propriedadeId } = useParams()
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todos')

  const animaisComStatus = ANIMAIS_SAUDE.map(a => ({
    ...a,
    statusCalc: calcularStatusAnimal(a),
    carenciaAtiva: getCarenciaAtiva(a),
  }))

  const counts = {
    urgente: animaisComStatus.filter(a => a.statusCalc === 'urgente').length,
    atencao: animaisComStatus.filter(a => a.statusCalc === 'atencao').length,
    ok:      animaisComStatus.filter(a => a.statusCalc === 'ok').length,
  }

  const filtrados = animaisComStatus.filter(a => {
    const matchBusca =
      a.nome.toLowerCase().includes(busca.toLowerCase()) ||
      a.brinco.toLowerCase().includes(busca.toLowerCase()) ||
      a.lote.toLowerCase().includes(busca.toLowerCase())
    const matchFiltro = filtro === 'todos' || a.statusCalc === filtro
    return matchBusca && matchFiltro
  })

  const ORDER = { urgente: 0, atencao: 1, ok: 2 }
  const ordenados = [...filtrados].sort((a, b) => ORDER[a.statusCalc] - ORDER[b.statusCalc])

  const FILTROS = [
    { key: 'todos',   label: 'Todos' },
    { key: 'urgente', label: 'Urgente' },
    { key: 'atencao', label: 'Atenção' },
    { key: 'ok',      label: 'Ok' },
  ]

  return (
    <div className={styles.screen}>

      {/* ── Topbar ── */}
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <button
            className={styles.backBtn}
            onClick={() => navigate(`/propriedade/${propriedadeId}`)}
          >
            ←
          </button>
          <div>
            <div className={styles.pageTitle}>Módulo Sanitário</div>
            <div className={styles.pageSub}>{propriedadeId}</div>
          </div>
        </div>
      </header>

      {/* ── Resumo por status ── */}
      <div className={styles.summaryRow}>
        <div className={`${styles.summaryPill} ${styles.pillUrgente}`}>
          <span className={styles.pillCount}>{counts.urgente}</span>
          <span className={styles.pillLabel}>Urgente</span>
        </div>
        <div className={`${styles.summaryPill} ${styles.pillAtencao}`}>
          <span className={styles.pillCount}>{counts.atencao}</span>
          <span className={styles.pillLabel}>Atenção</span>
        </div>
        <div className={`${styles.summaryPill} ${styles.pillOk}`}>
          <span className={styles.pillCount}>{counts.ok}</span>
          <span className={styles.pillLabel}>Ok</span>
        </div>
      </div>

      {/* ── Busca ── */}
      <div className={styles.searchRow}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            placeholder="Buscar por nome, brinco ou lote..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className={styles.filterRow}>
        {FILTROS.map(f => (
          <button
            key={f.key}
            className={`${styles.filterBtn} ${filtro === f.key ? styles.filterActive : ''}`}
            onClick={() => setFiltro(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Lista de animais ── */}
      <div className={styles.list}>
        {ordenados.length === 0 && (
          <p className={styles.empty}>Nenhum animal encontrado.</p>
        )}

        {ordenados.map(animal => {
          const cfg = STATUS_CONFIG[animal.statusCalc]
          return (
            <div
              key={animal.id}
              className={`${styles.animalCard} ${styles[cfg.borderClass]}`}
              onClick={() => navigate(`/propriedade/${propriedadeId}/saude/${animal.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && navigate(`/propriedade/${propriedadeId}/saude/${animal.id}`)}
            >
              {/* Info principal */}
              <div className={styles.animalMain}>
                <div className={styles.animalNameRow}>
                  <span className={styles.animalName}>{animal.nome}</span>
                  <span className={styles.brincoTag}>{animal.brinco}</span>
                </div>

                <div className={styles.animalMeta}>
                  {animal.raca} · {animal.sexo} · Lote {animal.lote}
                </div>

                {/* Carência */}
                {animal.carenciaAtiva ? (
                  <div className={styles.carenciaRow}>
                    <span className={styles.carenciaIcon}>💊</span>
                    <span className={styles.carenciaText}>
                      {animal.carenciaAtiva.produto} —{' '}
                      <strong>{animal.carenciaAtiva.dias}d restantes</strong>
                    </span>
                  </div>
                ) : (
                  <div className={styles.carenciaClear}>✓ Sem carência ativa</div>
                )}
              </div>

              {/* Badge de status + seta */}
              <div className={styles.animalRight}>
                <span
                  className={styles.statusBadge}
                  style={{ backgroundColor: cfg.bg, color: cfg.color }}
                >
                  {cfg.label}
                </span>
                <span className={styles.arrow}>›</span>
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}

export default HealthModule
