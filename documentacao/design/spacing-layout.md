# Espaçamento e Layout

> Definição de espaçamento, raios de borda, sombras e grid do **Propriedade Inteligente**.
> Fonte: variáveis CSS em `styles/login_global.css`.

---

## 1. Escala de Espaçamento

| Variável CSS   | Valor | Pixels | Uso principal                              |
|----------------|-------|:------:|--------------------------------------------|
| `--space-xs`   | 4px   | 4px    | Gaps mínimos, espaços entre badge e texto  |
| `--space-sm`   | 8px   | 8px    | Gaps entre elementos compactos, padding interno |
| `--space-md`   | 16px  | 16px   | Padding de inputs, gaps de formulários     |
| `--space-lg`   | 24px  | 24px   | Padding de cards, margens entre seções     |
| `--space-xl`   | 32px  | 32px   | Margens grandes, espaçamento entre blocos  |
| `--space-2xl`  | 48px  | 48px   | Espaçamento de tela (topo, rodapé)         |

---

## 2. Uso por Componente

### Input
```css
padding: var(--space-md);          /* 16px */
gap: var(--space-xs);              /* 4px (label → input) */
```

### Button
```css
padding: 0 var(--space-lg);        /* 0 24px */
min-height: 52px;
```

### Card
```css
padding: var(--space-md) var(--space-lg);  /* 16px 24px */
margin-bottom: var(--space-sm);            /* 8px entre cards */
```

### Formulário
```css
gap: var(--space-md);              /* 16px entre campos */
```

### Seções de página
```css
margin-top: var(--space-lg);       /* 24px entre seções */
padding: var(--space-md);          /* 16px padding interno */
```

---

## 3. Raios de Borda (Border Radius)

| Variável CSS    | Valor  | Uso principal                              |
|-----------------|--------|--------------------------------------------|
| `--radius-sm`   | 8px    | Inputs, cards pequenos, badges             |
| `--radius-md`   | 12px   | Cards, modais, containers                  |
| `--radius-pill` | 9999px | Botões (formato pílula), badges arredondados |

### Uso por Componente

| Componente      | Border-radius       |
|-----------------|---------------------|
| Input           | `--radius-sm` (8px) |
| Button          | `--radius-pill`     |
| Card            | `--radius-sm` (8px) |
| Modal           | `--radius-md` (12px)|
| Badge           | `--radius-pill`     |
| BottomNav "+"   | 50% (círculo)       |
| Avatar          | 50% (círculo)       |

---

## 4. Sombras

| Variável CSS    | Valor                              | Uso                    |
|-----------------|------------------------------------|------------------------|
| `--shadow-card` | `0 2px 20px rgba(0,0,0,0.08)`     | Cards elevados         |

### Sombras adicionais (inline)

| Elemento         | Sombra                                        |
|------------------|-----------------------------------------------|
| BottomNav "+"    | `0 4px 16px rgba(78,138,26,0.4)`             |
| "+" hover        | `0 6px 20px rgba(78,138,26,0.5)`             |
| Logo             | `drop-shadow(0 4px 12px rgba(78,138,26,0.25))`|

---

## 5. Transições

| Variável CSS       | Valor          | Uso                              |
|--------------------|----------------|----------------------------------|
| `--transition-fast`| `150ms ease`   | Hovers, focus, feedback de toque |
| `--transition-base`| `250ms ease`   | Animações de modal, expansão     |

---

## 6. Layout das Telas

### Layout de Login/Cadastro

```css
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-lg);
}

.card {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
}
```

### Layout de Listas (Dashboard, Animais)

```css
.screen {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-background);
}

.scrollArea {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-md);
  padding-bottom: 90px;  /* Espaço para BottomNav */
}
```

### Layout de Painel (PropertyHome)

```css
.screen {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.scrollArea {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-md);
}
```

---

## 7. Grid Responsivo

O app não utiliza grid CSS complexo — o layout é baseado em **flexbox** com containers full-width.

### Padrão de Cards em Lista

```css
/* Cards empilhados verticalmente */
display: flex;
flex-direction: column;
gap: var(--space-sm);  /* 8px entre cards */
```

### Padrão de Stats em Grid

```css
/* 2x2 grid de estatísticas */
display: grid;
grid-template-columns: 1fr 1fr;
gap: var(--space-sm);
```

---

## 8. Safe Area (iOS/Notch)

```css
/* BottomNav */
padding-bottom: env(safe-area-inset-bottom, 0px);
```

Usado na BottomNav para evitar que o conteúdo fique atrás da barra de gestos do iPhone.

---

## 9. Dimensões de Touch Targets

| Elemento         | Tamanho mínimo | Justificativa                |
|------------------|:--------------:|------------------------------|
| Botões           | 52px altura    | WCAG 2.5.5, Google Material  |
| Inputs           | 48px altura    | WCAG 2.5.5                   |
| Tabs BottomNav   | 48px altura    | Google Material Design       |
| Botão "+"        | 56×56px        | Ação principal destacadada   |
| Links/checkboxes | 44×44px        | Área de toque mínima iOS     |
