import { useParams } from 'react-router-dom'
import {
  useMediaHistoricaGmdPropriedade,
  useSeriePesoPropriedade,
} from '../../../hooks/usePesagemAnalise'
import GraficoLinha from '../../../components/GraficoLinha'
import SubpageLayout from '../_SubpageLayout'
import styles from '../Corte.module.css'

function GmdCard({ periodo, media, dias }) {
  return (
    <div className={styles.resumoCard}>
      <div className={styles.resumoTitle}>GMD {periodo}</div>
      <div className={styles.resumoGrid}>
        <div className={styles.resumoItem}>
          <span className={styles.resumoLabel}>Média diária</span>
          <span className={styles.resumoValor}>
            {media.toFixed(3)} <span className={styles.resumoUnit}>kg/dia</span>
          </span>
        </div>
        <div className={styles.resumoItem}>
          <span className={styles.resumoLabel}>Dias com pesagem</span>
          <span className={styles.resumoValor}>{dias}</span>
        </div>
      </div>
    </div>
  )
}

export default function CorteHistorico() {
  const { propriedadeId } = useParams()
  const { medias, carregando, erro } = useMediaHistoricaGmdPropriedade(propriedadeId)
  const { serie } = useSeriePesoPropriedade(propriedadeId, 90)

  const dadosGrafico = serie.map(p => ({ dia: p.dia, valor: p.peso_medio }))

  return (
    <SubpageLayout activeTab="historico">
      {erro && <div className={styles.errorToast}>{erro}</div>}
      {carregando && <p className={styles.emptyState}>Carregando...</p>}

      {!carregando && !erro && (
        <>
          <div className={styles.mediasGrid}>
            <GmdCard periodo="7 dias"  media={medias.gmd_media_7d}  dias={medias.gmd_dias_7d} />
            <GmdCard periodo="30 dias" media={medias.gmd_media_30d} dias={medias.gmd_dias_30d} />
            <GmdCard periodo="90 dias" media={medias.gmd_media_90d} dias={medias.gmd_dias_90d} />
          </div>

          <div className={styles.resumoCard} style={{ marginTop: 'var(--space-md)' }}>
            <div className={styles.resumoTitle}>ECC médio (90 dias)</div>
            <div className={styles.resumoGrid}>
              <div className={styles.resumoItem}>
                <span className={styles.resumoLabel}>Escore Corporal</span>
                <span className={styles.resumoValor}>
                  {medias.ecc_medio_90d ? medias.ecc_medio_90d.toFixed(2) : '—'}
                  <span className={styles.resumoUnit}>/9</span>
                </span>
              </div>
            </div>
          </div>

          <h3 className={styles.resumoTitle} style={{ marginTop: 'var(--space-lg)' }}>
            Curva de peso médio — últimos 90 dias
          </h3>
          <GraficoLinha data={dadosGrafico} unidade="kg" />
          {dadosGrafico.length === 0 && (
            <div className={styles.emptyState}>
              Sem pesagens registradas no histórico.
            </div>
          )}
        </>
      )}
    </SubpageLayout>
  )
}
