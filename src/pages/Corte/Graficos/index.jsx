import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAnimais } from '../../../hooks/useAnimais'
import { useSeriePesoAnimal, useSeriePesoPropriedade } from '../../../hooks/usePesagemAnalise'
import GraficoLinha from '../../../components/GraficoLinha'
import SubpageLayout from '../_SubpageLayout'
import styles from '../Corte.module.css'

const PERIODOS = [
  { valor: 7, label: '7 dias' },
  { valor: 30, label: '30 dias' },
  { valor: 90, label: '90 dias' },
]

export default function CorteGraficos() {
  const { propriedadeId } = useParams()
  const { animais } = useAnimais(propriedadeId)
  const animaisCorte = animais.filter(a => {
    if (a.deleted || a.sync_status === 'deleted') return false
    if (a.especie === 'bovino' && a.sexo === 'macho') return true
    if (['ovino', 'caprino'].includes(a.especie)) return true
    return false
  })

  const [modo, setModo] = useState('propriedade')
  const [animalUuid, setAnimalUuid] = useState('')
  const [dias, setDias] = useState(30)

  useEffect(() => {
    if (modo === 'animal' && !animalUuid && animaisCorte.length > 0) {
      setAnimalUuid(animaisCorte[0].uuid)
    }
  }, [modo, animalUuid, animaisCorte])

  const serieAnimal = useSeriePesoAnimal(modo === 'animal' ? animalUuid : null, propriedadeId, dias)
  const seriePropriedade = useSeriePesoPropriedade(modo === 'propriedade' ? propriedadeId : null, dias)

  const serie = modo === 'animal' ? serieAnimal : seriePropriedade
  const dadosGrafico = serie.serie.map(p => ({ dia: p.dia, valor: p.peso || p.peso_medio }))
  const maxAnimais = serie.serie.reduce((m, p) => Math.max(m, p.animais_pesados || 0), 0)

  return (
    <SubpageLayout activeTab="graficos">
      <div className={styles.dataSelector}>
        <div className={styles.ordenhaField}>
          <label className={styles.ordenhaLabel}>Modo</label>
          <select className={styles.dataInput} value={modo} onChange={(e) => setModo(e.target.value)}>
            <option value="propriedade">Propriedade</option>
            <option value="animal">Animal</option>
          </select>
        </div>

        {modo === 'animal' && (
          <div className={styles.ordenhaField}>
            <label className={styles.ordenhaLabel}>Animal</label>
            <select className={styles.dataInput} value={animalUuid} onChange={(e) => setAnimalUuid(e.target.value)}>
              <option value="">Selecione...</option>
              {animaisCorte.map(a => (
                <option key={a.uuid} value={a.uuid}>{a.nome} {a.id_fisico ? `· ${a.id_fisico}` : ''}</option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.ordenhaField}>
          <label className={styles.ordenhaLabel}>Período</label>
          <select className={styles.dataInput} value={dias} onChange={(e) => setDias(Number(e.target.value))}>
            {PERIODOS.map(p => (
              <option key={p.valor} value={p.valor}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {serie.erro && <div className={styles.errorToast}>{serie.erro}</div>}
      {serie.carregando && <p className={styles.emptyState}>Carregando...</p>}

      {!serie.carregando && (
        <>
          <GraficoLinha data={dadosGrafico} unidade="kg" />
          {modo === 'propriedade' && dadosGrafico.length > 0 && (
            <p className={styles.resumoSub} style={{ marginTop: 'var(--space-md)' }}>
              Pico de animais pesados no período: {maxAnimais}
            </p>
          )}
          {dadosGrafico.length === 0 && (
            <div className={styles.emptyState}>
              Sem registros de pesagem no período selecionado.
            </div>
          )}
        </>
      )}
    </SubpageLayout>
  )
}
