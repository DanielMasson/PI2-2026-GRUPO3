# Autenticação JWT e Firebase

> Como a autenticação funciona no **Propriedade Inteligente** via Firebase Auth.
> O app não gerencia tokens manualmente — o SDK Firebase cuida de tudo.

---

## 1. Como o Firebase Auth Funciona

### Fluxo de Token

```text
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Login   │────►│ Firebase Auth │────►│ Token JWT    │
│  (email  │     │  (valida)    │     │ (armazenado  │
│  +senha) │     │              │     │  pelo SDK)   │
└──────────┘     └──────────────┘     └──────┬───────┘
                                             │
                                             ▼
                                    ┌────────────────┐
                                    │  Firestore     │
                                    │  (verifica     │
                                    │   token auto)  │
                                    └────────────────┘
```

### O que o SDK faz automaticamente
1. **Armazena o token** no dispositivo (SharedPreferences no Android)
2. **Renova o token** antes de expirar (tokens duram 1 hora)
3. **Anexa o token** em cada requisição ao Firestore
4. **Persiste a sessão** entre aberturas do app

### O que o app NÃO precisa fazer
- ❌ Armazenar tokens manualmente
- ❌ Enviar tokens em headers
- ❌ Renovar tokens
- ❌ Verificar expiração

---

## 2. Estrutura do Token JWT (informativo)

```javascript
// Header
{ "alg": "RS256", "typ": "JWT" }

// Payload
{
  "iss": "https://securetoken.google.com/propriedade-inteligente",
  "aud": "propriedade-inteligente",
  "auth_time": 1716742800,
  "user_id": "abc123def456",
  "sub": "abc123def456",
  "iat": 1716742800,
  "exp": 1716746400,
  "email": "joao@email.com",
  "email_verified": false,
  "firebase": { "sign_in_provider": "password" }
}
```

---

## 3. Verificação de Sessão

### No início do app

```javascript
// AuthContext.jsx
useEffect(() => {
  const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      // Usuário logado — carregar dados do Firestore
      const doc = await db.collection('usuarios').doc(user.uid).get()
      setUsuario({ uid: user.uid, email: user.email, ...doc.data() })
    } else {
      setUsuario(null)
    }
    setCarregando(false)
  })
  return unsubscribe // Cleanup ao desmontar
}, [])
```

### Verificação manual

```javascript
const user = firebase.auth().currentUser
if (user) {
  // Logado
  const token = await user.getIdToken() // Token fresco
} else {
  // Não logado
}
```

---

## 4. Regras de Segurança Firestore

As regras verificam o token JWT automaticamente:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // request.auth contém os dados do token JWT
    // request.auth.uid = UID do usuário logado
    
    function isAuth() {
      return request.auth != null;  // Token válido existe
    }
    
    match /usuarios/{userId} {
      allow read, update: if isAuth() && request.auth.uid == userId;
      // Usuário só acessa seus próprios dados
    }
  }
}
```

---

## 5. Tratamento de Erros de Autenticação

| Erro Firebase                    | Código               | Ação do app                     |
|----------------------------------|----------------------|---------------------------------|
| Usuário não encontrado           | `auth/user-not-found`| "E-mail ou senha incorretos."   |
| Senha incorreta                  | `auth/wrong-password`| "E-mail ou senha incorretos."   |
| E-mail já em uso                 | `auth/email-already-in-use` | "E-mail já cadastrado."  |
| E-mail inválido                  | `auth/invalid-email` | "E-mail inválido."              |
| Senha fraca                      | `auth/weak-password` | "Mínimo de 6 caracteres."       |
| Muitas tentativas                | `auth/too-many-requests` | "Tente mais tarde."       |
| Sem conexão                      | `auth/network-request-failed` | "Sem conexão."         |
| Token expirado                   | `auth/id-token-expired` | SDK renova automaticamente  |

---

## 6. Segurança Adicional

### Network Security Config (Android)

Bloquear HTTP não seguro:

```xml
<!-- res/xml/network_security_config.xml -->
<network-security-config>
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>
</network-security-config>
```

### Dados Sensíveis

| Dado                | Armazenamento         | Segurança                    |
|---------------------|-----------------------|------------------------------|
| Senha               | Firebase Auth (hash)  | Nunca armazenada localmente  |
| Token JWT           | SDK Firebase          | Renovação automática         |
| Dados do usuário    | Firestore + SQLite    | Regras Firestore + sandbox   |
| Dados do rebanho    | Firestore + SQLite    | Regras Firestore + sandbox   |
