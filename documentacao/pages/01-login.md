# Tela de Login

> **Rota:** `/login` | **Status:** Implementada | **Sprint:** 1–2
>
> Primeira tela do aplicativo. Permite que o usuário acesse sua conta via e-mail e senha.

---

## 1. Arquivo

- **Componente:** `pages/Login/index.jsx`
- **Estilo:** `pages/Login/Login.module.css`

---

## 2. Wireframe

```text
┌──────────────────────────────────┐
│                                  │
│          [Logo]                  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ E-mail                     │  │
│  │ [________________________] │  │
│  │                            │  │
│  │ Senha                      │  │
│  │ [________________________] │  │
│  │                            │  │
│  │  Esqueceu a senha?         │  │
│  │                            │  │
│  │  [    LOG-IN     ]         │  │
│  │                            │  │
│  │  Ainda não tem uma conta?  │  │
│  │  Cadastre-se               │  │
│  └────────────────────────────┘  │
│                                  │
│  By: IFC                        │
└──────────────────────────────────┘
```

---

## 3. Campos e Componentes

| Componente | Tipo    | Props                              | Descrição                        |
|------------|---------|------------------------------------|----------------------------------|
| Logo       | `<img>` | `src={logo}`, `alt="Logo"`         | Logo do app (assets/logo.png)    |
| Input      | Input   | `name="email"`, `type="email"`     | Campo de e-mail                  |
| Input      | Input   | `name="password"`, `type="password"`| Campo de senha                  |
| Link       | `<p>`   | `onClick → /esqueci-senha`         | "Esqueceu a senha?"              |
| Button     | Button  | `variant="primary"`, `type="submit"`| Botão Log-in                    |
| Link       | `<p>`   | `onClick → /cadastro`              | "Cadastre-se"                    |
| Footer     | `<p>`   | —                                  | "By: IFC"                        |

---

## 4. Comportamento

### Estado do Componente
```javascript
const [fields, setFields] = useState({ email: '', password: '' })
const [errors, setErrors] = useState({})
const [formError, setFormError] = useState('')
const [isLoading, setIsLoading] = useState(false)
```

### Validações (existentes no código)
- E-mail: obrigatório + regex `/\S+@\S+\.\S+/`
- Senha: obrigatória + mínimo 6 caracteres

### Submit
1. Valida campos
2. Exibe loading no botão
3. Chama `firebaseAuth.signInWithEmailAndPassword(email, password)`
4. Sucesso → navega para `/dashboard`
5. Erro → exibe `formError`

### Navegação
| Ação                  | Destino        |
|-----------------------|----------------|
| Log-in sucesso        | `/dashboard`   |
| "Esqueceu a senha?"   | `/esqueci-senha`|
| "Cadastre-se"         | `/cadastro`    |

---

## 5. Tratamento de Erros

| Erro Firebase                    | Mensagem exibida                       |
|----------------------------------|----------------------------------------|
| `auth/user-not-found`            | "E-mail ou senha incorretos."          |
| `auth/wrong-password`            | "E-mail ou senha incorretos."          |
| `auth/too-many-requests`         | "Muitas tentativas. Tente mais tarde." |
| `auth/network-request-failed`    | "Sem conexão. Tente novamente."        |

---

## 6. Permissões

- Tela pública (não requer autenticação)
- Acessível por qualquer usuário

---

## 7. Responsividade

- Layout centralizado verticalmente
- Card com padding generoso
- Botão full-width
- Touch targets ≥ 48px
