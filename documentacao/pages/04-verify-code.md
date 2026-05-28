# Tela de Verificação de Código

> **Rota:** `/verificar-codigo` | **Status:** Implementada | **Sprint:** 1–2
>
> Exibe 4 inputs para dígitos do código de verificação enviado por e-mail ou SMS.

---

## 1. Arquivo

- **Componente:** `pages/VerifyCode/index.jsx`
- **Estilo:** `pages/VerifyCode/VerifyCode.module.css`

---

## 2. Wireframe

```text
┌──────────────────────────────────┐
│                                  │
│          [Logo]                  │
│                                  │
│  POR FAVOR INSIRA O CÓDIGO       │
│  QUE FOI ENVIADO POR E-MAIL      │
│                                  │
│    [  ] [  ] [  ] [  ]          │
│                                  │
│  [      VERIFICAR       ]        │
│                                  │
└──────────────────────────────────┘
```

---

## 3. Campos e Componentes

| Componente | Tipo    | Props                       | Descrição                  |
|------------|---------|-----------------------------|----------------------------|
| Instrução  | `<p>`   | Dinâmico (e-mail ou SMS)    | Texto do método de envio   |
| 4 inputs   | `<input>` | `type="text"`, `inputMode="numeric"`, `maxLength={1}` | Dígitos do código |
| Button     | Button  | `variant="primary"`         | Verificar                  |

---

## 4. Comportamento

### Auto-focus
- Cada dígito preenchido avança automaticamente para o próximo input
- Backspace em input vazio volta para o input anterior
- Apenas dígitos numéricos são aceitos

### Validação
- Código completo: todos os 4 dígitos preenchidos
- Botão "Verificar" só aparece quando código está completo

### Submit
- Valida código via Firebase (SMS) ou Cloud Function (e-mail)
- Sucesso → navega para `/criar-senha`
- Erro → exibe "Código inválido. Tente novamente."

### Estado recebido
```javascript
const location = useLocation()
const method = location.state?.method || 'email' // 'email' ou 'sms'
```

---

## 5. Permissões

- Tela pública
- Acessível apenas vindo de `/esqueci-senha`
