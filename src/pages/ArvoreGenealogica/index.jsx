import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAnimal } from '../../hooks/useAnimal'
import * as animalService from '../../services/animalService'
import styles from './ArvoreGenealogica.module.css'

// ─── Componente Nó ──────────────────────────────────────────────────────────
function NoAnimal({ animal, selecionado, onClick }) {
  if (!animal) {
    return (
      <div className={`${styles.no} ${styles.noDesconhecido}`}>
        <div className={styles.noIcone}>?</div>
        <div className={styles.noNome}>Desconhecido</div>
      </div>
    )
  }

  const isMacho = animal.sexo === 'macho'
  const classe = isMacho ? styles.noMacho : styles.noFemea
  const brinco = animal.id_fisico || animal.id_interno || ''

  return (
    <div
      className={`${styles.no} ${classe} ${selecionado ? styles.noSelecionado : ''}`}
      onClick={() => onClick(animal.uuid)}
      role="button"
      tabIndex={0}
    >
      <div className={styles.noIcone}>{isMacho ? '♂' : '♀'}</div>
      <div className={styles.noNome}>{animal.nome || brinco || '—'}</div>
      {brinco && <div className={styles.noBrinco}>{brinco}</div>}
      {animal.raca && <div className={styles.noRaca}>{animal.raca}</div>}
    </div>
  )
}

// ─── Linhas de conexão ──────────────────────────────────────────────────────
function LinhaAvos({ mae, pai, onClick }) {
  const temAvoMae = mae?.mae || mae?.pai
  const temAvoPai = pai?.mae || pai?.pai

  return (
    <div className={styles.linhaAvos}>
      {(temAvoMae || temAvoPai) && <div className={styles.avosLabel}>Avós</div>}
      <div className={styles.avosPar}>
        <div className={styles.avosLado}>
          {mae?.mae && <NoAnimal animal={mae.mae} onClick={onClick} />}
          {mae?.pai && <NoAnimal animal={mae.pai} onClick={onClick} />}
          {(!mae || (!mae.mae && !mae.pai)) && (
            <div className={styles.avosPlaceholder}>
              <NoAnimal animal={null} onClick={onClick} />
            </div>
          )}
        </div>
        <div className={styles.avosLado}>
          {pai?.mae && <NoAnimal animal={pai.mae} onClick={onClick} />}
          {pai?.pai && <NoAnimal animal={pai.pai} onClick={onClick} />}
          {(!pai || (!pai.mae && !pai.pai)) && (
            <div className={styles.avosPlaceholder}>
              <NoAnimal animal={null} onClick={onClick} />
            </div>
          )}
        </div>
      </div>
      <div className={styles.conectorAvosPais} />
    </div>
  )
}

function LinhaPais({ mae, pai, onClick }) {
  return (
    <div className={styles.linhaPais}>
      {(mae || pai) && <div className={styles.paisLabel}>Pais</div>}
      <div className={styles.paisPar}>
        <NoAnimal animal={mae} onClick={onClick} />
        <NoAnimal animal={pai} onClick={onClick} />
      </div>
      <div className={styles.conectorPaisAnimal} />
    </div>
  )
}

function LinhaFilhos({ filhos, onClick }) {
  if (!filhos || filhos.length === 0) return null
  return (
    <div className={styles.linhaFilhos}>
      <div className={styles.conectorAnimalFilhos} />
      <div className={styles.filhosLabel}>Filhos ({filhos.length})</div>
      <div className={styles.filhosLista}>
        {filhos.map(f => (
          <NoAnimal key={f.uuid} animal={f} onClick={onClick} />
        ))}
      </div>
    </div>
  )
}

// ─── Construção assíncrona da árvore ────────────────────────────────────────
// buscarGenealogia retorna { ...animal, mae, pai } com 1 nível de profundidade.
// Para obter avós (3 gerações), chamamos buscarGenealogia recursivamente nos pais.
async function expandirAncestrais(animal, profundidade = 2) {
  if (!animal || profundidade <= 0) return animal

  // buscarGenealogia já traz o animal + mae/pai diretos
  const dados = await animalService.buscarGenealogia(animal.uuid)
  if (!dados) return animal

  // Expandir ancestrais dos pais recursivamente
  const mae = dados.mae ? await expandirAncestrais(dados.mae, profundidade - 1) : null
  const pai = dados.pai ? await expandirAncestrais(dados.pai, profundidade - 1) : null

  return {
    ...dados,
    mae,
    pai,
  }
}

// ─── Componente principal ──────────────────────────────────────────────────
function ArvoreGenealogica() {
  const { propriedadeId, animalId } = useParams()
  const navigate = useNavigate()

  // Hook para dados básicos do animal (loading/erro gerenciados pelo hook)
  const { animal: animalBase, carregando: carregandoBase, erro: erroBase } = useAnimal(animalId)

  // Estado da árvore genealógica completa (ancestrais + filhos)
  const [arvore, setArvore] = useState(null)
  const [carregandoArvore, setCarregandoArvore] = useState(true)
  const [erroArvore, setErroArvore] = useState(null)

  const carregarArvore = useCallback(async () => {
    if (!animalId) return
    setCarregandoArvore(true)
    setErroArvore(null)
    try {
      // 1. Buscar o animal base via service (ancestrais até 3 gerações)
      const base = await animalService.buscarAnimal(animalId)
      if (!base) {
        setArvore(null)
        setCarregandoArvore(false)
        return
      }

      // 2. Expandir ancestrais recursivamente (pais + avós)
      const comAncestrais = await expandirAncestrais(base, 2)

      // 3. Buscar filhos: lista animais da propriedade e filtra por mae_uuid/pai_uuid
      let filhos = []
      if (propriedadeId) {
        try {
          const todosAnimais = await animalService.listarAnimais(propriedadeId)
          filhos = todosAnimais.filter(
            a => a.mae_uuid === animalId || a.pai_uuid === animalId
          )
        } catch {
          // Falha ao buscar filhos não deve impedir a exibição da árvore
          filhos = []
        }
      }

      setArvore({ ...comAncestrais, filhos })
    } catch (e) {
      setErroArvore(e.message)
    } finally {
      setCarregandoArvore(false)
    }
  }, [animalId, propriedadeId])

  useEffect(() => { carregarArvore() }, [carregarArvore])

  // Recarregar árvore quando o animal base mudar (ex: edição externa)
  useEffect(() => {
    if (animalBase && !carregandoBase) {
      carregarArvore()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animalBase?.uuid])

  const carregando = carregandoBase || carregandoArvore
  const erro = erroBase || erroArvore

  function handleClickNo(uuid) {
    if (uuid && uuid !== animalId) {
      navigate(`/propriedade/${propriedadeId}/animal/${uuid}/genealogia`)
    }
  }

  // ─── Loading ──
  if (carregando) {
    return (
      <div className={styles.container}>
        <div className={styles.topbar}>
          <button className={styles.backBtn} onClick={() => navigate(`/propriedade/${propriedadeId}/animal/${animalId}`)}>←</button>
          <div>
            <div className={styles.pageTitle}>Árvore Genealógica</div>
            <div className={styles.pageSubtitle}>Carregando...</div>
          </div>
        </div>
        <div className={styles.inner}>
          <div className={styles.loadingContainer}>
            Montando árvore genealógica...
          </div>
        </div>
      </div>
    )
  }

  // ─── Error ──
  if (erro || !arvore) {
    return (
      <div className={styles.container}>
        <div className={styles.topbar}>
          <button className={styles.backBtn} onClick={() => navigate(`/propriedade/${propriedadeId}/animal/${animalId}`)}>←</button>
          <div>
            <div className={styles.pageTitle}>Árvore Genealógica</div>
            <div className={styles.pageSubtitle}>Erro</div>
          </div>
        </div>
        <div className={styles.inner}>
          <div className={styles.errorContainer}>
            {erro || 'Animal não encontrado'}
          </div>
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={carregarArvore}
              style={{ color: '#c8a97e', background: 'none', border: '1px solid #c8a97e', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  const brinco = arvore.id_fisico || arvore.id_interno || ''
  const temAvos = arvore?.mae?.mae || arvore?.mae?.pai || arvore?.pai?.mae || arvore?.pai?.pai
  const temPais = arvore?.mae || arvore?.pai
  const temFilhos = arvore?.filhos && arvore.filhos.length > 0

  return (
    <div className={styles.container}>
      {/* ── Topbar ── */}
      <div className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => navigate(`/propriedade/${propriedadeId}/animal/${animalId}`)}>←</button>
        <div>
          <div className={styles.pageTitle}>Árvore Genealógica</div>
          <div className={styles.pageSubtitle}>{arvore.nome || brinco || '—'}</div>
        </div>
      </div>

      {/* ── Árvore ── */}
      <div className={styles.inner}>
        <div className={styles.treeWrapper}>
          <div className={styles.tree}>
            {/* Avós */}
            {temAvos && (
              <LinhaAvos mae={arvore.mae} pai={arvore.pai} onClick={handleClickNo} />
            )}

            {/* Pais */}
            {temPais && (
              <LinhaPais mae={arvore.mae} pai={arvore.pai} onClick={handleClickNo} />
            )}

            {/* Animal principal */}
            <NoAnimal animal={arvore} selecionado onClick={handleClickNo} />

            {/* Filhos */}
            {temFilhos && (
              <LinhaFilhos filhos={arvore.filhos} onClick={handleClickNo} />
            )}
          </div>
        </div>

        {/* ── Info resumo ── */}
        <div className={styles.animalInfo}>
          <h3 className={styles.animalInfoTitulo}>Resumo Genealógico</h3>
          <div className={styles.animalInfoGrid}>
            <div className={styles.animalInfoItem}>
              <span className={styles.animalInfoLabel}>Animal</span>
              <span className={styles.animalInfoValor}>{arvore.nome || brinco || '—'}</span>
            </div>
            <div className={styles.animalInfoItem}>
              <span className={styles.animalInfoLabel}>Mãe</span>
              <span className={styles.animalInfoValor}>
                {arvore.mae ? (
                  <button
                    className={styles.animalLink}
                    onClick={() => handleClickNo(arvore.mae.uuid)}
                  >
                    {arvore.mae.nome || arvore.mae.id_fisico || arvore.mae.id_interno || '—'}
                  </button>
                ) : 'Desconhecida'}
              </span>
            </div>
            <div className={styles.animalInfoItem}>
              <span className={styles.animalInfoLabel}>Pai</span>
              <span className={styles.animalInfoValor}>
                {arvore.pai ? (
                  <button
                    className={styles.animalLink}
                    onClick={() => handleClickNo(arvore.pai.uuid)}
                  >
                    {arvore.pai.nome || arvore.pai.id_fisico || arvore.pai.id_interno || '—'}
                  </button>
                ) : 'Desconhecido'}
              </span>
            </div>
            <div className={styles.animalInfoItem}>
              <span className={styles.animalInfoLabel}>Filhos</span>
              <span className={styles.animalInfoValor}>{temFilhos ? arvore.filhos.length : 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ArvoreGenealogica
