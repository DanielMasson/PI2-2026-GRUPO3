# Componente Button

> **Status:** Implementado | **Arquivo:** `components/Button/index.jsx` + `Button.module.css`
>
> Botão reutilizável com variantes de estilo (primary, ghost) e estado de loading.

---

## 1. Uso

```jsx
<Button variant="primary" type="submit" isLoading={isLoading}>
  Salvar animal
</Button>

<Button variant="ghost" onClick={handleLimpar}>
  Limpar
</Button>
```

---

## 2. Props

| Prop        | Tipo      | Obrigatório | Descrição                               |
|-------------|-----------|:-----------:|-----------------------------------------|
| `children`  | node      | Sim         | Texto ou conteúdo do botão              |
| `variant`   | string    | Não         | `'primary'` (padrão) ou `'ghost'`       |
| `isLoading` | boolean   | Não         | Exibe "Carregando..." e desabilita      |
| `type`      | string    | Não         | HTML: button (padrão), submit, reset    |
| `disabled`  | boolean   | Não         | Desabilita o botão                      |
| `onClick`   | function  | Não         | Handler de clique                       |

---

## 3. Variantes

### Primary (padrão)
- Fundo: `--color-primary` (verde sólido)
- Texto: branco
- Hover: `--color-primary-dark`
- **Uso:** Ações principais (salvar, logar, cadastrar)

### Ghost
- Fundo: transparente
- Borda: 2px solid `--color-primary`
- Texto: `--color-primary`
- Hover: `--color-primary-light`
- **Uso:** Ações secundárias (limpar, cancelar)

---

## 4. Comportamento

- **Active:** `transform: scale(0.97)` (feedback de toque)
- **Loading:** Exibe "Carregando...", desabilita clique
- **Disabled:** Opacidade 0.5, cursor `not-allowed`

---

## 5. Dimensões

- **min-height:** 52px
- **border-radius:** `--radius-pill` (999px / formato pílula)
- **padding:** 0 `--space-lg` (horizontal)
- **font-size:** `--font-size-md` (16px)
- **text-transform:** uppercase
- **letter-spacing:** 0.05em

---

## 6. Acessibilidade

- Touch target ≥ 52px
- Contraste texto/fundo ≥ 4.5:1
- Feedback visual ao toque (scale)
- Disabled state visível
