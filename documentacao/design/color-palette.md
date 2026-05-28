# Paleta de Cores

> Definição das cores do **Propriedade Inteligente**.
> Fonte: variáveis CSS em `styles/login_global.css` (`:root`).

---

## 1. Cores Principais

| Variável CSS           | Valor Hex    | Uso principal                              |
|------------------------|--------------|--------------------------------------------|
| `--color-primary`      | `#4e8a1a`    | Botões, links, tabs ativas, ações principais |
| `--color-primary-dark` | `#3a6812`    | Hover em botões e links                    |
| `--color-primary-light`| `#e8f5d9`    | Hover em botões ghost, fundo de badges OK  |

### Amostra

```
Primary:       ████████  #4e8a1a  (Verde Esmeralda)
Primary Dark:  ████████  #3a6812  (Verde Escuro)
Primary Light: ████████  #e8f5d9  (Verde Claro)
```

---

## 2. Cores de Superfície

| Variável CSS           | Valor Hex    | Uso principal                              |
|------------------------|--------------|--------------------------------------------|
| `--color-background`   | `#ffffff`    | Fundo principal do app                     |
| `--color-surface`      | `#efefef`    | Fundo de inputs, cards, áreas elevadas     |
| `--color-border`       | `#d8d8d8`    | Bordas de inputs e divisores               |

---

## 3. Cores de Texto

| Variável CSS           | Valor Hex    | Uso principal                              |
|------------------------|--------------|--------------------------------------------|
| `--color-text`         | `#1c1c1e`    | Texto principal (títulos, corpo)           |
| `--color-text-muted`   | `#8e8e93`    | Texto secundário (labels, placeholders)    |

---

## 4. Cores de Feedback

| Variável CSS           | Valor Hex    | Uso principal                              |
|------------------------|--------------|--------------------------------------------|
| `--color-error`        | `#ff3b30`    | Erros de validação, mensagens de erro      |
| `--color-dot`          | `#c8c8c8`    | Pontos de grid, indicadores inativos       |

---

## 5. Cores de Status (definidas inline)

| Status       | Cor             | Hex         | Uso                                    |
|--------------|-----------------|-------------|----------------------------------------|
| Sucesso/OK   | Verde           | `#4e8a1a`   | Vacina OK, sincronizado, lucro         |
| Alerta       | Laranja/Amarelo | `#e67e22`   | Vacina próxima, pré-parto              |
| Perigo       | Vermelho        | `#c0392b`   | Vacina vencida, carência, prejuízo     |
| Info         | Azul            | `#2980b9`   | Informações gerais                     |
| Inativo      | Cinza           | `#8e8e93`   | Status inativo, liberado               |

---

## 6. Tema Escuro (PropertyHome)

A tela PropertyHome usa um tema mais escuro no topo:

```css
.topbar {
  background-color: #1a241a;  /* Verde muito escuro */
  color: #f0ecff;             /* Texto claro */
}
```

| Elemento          | Cor fundo      | Cor texto     |
|-------------------|----------------|---------------|
| Topbar            | `#1a241a`      | `#f0ecff`     |
| Subtítulo topbar  | —              | `#9b92b8`     |
| Botão voltar      | transparente   | `#f0ecff`     |
| Hover botão       | rgba(200,169,126,0.1) | —       |
| Hover border      | `#c8a97e` (dourado) | —          |

---

## 7. Contraste WCAG

| Combinação                    | Razão    | WCAG AA (4.5:1) | WCAG AAA (7:1) |
|-------------------------------|----------|:---------------:|:--------------:|
| Texto #1c1c1e / Fundo #ffffff | 16.1:1   | ✅              | ✅             |
| Texto #8e8e93 / Fundo #ffffff | 3.9:1    | ⚠️ (só large)  | ❌             |
| Texto #ffffff / Fundo #4e8a1a | 4.7:1    | ✅              | ❌             |
| Texto #1c1c1e / Fundo #efefef | 12.6:1   | ✅              | ✅             |

> **Nota:** `--color-text-muted` (#8e8e93) não passa WCAG AA para texto pequeno.
> Usar apenas para labels e placeholders, não para conteúdo informativo.

---

## 8. Uso por Componente

| Componente      | Cor principal          | Cor hover             |
|-----------------|------------------------|-----------------------|
| Button primary  | `--color-primary`      | `--color-primary-dark`|
| Button ghost    | `--color-primary` borda| `--color-primary-light`|
| Input focus     | `--color-border` → `--color-primary` | —        |
| Input error     | `--color-error`        | —                     |
| BottomNav tab   | `#b0b0b0` → `--color-primary` | `#888`          |
| BottomNav "+"   | `--color-primary`      | `--color-primary-dark`|
| Card            | `#1a241a` ou `--color-surface` | —              |
