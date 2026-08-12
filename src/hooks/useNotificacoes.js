import { useState, useEffect, useCallback, useRef } from 'react'
import * as notificacaoService from '../services/notificacaoService'
import * as vacinaService from '../services/vacinaService'
import * as reproducaoService from '../services/reproducaoService'
import * as producaoLeiteService from '../services/producaoLeiteService'
import * as pesagemService from '../services/pesagemService'
import * as sqliteQueries from '../services/sqlite/queries'
import { auth } from '../services/firebase/config'
import * as nativeNotif from '../services/nativeNotificationService'
import { buscarConfigUsuario } from '../services/sqlite/queries'

// Intervalo mínimo entre sincronizações automáticas (5 minutos)
const SYNC_INTERVAL_MS = 5 * 60 * 1000

// Hook centralizado de notificações — agrega alertas de todos os módulos,
// persiste no SQLite, dispara notificações nativas e fornece operações de leitura/exclusão.
export function useNotificacoes(propriedadeId) {
  const [notificacoes, setNotificacoes] = useState([])
  const [countNaoLidas, setCountNaoLidas] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [notificacoesHabilitadas, setNotificacoesHabilitadas] = useState(true)

  const usuarioUuid = auth.currentUser?.uid || ''
  const ultimaSyncRef = useRef(0)
  const sincronizandoRef = useRef(false)

  // Carrega a preferência do usuário
  useEffect(() => {
    if (!usuarioUuid) return
    buscarConfigUsuario(usuarioUuid, 'notificacoes_habilitadas').then(valor => {
      // Default: true (habilitado) quando não há config salva
      setNotificacoesHabilitadas(valor !== 'false')
    }).catch(() => {})
  }, [usuarioUuid])

  const carregar = useCallback(async () => {
    if (!propriedadeId) return
    setCarregando(true)
    setErro(null)
    try {
      const [todas, count] = await Promise.all([
        notificacaoService.listarTodas(propriedadeId),
        notificacaoService.contarNaoLidas(propriedadeId),
      ])
      setNotificacoes(todas || [])
      setCountNaoLidas(count || 0)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [propriedadeId])

  useEffect(() => { carregar() }, [carregar])

  // Reage a syncs pós-pull
  useEffect(() => {
    function onSync() { if (propriedadeId) carregar() }
    window.addEventListener('sync:atualizado', onSync)
    return () => window.removeEventListener('sync:atualizado', onSync)
  }, [carregar, propriedadeId])

  // Solicita permissão de notificação no mount (Android 13+)
  useEffect(() => {
    nativeNotif.solicitarPermissao().catch(() => {})
  }, [])

  // Sincroniza alertas dos módulos com a tabela de notificações.
  // Compara alertas atuais com notificações existentes, insere novas e remove obsoletas.
  // Dispara notificações nativas apenas para alertas recém-inseridos (verifica DB).
  const sincronizar = useCallback(async () => {
    if (!propriedadeId || !usuarioUuid) return

    // Mutex: evita execuções concorrentes
    if (sincronizandoRef.current) return
    sincronizandoRef.current = true

    // Throttle: não sincroniza se fez menos de 30s
    const agora = Date.now()
    if (agora - ultimaSyncRef.current < 30000) {
      sincronizandoRef.current = false
      return
    }
    ultimaSyncRef.current = agora

    try {
      const alertasAtuais = await coletarAlertas(propriedadeId)

      // Busca notificações existentes no DB (fonte da verdade para dedup)
      const existentes = await notificacaoService.listarTodas(propriedadeId)
      const existentesMap = new Map()
      for (const n of existentes) {
        const key = `${n.tipo}::${n.referencia_uuid || ''}`
        existentesMap.set(key, n)
      }

      // Inserir alertas que não têm notificação correspondente no DB
      const novasNotificacoes = []
      for (const alerta of alertasAtuais) {
        const key = `${alerta.tipo}::${alerta.referencia_uuid || ''}`
        if (!existentesMap.has(key)) {
          await notificacaoService.registrar({
            propriedade_uuid: propriedadeId,
            usuario_uuid: usuarioUuid,
            tipo: alerta.tipo,
            titulo: alerta.titulo,
            descricao: alerta.descricao,
            nivel: alerta.nivel,
            modulo: alerta.modulo,
            referencia_uuid: alerta.referencia_uuid || null,
          })
          novasNotificacoes.push(alerta)
        }
      }

      // Dispara notificações nativas apenas se habilitado e há novas
      if (notificacoesHabilitadas && novasNotificacoes.length > 0) {
        for (const alerta of novasNotificacoes) {
          const notifId = nativeNotif.gerarIdNotificacao(alerta.tipo, alerta.referencia_uuid)
          await nativeNotif.agendar({
            id: notifId,
            titulo: alerta.titulo,
            descricao: alerta.descricao,
            nivel: alerta.nivel,
            modulo: alerta.modulo,
            referencia_uuid: alerta.referencia_uuid,
          })
        }
      }

      // Remover notificações cujos alertas fonte não existem mais (resolução automática)
      const keysAtuais = new Set(alertasAtuais.map(a => `${a.tipo}::${a.referencia_uuid || ''}`))
      for (const [key, notif] of existentesMap) {
        if (!keysAtuais.has(key) && !notif.lida) {
          await notificacaoService.excluir(notif.uuid)
          // Cancela notificação nativa correspondente
          const notifId = nativeNotif.gerarIdNotificacao(notif.tipo, notif.referencia_uuid)
          await nativeNotif.cancelar(notifId)
        }
      }

      // Recarregar após sincronização
      await carregar()
    } catch (e) {
      // Erros de sincronização são silenciosos — não quebra a UI
      console.warn('Erro ao sincronizar notificações:', e)
    } finally {
      sincronizandoRef.current = false
    }
  }, [propriedadeId, usuarioUuid, carregar, notificacoesHabilitadas])

  // Auto-sincronização periódica (a cada 5 min) + no app start
  useEffect(() => {
    if (!propriedadeId) return
    const timer = setTimeout(() => {
      sincronizar().catch(() => {})
    }, 2000)
    const interval = setInterval(() => {
      sincronizar().catch(() => {})
    }, SYNC_INTERVAL_MS)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propriedadeId])

  async function marcarComoLida(uuid) {
    await notificacaoService.marcarComoLida(uuid)
    await carregar()
  }

  async function marcarTodasComoLidas() {
    await notificacaoService.marcarTodasComoLidas(propriedadeId)
    await carregar()
  }

  async function excluir(uuid) {
    await notificacaoService.excluir(uuid)
    await carregar()
  }

  const naoLidas = notificacoes.filter(n => !n.lida)

  const toggleNotificacoes = useCallback(async (habilitar) => {
    setNotificacoesHabilitadas(habilitar)
    const { salvarConfigUsuario } = await import('../services/sqlite/queries')
    await salvarConfigUsuario(usuarioUuid, 'notificacoes_habilitadas', String(habilitar))
    if (habilitar) {
      await nativeNotif.solicitarPermissao()
      // Re-dispara notificações nativas para alertas não lidos existentes
      const naoLidas = notificacoes.filter(n => !n.lida)
      for (const n of naoLidas) {
        const notifId = nativeNotif.gerarIdNotificacao(n.tipo, n.referencia_uuid)
        await nativeNotif.agendar({
          id: notifId,
          titulo: n.titulo,
          descricao: n.descricao,
          nivel: n.nivel,
          modulo: n.modulo,
          referencia_uuid: n.referencia_uuid,
        })
      }
    } else {
      // Cancela todas as notificações nativas ao desabilitar
      await nativeNotif.cancelarTodas()
    }
  }, [usuarioUuid, notificacoes])

  return {
    notificacoes,
    naoLidas,
    countNaoLidas,
    carregando,
    erro,
    sincronizar,
    marcarComoLida,
    marcarTodasComoLidas,
    excluir,
    recarregar: carregar,
    notificacoesHabilitadas,
    toggleNotificacoes,
  }
}

// Coleta alertas de todos os módulos e retorna formato unificado
async function coletarAlertas(propriedadeId) {
  const lista = []
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  // ── 1. Vacinas (vencidas, hoje, próximas) ──
  try {
    const vacinas = await vacinaService.listarVacinasPropriedade(propriedadeId)
    for (const v of vacinas) {
      if (!v.proxima_dose) continue
      const data = new Date(v.proxima_dose + 'T00:00:00')
      const diff = Math.ceil((data - hoje) / (1000 * 60 * 60 * 24))

      if (diff < 0) {
        lista.push({
          tipo: 'vacina_vencida',
          titulo: `Vacina vencida: ${v.nome_vacina}`,
          descricao: `${v.nome_animal || 'Animal'} — vencida há ${Math.abs(diff)} dia(s)`,
          nivel: 'danger',
          modulo: 'vacinas',
          referencia_uuid: v.uuid,
        })
      } else if (diff === 0) {
        lista.push({
          tipo: 'vacina_hoje',
          titulo: `Vacina vence hoje: ${v.nome_vacina}`,
          descricao: `${v.nome_animal || 'Animal'} — aplicação prevista para hoje`,
          nivel: 'danger',
          modulo: 'vacinas',
          referencia_uuid: v.uuid,
        })
      } else if (diff <= 7) {
        lista.push({
          tipo: 'vacina_proxima',
          titulo: `Vacina próxima: ${v.nome_vacina}`,
          descricao: `${v.nome_animal || 'Animal'} — vence em ${diff} dia(s)`,
          nivel: 'warning',
          modulo: 'vacinas',
          referencia_uuid: v.uuid,
        })
      }
    }
  } catch { /* ignore */ }

  // ── 2. Reprodução (partos próximos e atrasados) ──
  try {
    const gestantes = await reproducaoService.listarGestantes(propriedadeId)
    for (const g of gestantes) {
      if (!g.data_previa_parto) continue
      const dataParto = new Date(g.data_previa_parto + 'T00:00:00')
      const diff = Math.ceil((dataParto - hoje) / (1000 * 60 * 60 * 24))

      if (diff < 0) {
        lista.push({
          tipo: 'parto_atrasado',
          titulo: `Parto atrasado: ${g.nome_animal || 'Animal'}`,
          descricao: `Previsto há ${Math.abs(diff)} dia(s) — possível aborto`,
          nivel: 'danger',
          modulo: 'reproducao',
          referencia_uuid: g.uuid,
        })
      } else if (diff <= 30) {
        lista.push({
          tipo: 'parto_proximo',
          titulo: `Parto próximo: ${g.nome_animal || 'Animal'}`,
          descricao: `Previsto em ${diff} dia(s)`,
          nivel: 'warning',
          modulo: 'reproducao',
          referencia_uuid: g.uuid,
        })
      }
    }
  } catch { /* ignore */ }

  // ── 3. Medicamentos (carência) ──
  try {
    const medicamentos = await sqliteQueries.listarMedicamentosPropriedade(propriedadeId)
    for (const m of medicamentos) {
      if (!m.data_liberacao) continue
      const dataLib = new Date(m.data_liberacao + 'T00:00:00')
      const diff = Math.ceil((dataLib - hoje) / (1000 * 60 * 60 * 24))

      if (diff < 0) {
        lista.push({
          tipo: 'carencia_liberada',
          titulo: `Carência liberada: ${m.produto}`,
          descricao: `${m.nome_animal || 'Animal'} — liberado há ${Math.abs(diff)} dia(s)`,
          nivel: 'info',
          modulo: 'medicamentos',
          referencia_uuid: m.uuid,
        })
      } else if (diff <= 7) {
        lista.push({
          tipo: 'carencia_proxima',
          titulo: `Em carência: ${m.produto}`,
          descricao: `${m.nome_animal || 'Animal'} — libera em ${diff} dia(s)`,
          nivel: 'warning',
          modulo: 'medicamentos',
          referencia_uuid: m.uuid,
        })
      }
    }
  } catch { /* ignore */ }

  // ── 4. Produção de Leite (quedas bruscas) ──
  try {
    const alertasLeite = await producaoLeiteService.alertasQuedaLeite(propriedadeId)
    for (const a of alertasLeite) {
      const pior = Math.min(a.variacao_dia_dia ?? 0, a.variacao_7d ?? 0)
      let severidade = 'moderada'
      let nivel = 'warning'
      if (pior <= -50) { severidade = 'critica'; nivel = 'danger' }
      else if (pior <= -30) { severidade = 'severa'; nivel = 'danger' }

      lista.push({
        tipo: `queda_leite_${severidade}`,
        titulo: `Queda de produção (${severidade}): ${a.nome}`,
        descricao: `Variação dia-a-dia: ${a.variacao_dia_dia != null ? a.variacao_dia_dia.toFixed(1) : '—'}%`, // eslint-disable-line eqeqeq
        nivel,
        modulo: 'leite',
        referencia_uuid: a.uuid,
      })
    }
  } catch { /* ignore */ }

  // ── 5. Corte (perda, estagnação, pronto abate) ──
  try {
    const alertasCorte = await pesagemService.alertasCortePropriedade(propriedadeId)
    for (const a of alertasCorte) {
      const labels = {
        perda: 'Perda de peso',
        estagnacao: 'Estagnação',
        pronto_abate: 'Pronto para abate',
      }
      const niveis = {
        perda: 'danger',
        estagnacao: 'warning',
        pronto_abate: 'info',
      }

      lista.push({
        tipo: `corte_${a.tipo_alerta}`,
        titulo: `${labels[a.tipo_alerta] || a.tipo_alerta}: ${a.nome}`,
        descricao: `GMD: ${a.gmd != null ? a.gmd.toFixed(3) : '—'} kg/dia`, // eslint-disable-line eqeqeq
        nivel: niveis[a.tipo_alerta] || 'warning',
        modulo: 'corte',
        referencia_uuid: a.uuid,
      })
    }
  } catch { /* ignore */ }

  // Ordenar por urgência
  const ordem = { danger: 0, warning: 1, info: 2 }
  lista.sort((a, b) => (ordem[a.nivel] ?? 3) - (ordem[b.nivel] ?? 3))

  return lista
}
