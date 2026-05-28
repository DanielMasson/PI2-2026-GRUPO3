# Tipografia

> Definição de fontes, tamanhos e pesos do **Propriedade Inteligente**.
> Fonte: variáveis CSS em `styles/login_global.css`.

---

## 1. Família de Fontes

```css
--font-family: 'Poppins', system-ui, sans-serif;
```

- **Fonte primária:** Poppins (Google Fonts)
- **Fallback:** system-ui, sans-serif
- **Import:** `@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap')`

---

## 2. Pesos Disponíveis

| Peso | Valor | Uso                          |
|------|:-----:|------------------------------|
| Regular | 400 | Texto corpo, placeholders    |
| Medium  | 500 | Labels, subtítulos           |
| Semi-bold | 600 | Botões, destaques, links   |
| Bold    | 700 | Títulos, nomes de animais    |

---

## 3. Tamanhos

| Variável CSS      | Valor    | Pixels | Uso principal                              |
|-------------------|----------|:------:|--------------------------------------------|
| `--font-size-xs`  | 0.75rem  | 12px   | Badges, timestamps, texto muito pequeno    |
| `--font-size-sm`  | 0.875rem | 14px   | Labels de input, texto secundário, links   |
| `--font-size-md`  | 1rem     | 16px   | Texto corpo padrão, texto de botões        |
| `--font-size-lg`  | 1.125rem | 18px   | Subtítulos, nomes de seções                |
| `--font-size-xl`  | 1.5rem   | 24px   | Títulos de página                          |

---

## 4. Hierarquia Tipográfica

### Título de Página (H1)
```css
font-size: var(--font-size-xl);     /* 24px */
font-weight: 700;
color: var(--color-text);           /* #1c1c1e */
line-height: 1.2;
```
**Uso:** "Login", "Dashboard", "Ficha do Animal"

### Subtítulo (H2)
```css
font-size: var(--font-size-lg);     /* 18px */
font-weight: 600;
color: var(--color-text);
```
**Uso:** Seções dentro de uma tela ("Identificação", "Desempenho")

### Texto Corpo
```css
font-size: var(--font-size-md);     /* 16px */
font-weight: 400;
color: var(--color-text);
line-height: 1.5;
```
**Uso:** Descrições, dados, conteúdo

### Label de Input
```css
font-size: var(--font-size-sm);     /* 14px */
font-weight: 500;
color: var(--color-text-muted);     /* #8e8e93 */
```
**Uso:** Labels acima de campos de formulário

### Texto de Botão
```css
font-size: var(--font-size-md);     /* 16px */
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.05em;
```
**Uso:** Botões primary e ghost

### Badge / Timestamp
```css
font-size: var(--font-size-xs);     /* 12px */
font-weight: 500;
letter-spacing: 0.06em;
text-transform: uppercase;
```
**Uso:** Badges de status, timestamps, texto pequeno

---

## 5. Alinhamento

| Contexto        | Alinhamento | Justificativa                    |
|-----------------|:-----------:|----------------------------------|
| Títulos         | Esquerda    | Padrão mobile, melhor leitura    |
| Botões          | Centro      | Centralizado no container        |
| Labels          | Esquerda    | Alinhados com o campo            |
| Mensagens erro  | Esquerda    | Abaixo do campo correspondente   |
| Texto vazio     | Centro      | Estado vazio centralizado        |

---

## 6. Line Height

| Contexto          | Line-height | Justificativa              |
|-------------------|:-----------:|----------------------------|
| Títulos           | 1.2         | Compacto, impacto visual   |
| Texto corpo       | 1.5         | Legibilidade confortável   |
| Instruções (caps) | 1.5         | Texto em caixa alta        |

---

## 7. Letter Spacing

| Contexto                | Letter-spacing | Justificativa            |
|-------------------------|:--------------:|--------------------------|
| Texto em uppercase      | 0.02em–0.06em  | Melhora legibilidade     |
| Botões                  | 0.05em         | Destaque e profissionalismo |
| Subtítulos (topbar)     | 0.06em         | Hierarquia visual        |
| Texto normal            | 0              | Padrão                   |
