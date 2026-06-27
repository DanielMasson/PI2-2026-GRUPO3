import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAnimal } from '../../hooks/useAnimal'
import { useAnimais } from '../../hooks/useAnimais'
import { useVacinas } from '../../hooks/useVacinas'
import { usePesagens } from '../../hooks/usePesagens'
import { useOcorrencias } from '../../hooks/useOcorrencias'
import { useReproducao } from '../../hooks/useReproducao'
import styles from './FichaAnimal.module.css'

function FichaAnimal() {
  const { propriedadeId, animalId } = useParams()
  const navigate = useNavigate()
  const [abaAtiva, setAbaAtiva] = useState('info')
	const [mostrarEdicao, setMostrarEdicao] = useState(false)
	const [editFields, setEditFields] = useState({})
	const [salvando, setSalvando] = useState(false)
	const [editSucesso, setEditSucesso] = useState(false)
	const [mostrarConfirmarExcluir, setMostrarConfirmarExcluir] = useState(false)
	const [excluindo, setExcluindo] = useState(false)

  const { animal, idade, carregando, erro, recarregar } = useAnimal(animalId)
	const { animais, editarAnimal, excluirAnimal } = useAnimais(propriedadeId)
  const { vacinas, carregando: carregandoVacinas } = useVacinas(animalId)
  const { pesagens, carregando: carregandoPesagens, gmd } = usePesagens(animalId)
  const { ocorrencias, carregando: carregandoOcorrencias } = useOcorrencias(animalId)

  // Reprodução apenas para fêmeas
  const isFemea = animal?.sexo === 'femea'

	function abrirEdicao() {
		if (!animal) return
		setEditFields({
			nome: animal.nome || '',
			id_fisico: animal.id_fisico || '',
			id_interno: animal.id_interno || '',
			raca: animal.raca || '',
			pelagem: animal.pelagem || '',
			genetica: animal.genetica || '',
			origem: animal.origem || '',
			peso_inicial: animal.peso_inicial || '',
			data_nascimento: animal.data_nascimento || '',
			pai_uuid: animal.pai_uuid || '',
			mae_uuid: animal.mae_uuid || '',
		})
		setMostrarEdicao(true)
		setEditSucesso(false)
	}

	function handleEditChange(e) {
		const { name, value } = e.target
		setEditFields(prev => ({ ...prev, [name]: value }))
	}

	async function handleSalvarEdicao() {
		setSalvando(true)
		try {
			await editarAnimal(animalId, {
				...editFields,
				peso_inicial: editFields.peso_inicial ? parseFloat(editFields.peso_inicial) : null,
				pai_uuid: editFields.pai_uuid || null,
				mae_uuid: editFields.mae_uuid || null,
			})
			setEditSucesso(true)
			recarregar()
			setTimeout(() => {
				setMostrarEdicao(false)
				setEditSucesso(false)
			}, 1200)
		} catch (err) {
			alert('Erro ao salvar: ' + (err.message || err))
		} finally {
			setSalvando(false)
		}
	}

	async function handleExcluir() {
		setExcluindo(true)
		try {
			await excluirAnimal(animalId)
			setMostrarConfirmarExcluir(false)
			navigate(`/propriedade/${propriedadeId}/animais`)
		} catch (err) {
			alert('Erro ao excluir: ' + (err.message || err))
			setExcluindo(false)
		}
	}
  const { registros: reproducao, gestacaoAtiva, diasRestantes, statusGestacao, carregando: carregandoReproducao } = useReproducao(isFemea ? animalId : null)

  const pesoAtual = pesagens.length > 0
    ? [...pesagens].sort((a, b) => new Date(b.data) - new Date(a.data))[0]?.peso
    : animal?.peso_inicial

  // ─── Loading state ──────────────────────────────────────────────────────────
  if (carregando) {
    return (
      <div className={styles.screen}>
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button className={styles.backBtn} onClick={() => navigate(`/propriedade/${propriedadeId}/animais`)}>←</button>
            <div>
              <div className={styles.topbarTitle}>Carregando...</div>
            </div>
          </div>
        </div>
        <div className={styles.scrollArea}>
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9b92b8' }}>
            Carregando dados do animal...
          </div>
        </div>
      </div>
    )
  }

  // ─── Error state ────────────────────────────────────────────────────────────
  if (erro || !animal) {
    return (
      <div className={styles.screen}>
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button className={styles.backBtn} onClick={() => navigate(`/propriedade/${propriedadeId}/animais`)}>←</button>
            <div>
              <div className={styles.topbarTitle}>Erro</div>
            </div>
          </div>
        </div>
        <div className={styles.scrollArea}>
          <div style={{ textAlign: 'center', padding: '3rem', color: '#e57373' }}>
            {erro || 'Animal não encontrado'}
          </div>
          <div style={{ textAlign: 'center' }}>
            <button onClick={recarregar} style={{ color: '#c8a97e', background: 'none', border: '1px solid #c8a97e', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  const brinco = animal.id_fisico || animal.id_interno || '—'

  // ─── Tabs ───────────────────────────────────────────────────────────────────
  const abas = [
    { id: 'info', label: 'Info' },
    { id: 'vacinas', label: 'Vacinas', badge: vacinas.length },
    { id: 'pesagens', label: 'Pesagens', badge: pesagens.length },
    { id: 'ocorrencias', label: 'Ocorrências', badge: ocorrencias.length },
    ...(isFemea ? [{ id: 'reproducao', label: 'Reprodução', badge: reproducao.length }] : []),
  ]

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.screen}>
      {/* ── Topbar ── */}
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <button className={styles.backBtn} onClick={() => navigate(`/propriedade/${propriedadeId}/animais`)}>←</button>
          <div>
            <div className={styles.topbarTitle}>{animal.nome || brinco}</div>
            <div className={styles.topbarSub}>{animal.raca || animal.especie || ''}</div>
          </div>
        </div>
        <div className={styles.topbarActions}>
          <button className={styles.iconBtn} onClick={abrirEdicao} title="Editar animal">
            ✏️
          </button>
          <button className={styles.iconBtn} onClick={() => navigate(`/propriedade/${propriedadeId}/animal/${animalId}/genealogia`)} title="Árvore genealógica">
            🌳
          </button>
        </div>
      </div>

      {/* ── Card resumo ── */}
      <div className={styles.scrollArea}>
        <div className={styles.cardResumo}>
          <div className={styles.resumoHeader}>
            <div className={styles.resumoIcone}>
              {animal.sexo === 'macho' ? '♂' : '♀'}
            </div>
            <div className={styles.resumoInfo}>
              <h2 className={styles.resumoNome}>{animal.nome || brinco}</h2>
              <span className={styles.resumoBrinco}>{brinco}</span>
            </div>
            <span className={`${styles.resumoStatus} ${animal.status === 'Ativo' ? styles.statusAtivo : styles.statusInativo}`}>
              {animal.status || '—'}
            </span>
          </div>
          <div className={styles.resumoGrid}>
            <div className={styles.resumoItem}>
              <span className={styles.resumoLabel}>Idade</span>
              <span className={styles.resumoValor}>{idade.texto || '—'}</span>
            </div>
            <div className={styles.resumoItem}>
              <span className={styles.resumoLabel}>Peso</span>
              <span className={styles.resumoValor}>{pesoAtual ? `${pesoAtual} kg` : '—'}</span>
            </div>
            <div className={styles.resumoItem}>
              <span className={styles.resumoLabel}>GMD</span>
              <span className={styles.resumoValor}>{gmd?.valor ? `${gmd.valor.toFixed(3)} kg/dia` : '—'}</span>
            </div>
            <div className={styles.resumoItem}>
              <span className={styles.resumoLabel}>Espécie</span>
              <span className={styles.resumoValor}>{animal.especie || '—'}</span>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className={styles.tabs}>
          {abas.map(aba => (
            <button
              key={aba.id}
              className={`${styles.tab} ${abaAtiva === aba.id ? styles.tabAtiva : ''}`}
              onClick={() => setAbaAtiva(aba.id)}
            >
              {aba.label}
              {aba.badge > 0 && <span className={styles.tabBadge}>{aba.badge}</span>}
            </button>
          ))}
        </div>

        {/* ── Tab: Info ── */}
        {abaAtiva === 'info' && (
          <div className={styles.tabContent}>
            <div className={styles.secao}>
              <h3 className={styles.secaoTitulo}>Dados Gerais</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Brinco / ID</span>
                  <span className={styles.infoValor}>{brinco}</span>
                </div>
                {animal.id_interno && animal.id_fisico && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>ID Interno</span>
                    <span className={styles.infoValor}>{animal.id_interno}</span>
                  </div>
                )}
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Nome</span>
                  <span className={styles.infoValor}>{animal.nome || '—'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Espécie</span>
                  <span className={styles.infoValor}>{animal.especie || '—'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Raça</span>
                  <span className={styles.infoValor}>{animal.raca || '—'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Sexo</span>
                  <span className={styles.infoValor}>{animal.sexo === 'macho' ? 'Macho' : 'Fêmea'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Nascimento</span>
                  <span className={styles.infoValor}>
                    {animal.data_nascimento
                      ? new Date(animal.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR')
                      : '—'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Idade</span>
                  <span className={styles.infoValor}>{idade.texto || '—'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Pelagem</span>
                  <span className={styles.infoValor}>{animal.pelagem || '—'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Genética</span>
                  <span className={styles.infoValor}>{animal.genetica || '—'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Origem</span>
                  <span className={styles.infoValor}>{animal.origem || '—'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Peso Inicial</span>
                  <span className={styles.infoValor}>{animal.peso_inicial ? `${animal.peso_inicial} kg` : '—'}</span>
                </div>
              </div>
            </div>

            {/* Genealogia resumo */}
            <div className={styles.secao}>
              <h3 className={styles.secaoTitulo}>Genealogia</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Mãe</span>
                  <span className={styles.infoValor}>
                    {animal.mae_uuid ? (
                      <button
                        className={styles.linkBtn}
                        onClick={() => navigate(`/propriedade/${propriedadeId}/animal/${animal.mae_uuid}`)}
                      >
                        {animal.nome_mae || 'Ver ficha'}
                      </button>
                    ) : 'Desconhecida'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Pai</span>
                  <span className={styles.infoValor}>
                    {animal.pai_uuid ? (
                      <button
                        className={styles.linkBtn}
                        onClick={() => navigate(`/propriedade/${propriedadeId}/animal/${animal.pai_uuid}`)}
                      >
                        {animal.nome_pai || 'Ver ficha'}
                      </button>
                    ) : 'Desconhecido'}
                  </span>
                </div>
              </div>
              <button
                className={styles.voltarBtn}
                onClick={() => navigate(`/propriedade/${propriedadeId}/animal/${animalId}/genealogia`)}
              >
                Ver árvore genealógica
              </button>
            </div>
          </div>
        )}

        {/* ── Tab: Vacinas ── */}
        {abaAtiva === 'vacinas' && (
          <div className={styles.tabContent}>
            {carregandoVacinas ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#9b92b8' }}>Carregando vacinas...</div>
            ) : vacinas.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>💉</div>
                <div className={styles.emptyText}>Nenhuma vacina registrada</div>
              </div>
            ) : (
              <div className={styles.listaItens}>
                {vacinas.map(v => (
                  <div key={v.uuid} className={styles.itemCard}>
                    <div className={styles.itemHeader}>
                      <span className={styles.itemNome}>{v.nome_vacina || '—'}</span>
                      <span className={styles.itemData}>
                        {v.data_aplicacao
                          ? new Date(v.data_aplicacao + 'T00:00:00').toLocaleDateString('pt-BR')
                          : '—'}
                      </span>
                    </div>
                    <div className={styles.itemDetalhes}>
                      {v.proxima_dose && (
                        <span className={styles.itemDetail}>
                          Próxima: {new Date(v.proxima_dose + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {v.ciclo_dias && (
                        <span className={styles.itemDetail}>Ciclo: {v.ciclo_dias} dias</span>
                      )}
                      {v.obrigatoria && (
                        <span className={styles.itemDetail}>Obrigatória</span>
                      )}
                      {v.lote && (
                        <span className={styles.itemDetail}>Lote: {v.lote}</span>
                      )}
                      {v.responsavel && (
                        <span className={styles.itemDetail}>Resp.: {v.responsavel}</span>
                      )}
                    </div>
                    {v.observacao && (
                      <div className={styles.itemObs}>{v.observacao}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Pesagens ── */}
        {abaAtiva === 'pesagens' && (
          <div className={styles.tabContent}>
            {carregandoPesagens ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#9b92b8' }}>Carregando pesagens...</div>
            ) : pesagens.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>⚖️</div>
                <div className={styles.emptyText}>Nenhuma pesagem registrada</div>
              </div>
            ) : (
              <>
                <div className={styles.gmdCard}>
                  <span className={styles.gmdLabel}>GMD</span>
                  <span className={styles.gmdValor} style={{ color: gmd?.cor === 'verde' ? '#4caf50' : gmd?.cor === 'amarelo' ? '#ff9800' : gmd?.cor === 'vermelho' ? '#e57373' : '#9b92b8' }}>
                    {gmd?.valor ? `${gmd.valor.toFixed(3)} kg/dia` : '—'}
                  </span>
                </div>
                <div className={styles.listaItens}>
                  {[...pesagens]
                    .sort((a, b) => new Date(b.data) - new Date(a.data))
                    .map(p => (
                      <div key={p.uuid} className={styles.itemCard}>
                        <div className={styles.itemHeader}>
                          <span className={styles.itemNome}>{p.peso ? `${p.peso} kg` : '—'}</span>
                          <span className={styles.itemData}>
                            {p.data
                              ? new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR')
                              : '—'}
                          </span>
                        </div>
                        <div className={styles.itemDetalhes}>
                          {p.ecc && (
                            <span className={styles.itemDetail}>ECC: {p.ecc}</span>
                          )}
                        </div>
                        {p.observacao && (
                          <div className={styles.itemObs}>{p.observacao}</div>
                        )}
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Tab: Ocorrências ── */}
        {abaAtiva === 'ocorrencias' && (
          <div className={styles.tabContent}>
            {carregandoOcorrencias ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#9b92b8' }}>Carregando ocorrências...</div>
            ) : ocorrencias.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📋</div>
                <div className={styles.emptyText}>Nenhuma ocorrência registrada</div>
              </div>
            ) : (
              <div className={styles.listaItens}>
                {ocorrencias.map(o => (
                  <div key={o.uuid} className={styles.itemCard}>
                    <div className={styles.itemHeader}>
                      <span className={styles.itemNome}>{o.sintomas || '—'}</span>
                      <span className={styles.itemData}>
                        {o.data
                          ? new Date(o.data + 'T00:00:00').toLocaleDateString('pt-BR')
                          : '—'}
                      </span>
                    </div>
                    <div className={styles.itemDetalhes}>
                      {o.tratamento && (
                        <span className={styles.itemDetail}>Tratamento: {o.tratamento}</span>
                      )}
                      {o.resultado && (
                        <span className={styles.itemDetail}>Resultado: {o.resultado}</span>
                      )}
                      {o.veterinario && (
                        <span className={styles.itemDetail}>Vet.: {o.veterinario}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Reprodução ── */}
        {abaAtiva === 'reproducao' && isFemea && (
          <div className={styles.tabContent}>
            {carregandoReproducao ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#9b92b8' }}>Carregando reprodução...</div>
            ) : reproducao.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🐄</div>
                <div className={styles.emptyText}>Nenhum registro de reprodução</div>
              </div>
            ) : (
              <>
                {gestacaoAtiva && (
                  <div className={styles.gmdCard}>
                    <span className={styles.gmdLabel}>Gestação</span>
                    <span className={styles.gmdValor} style={{
                      color: statusGestacao()?.cor === 'verde' ? '#4caf50'
                        : statusGestacao()?.cor === 'amarelo' ? '#ff9800'
                        : statusGestacao()?.cor === 'vermelho' ? '#e57373'
                        : '#9b92b8'
                    }}>
                      {statusGestacao()?.label || '—'}
                      {diasRestantes !== null && ` (${diasRestantes}d restantes)`}
                    </span>
                  </div>
                )}
                <div className={styles.listaItens}>
                  {reproducao.map(r => (
                    <div key={r.uuid} className={styles.itemCard}>
                      <div className={styles.itemHeader}>
                        <span className={styles.itemNome}>
                          {r.data_cobertura
                            ? new Date(r.data_cobertura + 'T00:00:00').toLocaleDateString('pt-BR')
                            : '—'}
                        </span>
                        <span className={styles.itemData}>
                          {r.data_parto
                            ? `Parto: ${new Date(r.data_parto + 'T00:00:00').toLocaleDateString('pt-BR')}`
                            : r.prenhez_confirmada ? 'Prenhez confirmada' : 'Aguardando'}
                        </span>
                      </div>
                      <div className={styles.itemDetalhes}>
                        {r.touro && (
                          <span className={styles.itemDetail}>Touro: {r.touro}</span>
                        )}
                        {r.data_previa_parto && !r.data_parto && (
                          <span className={styles.itemDetail}>
                            Previsão: {new Date(r.data_previa_parto + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        {r.observacao && (
                          <span className={styles.itemDetail}>{r.observacao}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Seção Excluir ── */}
        {abaAtiva === 'info' && (
          <div className={styles.excluirSecao}>
            <button
              className={styles.excluirBtn}
              onClick={() => setMostrarConfirmarExcluir(true)}
            >
              🗑️ Excluir animal
            </button>
            <p className={styles.excluirAviso}>
              O animal será marcado como removido e não aparecerá mais nas listas. Todos os registros (vacinas, pesagens, reprodução) serão preservados.
            </p>
          </div>
        )}

        {/* ── Botões flutuantes ── */}
        <div className={styles.fabArea}>
          {abaAtiva === 'vacinas' && (
            <button
              className={styles.fab}
              onClick={() => navigate(`/propriedade/${propriedadeId}/saude?aba=vacinas&animal=${encodeURIComponent((animal.nome || '') + ' (' + brinco + ')')}`)}
            >
              💉
            </button>
          )}
          {abaAtiva === 'ocorrencias' && (
            <button
              className={styles.fab}
              onClick={() => navigate(`/propriedade/${propriedadeId}/saude?aba=ocorrencias&animal=${encodeURIComponent((animal.nome || '') + ' (' + brinco + ')')}`)}
            >
              📋
            </button>
          )}
          {abaAtiva === 'reproducao' && isFemea && (
            <button
              className={styles.fab}
              onClick={() => navigate(`/propriedade/${propriedadeId}/reproducao?animal=${animalId}`)}
            >
              🐄
            </button>
          )}
        </div>
      </div>

		{/* ── Modal de Edição ── */}
		{mostrarEdicao && (
			<div className={styles.modalOverlay} onClick={() => setMostrarEdicao(false)}>
				<div className={styles.modalContent} onClick={e => e.stopPropagation()}>
					<div className={styles.modalHeader}>
						<h2 className={styles.modalTitle}>Editar Animal</h2>
						<button className={styles.modalClose} onClick={() => setMostrarEdicao(false)}>✕</button>
					</div>

					{editSucesso ? (
						<div className={styles.modalSucesso}>✅ Salvo com sucesso!</div>
					) : (
						<div className={styles.modalBody}>
							<div className={styles.editGrid}>
								<div className={styles.editField}>
									<label className={styles.editLabel}>Nome</label>
									<input className={styles.editInput} name="nome" value={editFields.nome || ''} onChange={handleEditChange} />
								</div>
								<div className={styles.editField}>
									<label className={styles.editLabel}>Brinco / ID Físico</label>
									<input className={styles.editInput} name="id_fisico" value={editFields.id_fisico || ''} onChange={handleEditChange} />
								</div>
								<div className={styles.editField}>
									<label className={styles.editLabel}>ID Interno</label>
									<input className={styles.editInput} name="id_interno" value={editFields.id_interno || ''} onChange={handleEditChange} />
								</div>
								<div className={styles.editField}>
									<label className={styles.editLabel}>Raça</label>
									<input className={styles.editInput} name="raca" value={editFields.raca || ''} onChange={handleEditChange} />
								</div>
								<div className={styles.editField}>
									<label className={styles.editLabel}>Data de Nascimento</label>
									<input className={styles.editInput} type="date" name="data_nascimento" value={editFields.data_nascimento || ''} onChange={handleEditChange} />
								</div>
								<div className={styles.editField}>
									<label className={styles.editLabel}>Pelagem</label>
									<input className={styles.editInput} name="pelagem" value={editFields.pelagem || ''} onChange={handleEditChange} />
								</div>
								<div className={styles.editField}>
									<label className={styles.editLabel}>Genética</label>
									<input className={styles.editInput} name="genetica" value={editFields.genetica || ''} onChange={handleEditChange} />
								</div>
								<div className={styles.editField}>
									<label className={styles.editLabel}>Origem</label>
									<input className={styles.editInput} name="origem" value={editFields.origem || ''} onChange={handleEditChange} />
								</div>
								<div className={styles.editField}>
									<label className={styles.editLabel}>Peso Inicial (kg)</label>
									<input className={styles.editInput} type="number" step="0.1" name="peso_inicial" value={editFields.peso_inicial || ''} onChange={handleEditChange} />
								</div>
								<div className={styles.editField}>
									<label className={styles.editLabel}>Pai (Sire)</label>
									<select className={styles.editSelect} name="pai_uuid" value={editFields.pai_uuid || ''} onChange={handleEditChange}>
										<option value="">Não informado</option>
										{animais.filter(a => a.sexo === 'macho' && a.uuid !== animalId).map(a => (
											<option key={a.uuid} value={a.uuid}>{a.nome} ({a.id_fisico || a.id_interno || 's/brinco'})</option>
										))}
									</select>
								</div>
								<div className={styles.editField}>
									<label className={styles.editLabel}>Mãe (Dam)</label>
									<select className={styles.editSelect} name="mae_uuid" value={editFields.mae_uuid || ''} onChange={handleEditChange}>
										<option value="">Não informado</option>
										{animais.filter(a => a.sexo === 'femea' && a.uuid !== animalId).map(a => (
											<option key={a.uuid} value={a.uuid}>{a.nome} ({a.id_fisico || a.id_interno || 's/brinco'})</option>
										))}
									</select>
								</div>
							</div>

							<div className={styles.modalActions}>
								<button className={styles.modalCancelBtn} onClick={() => setMostrarEdicao(false)} disabled={salvando}>Cancelar</button>
								<button className={styles.modalSaveBtn} onClick={handleSalvarEdicao} disabled={salvando}>
									{salvando ? 'Salvando...' : 'Salvar'}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		)}

		{/* ── Modal de Confirmação de Exclusão ── */}
		{mostrarConfirmarExcluir && (
			<div className={styles.modalOverlay} onClick={() => !excluindo && setMostrarConfirmarExcluir(false)}>
				<div className={styles.modalContent} onClick={e => e.stopPropagation()}>
					<div className={styles.modalHeader}>
						<h2 className={styles.modalTitle}>Excluir animal?</h2>
						<button className={styles.modalClose} onClick={() => setMostrarConfirmarExcluir(false)} disabled={excluindo}>✕</button>
					</div>
					<div className={styles.modalBody}>
						<p style={{ color: '#e8e4d8', fontSize: '15px', lineHeight: '1.5', margin: '0 0 8px 0' }}>
							Você está prestes a excluir <strong>{animal.nome || brinco}</strong>.
						</p>
						<p style={{ color: '#9b92b8', fontSize: '13px', lineHeight: '1.4', margin: '0 0 16px 0' }}>
							O animal será marcado como removido (soft delete). O histórico de vacinas, pesagens, ocorrências e reprodução serão preservados.
						</p>
						<div className={styles.modalActions}>
							<button className={styles.modalCancelBtn} onClick={() => setMostrarConfirmarExcluir(false)} disabled={excluindo}>Cancelar</button>
							<button
								className={styles.modalSaveBtn}
								style={{ background: '#a13a3a' }}
								onClick={handleExcluir}
								disabled={excluindo}
							>
								{excluindo ? 'Excluindo...' : 'Sim, excluir'}
							</button>
						</div>
					</div>
				</div>
			</div>
		)}
	</div>
  )
}

export default FichaAnimal
