# Componente BottomNav

> **Status:** Implementado | **Arquivo:** `components/BottomNav/index.jsx` + `BottomNav.module.css`
>
> Barra de navegação inferior fixa com 3 abas: Home, Adicionar (+) e Ajustes.

---

## 1. Uso

```jsx
<BottomNav
  activeTab="home"
  onHome={() => navigate('/dashboard')}
  onAdd={() => handleAdicionarPropriedade()}
  onSettings={() => navigate('/configuracoes')}
/>
```

---

## 2. Props

| Prop        | Tipo      | Obrigatório | Descrição                                  |
|-------------|-----------|:-----------:|--------------------------------------------|
| `activeTab` | string    | Não         | `'home'` ou `'settings'` (padrão: `'home'`)|
| `onHome`    | function  | Não         | Handler do botão Home                       |
| `onAdd`     | function  | Não         | Handler do botão central "+"                |
| `onSettings`| function  | Não         | Handler do botão Ajustes                    |

---

## 3. Estrutura

```text
┌─────────────────────────────────────────┐
│  [🏠 Home]    [＋]    [⚙️ Ajustes]     │
│                 ↑                        │
│           botão elevado                  │
└─────────────────────────────────────────┘
```

### 3 Tabs
1. **Home** — Ícone SVG (casa), label "Home"
2. **Adicionar (+)** — Botão circular elevado (56px), fundo verde, sombra
3. **Ajustes** — Ícone SVG (engrenagem), label "Ajustes"

---

## 4. Comportamento Visual

| Elemento        | Estado     | Cor                    |
|-----------------|------------|------------------------|
| Tab             | Normal     | `#b0b0b0` (cinza)     |
| Tab             | Hover      | `#888`                 |
| Tab             | Ativo      | `--color-primary` (verde)|
| Botão "+"       | Normal     | `--color-primary` (verde)|
| Botão "+"       | Hover      | `--color-primary-dark` |
| Botão "+"       | Active     | `scale(0.93)`          |

### Indicador de Tab Ativa
- Linha verde de 2px no topo da tab ativa
- Cor: `--color-primary`

---

## 5. Dimensões

- **Altura da barra:** 72px
- **Botão "+":** 56×56px, border-radius 50%
- **Sombra do "+":** `0 4px 16px rgba(78, 138, 26, 0.4)`
- **Safe area:** `padding-bottom: env(safe-area-inset-bottom)` (para iPhones com notch)

---

## 6. Posicionamento

- `position: fixed`
- `bottom: 0`
- `z-index: 100`
- Telas com BottomNav precisam de padding-bottom extra (~90px) para não cortar conteúdo

---

## 7. Acessibilidade

- `aria-label` em cada botão
- Ícones SVG com `stroke="currentColor"`
- Touch targets ≥ 48px (tabs) e 56px (botão "+")
