# Acessibilidade

> Diretrizes de acessibilidade do **Propriedade Inteligente**.
> Baseado em WCAG 2.1 nível AA e considerações para uso em campo (luz solar).

---

## 1. Contraste de Cores

### Razões Mínimas (WCAG AA)

| Tipo de texto          | Razão mínima | Status no projeto     |
|------------------------|:------------:|-----------------------|
| Texto normal (< 18px)  | 4.5:1        | ✅ Atende             |
| Texto grande (≥ 18px)  | 3:1          | ✅ Atende             |
| Componentes UI         | 3:1          | ✅ Atende             |

### Verificações

| Combinação                      | Razão   | Status |
|---------------------------------|:-------:|:------:|
| #1c1c1e / #ffffff               | 16.1:1  | ✅     |
| #ffffff / #4e8a1a (botão)       | 4.7:1   | ✅     |
| #8e8e93 / #ffffff (labels)      | 3.9:1   | ⚠️     |
| #ffffff / #3a6812 (hover)       | 6.2:1   | ✅     |
| #ff3b30 / #ffffff (erro)        | 4.6:1   | ✅     |

> **Nota:** `#8e8e93` (text-muted) não atinge 4.5:1 para texto pequeno.
> Usar apenas para labels e placeholders, não para conteúdo informativo crítico.

---

## 2. Touch Targets (Áreas de Toque)

| Elemento              | Tamanho    | WCAG 2.5.5 | Status |
|-----------------------|:----------:|:----------:|:------:|
| Botões                | 52px       | ✅ (≥ 44px)| ✅     |
| Inputs                | 48px       | ✅ (≥ 44px)| ✅     |
| Tabs BottomNav        | 48px       | ✅ (≥ 44px)| ✅     |
| Botão "+"             | 56×56px    | ✅          | ✅     |
| Botões de ícone       | 36px       | ⚠️ (< 44px)| ⚠️     |

> **Recomendação:** Botões de ícone (36px) devem ser expandidos para 44px com padding.

---

## 3. Uso em Campo (Luz Solar)

### Problema
O aplicativo é usado em **ambientes rurais com luz solar direta**, o que reduz drasticamente a visibilidade de telas de celular.

### Soluções Implementadas

| Solução                      | Descrição                                          |
|------------------------------|----------------------------------------------------|
| Alto contraste               | Texto escuro (#1c1c1e) em fundo branco (#ffffff)  |
| Botões grandes               | 52px de altura, fácil de localizar ao toque        |
| Fonte sem serifa             | Poppins — melhor legibilidade em telas pequenas    |
| Tamanho base 16px            | Mínimo para leitura confortável                    |
| Texto em uppercase em botões | Maior destaque visual                              |

### Soluções Planejadas

| Solução                      | Descrição                                          |
|------------------------------|----------------------------------------------------|
| Modo alto contraste (futuro) | Toggle para aumentar contraste ainda mais          |
| Fonte configurável           | Permitir aumento de tamanho da fonte               |
| Ícones ao lado de textos     | Redundância visual para identificar ações          |

---

## 4. Navegação por Teclado

### Status Atual
- Inputs: foco via Tab ✅
- Botões: foco via Tab ✅
- Links: foco via Tab ✅

### Focus Visible

```css
/* Padrão de focus para todos os elementos interativos */
:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

---

## 5. Semântica HTML

### Status Atual

| Elemento           | Semântica               | Status |
|--------------------|-------------------------|:------:|
| Botões             | `<button>`              | ✅     |
| Inputs             | `<input>` com type      | ✅     |
| Labels             | `<label>` com htmlFor   | ✅     |
| Navegação          | `<nav>` (BottomNav)     | ✅     |
| Formulários        | `<form>` com onSubmit   | ✅     |

### ARIA Labels

| Elemento           | ARIA                          | Status |
|--------------------|-------------------------------|:------:|
| BottomNav botões   | `aria-label` em cada botão    | ✅     |
| Botões sem texto   | `aria-label` descritivo       | ✅     |
| Inputs com erro    | `aria-describedby` (futuro)   | ⚠️     |
| Modais             | `role="dialog"`, `aria-modal` | ⚠️     |
| Loading            | `aria-live="polite"` (futuro) | ⚠️     |

---

## 6. Mensagens de Erro

### Padrão

- Mensagens de erro aparecem **abaixo do campo** correspondente
- Cor: `--color-error` (#ff3b30)
- Fonte: `--font-size-sm` (14px)
- Mensagens em **português** e descritivas

### Exemplos

| Erro                           | Mensagem                               |
|--------------------------------|----------------------------------------|
| Campo vazio                    | "Nome é obrigatório"                   |
| Formato inválido               | "E-mail inválido"                      |
| Senha curta                    | "Mínimo de 6 caracteres"               |
| Senhas diferentes              | "As senhas não coincidem"              |
| Erro de rede                   | "Sem conexão. Tente novamente."        |
| Credenciais incorretas         | "E-mail ou senha incorretos."          |

---

## 7. Idioma

- **Lang attribute:** `<html lang="pt-BR">`
- **Todo o texto da interface** em português brasileiro
- **Mensagens de erro** em português
- **Placeholders** em português
- **Tooltips** em português

---

## 8. Prioridades de Acessibilidade

| Prioridade | Item                               | Status    |
|------------|-------------------------------------|-----------|
| Alta       | Contraste ≥ 4.5:1                  | ✅ Feito  |
| Alta       | Touch targets ≥ 44px               | ✅ Feito  |
| Alta       | Labels vinculados a inputs         | ✅ Feito  |
| Alta       | Mensagens de erro em português     | ✅ Feito  |
| Média      | aria-labels em botões de ícone     | ✅ Feito  |
| Média      | Focus visível                      | ⚠️ Parcial|
| Média      | aria-describedby em erros          | ⚠️ A fazer|
| Baixa      | Modo alto contraste                | ⚠️ Futuro |
| Baixa      | Suporte a screen reader            | ⚠️ Futuro |
| Baixa      | Tamanho de fonte configurável      | ⚠️ Futuro |
