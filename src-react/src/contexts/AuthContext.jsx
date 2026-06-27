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
import * as usuarioService from '../services/usuarioService'

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
   * Espelha o `firebaseUser` na tabela local `usuarios`.
   * - Se já existe, **mescla** com dados do Firebase (email/foto vem do Firebase;
   *   telefone/cpf/nome persistem do SQLite se já preenchidos).
   * - Caso contrário, cria a linha com `uuid` derivado do UID do Firebase.
   * - Em falha de SQLite (browser sem fallback), retorna object mínimo em memória.
   *
   * `signupExtras` (parâmetro opcional) carrega dados do fluxo de
   * `createUserWithEmailAndPassword` que o Firebase Auth não aceita (telefone, cpf).
   * Esses dados são persistidos no SQLite mas **não** sobrescrevem dados
   * existentes quando o user re-logar em device novo.
   */
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
   * `services/firebase/config.js`). Aqui só escutamos o estado — não
   * precisamos hidratar manualmente.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Bug #1: pula se um fluxo explícito de cadastrar/login já está sincronizando
          if (syncingRef.current) return
          const local = await espelharUsuarioLocal(firebaseUser)
          setUsuario(local)
        } else {
          setUsuario(null)
        }
      } finally {
        setCarregando(false)
      }
    })
    return unsubscribe
  }, [espelharUsuarioLocal])

  const login = useCallback(async (email, senha) => {
    try {
      syncingRef.current = true
      const cred = await signInWithEmailAndPassword(auth, email, senha)
      const local = await espelharUsuarioLocal(cred.user)
      setUsuario(local)
      return local
    } catch (err) {
      throw new Error(traduzirErroAuth(err))
    } finally {
      syncingRef.current = false
    }
  }, [espelharUsuarioLocal])

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
  }, [espelharUsuarioLocal])

  const logout = useCallback(async () => {
    await signOut(auth)
    setUsuario(null)
  }, [])

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
