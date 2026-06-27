import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAnimais } from '../../hooks/useAnimais'
import PropertyNav from '../../components/PropertyNav/index.jsx'
import styles from './ProducaoLeite.module.css'

// Produção de leite: tabela producao_leite é pós-MVP
// Por enquanto, usamos animais reais do banco mas registros ficam em state local

function formatarData(data) {
 return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
}

function formatarNumero(n) {
 return Number(n).toLocaleString('pt-BR')
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
   }}
  />
 )
}

// ─── Componente Principal ───────────────────────────────────────────────────
function ProducaoLeite() {
 const navigate = useNavigate()
 const { propriedadeId } = useParams()
 const { animais, carregando } = useAnimais(propriedadeId)
 const [data, setData] = useState(new Date().toISOString().split('T')[0])
 const [registros, setRegistros] = useState({})
 const [sucesso, setSucesso] = useState('')
 const [activeTab, setActiveTab] = useState('leite')

 // Filtrar apenas fêmeas bovinas (vacas em lactação — simplificação MVP)
 const vacasLactantes = animais.filter(a => a.especie === 'bovino' && a.sexo === 'femea')

 function handleChange(vacaId, campo, valor) {
  setRegistros(prev => ({
   ...prev,
   [vacaId]: {
    ...prev[vacaId],
    [campo]: valor,
   },
  }))
  setSucesso('')
 }

 function getProducaoTotal(vacaId) {
  const r = registros[vacaId] || {}
  const manha = parseFloat(r.manha) || 0
  const tarde = parseFloat(r.tarde) || 0
  return manha + tarde
 }

 function handleSalvar() {
  const semOrdenha = vacasLactantes.filter(v => {
   const r = registros[v.uuid] || {}
   return !r.manha && !r.tarde
  })
  if (semOrdenha.length > 0) {
   const nomes = semOrdenha.map(v => v.nome).join(', ')
   alert(`Registre pelo menos uma ordenha para: ${nomes}`)
   return
  }

  // Pós-MVP: salvar no banco (tabela producao_leite)
  setSucesso('Registros salvos com sucesso!')
  setTimeout(() => setSucesso(''), 3000)
 }

 // Estatísticas
 const totalDia = vacasLactantes.reduce((sum, v) => sum + getProducaoTotal(v.uuid), 0)
 const mediaPorVaca = vacasLactantes.length > 0 ? totalDia / vacasLactantes.length : 0
 const alertasCcs = vacasLactantes.filter(v => {
  const r = registros[v.uuid] || {}
  return r.ccs && parseInt(r.ccs) > 200000
 })

 if (carregando) {
  return (
   <div className={styles.container}>
    <header className={styles.topbar}>
     <button className={styles.backBtn} onClick={() => navigate(`/propriedade/${propriedadeId}`)}>←</button>
     <div>
      <h1 className={styles.pageTitle}>Produção de Leite</h1>
     </div>
    </header>
    <div className={styles.inner}>
     <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>Carregando...</p>
    </div>
    <PropertyNavWithRoute activeTab={activeTab} setActiveTab={setActiveTab} navigate={navigate} propriedadeId={propriedadeId} />
   </div>
  )
 }

 if (vacasLactantes.length === 0) {
  return (
   <div className={styles.container}>
    <header className={styles.topbar}>
     <button className={styles.backBtn} onClick={() => navigate(`/propriedade/${propriedadeId}`)}>←</button>
     <div>
      <h1 className={styles.pageTitle}>Produção de Leite</h1>
     </div>
    </header>
    <div className={styles.inner}>
     <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>
      Nenhuma fêmea bovina cadastrada. Cadastre animais para registrar a produção.
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
     <h1 className={styles.pageTitle}>Produção de Leite</h1>
     <p className={styles.pageSubtitle}>{formatarData(data)}</p>
    </div>
   </header>

   <div className={styles.inner}>
    {sucesso && <div className={styles.successToast}>{sucesso}</div>}

    {/* Seletor de data */}
    <div className={styles.dataSelector}>
     <span className={styles.dataLabel}>Data do registro:</span>
     <input
      type="date"
      value={data}
      onChange={e => setData(e.target.value)}
      className={styles.dataInput}
     />
    </div>

    {/* Cards de vacas */}
    <div className={styles.vacasList}>
     {vacasLactantes.map(vaca => {
      const reg = registros[vaca.uuid] || {}
      const total = getProducaoTotal(vaca.uuid)
      const ccsValido = reg.ccs && parseInt(reg.ccs) > 200000
      const temOrdenha = reg.manha || reg.tarde

      return (
       <div key={vaca.uuid} className={`${styles.vacaCard} ${ccsValido ? styles.alertaCcs : ''}`}>
        <div className={styles.vacaHeader}>
         <div className={styles.vacaInfo}>
          <div className={styles.vacaNome}>🐄 {vaca.nome} ({vaca.id_fisico || vaca.id_interno || 's/brinco'})</div>
          <div className={styles.vacaMeta}>{vaca.raca}</div>
         </div>
         <div className={styles.vacaBadges}>
          {temOrdenha && (
           <span className={`${styles.totalBadge} ${ccsValido ? styles.alerta : ''}`}>
            {total.toFixed(1)} L
           </span>
          )}
         </div>
        </div>

        {/* Inputs de ordenha */}
        <div className={styles.ordenhaGrid}>
         <div className={styles.ordenhaField}>
          <label className={styles.ordenhaLabel}>☀️ Manhã (L)</label>
          <input
           type="number"
           step="0.1"
           min="0"
           placeholder="0.0"
           value={reg.manha ?? ''}
           onChange={e => handleChange(vaca.uuid, 'manha', e.target.value)}
           className={styles.ordenhaInput}
          />
         </div>
         <div className={styles.ordenhaField}>
          <label className={styles.ordenhaLabel}>🌙 Tarde (L)</label>
          <input
           type="number"
           step="0.1"
           min="0"
           placeholder="0.0"
           value={reg.tarde ?? ''}
           onChange={e => handleChange(vaca.uuid, 'tarde', e.target.value)}
           className={styles.ordenhaInput}
          />
         </div>
         <div className={styles.ordenhaField}>
          <label className={styles.ordenhaLabel}>Total</label>
          <input
           type="text"
           value={temOrdenha ? `${total.toFixed(1)} L` : '—'}
           readOnly
           className={styles.ordenhaInput}
           style={{ opacity: 0.6, cursor: 'default' }}
          />
         </div>
        </div>

        {/* ccs */}
        <div className={styles.ccsField}>
         <label className={styles.ordenhaLabel}>CCS (Contagem de Células Somáticas)</label>
         <div className={styles.ccsRow}>
          <input
           type="number"
           min="0"
           placeholder="Ex: 150000"
           value={reg.ccs ?? ''}
           onChange={e => handleChange(vaca.uuid, 'ccs', e.target.value)}
           className={`${styles.ccsInput} ${ccsValido ? styles.alerta : ''}`}
          />
          {ccsValido && (
           <span className={styles.ccsAlerta}>⚠️ Possível mastite</span>
          )}
         </div>
        </div>
       </div>
      )
     })}
    </div>

    {/* Resumo do mês */}
    <div className={styles.resumoCard}>
     <div className={styles.resumoTitle}>Resumo do Mês</div>
     <div className={styles.resumoGrid}>
      <div className={styles.resumoItem}>
       <span className={styles.resumoLabel}>Produção hoje</span>
       <span className={styles.resumoValor}>
        {totalDia.toFixed(1)} <span className={styles.resumoUnit}>L</span>
       </span>
      </div>
      <div className={styles.resumoItem}>
       <span className={styles.resumoLabel}>Média por vaca</span>
       <span className={styles.resumoValor}>
        {mediaPorVaca.toFixed(1)} <span className={styles.resumoUnit}>L/dia</span>
       </span>
      </div>
      <div className={styles.resumoItem}>
       <span className={styles.resumoLabel}>Vacas em lactação</span>
       <span className={styles.resumoValor}>
        {vacasLactantes.length}
       </span>
      </div>
      <div className={styles.resumoItem}>
       <span className={styles.resumoLabel}>Alertas CCS</span>
       <span className={styles.resumoValor} style={{ color: alertasCcs.length > 0 ? '#e74c3c' : '#82c341' }}>
        {alertasCcs.length} <span className={styles.resumoUnit}>{alertasCcs.length === 1 ? 'vaca' : 'vacas'}</span>
       </span>
      </div>
     </div>
    </div>

    {/* Botão salvar */}
    <button className={styles.salvarBtn} onClick={handleSalvar}>
     Salvar registros
    </button>
   </div>
   <PropertyNavWithRoute activeTab={activeTab} setActiveTab={setActiveTab} navigate={navigate} propriedadeId={propriedadeId} />
  </div>
 )
}

export default ProducaoLeite
