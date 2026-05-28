# Tela de Recuperação de Senha

> **Rota:** `/esqueci-senha` | **Status:** Implementada | **Sprint:** 1–2
>
> Permite solicitar a recuperação de senha por e-mail ou SMS.

---

## 1. Arquivo

- **Componente:** `pages/ForgotPassword/index.jsx`
- **Estilo:** `pages/Login/Login.module.css` (reutiliza)

---

## 2. Wireframe

```text
┌──────────────────────────────────┐
│                                  │
│          [Logo]                  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ Insira seu e-mail          │  │
│  │ [________________________] │  │
│  │                            │  │
│  │ Insira seu telefone        │  │
│  │ [________________________] │  │
│  │                            │  │
│  │  [ENVIAR CÓDIGO POR EMAIL]│  │
│  │  [ENVIAR CÓDIGO POR SMS]  │  │
│  │                            │  │
│  │  Lembrou a senha?          │  │
│  │  Fazer login               │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

---

## 3. Campos e Componentes

| Componente | Tipo    | Props                           | Descrição              |
|------------|---------|---------------------------------|------------------------|
| Input      | Input   | `name="email"`, `type="email"`  | E-mail para recuperação|
| Input      | Input   | `name="phone"`, `type="tel"`    | Telefone (alternativo) |
| Button     | Button  | `variant="primary"`             | Enviar por e-mail      |
| Button     | Button  | `variant="outline"`             | Enviar por SMS         |
| Link       | `<p>`   | `onClick → /login`              | "Fazer login"          |

---

## 4. Comportamento

### Validações
- Pelo menos um dos campos (e-mail ou telefone) deve ser preenchido

### Ações
- Botão "Enviar por e-mail" → valida → envia código → navega para `/verificar-codigo` com `state: { method: 'email' }`
- Botão "Enviar por SMS" → valida → envia código → navega para `/verificar-codigo` com `state: { method: 'sms' }`

### Implementação Firebase
- E-mail: `firebase.auth().sendPasswordResetEmail(email)`
- SMS: `firebase.auth().signInWithPhoneNumber(phone, appVerifier)` (requer reCAPTCHA)

> **Nota MVP:** Priorizar fluxo por e-mail. SMS requer configuração adicional.

---

## 5. Permissões

- Tela pública
- Se usuário logado, redirecionar para `/dashboard`
