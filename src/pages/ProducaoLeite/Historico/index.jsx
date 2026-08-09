import { useParams } from 'react-router-dom'
import {
  useMediaHistoricaPropriedade,
  useSeriePropriedade,
} from '../../../hooks/useProducaoLeiteAnalise'
import GraficoLinha from '../../../components/GraficoLinha'
import SubpageLayout from '../_SubpageLayout'
import styles from '../ProducaoLeite.module.css'

function MediaCard({ periodo, media, dias, total }) {
  return (
    <div className={styles.resumoCard}>
      <div className={styles.resumoTitle}>Média {periodo}</div>
      <div className={styles.resumoGrid}>
        <div className={styles.resumoItem}>
          <span className={styles.resumoLabel}>Média diária</span>
          <span className={styles.resumoValor}>{media.toFixed(1)} <span className={styles.resumoUnit}>L/dia</span></span>
        </div>
        <div className={styles.resumoItem}>
          <span className={styles.resumoLabel}>Dias com registro</span>
          <span className={styles.resumoValor}>{dias}</span>
        </div>
        <div className={styles.resumoItem}>
          <span className={styles.resumoLabel}>Total período</span>
          <span className={styles.resumoValor}>{total.toFixed(0)} <span className={styles.resumoUnit}>L</span></span>
        </div>
      </div>
    </div>
  )
}

export default function ProducaoLeiteHistorico() {
  const { propriedadeId } = useParams()
  const { medias, carregando, erro } = useMediaHistoricaPropriedade(propriedadeId)
  const { serie } = useSeriePropriedade(propriedadeId, 90)

  // total = media * dias_with_registro (per-card)
  const total7 = medias.media_7d * medias.dias_7d
  const total30 = medias.media_30d * medias.dias_30d
  const total90 = medias.media_90d * medias.dias_90d

  const dadosGrafico = serie.map(p => ({ dia: p.dia, valor: p.total_litros }))

  return (
    <SubpageLayout activeTab="historico">
      {erro && <div className={styles.errorToast}>{erro}</div>}
      {carregando && <p className={styles.emptyState}>Carregando...</p>}

      {!carregando && !erro && (
        <>
          <div className={styles.mediasGrid}>
            <MediaCard periodo="7 dias"  media={medias.media_7d}  dias={medias.dias_7d}  total={total7} />
            <MediaCard periodo="30 dias" media={medias.media_30d} dias={medias.dias_30d} total={total30} />
            <MediaCard periodo="90 dias" media={medias.media_90d} dias={medias.dias_90d} total={total90} />
          </div>

          <h3 className={styles.resumoTitle} style={{ marginTop: 'var(--space-lg)' }}>
            Curva dos últimos 90 dias
          </h3>
          <GraficoLinha data={dadosGrafico} unidade="L" />
          {dadosGrafico.length === 0 && (
            <div className={styles.emptyState}>
              Sem registros no histórico.
            </div>
          )}
        </>
      )}
    </SubpageLayout>
  )
}
