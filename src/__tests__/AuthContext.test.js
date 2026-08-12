import { renderHook, waitFor, act } from '@testing-library/react'

// Estado compartilhado em module-scope. Prefixados com "mock" para que
// `jest.mock()` factories possam referenciá-los (regra do Jest).
const mockAuthCallbacks = new Set()
const metaStore = {}
const usuariosByUuid = {}
const usuariosByFirebaseUid = {}

function mockEmitAuthState(firebaseUser) {
  // Coleta promises resultantes para permitir await no teste.
  const promises = []
  for (const cb of mockAuthCallbacks) {
    try {
      const r = cb(firebaseUser)
      if (r && typeof r.then === 'function') promises.push(r)
    } catch { /* ignore */ }
  }
  return Promise.all(promises)
}

// Espera o listener onAuthStateChanged ser registrado pelo AuthContext
// (a hidratação local no mount é async — precisa aguardar antes de emitir).
async function waitForAuthListener() {
  await waitFor(() => {
    if (mockAuthCallbacks.size === 0) throw new Error('listener ainda não registrado')
  })
}

// Helper combinado: espera listener registering + emite + aguarda estabilizar.
async function emitirAuth(resultRef, firebaseUser) {
  await waitForAuthListener()
  await act(async () => { await mockEmitAuthState(firebaseUser) })
}

jest.mock('../services/firebase/config', () => ({
  __esModule: true,
  auth: {},
  default: {},
}))

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
  signOut: jest.fn(),
  deleteUser: jest.fn(),
  onAuthStateChanged: jest.fn((_auth, cb) => {
    // NÃO emite estado inicial automaticamente — cada teste dispara manualmente
    // via mockEmitAuthState para simular Firebase online/offline preciso.
    mockAuthCallbacks.add(cb)
    return () => mockAuthCallbacks.delete(cb)
  }),
}))

jest.mock('../services/erroresFirebase', () => ({
  traduzirErroAuth: jest.fn(e => e?.message || 'Erro'),
}))

jest.mock('../services/sync/orchestrator', () => ({
  sincronizarAgora: jest.fn(),
}))

jest.mock('../services/sqlite/queries', () => ({
  obterMeta: jest.fn(key => metaStore[key] ?? null),
  definirMeta: jest.fn((key, value) => { metaStore[key] = String(value) }),
  buscarUsuarioPorUuid: jest.fn(uuid => usuariosByUuid[uuid] ?? null),
  buscarUsuario: jest.fn(firebaseUid => usuariosByFirebaseUid[firebaseUid] ?? null),
  inserirUsuario: jest.fn(dados => {
    const uuid = dados.uuid || `u_${Date.now()}`
    usuariosByUuid[uuid] = { ...dados, uuid }
    usuariosByFirebaseUid[dados.firebase_uid] = usuariosByUuid[uuid]
    return uuid
  }),
  atualizarUsuario: jest.fn(() => {}),
  buscarUsuarioPorFirebaseUid: jest.fn(firebaseUid => usuariosByFirebaseUid[firebaseUid] ?? null),
}))

jest.mock('../services/usuarioService', () => ({
  buscarUsuarioPorFirebaseUid: jest.fn(firebaseUid => usuariosByFirebaseUid[firebaseUid] ?? null),
  criarUsuario: jest.fn(async dados => {
    const uuid = dados.uuid || `u_${Date.now()}`
    usuariosByUuid[uuid] = { ...dados, uuid }
    usuariosByFirebaseUid[dados.firebase_uid] = usuariosByUuid[uuid]
    return usuariosByUuid[uuid]
  }),
  editarUsuario: jest.fn(),
}))

import { useAuth, AuthProvider } from '../contexts/AuthContext'
import { traduzirErroAuth } from '../services/erroresFirebase'
import { sincronizarAgora } from '../services/sync/orchestrator'
import * as firebaseAuth from 'firebase/auth'

beforeEach(() => {
  for (const k of Object.keys(metaStore)) delete metaStore[k]
  for (const k of Object.keys(usuariosByUuid)) delete usuariosByUuid[k]
  for (const k of Object.keys(usuariosByFirebaseUid)) delete usuariosByFirebaseUid[k]
  mockAuthCallbacks.clear()
  jest.clearAllMocks()
  // Reseta navigator.onLine para true por padrão.
  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    value: true,
  })
})

function renderAuth() {
  return renderHook(() => useAuth(), { wrapper: AuthProvider })
}

describe('AuthContext — hidratação local (lembrar login)', () => {
  test('hidrata usuario do SQLite no boot se sessão local ativa', async () => {
    usuariosByUuid['u_1'] = {
      uuid: 'u_1', firebase_uid: 'fb_1',
      nome: 'Mário', email: 'mario@x.com',
      telefone: '119', foto_url: null, cpf: null, cargo: 'dono',
      created_at: '2026-01-01', updated_at: '2026-01-01',
    }
    metaStore['auth_session_uuid'] = 'u_1'
    metaStore['auth_session_ativa'] = '1'

    const { result } = renderAuth()

    await waitFor(() => expect(result.current.carregando).toBe(false))

    expect(result.current.autenticado).toBe(true)
    expect(result.current.usuario).toMatchObject({
      uuid: 'u_1',
      nome: 'Mário',
      email: 'mario@x.com',
    })
  })

  test('não hidrata se sessão local marcada como inativa', async () => {
    usuariosByUuid['u_1'] = { uuid: 'u_1', nome: 'X' }
    metaStore['auth_session_uuid'] = 'u_1'
    metaStore['auth_session_ativa'] = '0'

    const { result } = renderAuth()

    // Firebase diz: sem usuário (online). Deve deslogar.
    await emitirAuth(result, null)
    await waitFor(() => expect(result.current.carregando).toBe(false))

    expect(result.current.autenticado).toBe(false)
    expect(result.current.usuario).toBe(null)
  })

  test('não hidrata se uuid da sessão ausente mesmo com flag ativa', async () => {
    metaStore['auth_session_ativa'] = '1'
    // auth_session_uuid ausente.

    const { result } = renderAuth()
    await emitirAuth(result, null)
    await waitFor(() => expect(result.current.carregando).toBe(false))

    expect(result.current.autenticado).toBe(false)
  })

  test('limpa sessão local se uuid aponta para usuário inexistente', async () => {
    metaStore['auth_session_uuid'] = 'u_fantasma'
    metaStore['auth_session_ativa'] = '1'

    const { result } = renderAuth()
    await emitirAuth(result, null)
    await waitFor(() => expect(result.current.carregando).toBe(false))

    expect(metaStore['auth_session_ativa']).toBe('0')
    expect(metaStore['auth_session_uuid']).toBe('')
    expect(result.current.autenticado).toBe(false)
  })
})

describe('AuthContext — persistência em login/cadastrar', () => {
  test('login persiste sessão local e seta usuario', async () => {
    const firebaseUser = { uid: 'fb_1', email: 'm@x.com', displayName: 'M' }
    firebaseAuth.signInWithEmailAndPassword.mockResolvedValue({ user: firebaseUser })

    const { result } = renderAuth()
    await emitirAuth(result, null)

    await act(async () => {
      await result.current.login('m@x.com', '123456')
    })

    expect(metaStore['auth_session_ativa']).toBe('1')
    expect(metaStore['auth_session_uuid']).toBeTruthy()
    expect(result.current.autenticado).toBe(true)
    expect(result.current.usuario).toMatchObject({ email: 'm@x.com' })
  })

  test('cadastrar persiste sessão local', async () => {
    const firebaseUser = { uid: 'fb_2', email: 'n@x.com' }
    firebaseAuth.createUserWithEmailAndPassword.mockResolvedValue({ user: firebaseUser })
    firebaseAuth.updateProfile.mockResolvedValue(undefined)

    const { result } = renderAuth()
    await emitirAuth(result, null)

    await act(async () => {
      await result.current.cadastrar({ nome: 'NoVo', email: 'n@x.com', senha: '123456' })
    })

    expect(result.current.autenticado).toBe(true)
    expect(metaStore['auth_session_ativa']).toBe('1')
    expect(metaStore['auth_session_uuid']).toBeTruthy()
  })
})

describe('AuthContext — acesso offline', () => {
  test('Firebase null + offline + sessão local ativa → mantém logado', async () => {
    usuariosByUuid['u_1'] = {
      uuid: 'u_1', firebase_uid: 'fb_1',
      nome: 'Offline User', email: 'o@x.com',
      telefone: null, foto_url: null, cpf: null, cargo: 'membro',
      created_at: '2026-01-01', updated_at: '2026-01-01',
    }
    metaStore['auth_session_uuid'] = 'u_1'
    metaStore['auth_session_ativa'] = '1'

    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })

    const { result } = renderAuth()
    await waitFor(() => expect(result.current.carregando).toBe(false))

    // Dispara null depois de carregado (simula Firebase offline).
    await emitirAuth(result, null)

    expect(result.current.autenticado).toBe(true)
    expect(result.current.usuario).toMatchObject({ uuid: 'u_1' })
    expect(metaStore['auth_session_ativa']).toBe('1')
  })

  test('Firebase null + online + sem sessão local → desloga', async () => {
    const { result } = renderAuth()
    await emitirAuth(result, null)
    await waitFor(() => expect(result.current.carregando).toBe(false))

    expect(result.current.autenticado).toBe(false)
  })

  test('Firebase traz usuário online → sincroniza e persiste sessão', async () => {
    const firebaseUser = { uid: 'fb_3', email: 'z@x.com', displayName: 'Z' }
    sincronizarAgora.mockResolvedValue(undefined)

    const { result } = renderAuth()
    await emitirAuth(result, firebaseUser)
    await waitFor(() => expect(result.current.autenticado).toBe(true))

    expect(sincronizarAgora).toHaveBeenCalled()
    expect(metaStore['auth_session_ativa']).toBe('1')
    expect(result.current.usuario).toMatchObject({ email: 'z@x.com' })
  })
})

describe('AuthContext — logout limpa sessão local', () => {
  test('logout remove flag e signOut do Firebase', async () => {
    firebaseAuth.signOut.mockResolvedValue(undefined)
    usuariosByUuid['u_1'] = {
      uuid: 'u_1', firebase_uid: 'fb_1',
      nome: 'A', email: 'a@x',
      telefone: null, foto_url: null, cpf: null, cargo: 'dono',
      created_at: '2026-01-01', updated_at: '2026-01-01',
    }
    metaStore['auth_session_uuid'] = 'u_1'
    metaStore['auth_session_ativa'] = '1'

    const { result } = renderAuth()
    await waitFor(() => expect(result.current.carregando).toBe(false))

    expect(result.current.autenticado).toBe(true)

    await act(async () => {
      await result.current.logout()
    })

    expect(firebaseAuth.signOut).toHaveBeenCalled()
    expect(result.current.autenticado).toBe(false)
    expect(metaStore['auth_session_ativa']).toBe('0')
    expect(metaStore['auth_session_uuid']).toBe('')
  })

  test('erro no signOut não bloqueia logout local', async () => {
    firebaseAuth.signOut.mockRejectedValue(new Error('Network error'))
    usuariosByUuid['u_1'] = {
      uuid: 'u_1', firebase_uid: 'fb_1',
      nome: 'B', email: 'b@x',
      telefone: null, foto_url: null, cpf: null, cargo: 'membro',
      created_at: '2026-01-01', updated_at: '2026-01-01',
    }
    metaStore['auth_session_uuid'] = 'u_1'
    metaStore['auth_session_ativa'] = '1'

    const { result } = renderAuth()
    await waitFor(() => expect(result.current.carregando).toBe(false))

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.autenticado).toBe(false)
    expect(metaStore['auth_session_ativa']).toBe('0')
  })
})

describe('AuthContext — erros de login propagam mensagem traduzida', () => {
  test('login com falha lança Error com tradução', async () => {
    firebaseAuth.signInWithEmailAndPassword.mockRejectedValue(new Error('auth/invalid-credential'))
    traduzirErroAuth.mockReturnValue('E-mail ou senha inválidos')

    const { result } = renderAuth()
    await emitirAuth(result, null)

    await expect(act(async () => {
      await result.current.login('x@x.com', 'wrong')
    })).rejects.toThrow('E-mail ou senha inválidos')
  })
})
