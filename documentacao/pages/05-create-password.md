# Tela de Criação de Nova Senha

> **Rota:** `/criar-senha` | **Status:** Implementada | **Sprint:** 1–2
>
> Permite definir uma nova senha após verificação do código de recuperação.

---

## 1. Arquivo

- **Componente:** `pages/CreatePassword/index.jsx`
- **Estilo:** `pages/Login/Login.module.css` (reutiliza)

---

## 2. Wireframe

```text
┌──────────────────────────────────┐
│                                  │
│          [Logo]                  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ Crie uma senha             │  │
│  │ [________________________] │  │
│  │                            │  │
│  │ Reescreva sua senha        │  │
│  │ [________________________] │  │
│  │                            │  │
│  │  [      VERIFICAR    ]     │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

---

## 3. Campos e Componentes

| Componente | Tipo    | Props                            | Descrição            |
|------------|---------|----------------------------------|----------------------|
| Input      | Input   | `name="password"`, `type="password"` | Nova senha       |
| Input      | Input   | `name="confirm"`, `type="password"`  | Confirmar senha  |
| Button     | Button  | `variant="primary"`, `type="submit"` | Verificar/Salvar |

---

## 4. Comportamento

### Validações
- Senha: obrigatória + mínimo 6 caracteres
- Confirmar: deve ser igual à senha

### Submit
1. Valida campos
2. Chama `firebase.auth().currentUser.updatePassword(novaSenha)`
3. Sucesso → navega para `/login`
4. Erro → exibe mensagem de erro

---

## 5. Permissões

- Tela pública (mas requer verificação prévia de código)
- Acessível apenas vindo de `/verificar-codigo`
