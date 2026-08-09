import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAnimais } from '../../hooks/useAnimais'
import * as pesagemService from '../../services/pesagemService'
import PropertyNav from '../../components/PropertyNav/index.jsx'
import styles from './Corte.module.css'

function formatarData(data) {
  return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
}

function PropertyNavWithRoute({ activeTab, setActiveTab, navigate, propriedadeId }) {
  return (
    <PropertyNav
      activeTab={activeTab}
      onNav={(tab) => {
        setActiveTab(tab)
        if (tab === 'home') navigate(`/propriedade/${propriedadeId}`)
        else if (tab === 'animais') navigate(`/propriedade/${propriedadeId}/animais`)
        else if (tab === 'saude') navigate(`/propriedade/${propriedadeId}/saude`)
        else if (tab === 'reproducao') navigate(`/propriedade/${propriedadeId}/reproducao`)
        else if (tab === 'leite') navigate(`/propriedade/${propriedadeId}/producao-leite`)
        else if (tab === 'corte') navigate(`/propriedade/${propriedadeId}/corte`)
      }}
    />
  )
}

// GMD em kg/dia a partir de pesagens ordenadas por data asc.
function calcularGmdLocal(pesagens) {
  if (!pesagens || pesagens.length < 2) return null
  const ordenadas = [...pesagens].sort((a, b) => new Date(a.data) - new Date(b.data))
  const primeira = ordenadas[0]
  const ultima = ordenadas[ordenadas.length - 1]
  const dias = (new Date(ultima.data) - new Date(primeira.data)) / (1000 * 60 * 60 * 24)
  if (dias <= 0) return null
  return (ultima.peso - primeira.peso) / dias
}

function gmdStatus(gmd) {
  if (gmd === null) return { label: 'Sem dados', classe: styles.gmdSemDados }
  if (gmd >= 1.0) return { label: 'Ótimo', classe: styles.gmdOtimo }
  if (gmd >= 0.5) return { label: 'Bom', classe: styles.gmdBom }
  if (gmd >= 0.1) return { label: 'Regular', classe: styles.gmdRegular }
  if (gmd >= 0) return { label: 'Estável', classe: styles.gmdEstavel }
  return { label: 'Perda', classe: styles.gmdPerda }
}

// ─── Componente Principal ───────────────────────────────────────────────────
function Corte() {
  const navigate = useNavigate()
  const { propriedadeId } = useParams()
  const { animais, carregando } = useAnimais(propriedadeId)
  const [pesagensPorAnimal, setPesagensPorAnimal] = useState({})
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [registros, setRegistros] = useState({})
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [activeTab, setActiveTab] = useState('corte')

  // Filtrar animais aptos para corte: machos bovinos + ovinos/caprinos (qualquer sexo)
  const animaisCorte = animais.filter(a => {
    if (a.deleted || a.sync_status === 'deleted') return false
    if (a.especie === 'bovino' && a.sexo === 'macho') return true
    if (['ovino', 'caprino'].includes(a.especie)) return true
    return false
  })

  // Carregar pesagens de cada animal apto uma única vez e agrupar.
  const carregarPesagens = useCallback(async () => {
    if (!animaisCorte.length) return
    const map = {}
    await Promise.all(animaisCorte.map(async (a) => {
      try {
        const pesagens = await pesagemService.listarPesagens(a.uuid)
        map[a.uuid] = pesagens || []
      } catch {
        map[a.uuid] = []
      }
    }))
    setPesagensPorAnimal(map)
  }, [animaisCorte.map(a => a.uuid).join(',')])

  useEffect(() => { carregarPesagens() }, [carregarPesagens])

  // Reage a syncs (повтор padrão de useAnimais)
  useEffect(() => {
    function onSync() { carregarPesagens() }
    window.addEventListener('sync:atualizado', onSync)
    return () => window.removeEventListener('sync:atualizado', onSync)
  }, [carregarPesagens])

  function handleChange(animalUuid, campo, valor) {
    setRegistros(prev => ({
      ...prev,
      [animalUuid]: { ...prev[animalUuid], [campo]: valor },
    }))
    setSucesso('')
  }

  async function handleSalvar() {
    const pendentes = animaisCorte.map(a => {
      const r = registros[a.uuid] || {}
      const peso = parseFloat(r.peso)
      if (!peso || peso <= 0) return null
      const ecc = r.ecc ? parseInt(r.ecc) : null
      return {
        animal_uuid: a.uuid,
        propriedade_uuid: propriedadeId,
        data,
        peso,
        ecc: (ecc && ecc >= 1 && ecc <= 9) ? ecc : null,
        observacao: r.observacao || null,
      }
    }).filter(Boolean)

    if (pendentes.length === 0) {
      setErro('Informe o peso de pelo menos um animal.')
      setTimeout(() => setErro(''), 4000)
      return
    }

    setSalvando(true)
    setErro('')
    try {
      for (const p of pendentes) {
        await pesagemService.registrarPesagem(p)
      }
      setRegistros({})
      await carregarPesagens()
      setSucesso(`${pendentes.length} pesagem(ns) salva(s)!`)
      setTimeout(() => setSucesso(''), 3000)
    } catch (e) {
      setErro(e.message || String(e))
    } finally {
      setSalvando(false)
    }
  }

  // Estatísticas para rodapé
  let animaisPesados = 0
  let ganhoTotal = 0
  let animaisComGmd = 0
  let eccs = []
  let alertasCount = 0
  for (const a of animaisCorte) {
    const pesagens = pesagensPorAnimal[a.uuid] || []
    const gmd = calcularGmdLocal(pesagens)
    const ultima = pesagens.length > 0
      ? [...pesagens].sort((x, y) => new Date(y.data) - new Date(x.data))[0]
      : null
    if (ultima?.ecc) eccs.push(ultima.ecc)
    if (gmd !== null) {
      animaisComGmd++
      ganhoTotal += gmd
      if (gmd < 0) alertasCount++
    }
    if (ultima?.peso_abate_estimado && ultima?.peso && ultima.peso >= 0.95 * ultima.peso_abate_estimado) {
      alertasCount++
    }
  }
  const ganhoMedio = animaisComGmd > 0 ? ganhoTotal / animaisComGmd : 0
  const eccMedio = eccs.length > 0 ? eccs.reduce((s, v) => s + v, 0) / eccs.length : 0

  if (carregando) {
    return (
      <div className={styles.container}>
        <header className={styles.topbar}>
          <button className={styles.backBtn} onClick={() => navigate(`/propriedade/${propriedadeId}`)}>←</button>
          <div>
            <div className={styles.pageTitle}>Desempenho de Corte</div>
          </div>
        </header>
        <div className={styles.inner}>
          <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>Carregando...</p>
        </div>
        <PropertyNavWithRoute activeTab={activeTab} setActiveTab={setActiveTab} navigate={navigate} propriedadeId={propriedadeId} />
      </div>
    )
  }

  if (animaisCorte.length === 0) {
    return (
      <div className={styles.container}>
        <header className={styles.topbar}>
          <button className={styles.backBtn} onClick={() => navigate(`/propriedade/${propriedadeId}`)}>←</button>
          <div>
            <div className={styles.pageTitle}>Desempenho de Corte</div>
          </div>
        </header>
        <div className={styles.inner}>
          <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>
            Nenhum animal de corte cadastrado. Cadastre machos bovinos, ovinos ou caprinos para acompanhar o desempenho.
          </p>
        </div>
        <PropertyNavWithRoute activeTab={activeTab} setActiveTab={setActiveTab} navigate={navigate} propriedadeId={propriedadeId} />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => navigate(`/propriedade/${propriedadeId}`)}>←</button>
        <div>
          <div className={styles.pageTitle}>Desempenho de Corte</div>
          <div className={styles.pageSubtitle}>{formatarData(data)}</div>
        </div>
      </header>

      <nav className={styles.corteTabs} aria-label="Seções de Desempenho de Corte">
        <button
          className={`${styles.corteTab} ${styles.corteTabActive}`}
          onClick={() => navigate(`/propriedade/${propriedadeId}/corte`)}
          type="button"
        >Registro</button>
        <button
          className={styles.corteTab}
          onClick={() => navigate(`/propriedade/${propriedadeId}/corte/graficos`)}
          type="button"
        >Gráficos</button>
        <button
          className={styles.corteTab}
          onClick={() => navigate(`/propriedade/${propriedadeId}/corte/ranking`)}
          type="button"
        >Ranking</button>
        <button
          className={styles.corteTab}
          onClick={() => navigate(`/propriedade/${propriedadeId}/corte/historico`)}
          type="button"
        >Histórico</button>
        <button
          className={styles.corteTab}
          onClick={() => navigate(`/propriedade/${propriedadeId}/corte/alertas`)}
          type="button"
        >Alertas</button>
      </nav>

      <div className={styles.inner}>
        {sucesso && <div className={styles.successToast}>{sucesso}</div>}
        {erro && <div className={styles.errorToast}>{erro}</div>}

        <div className={styles.dataSelector}>
          <span className={styles.dataLabel}>Data do registro:</span>
          <input
            type="date"
            value={data}
            onChange={e => setData(e.target.value)}
            className={styles.dataInput}
          />
        </div>

        <div className={styles.animaisList}>
          {animaisCorte.map(animal => {
            const reg = registros[animal.uuid] || {}
            const pesagens = pesagensPorAnimal[animal.uuid] || []
            const gmd = calcularGmdLocal(pesagens)
            const status = gmdStatus(gmd)
            const ultima = pesagens.length > 0
              ? [...pesagens].sort((a, b) => new Date(b.data) - new Date(a.data))[0]
              : null
            const pesoAtual = ultima?.peso ?? null
            const pesoAbate = animal.peso_abate_estimado || null
            const prontoAbate = pesoAtual && pesoAbate && pesoAtual >= 0.95 * pesoAbate
            const especieIcon = animal.especie === 'bovino' ? '🐂' : animal.especie === 'ovino' ? '🐑' : '🐐'

            return (
              <div key={animal.uuid} className={styles.animalCard}>
                <div className={styles.animalHeader}>
                  <div className={styles.animalInfo}>
                    <div className={styles.animalNome}>
                      {especieIcon} {animal.nome} ({animal.id_fisico || animal.id_interno || 's/brinco'})
                    </div>
                    <div className={styles.animalMeta}>
                      {animal.raca} · {animal.especie}·{animal.sexo}
                      {pesoAtual !== null && <> · Atual: {pesoAtual.toFixed(1)} kg</>}
                    </div>
                  </div>
                  <div className={styles.animalBadges}>
                    <span className={`${styles.gmdBadge} ${status.classe}`}>
                      GMD: {gmd !== null ? `${gmd.toFixed(2)} kg/dia · ${status.label}` : status.label}
                    </span>
                    {prontoAbate && (
                      <span className={styles.abateBadge}>Pronto p/ abate</span>
                    )}
                  </div>
                </div>

                <div className={styles.pesoGrid}>
                  <div className={styles.pesoField}>
                    <label className={styles.pesoLabel}>Peso (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0.0"
                      value={reg.peso ?? ''}
                      onChange={e => handleChange(animal.uuid, 'peso', e.target.value)}
                      className={styles.pesoInput}
                    />
                  </div>
                  <div className={styles.pesoField}>
                    <label className={styles.pesoLabel}>ECC (1-9)</label>
                    <input
                      type="number"
                      min="1"
                      max="9"
                      step="1"
                      placeholder="—"
                      value={reg.ecc ?? ''}
                      onChange={e => handleChange(animal.uuid, 'ecc', e.target.value)}
                      className={styles.pesoInput}
                    />
                  </div>
                  <div className={styles.pesoField}>
                    <label className={styles.pesoLabel}>Observação</label>
                    <input
                      type="text"
                      placeholder="Opcional"
                      value={reg.observacao ?? ''}
                      onChange={e => handleChange(animal.uuid, 'observacao', e.target.value)}
                      className={styles.pesoInput}
                    />
                  </div>
                </div>

                {pesoAbate && (
                  <div className={styles.abateInfo}>
                    Abate estimado: {pesoAbate.toFixed(0)} kg
                    {pesoAtual && (
                      <> · {((pesoAtual / pesoAbate) * 100).toFixed(0)}% atingido</>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className={styles.resumoCard}>
          <div className={styles.resumoTitle}>Resumo do Rebanho</div>
          <div className={styles.resumoGrid}>
            <div className={styles.resumoItem}>
              <span className={styles.resumoLabel}>Animais de corte</span>
              <span className={styles.resumoValor}>{animaisCorte.length}</span>
            </div>
            <div className={styles.resumoItem}>
              <span className={styles.resumoLabel}>GMD médio</span>
              <span className={styles.resumoValor}>
                {ganhoMedio.toFixed(2)} <span className={styles.resumoUnit}>kg/dia</span>
              </span>
            </div>
            <div className={styles.resumoItem}>
              <span className={styles.resumoLabel}>ECC médio</span>
              <span className={styles.resumoValor}>
                {eccMedio.toFixed(1)} <span className={styles.resumoUnit}>({eccs.length} pesagens)</span>
              </span>
            </div>
            <div className={styles.resumoItem}>
              <span className={styles.resumoLabel}>Alertas</span>
              <span className={styles.resumoValor} style={{ color: alertasCount > 0 ? '#e74c3c' : '#82c341' }}>
                {alertasCount}
              </span>
            </div>
          </div>
        </div>

        <button className={styles.salvarBtn} onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar pesagens'}
        </button>
      </div>
      <PropertyNavWithRoute activeTab={activeTab} setActiveTab={setActiveTab} navigate={navigate} propriedadeId={propriedadeId} />
    </div>
  )
}

export default Corte
