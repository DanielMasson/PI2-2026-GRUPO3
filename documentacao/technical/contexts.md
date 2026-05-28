# Contexts Globais

> Contexts do React que gerenciam estado global no **Propriedade Inteligente**.
> 4 contexts: Auth, Propriedade, Sync e Offline.

---

## 1. Estrutura de Arquivos

```text
src/contexts/
├── AuthContext.jsx          # Autenticação e dados do usuário
├── PropriedadeContext.jsx   # Propriedade atual e permissões
├── SyncContext.jsx          # Estado de sincronização
└── OfflineContext.jsx       # Status de conexão
```

---

## 2. AuthContext

### Responsabilidade
- Estado de autenticação (logado/deslogado)
- Dados do usuário logado
- Funções de login, cadastro, logout, recuperação de senha

### Valor do Context

```javascript
const AuthContextValue = {
  // Estado
  usuario: null,            // { uuid, firebase_uid, nome, email, cargo, foto_url }
  carregando: true,         // true enquanto verifica sessão
  autenticado: false,       // true se logado

  // Funções
  login: async (email, senha) => {},
  cadastrar: async (nome, email, telefone, senha) => {},
  logout: async () => {},
  recuperarSenha: async (email) => {},
  atualizarPerfil: async (dados) => {},
}
```

### Implementação

```jsx
// contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { auth } from '../services/firebase/config'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth'
import * as usuarioService from '../services/usuarioService'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Buscar dados do usuário no SQLite local
        const dadosLocal = await usuarioService.buscarUsuario(firebaseUser.uid)
        setUsuario({
          uuid: firebaseUser.uid,
          firebase_uid: firebaseUser.uid,
          email: firebaseUser.email,
          nome: dadosLocal?.nome || firebaseUser.displayName,
          cargo: dadosLocal?.cargo || 'dono',
          foto_url: dadosLocal?.foto_url || null,
        })
      } else {
        setUsuario(null)
      }
      setCarregando(false)
    })
    return unsubscribe
  }, [])

  async function login(email, senha) {
    const cred = await signInWithEmailAndPassword(auth, email, senha)
    return cred.user
  }

  async function cadastrar(nome, email, telefone, senha) {
    const cred = await createUserWithEmailAndPassword(auth, email, senha)
    await updateProfile(cred.user, { displayName: nome })
    await usuarioService.criarUsuario({
      firebase_uid: cred.user.uid,
      nome,
      email,
      telefone,
    })
    return cred.user
  }

  async function logout() {
    await signOut(auth)
    setUsuario(null)
  }

  async function recuperarSenha(email) {
    await sendPasswordResetEmail(auth, email)
  }

  async function atualizarPerfil(dados) {
    if (dados.nome) await updateProfile(auth.currentUser, { displayName: dados.nome })
    await usuarioService.atualizarUsuario(usuario.uuid, dados)
    setUsuario(prev => ({ ...prev, ...dados }))
  }

  return (
    <AuthContext.Provider value={{
      usuario,
      carregando,
      autenticado: !!usuario,
      login,
      cadastrar,
      logout,
      recuperarSenha,
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
```

---

## 3. PropriedadeContext

### Responsabilidade
- Propriedade atualmente acessada
- Permissão do usuário na propriedade (dono/peão)
- Dados resumidos da propriedade

### Valor do Context

```javascript
const PropriedadeContextValue = {
  // Estado
  propriedadeId: null,        // UUID da propriedade atual
  propriedade: null,          // { uuid, nome, localizacao, tamanho_ha }
  cargo: null,                // 'dono' | 'peao'
  isDono: false,
  isPeao: false,
  isMembro: false,
  carregando: true,

  // Funções
  selecionarPropriedade: async (uuid) => {},
  limparPropriedade: () => {},
}
```

### Implementação

```jsx
// contexts/PropriedadeContext.jsx
import { createContext, useContext, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import * as propriedadeService from '../services/propriedadeService'
import * as membroService from '../services/membroService'

const PropriedadeContext = createContext()

export function PropriedadeProvider({ children }) {
  const { usuario } = useAuth()
  const [propriedade, setPropriedade] = useState(null)
  const [propriedadeId, setPropriedadeId] = useState(null)
  const [cargo, setCargo] = useState(null)
  const [carregando, setCarregando] = useState(false)

  const selecionarPropriedade = useCallback(async (uuid) => {
    setCarregando(true)
    try {
      // Buscar propriedade no SQLite
      const prop = await propriedadeService.buscarPropriedade(uuid)
      setPropriedade(prop)
      setPropriedadeId(uuid)

      // Buscar cargo do usuário nesta propriedade
      const membro = await membroService.buscarMembro(uuid, usuario.uuid)
      setCargo(membro?.cargo || null)
    } finally {
      setCarregando(false)
    }
  }, [usuario])

  function limparPropriedade() {
    setPropriedade(null)
    setPropriedadeId(null)
    setCargo(null)
  }

  return (
    <PropriedadeContext.Provider value={{
      propriedadeId,
      propriedade,
      cargo,
      isDono: cargo === 'dono',
      isPeao: cargo === 'peao',
      isMembro: cargo !== null,
      carregando,
      selecionarPropriedade,
      limparPropriedade,
    }}>
      {children}
    </PropriedadeContext.Provider>
  )
}

export function usePropriedade() {
  const context = useContext(PropriedadeContext)
  if (!context) throw new Error('usePropriedade deve ser usado dentro de PropriedadeProvider')
  return context
}
```

### Uso nas telas

```jsx
function PropertyHome() {
  const { propriedadeId } = useParams()
  const { propriedade, isDono, selecionarPropriedade, carregando } = usePropriedade()

  useEffect(() => {
    selecionarPropriedade(propriedadeId)
  }, [propriedadeId])

  if (carregando) return <LoadingSpinner />
  // ...
}
```

---

## 4. SyncContext

### Responsabilidade
- Estado da sincronização (ocioso, sincronizando, erro)
- Contador de registros pendentes
- Última sincronização bem-sucedida
- Funções de sync manual

### Valor do Context

```javascript
const SyncContextValue = {
  // Estado
  status: 'ocioso',          // 'ocioso' | 'sincronizando' | 'erro'
  pendentes: 0,              // Número de registros pendentes de sync
  ultimaSync: null,          // ISO 8601 da última sync bem-sucedida
  erro: null,                // Mensagem de erro da última tentativa

  // Funções
  sincronizar: async () => {},       // Sync manual (pull + push)
  forcarSync: async () => {},        // Sync forçada
}
```

### Implementação

```jsx
// contexts/SyncContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { useOffline } from './OfflineContext'
import * as syncService from '../services/sync/syncService'

const SyncContext = createContext()

const INTERVALO_SYNC = 5 * 60 * 1000 // 5 minutos

export function SyncProvider({ children }) {
  const { autenticado } = useAuth()
  const { isOnline } = useOffline()
  const [status, setStatus] = useState('ocioso')
  const [pendentes, setPendentes] = useState(0)
  const [ultimaSync, setUltimaSync] = useState(null)
  const [erro, setErro] = useState(null)

  // Sync automática a cada 5 minutos
  useEffect(() => {
    if (!autenticado || !isOnline) return

    const intervalo = setInterval(async () => {
      await sincronizar()
    }, INTERVALO_SYNC)

    return () => clearInterval(intervalo)
  }, [autenticado, isOnline])

  // Sync ao reconectar
  useEffect(() => {
    if (isOnline && autenticado) {
      sincronizar()
    }
  }, [isOnline])

  // Contar pendentes periodicamente
  useEffect(() => {
    if (!autenticado) return
    async function contar() {
      const count = await syncService.contarPendentes()
      setPendentes(count)
    }
    contar()
    const intervalo = setInterval(contar, 30000) // a cada 30s
    return () => clearInterval(intervalo)
  }, [autenticado, status])

  const sincronizar = useCallback(async () => {
    if (status === 'sincronizando' || !isOnline) return

    setStatus('sincronizando')
    setErro(null)

    try {
      await syncService.pullDados()
      await syncService.pushPendentes()
      setUltimaSync(new Date().toISOString())
      setStatus('ocioso')
    } catch (e) {
      setErro(e.message)
      setStatus('erro')
    }
  }, [status, isOnline])

  const forcarSync = useCallback(async () => {
    await sincronizar()
  }, [sincronizar])

  return (
    <SyncContext.Provider value={{
      status,
      pendentes,
      ultimaSync,
      erro,
      sincronizar,
      forcarSync,
    }}>
      {children}
    </SyncContext.Provider>
  )
}

export function useSync() {
  const context = useContext(SyncContext)
  if (!context) throw new Error('useSync deve ser usado dentro de SyncProvider')
  return context
}
```

### Indicador na UI

```jsx
function SyncBadge() {
  const { status, pendentes, ultimaSync } = useSync()
  const { isOnline } = useOffline()

  if (!isOnline) return <span className={styles.offline}>☁️❌ Sem conexão</span>
  if (status === 'sincronizando') return <span className={styles.syncing}>☁️⏳ Sincronizando...</span>
  if (pendentes > 0) return <span className={styles.pending}>☁️📤 {pendentes} pendente(s)</span>
  return <span className={styles.synced}>☁️✅ Sincronizado</span>
}
```

---

## 5. OfflineContext

### Responsabilidade
- Status de conexão com a internet
- Listener de mudanças de conectividade
- Disponibiliza `isOnline` para todo o app

### Implementação

```jsx
// contexts/OfflineContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import NetInfo from '@react-native-community/netinfo' // ou lógica manual no Cordova

const OfflineContext = createContext()

export function OfflineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true)
  const [connectionType, setConnectionType] = useState(null)

  useEffect(() => {
    // Verificar status inicial
    async function verificarConexao() {
      try {
        // No Cordova, usar navigator.connection ou plugin de rede
        const online = navigator.onLine
        setIsOnline(online)
      } catch {
        setIsOnline(true) // Assumir online se não conseguir verificar
      }
    }
    verificarConexao()

    // Listener de mudanças
    function handleOnline() {
      setIsOnline(true)
    }
    function handleOffline() {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <OfflineContext.Provider value={{ isOnline, connectionType }}>
      {children}
    </OfflineContext.Provider>
  )
}

export function useOffline() {
  const context = useContext(OfflineContext)
  if (!context) throw new Error('useOffline deve ser usado dentro de OfflineProvider')
  return context
}
```

---

## 6. Ordem dos Providers

```jsx
// App.jsx
function App() {
  return (
    <HashRouter>
      <OfflineProvider>
        <AuthProvider>
          <SyncProvider>
            <PropriedadeProvider>
              <Routes>
                {/* rotas aqui */}
              </Routes>
            </PropriedadeProvider>
          </SyncProvider>
        </AuthProvider>
      </OfflineProvider>
    </HashRouter>
  )
}
```

### Dependências entre Providers

```text
OfflineProvider  (sem dependências)
    │
AuthProvider     (sem dependências)
    │
SyncProvider     (depende de Auth + Offline)
    │
PropriedadeProvider (depende de Auth)
```

---

## 7. Resumo

| Context              | Estado principal                  | Quando atualiza             |
|----------------------|-----------------------------------|-----------------------------|
| `AuthContext`         | Usuário logado, dados do perfil   | Login/logout/mudança de sessão |
| `PropriedadeContext`  | Propriedade atual, cargo do usuário | Seleção de propriedade     |
| `SyncContext`         | Status sync, pendentes, última sync| A cada 5 min, ao reconectar |
| `OfflineContext`      | isOnline, tipo de conexão         | Quando conexão muda         |
