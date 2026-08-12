import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  deleteUser,
} from 'firebase/auth'
import { auth } from '../services/firebase/config'
import { traduzirErroAuth } from '../services/erroresFirebase'
import { sincronizarAgora } from '../services/sync/orchestrator'
import * as usuarioService from '../services/usuarioService'
import { obterMeta, definirMeta, buscarUsuarioPorUuid } from '../services/sqlite/queries'

// Chaves de sessão persistidas em `_sync_meta` (SQLite local). Permitem
// hidratar o usuário no boot do app antes do Firebase responder, viabilizando
// acesso offline após login prévio. `auth_session_uuid` guarda o uuid do
// último usuário logado; `auth_session_ativa` é flag 1/0.
const SESSAO_KEY_UUID  = 'auth_session_uuid'
const SESSAO_KEY_ATIVA = 'auth_session_ativa'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  /**
   * Bug #1: guarda de race entre o listener `onAuthStateChanged` e o fluxo
   * explícito de `cadastrar`/`login`. Quando estamos criando local state a
   * partir de um desses fluxos, o listener também dispara — se ambos rodarem
   * em paralelo, dois `espelharUsuarioLocal` competem.
   *
   * `syncingRef.current` fica true durante a chamada síncrona — e o listener
   * pula sua execução. Como `useRef`, é seguro contra stale closures.
   */
  const syncingRef = useRef(false)

  /**
   * Sessão local ativa? Usada pelo listener onAuthStateChanged para decidir
   * se um `null` do Firebase significa "usuário deslogado" (online) ou
   * "Firebase indisponível offline + sessão local prévia" (mantém logado).
   * Inicia null e é setada pela hidratação local do mount.
   */
  const sessaoLocalAtivaRef = useRef(false)

  /**
   * Marca a sessão local como ativa em `_sync_meta`. Persiste o uuid do
   * usuário que acabou de logar/cadastrar, para hidratar o boot offline.
   * Tolerante a falhas de SQLite (não bloqueia o login se o storage falhar).
   */
  const persistirSessaoLocal = useCallback(async (uuid) => {
    if (!uuid) return
    try {
      await definirMeta(SESSAO_KEY_UUID, uuid)
      await definirMeta(SESSAO_KEY_ATIVA, '1')
      sessaoLocalAtivaRef.current = true
    } catch (e) {
      console.warn('[AuthContext] Falha ao persistir sessão local:', e)
    }
  }, [])

  /**
   * Limpa a flag de sessão local ativa. Usado em `logout` e em eventos
   * explícitos de desautenticação vinda do Firebase quando online.
   */
  const limparSessaoLocal = useCallback(async () => {
    sessaoLocalAtivaRef.current = false
    try {
      await definirMeta(SESSAO_KEY_ATIVA, '0')
      await definirMeta(SESSAO_KEY_UUID, '')
    } catch (e) {
      console.warn('[AuthContext] Falha ao limpar sessão local:', e)
    }
  }, [])

  /**
   * Hidrata `usuario` a partir do SQLite no boot do app — precede a resposta
   * do `onAuthStateChanged`, permitindo acesso offline imediato a quem já
   * logou antes. Retorna `true` se conseguiu hidratar, `false` caso contrário.
   * Em falha de SQLite, retorna false silenciosamente (fluxo Firebase continua).
   */
  const hidratarSessaoLocal = useCallback(async () => {
    try {
      const ativa = await obterMeta(SESSAO_KEY_ATIVA)
      const uuid = await obterMeta(SESSAO_KEY_UUID)
      if (ativa !== '1' || !uuid) return false

      const local = await buscarUsuarioPorUuid(uuid)
      if (!local) {
        // Usuário foi removido do SQLite local (reset do app). Limpa a flag.
        await limparSessaoLocal()
        return false
      }
      // Normaliza shape igual a usuarioService.buscarUsuarioPorFirebaseUid.
      const normalizado = {
        uuid: local.uuid,
        firebase_uid: local.firebase_uid || null,
        nome: local.nome || null,
        email: local.email || null,
        telefone: local.telefone || null,
        foto_url: local.foto_url || null,
        cargo: local.cargo || 'membro',
        created_at: local.created_at,
        updated_at: local.updated_at,
      }
      setUsuario(normalizado)
      sessaoLocalAtivaRef.current = true
      return true
    } catch (e) {
      console.warn('[AuthContext] Falha ao hidratar sessão local:', e)
      return false
    }
  }, [limparSessaoLocal])

  const espelharUsuarioLocal = useCallback(async (firebaseUser, signupExtras = null) => {
    const existente = await usuarioService.buscarUsuarioPorFirebaseUid(firebaseUser.uid)
    const initialPhone = signupExtras?.telefone ?? firebaseUser.phoneNumber ?? null
    const initialCpf   = signupExtras?.cpf ?? null

    if (existente) {
      // phone/cpf: preservar SQLite se já existe; usar initialPhone só na primeira criação
      const phoneFinal = existente.telefone ?? initialPhone
      // Para `cpf` só atualizamos se houver algo novo E o SQLite não tiver — evita sobrescrever.
      const cpfFinal = existente.cpf ?? initialCpf
      if (phoneFinal !== existente.telefone || cpfFinal !== existente.cpf) {
        try {
          await usuarioService.editarUsuario(existente.uuid, {
            telefone: phoneFinal,
            cpf: cpfFinal,
          })
        } catch (e) {
          console.warn('[AuthContext] Falha ao mesclar telefone/cpf:', e)
        }
        return {
          ...existente,
          telefone: phoneFinal,
          cpf: cpfFinal,
          email: existente.email ?? firebaseUser.email,
        }
      }
      return existente
    }

    const uuid = `fbu_${firebaseUser.uid}`
    const novo = {
      uuid,
      firebase_uid: firebaseUser.uid,
      nome: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'Usuário',
      email: firebaseUser.email,
      telefone: initialPhone,
      foto_url: firebaseUser.photoURL ?? null,
      cpf: initialCpf,
      cargo: 'membro',
    }
    try {
      const criado = await usuarioService.criarUsuario(novo)
      return criado ?? novo
    } catch (e) {
      console.warn('[AuthContext] Falha ao criar usuário local — usando dados em memória:', e)
      return novo
    }
  }, [])

  /**
   * Sessão persiste via SDK Firebase (`browserLocalPersistence` em
   * `services/firebase/config.js`). Aqui escutamos o estado e, adicionalmente,
   * hidratamos do SQLite local **antes** do Firebase responder — viabilizando
   * acesso offline a quem já logou em boot anterior.
   *
   * Regra de decisão no listener:
   *   - Firebase traz usuário             → espelha normal (online/retornando).
   *   - Firebase traz null + offline + sessão local ativa → mantém local
   *     (não expulsa o usuário porque a rede caiu).
   *   - Firebase traz null + online + sessão local ativa → desloga normalmente
   *     (significa que signOut foi chamado em outro lugar ou token expirou).
   *   - Firebase traz null + sem sessão local → deslogado de fato.
   */
  useEffect(() => {
    let cancelado = false
    const inicializarCleanupRef = { current: null }

    async function inicializar() {
      // Hidratação local first — não bloqueia o listener Firebase.
      const hidratou = await hidratarSessaoLocal()
      // Se conseguiu hidratar mas esse boot efetivamente não tem sessão no
      // Firebase (off-line), `carregando` já pode ir para false para liberar
      // a navegação; o listener confirmará logo que a rede voltar.
      if (hidratou) {
        if (!cancelado) setCarregando(false)
      }

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (cancelado) return
        try {
          if (firebaseUser) {
            // Bug #1: pula se um fluxo explícito de cadastrar/login já está sincronizando
            if (syncingRef.current) return
            const local = await espelharUsuarioLocal(firebaseUser)
            setUsuario(local)
            // Persistir sessão local para próximo boot offline.
            await persistirSessaoLocal(local?.uuid)

            // Sync automático no login (decision ratificada 05/08):
            // pull traz mudanças remotas; push envia alterações locais.
            // Fire-and-forget — não bloqueia navegação, SyncIndicator
            // mostra progresso no header global.
            if (navigator.onLine) {
              sincronizarAgora()
                .then(() => console.log('[AuthContext] Sync automática OK'))
                .catch(err => console.warn('[AuthContext] Sync automática falhou:', err))
            }
          } else {
            // Firebase sem usuário. Decide entre "offline com sessão local"
            // (mantém) e "realmente deslogado" (limpa).
            const offline = !navigator.onLine
            if (offline && sessaoLocalAtivaRef.current) {
              // Mantém o usuário hidratado localmente; só sinaliza fim do load.
              return
            }
            // Online sem sessão Firebase OU sem sessão local: desloga de fato.
            setUsuario(null)
            await limparSessaoLocal()
          }
        } finally {
          if (!cancelado) setCarregando(false)
        }
      })

      // Cleanup guard: permite o return do useEffect acessar o unsubscribe.
      inicializarCleanupRef.current = unsubscribe
    }

    inicializar()

    return () => {
      cancelado = true
      if (inicializarCleanupRef.current) inicializarCleanupRef.current()
    }
  }, [espelharUsuarioLocal, hidratarSessaoLocal, persistirSessaoLocal, limparSessaoLocal])

  const login = useCallback(async (email, senha) => {
    try {
      syncingRef.current = true
      const cred = await signInWithEmailAndPassword(auth, email, senha)
      const local = await espelharUsuarioLocal(cred.user)
      setUsuario(local)
      await persistirSessaoLocal(local?.uuid)
      return local
    } catch (err) {
      throw new Error(traduzirErroAuth(err))
    } finally {
      syncingRef.current = false
    }
  }, [espelharUsuarioLocal, persistirSessaoLocal])

  /**
   * Cadastro via Firebase Auth + espelho local.
   * Aceita objeto `{ nome, email, telefone, senha, cpf }` (cpf opcional).
   *
   * Bug #5: se Firebase Auth cria conta mas SQLite falha ao espelhar, tenta
   * `signOut + deleteUser` para rollback. Se deleteUser falhar (conta > 5min),
   * propaga uma mensagem clara para a UI entender que a conta existe.
   */
  const cadastrar = useCallback(async ({ nome, email, telefone, senha, cpf }) => {
    let cred
    try {
      cred = await createUserWithEmailAndPassword(auth, email, senha)
    } catch (err) {
      throw new Error(traduzirErroAuth(err))
    }

    try {
      if (nome) {
        await updateProfile(cred.user, { displayName: nome })
      }
      syncingRef.current = true
      const local = await espelharUsuarioLocal(
        { ...cred.user, displayName: nome },
        { telefone, cpf },
      )
      setUsuario(local)
      await persistirSessaoLocal(local?.uuid)
      return local
    } catch (mirrorErr) {
      // Bug #5: tentar rollback da conta Firebase para não deixar usuário parcial
      console.warn('[AuthContext] Falha no espelho local — tentando rollback Firebase:', mirrorErr)
      try {
        await signOut(auth)
        await deleteUser(cred.user)
      } catch (rollbackErr) {
        console.error('[AuthContext] Rollback falhou — conta Firebase permanece:', rollbackErr)
        throw new Error(
          'Conta criada no servidor, mas erro local. Tente fazer login e/ou contate o suporte.',
        )
      }
      throw new Error(traduzirErroAuth(mirrorErr) || 'Erro de sincronização local. Tente novamente.')
    } finally {
      syncingRef.current = false
    }
  }, [espelharUsuarioLocal, persistirSessaoLocal])

  const logout = useCallback(async () => {
    // Limpa a sessão local FIRST: quando signOut disparar onAuthStateChanged
    // com null, o listener saberá que precisa deslogar de fato (em vez de
    // manter "offline com sessão local ativa").
    await limparSessaoLocal()
    try {
      await signOut(auth)
    } catch (e) {
      console.warn('[AuthContext] signOut Firebase falhou:', e)
    }
    setUsuario(null)
  }, [limparSessaoLocal])

  const atualizarPerfil = useCallback(async (dados) => {
    let atualizado
    setUsuario(prev => {
      atualizado = { ...prev, ...dados }
      return atualizado
    })
    try {
      if (atualizado?.uuid) {
        await usuarioService.editarUsuario(atualizado.uuid, dados)
      }
    } catch (e) {
      console.warn('[AuthContext] Falha ao persistir perfil em SQLite:', e)
    }
    return atualizado
  }, [])

  return (
    <AuthContext.Provider value={{
      usuario,
      carregando,
      autenticado: !!usuario,
      login,
      cadastrar,
      logout,
      atualizarPerfil,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}
