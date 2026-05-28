# Controle de Acesso e Permissões

> Sistema multinível de permissões do **Propriedade Inteligente**.
> Dois níveis de acesso: **Dono** e **Peão/Tratador**, com regras no frontend e no Firestore.

---

## 1. Níveis de Acesso

| Nível            | Cargo no código | Descrição                                                  |
|------------------|-----------------|------------------------------------------------------------|
| **Dono**         | `'dono'`        | Criador da propriedade. Acesso total (CRUD completo).      |
| **Peão/Tratador**| `'peao'`        | Membro convidado. Pode criar registros e visualizar dados. |

---

## 2. Tabela de Permissões por Operação

| Operação                          | Dono | Peão  | Módulo             |
|-----------------------------------|:----:|:-----:|---------------------|
| Visualizar lista de animais       | ✅   | ✅    | Identificação       |
| Ver ficha individual              | ✅   | ✅    | Identificação       |
| Cadastrar novo animal             | ✅   | ✅    | Identificação       |
| Editar dados do animal            | ✅   | ❌    | Identificação       |
| Excluir animal (soft delete)      | ✅   | ❌    | Identificação       |
| Registrar vacina                  | ✅   | ✅    | Saúde               |
| Registrar medicamento             | ✅   | ✅    | Saúde               |
| Registrar ocorrência clínica      | ✅   | ✅    | Saúde               |
| Registrar movimentação            | ✅   | ✅    | Saúde               |
| Editar/excluir registros de saúde | ✅   | ❌    | Saúde               |
| Registrar pesagem                 | ✅   | ✅    | Desempenho          |
| Editar/excluir pesagem            | ✅   | ❌    | Desempenho          |
| Registrar reprodução              | ✅   | ✅    | Reprodutivo         |
| Editar/excluir reprodução         | ✅   | ❌    | Reprodutivo         |
| Ver financeiro do animal          | ✅   | ❌    | Financeiro          |
| Editar propriedade                | ✅   | ❌    | Propriedade         |
| Excluir propriedade               | ✅   | ❌    | Propriedade         |
| Convidar membros                  | ✅   | ❌    | Propriedade         |
| Remover membros                   | ✅   | ❌    | Propriedade         |
| Alterar configurações             | ✅   | ❌    | Configurações       |

### Resumo simplificado

```text
Dono:  Visualizar ✅ | Criar ✅ | Editar ✅ | Excluir ✅
Peão:  Visualizar ✅ | Criar ✅ | Editar ❌ | Excluir ❌
```

---

## 3. Regras de Segurança no Firestore

### 3.1. Estrutura de dados de permissão

Na coleção `propriedade/{propriedadeId}`, existe uma subcoleção `membros/`:

```text
propriedade/{propriedadeId}/
├── dono_uid: "firebase_uid_123"       // Dono original
└── membros/{membroId}
    ├── usuario_uid: "firebase_uid_456"
    ├── cargo: "peao"                  // ou "dono"
    └── convidado_por: "firebase_uid_123"
```

### 3.2. Regras Firestore (security.rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── Helper functions ──────────────────────────────────────

    // Verifica se o usuário está autenticado
    function isAuth() {
      return request.auth != null;
    }

    // Verifica se o usuário é dono da propriedade
    function isDono(propriedadeId) {
      return isAuth() &&
        exists(/databases/$(database)/documents/propriedade/$(propriedadeId)/membros/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/propriedade/$(propriedadeId)/membros/$(request.auth.uid)).data.cargo == 'dono';
    }

    // Verifica se o usuário é membro (dono ou peão) da propriedade
    function isMembro(propriedadeId) {
      return isAuth() &&
        exists(/databases/$(database)/documents/propriedade/$(propriedadeId)/membros/$(request.auth.uid));
    }

    // ── Coleção de usuários ───────────────────────────────────

    match /usuarios/{userId} {
      // Usuário só pode ler e editar seus próprios dados
      allow read, update: if isAuth() && request.auth.uid == userId;
      allow create: if isAuth();
      allow delete: if false; // Nunca deletar via cliente
    }

    // ── Coleção de propriedades ───────────────────────────────

    match /propriedade/{propriedadeId} {

      // Leitura: qualquer membro pode ver a propriedade
      allow read: if isMembro(propriedadeId);

      // Criação: qualquer usuário autenticado pode criar
      allow create: if isAuth();

      // Edição e exclusão: apenas o dono
      allow update, delete: if isDono(propriedadeId);

      // ── Subcoleção de membros ───────────────────────────────

      match /membros/{membroId} {
        // Qualquer membro pode ver a lista de membros
        allow read: if isMembro(propriedadeId);

        // Apenas o dono pode adicionar membros
        allow create: if isDono(propriedadeId);

        // Apenas o dono pode remover membros
        allow delete: if isDono(propriedadeId);

        // Ninguém edita membros via cliente (cargo não muda)
        allow update: if false;
      }

      // ── Subcoleção de animais ───────────────────────────────

      match /animais/{animalId} {
        // Qualquer membro pode ver animais
        allow read: if isMembro(propriedadeId);

        // Qualquer membro pode criar animais
        allow create: if isMembro(propriedadeId);

        // Apenas o dono pode editar e excluir animais
        allow update, delete: if isDono(propriedadeId);

        // ── Subcoleções dentro de animal ──────────────────────

        match /vacinas/{vacinaId} {
          allow read: if isMembro(propriedadeId);
          allow create: if isMembro(propriedadeId);
          allow update, delete: if isDono(propriedadeId);
        }

        match /medicamentos/{medicamentoId} {
          allow read: if isMembro(propriedadeId);
          allow create: if isMembro(propriedadeId);
          allow update, delete: if isDono(propriedadeId);
        }

        match /ocorrencias/{ocorrenciaId} {
          allow read: if isMembro(propriedadeId);
          allow create: if isMembro(propriedadeId);
          allow update, delete: if isDono(propriedadeId);
        }

        match /pesagens/{pesagemId} {
          allow read: if isMembro(propriedadeId);
          allow create: if isMembro(propriedadeId);
          allow update, delete: if isDono(propriedadeId);
        }

        match /reproducao/{reproducaoId} {
          allow read: if isMembro(propriedadeId);
          allow create: if isMembro(propriedadeId);
          allow update, delete: if isDono(propriedadeId);
        }
      }
    }
  }
}
```

---

## 4. Controle de Permissões no Frontend

### 4.1. Context de Autenticação

```jsx
// contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { auth, db } from '../services/firebase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Buscar dados do usuário no Firestore
        const doc = await db.collection('usuarios').doc(user.uid).get()
        setUsuario({
          uid: user.uid,
          email: user.email,
          ...doc.data()
        })
      } else {
        setUsuario(null)
      }
      setCarregando(false)
    })
    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ usuario, carregando }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

### 4.2. Hook de Permissões por Propriedade

```jsx
// hooks/usePermissao.js
import { useState, useEffect } from 'react'
import { db } from '../services/firebase'
import { useAuth } from '../contexts/AuthContext'

export function usePermissao(propriedadeId) {
  const { usuario } = useAuth()
  const [cargo, setCargo] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!usuario || !propriedadeId) return

    async function buscarCargo() {
      const membroDoc = await db
        .collection('propriedade')
        .doc(propriedadeId)
        .collection('membros')
        .doc(usuario.uid)
        .get()

      if (membroDoc.exists) {
        setCargo(membroDoc.data().cargo) // 'dono' ou 'peao'
      }
      setCarregando(false)
    }

    buscarCargo()
  }, [usuario, propriedadeId])

  const isDono = cargo === 'dono'
  const isPeao = cargo === 'peao'
  const isMembro = cargo !== null

  return { cargo, isDono, isPeao, isMembro, carregando }
}
```

### 4.3. Componente de Guarda de Permissão

```jsx
// components/PermissaoGuard.jsx

// Exibe children apenas se o usuário tiver o cargo necessário
function PermissaoGuard({ propriedadeId, cargoNecessario, children, fallback = null }) {
  const { cargo, carregando } = usePermissao(propriedadeId)

  if (carregando) return null

  // 'dono' tem acesso a tudo
  if (cargoNecessario === 'peao' && (cargo === 'dono' || cargo === 'peao')) {
    return children
  }

  // Acesso específico por cargo
  if (cargo === cargoNecessario) {
    return children
  }

  return fallback
}
```

### 4.4. Uso nas Telas

```jsx
// Exemplo: Ficha do Animal
function FichaAnimal({ propriedadeId, animalId }) {
  const { isDono, isPeao } = usePermissao(propriedadeId)

  return (
    <div>
      {/* Dados do animal — visível para todos */}
      <DadosAnimal animalId={animalId} />

      {/* Botões de edição — apenas para o dono */}
      {isDono && (
        <div className={styles.acoes}>
          <Button onClick={handleEditar}>Editar</Button>
          <Button variant="danger" onClick={handleExcluir}>Excluir</Button>
        </div>
      )}

      {/* Registrar vacina — dono e peão podem criar */}
      <Button onClick={handleRegistrarVacina}>Registrar Vacina</Button>

      {/* Financeiro — apenas dono */}
      <PermissaoGuard propriedadeId={propriedadeId} cargoNecessario="dono">
        <SecaoFinanceiro animalId={animalId} />
      </PermissaoGuard>
    </div>
  )
}
```

---

## 5. Fluxo de Convite de Membros

### 5.1. Dono convida um Peão

```text
Dono abre configurações da propriedade
    │
    ▼
Insere e-mail do convidado
    │
    ▼
App busca usuário no Firestore (pelo e-mail)
    │
    ├── Usuário encontrado → cria documento em membros/
    │                         cargo: 'peao'
    │
    └── Usuário não encontrado → exibe mensagem:
                                "Usuário não encontrado. Ele precisa criar uma conta primeiro."
```

### 5.2. Implementação

```javascript
async function convidarMembro(propriedadeId, emailConvidado) {
  // 1. Buscar usuário pelo e-mail
  const usuariosRef = db.collection('usuarios')
  const snapshot = await usuariosRef.where('email', '==', emailConvidado).get()

  if (snapshot.empty) {
    throw new Error('Usuário não encontrado. Ele precisa criar uma conta primeiro.')
  }

  const convidadoDoc = snapshot.docs[0]
  const convidadoUid = convidadoDoc.id

  // 2. Verificar se já é membro
  const membroDoc = await db
    .collection('propriedade')
    .doc(propriedadeId)
    .collection('membros')
    .doc(convidadoUid)
    .get()

  if (membroDoc.exists) {
    throw new Error('Este usuário já é membro desta propriedade.')
  }

  // 3. Criar vínculo como peão
  await db
    .collection('propriedade')
    .doc(propriedadeId)
    .collection('membros')
    .doc(convidadoUid)
    .set({
      usuario_uid: convidadoUid,
      cargo: 'peao',
      convidado_por: auth.currentUser.uid,
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
    })

  // 4. Salvar no SQLite local
  await dbLocal.run(
    `INSERT INTO propriedade_membros (uuid, propriedade_uuid, usuario_uuid, cargo, convidado_por, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, 'peao', ?, ?, ?, 'novo')`,
    [convidadoUid, propriedadeId, convidadoUid, auth.currentUser.uid, new Date().toISOString(), new Date().toISOString()]
  )
}
```

### 5.3. Dono remove um membro

```javascript
async function removerMembro(propriedadeId, membroUid) {
  // 1. Remover do Firestore
  await db
    .collection('propriedade')
    .doc(propriedadeId)
    .collection('membros')
    .doc(membroUid)
    .delete()

  // 2. Remover do SQLite local
  await dbLocal.run(
    `DELETE FROM propriedade_membros WHERE uuid = ? AND propriedade_uuid = ?`,
    [membroUid, propriedadeId]
  )
}
```

---

## 6. Proteção de Rotas

### 6.1. Rota Privada

```jsx
// components/RotaPrivada.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function RotaPrivada({ children }) {
  const { usuario, carregando } = useAuth()

  if (carregando) return <TelaCarregamento />
  if (!usuario) return <Navigate to="/login" />

  return children
}
```

### 6.2. Rota com Permissão

```jsx
// components/RotaPermissao.jsx
import { Navigate, useParams } from 'react-router-dom'
import { usePermissao } from '../hooks/usePermissao'

function RotaPermissao({ children, cargoNecessario }) {
  const { propriedadeId } = useParams()
  const { cargo, carregando } = usePermissao(propriedadeId)

  if (carregando) return <TelaCarregamento />
  if (!cargo) return <Navigate to="/dashboard" />

  if (cargoNecessario === 'dono' && cargo !== 'dono') {
    return <Navigate to={`/propriedade/${propriedadeId}`} />
  }

  return children
}
```

### 6.3. Uso no App.jsx

```jsx
function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/esqueci-senha" element={<ForgotPassword />} />
          <Route path="/verificar-codigo" element={<VerifyCode />} />
          <Route path="/criar-senha" element={<CreatePassword />} />

          {/* Rotas privadas */}
          <Route path="/dashboard" element={
            <RotaPrivada><Dashboard /></RotaPrivada>
          } />

          <Route path="/propriedade/:propriedadeId" element={
            <RotaPrivada><PropertyHome /></RotaPrivada>
          } />

          <Route path="/propriedade/:propriedadeId/cadastro-animal" element={
            <RotaPrivada><CadastroAnimal /></RotaPrivada>
          } />

          {/* Rota exclusiva do dono — financeiro */}
          <Route path="/propriedade/:propriedadeId/financeiro" element={
            <RotaPrivada>
              <RotaPermissao cargoNecessario="dono">
                <Financeiro />
              </RotaPermissao>
            </RotaPrivada>
          } />
        </Routes>
      </AuthProvider>
    </HashRouter>
  )
}
```

---

## 7. Criação Automática de Membro Dono

Quando um usuário cria uma propriedade, ele é automaticamente adicionado como **dono**:

```javascript
async function criarPropriedade({ nome, localizacao, tamanhoHa }) {
  const user = auth.currentUser
  const propriedadeRef = db.collection('propriedade').doc()

  // 1. Criar a propriedade
  await propriedadeRef.set({
    nome,
    localizacao,
    tamanho_ha: tamanhoHa || null,
    dono_uid: user.uid,
    created_at: firebase.firestore.FieldValue.serverTimestamp(),
  })

  // 2. Adicionar o criador como dono
  await propriedadeRef.collection('membros').doc(user.uid).set({
    usuario_uid: user.uid,
    cargo: 'dono',
    convidado_por: null, // Criador original
    created_at: firebase.firestore.FieldValue.serverTimestamp(),
  })

  // 3. Salvar no SQLite
  await dbLocal.run(
    `INSERT INTO propriedades (uuid, nome, localizacao, tamanho_ha, dono_uuid, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'novo')`,
    [propriedadeRef.id, nome, localizacao, tamanhoHa, user.uid, new Date().toISOString(), new Date().toISOString()]
  )

  await dbLocal.run(
    `INSERT INTO propriedade_membros (uuid, propriedade_uuid, usuario_uuid, cargo, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, 'dono', ?, ?, 'novo')`,
    [user.uid, propriedadeRef.id, user.uid, new Date().toISOString(), new Date().toISOString()]
  )
}
```

---

## 8. Resumo das Decisões

| Decisão                          | Escolha                                              |
|----------------------------------|------------------------------------------------------|
| Níveis de acesso                 | 2 (Dono e Peão)                                      |
| Dono pode fazer                  | CRUD completo (criar, ler, editar, excluir)          |
| Peão pode fazer                  | Visualizar + Criar registros                         |
| Peão não pode                    | Editar, excluir, ver financeiro, gerenciar propriedade|
| Convite de membros               | Por e-mail, apenas o Dono pode convidar              |
| Validação de permissão           | Frontend (UX) + Firestore rules (segurança)          |
| Membro removido                  | Hard delete (perde acesso imediatamente)             |
| Cargo padrão ao criar propriedade| Dono (criador)                                       |
| Cargo padrão ao ser convidado    | Peão                                                 |
