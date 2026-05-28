# Componente Input

> **Status:** Implementado | **Arquivo:** `components/Input/index.jsx` + `Input.module.css`
>
> Campo de entrada de texto reutilizável com suporte a label, placeholder e mensagem de erro.

---

## 1. Uso

```jsx
<Input
  id="nome"
  name="nome"
  type="text"
  label="Nome do animal"
  placeholder="Digite o nome"
  value={fields.nome}
  onChange={handleChange}
  error={erros.nome}
/>
```

---

## 2. Props

| Prop         | Tipo      | Obrigatório | Descrição                              |
|--------------|-----------|:-----------:|----------------------------------------|
| `id`         | string    | Sim         | ID do input (vincula label ao input)   |
| `name`       | string    | Sim         | Nome do campo (para `handleChange`)    |
| `type`       | string    | Sim         | Tipo HTML: text, email, password, tel, number, date |
| `label`      | string    | Não         | Texto do label acima do input          |
| `placeholder`| string    | Não         | Texto placeholder                      |
| `value`      | string    | Sim         | Valor controlado (estado)              |
| `onChange`   | function  | Sim         | Handler de mudança                     |
| `error`      | string    | Não         | Mensagem de erro (exibe borda vermelha)|
| `inputMode`  | string    | Não         | Tipo de teclado mobile: email, tel, numeric |
| `autoComplete`| string   | Não         | Autocompletar do navegador             |

---

## 3. Comportamento Visual

### Estados
| Estado    | Borda          | Fundo               | Descrição                |
|-----------|----------------|----------------------|--------------------------|
| Normal    | `--color-border` | `--color-surface`  | Estado padrão            |
| Focus     | `--color-primary`| —                  | Borda verde ao focar     |
| Erro      | `--color-error`  | —                  | Borda vermelha + mensagem|
| Disabled  | —              | Opacidade 0.5        | Desabilitado             |

### Dimensões
- **min-height:** 48px (touch target mínimo para mobile)
- **border-radius:** `--radius-md` (8px)
- **padding:** `--space-md` (16px)

---

## 4. Estrutura DOM

```html
<div class="wrapper">
  <label class="label" for="id">Label text</label>
  <input class="input" id="id" ... />
  <span class="errorMessage">Erro aqui</span>
</div>
```

---

## 5. Acessibilidade

- Label vinculado ao input via `htmlFor`/`id`
- Mensagem de erro associada visualmente ao campo
- Touch target ≥ 48px
- Contraste de texto passa WCAG AA
