import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAnimais } from '../../../hooks/useAnimais'
import { useSerieAnimal, useSeriePropriedade } from '../../../hooks/useProducaoLeiteAnalise'
import GraficoLinha from '../../../components/GraficoLinha'
import SubpageLayout from '../_SubpageLayout'
import styles from '../ProducaoLeite.module.css'

const PERIODOS = [
  { valor: 7, label: '7 dias' },
  { valor: 30, label: '30 dias' },
  { valor: 90, label: '90 dias' },
]

export default function ProducaoLeiteGraficos() {
  const { propriedadeId } = useParams()
  const { animais } = useAnimais(propriedadeId)
  const vacas = animais.filter(a => a.especie === 'bovino' && a.sexo === 'femea' && a.status === 'ativo' && !a.deleted)

  const [modo, setModo] = useState('propriedade') // 'propriedade' | 'animal'
  const [animalUuid, setAnimalUuid] = useState('')
  const [dias, setDias] = useState(30)

  // Seleciona primeira vaca automaticamente
  useEffect(() => {
    if (modo === 'animal' && !animalUuid && vacas.length > 0) {
      setAnimalUuid(vacas[0].uuid)
    }
  }, [modo, animalUuid, vacas])

  const serieAnimal = useSerieAnimal(modo === 'animal' ? animalUuid : null, propriedadeId, dias)
  const seriePropriedade = useSeriePropriedade(modo === 'propriedade' ? propriedadeId : null, dias)

  const serie = modo === 'animal' ? serieAnimal : seriePropriedade
  const dadosGrafico = serie.serie.map(p => ({ dia: p.dia, valor: p.total_litros }))
  const maxVacas = serie.serie.reduce((m, p) => Math.max(m, p.vacas_ordenhadas || 0), 0)

  return (
    <SubpageLayout activeTab="graficos">
      <div className={styles.dataSelector}>
        <div className={styles.ordenhaField}>
          <label className={styles.ordenhaLabel}>Modo</label>
          <select
            className={styles.dataInput}
            value={modo}
            onChange={(e) => setModo(e.target.value)}
          >
            <option value="propriedade">Propriedade</option>
            <option value="animal">Animal</option>
          </select>
        </div>

        {modo === 'animal' && (
          <div className={styles.ordenhaField}>
            <label className={styles.ordenhaLabel}>Vaca</label>
            <select
              className={styles.dataInput}
              value={animalUuid}
              onChange={(e) => setAnimalUuid(e.target.value)}
            >
              <option value="">Selecione...</option>
              {vacas.map(v => (
                <option key={v.uuid} value={v.uuid}>{v.nome} {v.id_fisico ? `· ${v.id_fisico}` : ''}</option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.ordenhaField}>
          <label className={styles.ordenhaLabel}>Período</label>
          <select
            className={styles.dataInput}
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
          >
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
          <GraficoLinha data={dadosGrafico} unidade="L" />
          {modo === 'propriedade' && dadosGrafico.length > 0 && (
            <p className={styles.resumoSub} style={{ marginTop: 'var(--space-md)' }}>
              Pico de vacas ordenhadas no período: {maxVacas}
            </p>
          )}
          {dadosGrafico.length === 0 && (
            <div className={styles.emptyState}>
              Sem registros de produção no período selecionado.
            </div>
          )}
        </>
      )}
    </SubpageLayout>
  )
}
