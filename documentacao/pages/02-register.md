# Tela de Cadastro

> **Rota:** `/cadastro` | **Status:** Implementada | **Sprint:** 1–2
>
> Permite que um novo usuário crie sua conta no aplicativo.

---

## 1. Arquivo

- **Componente:** `pages/Register/index.jsx`
- **Estilo:** `pages/Login/Login.module.css` (reutiliza)

---

## 2. Wireframe

```text
┌──────────────────────────────────┐
│                                  │
│          [Logo]                  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ Nome completo              │  │
│  │ [________________________] │  │
│  │                            │  │
│  │ E-mail                     │  │
│  │ [________________________] │  │
│  │                            │  │
│  │ Telefone                   │  │
│  │ [________________________] │  │
│  │                            │  │
│  │ Senha                      │  │
│  │ [________________________] │  │
│  │                            │  │
│  │ Confirmar Senha            │  │
│  │ [________________________] │  │
│  │                            │  │
│  │  [   CRIAR CONTA   ]      │  │
│  │                            │  │
│  │  Já tem uma conta?        │  │
│  │  Fazer login               │  │
│  └────────────────────────────┘  │
│                                  │
│  By: IFC                        │
└──────────────────────────────────┘
```

---

## 3. Campos e Componentes

| Componente | Tipo    | Props                               | Descrição               |
|------------|---------|-------------------------------------|-------------------------|
| Input      | Input   | `name="name"`, `type="text"`        | Nome completo           |
| Input      | Input   | `name="email"`, `type="email"`      | E-mail                  |
| Input      | Input   | `name="phone"`, `type="tel"`        | Telefone                |
| Input      | Input   | `name="password"`, `type="password"` | Senha                  |
| Input      | Input   | `name="confirm"`, `type="password"` | Confirmar senha         |
| Button     | Button  | `variant="primary"`, `type="submit"`| Criar Conta            |
| Link       | `<p>`   | `onClick → /login`                  | "Fazer login"           |

---

## 4. Comportamento

### Validações (existentes no código)
- Nome: obrigatório
- E-mail: obrigatório + regex `/\S+@\S+\.\S+/`
- Telefone: obrigatório (inputMode tel)
- Senha: obrigatória + mínimo 6 caracteres
- Confirmar senha: deve ser igual à senha

### Submit
1. Valida campos
2. Exibe loading no botão
3. Chama `firebaseAuth.createUserWithEmailAndPassword(email, password)`
4. Atualiza `displayName` no Firebase Auth
5. Salva dados do usuário no Firestore (`usuarios/{uid}`)
6. Salva localmente no SQLite
7. Navega para `/login`

### Navegação
| Ação             | Destino  |
|------------------|----------|
| Cadastro sucesso | `/login` |
| "Fazer login"    | `/login` |

---

## 5. Permissões

- Tela pública (não requer autenticação)
- Se usuário já estiver logado, redirecionar para `/dashboard`
