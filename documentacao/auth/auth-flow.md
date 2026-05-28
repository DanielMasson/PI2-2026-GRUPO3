# Fluxo de Autenticação

> Autenticação do **Propriedade Inteligente** via Firebase Auth (e-mail/senha).
> Este documento detalha cada etapa: login, cadastro, recuperação de senha e persistência de sessão.

---

## 1. Visão Geral

O sistema utiliza **Firebase Authentication** com o método **E-mail e Senha**.
O fluxo completo envolve 5 telas:

```text
┌─────────┐     ┌───────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Login  │────►│  Cadastro │     │ Esqueci Senha│────►│Verificar Cod.│────►│ Criar Senha  │
│         │     │           │     │              │     │              │     │              │
└────┬────┘     └───────────┘     └──────────────┘     └──────────────┘     └──────────────┘
     │
     ▼
┌──────────┐
│Dashboard │
└──────────┘
```

---

## 2. Telas do Fluxo

### 2.1. Login (`pages/Login/`)

**Rota:** `/login`

**Campos:**
- E-mail (obrigatório, validação de formato)
- Senha (obrigatório, mínimo 6 caracteres)

**Ações:**
- Botão "Log-in" → valida campos → chama `firebaseAuth.signInWithEmailAndPassword()`
- Link "Esqueceu a senha?" → navega para `/esqueci-senha`
- Link "Ainda não tem uma conta?" → navega para `/cadastro`

**Validações (código existente):**
```javascript
function validateForm({ email, password }) {
  const errors = {}
  if (!email) errors.email = 'E-mail é obrigatório'
  else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'E-mail inválido'
  if (!password) errors.password = 'Senha é obrigatória'
  else if (password.length < 6) errors.password = 'Mínimo de 6 caracteres'
  return errors
}
```

**Erros Firebase tratados:**
| Erro Firebase                          | Mensagem exibida                        |
|----------------------------------------|-----------------------------------------|
| `auth/user-not-found`                  | "E-mail ou senha incorretos."           |
| `auth/wrong-password`                  | "E-mail ou senha incorretos."           |
| `auth/invalid-email`                   | "E-mail inválido."                      |
| `auth/too-many-requests`               | "Muitas tentativas. Tente mais tarde."  |
| `auth/network-request-failed`          | "Sem conexão. Tente novamente."         |

---

### 2.2. Cadastro (`pages/Register/`)

**Rota:** `/cadastro`

**Campos:**
- Nome completo (obrigatório)
- E-mail (obrigatório, validação de formato)
- Telefone (obrigatório, inputMode tel)
- Senha (obrigatório, mínimo 6 caracteres)
- Confirmar senha (obrigatório, deve ser igual)

**Ações:**
- Botão "Criar Conta" → valida campos → chama `firebaseAuth.createUserWithEmailAndPassword()`
- Após sucesso: salva dados do usuário no Firestore → navega para `/login`

**Fluxo completo de cadastro:**

```javascript
async function handleCadastro({ nome, email, telefone, senha }) {
  // 1. Criar usuário no Firebase Auth
  const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, senha)
  const user = userCredential.user

  // 2. Atualizar displayName no Firebase Auth
  await user.updateProfile({ displayName: nome })

  // 3. Salvar dados do usuário no Firestore
  await firestore.collection('usuarios').doc(user.uid).set({
    firebase_uid: user.uid,
    nome: nome,
    email: email,
    telefone: telefone,
    cargo: 'dono', // Primeiro usuário é sempre dono
    created_at: firebase.firestore.FieldValue.serverTimestamp(),
  })

  // 4. Salvar localmente no SQLite
  await db.run(
    `INSERT INTO usuarios (uuid, firebase_uid, nome, email, cargo, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'sincronizado')`,
    [user.uid, user.uid, nome, email, 'dono', new Date().toISOString(), new Date().toISOString()]
  )

  // 5. Enviar e-mail de verificação (opcional)
  await user.sendEmailVerification()

  // 6. Navegar para login
  navigate('/login')
}
```

**Erros Firebase tratados:**
| Erro Firebase                          | Mensagem exibida                        |
|----------------------------------------|-----------------------------------------|
| `auth/email-already-in-use`            | "Este e-mail já está cadastrado."       |
| `auth/invalid-email`                   | "E-mail inválido."                      |
| `auth/weak-password`                   | "Senha muito fraca. Use 6+ caracteres." |

---

### 2.3. Esqueci Senha (`pages/ForgotPassword/`)

**Rota:** `/esqueci-senha`

**Campos:**
- E-mail (opcional, se selecionar envio por e-mail)
- Telefone (opcional, se selecionar envio por SMS)

**Ações:**
- Botão "Enviar código por e-mail" → valida → envia código → navega para `/verificar-codigo` com `state: { method: 'email' }`
- Botão "Enviar código por SMS" → valida → envia código → navega para `/verificar-codigo` com `state: { method: 'sms' }`

**Implementação com Firebase:**

```javascript
// Opção A: Reset por e-mail (recomendado para MVP)
async function handleResetEmail(email) {
  await firebase.auth().sendPasswordResetEmail(email)
  // Firebase envia e-mail automaticamente com link de redefinição
  // Para fluxo de código personalizado, usar Firebase Extensions ou Cloud Functions
}

// Opção B: Reset por SMS (requer Firebase Phone Auth)
async function handleResetSMS(phoneNumber) {
  const appVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container')
  const confirmationResult = await firebase.auth().signInWithPhoneNumber(phoneNumber, appVerifier)
  // confirmationResult.confirm(code) será chamado na tela VerificarCodigo
}
```

> **Nota MVP:** O fluxo de SMS requer configuração adicional do Firebase Phone Auth
> e reCAPTCHA. Para o MVP, priorizar o fluxo por e-mail.

---

### 2.4. Verificar Código (`pages/VerifyCode/`)

**Rota:** `/verificar-codigo`

**Campos:**
- 4 dígitos numéricos (inputs individuais com auto-focus)

**Comportamento (código existente):**
- Cada dígito avança automaticamente para o próximo input
- Backspace volta para o input anterior
- Quando todos os 4 dígitos estão preenchidos, botão "Verificar" aparece
- Ao verificar → navega para `/criar-senha`

**Implementação com Firebase:**

```javascript
// Para fluxo de e-mail: o código é verificado pelo backend (Cloud Function)
// Para fluxo de SMS:
async function handleVerificarCodigo(codigo) {
  try {
    await confirmationResult.confirm(codigo)
    // Código correto → navegar para criar senha
    navigate('/criar-senha')
  } catch (error) {
    // Código incorreto
    setErro('Código inválido. Tente novamente.')
  }
}
```

---

### 2.5. Criar Nova Senha (`pages/CreatePassword/`)

**Rota:** `/criar-senha`

**Campos:**
- Nova senha (obrigatório, mínimo 6 caracteres)
- Confirmar senha (obrigatório, deve ser igual)

**Ações:**
- Botão "Verificar" → valida → atualiza senha → navega para `/login`

**Implementação com Firebase:**

```javascript
async function handleCriarSenha(novaSenha) {
  const user = firebase.auth().currentUser
  await user.updatePassword(novaSenha)
  // Senha atualizada → navegar para login
  navigate('/login')
}
```

---

## 3. Persistência de Sessão

### Comportamento do Firebase Auth

O Firebase Auth mantém a sessão automaticamente via token JWT armazenado no dispositivo.

```javascript
// Verificar se usuário está logado ao abrir o app
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    // Usuário logado → carregar dados e ir para dashboard
    carregarDadosLocais()
    navigate('/dashboard')
  } else {
    // Não logado → tela de login
    navigate('/login')
  }
})
```

### Fluxo de Inicialização

```text
App abre
    │
    ▼
┌─────────────────────────────┐
│ firebase.auth()             │
│ .onAuthStateChanged()       │
└──────────┬──────────────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
  user=null   user existe
     │           │
     ▼           ▼
  /login      /dashboard
```

### Token JWT

- O token JWT é gerenciado automaticamente pelo SDK Firebase
- O token é renovado automaticamente antes de expirar
- **Nunca armazenar o token manualmente** (SharedPreferences, SQLite, etc.)
- O token é enviado automaticamente em todas as requisições ao Firestore

---

## 4. Logout

```javascript
async function handleLogout() {
  await firebase.auth().signOut()
  // Limpar dados locais sensíveis (opcional)
  // Navegar para login
  navigate('/login')
}
```

**Nota:** O SQLite local **não é limpo** no logout. Os dados permanecem no dispositivo
para permitir acesso offline se o usuário fizer login novamente com a mesma conta.

---

## 5. Segurança

### Validações no Frontend
- E-mail: regex `/\S+@\S+\.\S+/`
- Senha: mínimo 6 caracteres
- Confirmar senha: comparação direta

### Validações no Firebase
- E-mail único (Firebase Auth valida automaticamente)
- Senha com mínimo 6 caracteres (configurado no Firebase Console)
- Rate limiting de tentativas (Firebase protege contra brute force)

### Validações no Firestore
- Regras de segurança garantem que só o próprio usuário pode ler/escrever seu documento
- Verificar se `request.auth.uid == resource.data.firebase_uid`

---

## 6. Tratamento de Erros Geral

```javascript
function handleFirebaseError(error) {
  const mensagens = {
    'auth/user-not-found': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
    'auth/invalid-email': 'E-mail inválido.',
    'auth/weak-password': 'Senha muito fraca. Use 6+ caracteres.',
    'auth/too-many-requests': 'Muitas tentativas. Tente mais tarde.',
    'auth/network-request-failed': 'Sem conexão. Tente novamente.',
    'auth/operation-not-allowed': 'Operação não permitida.',
  }
  return mensagens[error.code] || 'Ocorreu um erro. Tente novamente.'
}
```

---

## 7. Resumo do Fluxo

| Etapa | Tela | Rota | Ação Firebase |
|-------|------|------|---------------|
| 1 | Login | `/login` | `signInWithEmailAndPassword()` |
| 2 | Cadastro | `/cadastro` | `createUserWithEmailAndPassword()` + `updateProfile()` + Firestore write |
| 3 | Esqueci Senha | `/esqueci-senha` | `sendPasswordResetEmail()` ou `signInWithPhoneNumber()` |
| 4 | Verificar Código | `/verificar-codigo` | `confirmationResult.confirm()` (SMS) |
| 5 | Criar Senha | `/criar-senha` | `updatePassword()` |
| 6 | Logout | — | `signOut()` |
