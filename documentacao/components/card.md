# Componente Card

> **Status:** Implementado | **Padrão reutilizado** em Dashboard, PropertyHome, HealthModule
>
> Card de conteúdo genérico usado em listas e painéis. Sem componente dedicado —
> o padrão é replicado inline com classes CSS.

---

## 1. Uso (padrão atual)

```jsx
<div className={styles.card}>
  <div className={styles.cardHeader}>
    <span className={styles.cardIcon}>🐄</span>
    <span className={styles.cardTitle}>Mimosa (BR-00142)</span>
  </div>
  <div className={styles.cardBody}>
    <p>Bovino · Nelore · Fêmea</p>
    <p>3 anos · 345 kg</p>
  </div>
</div>
```

---

## 2. Padrão Visual

### Tipos de Card

| Tipo              | Uso                         | Borda superior | Cor de destaque   |
|-------------------|-----------------------------|:--------------:|-------------------|
| Propriedade       | Lista de propriedades       | —              | Verde             |
| Animal            | Lista de animais            | —              | —                 |
| Alerta            | Alertas do painel           | 3px            | Vermelho/Laranja  |
| Vacina            | Calendário de vacinas       | —              | Verde/Vermelho    |
| Medicamento       | Tratamentos                 | —              | Verde/Vermelho    |
| Reprodução        | Gestações                   | 3px            | Azul              |
| Financeiro        | Resumo financeiro           | 3px            | Dourado           |

### Estrutura Padrão

```text
┌──────────────────────────────┐
│ [ícone]  Título       [badge]│
│ Subtítulo / descrição        │
│ Dados relevantes             │
│ [Ações]                      │
└──────────────────────────────┘
```

---

## 3. Classes CSS Padrão

| Classe            | Descrição                              |
|-------------------|----------------------------------------|
| `.card`           | Container principal                    |
| `.cardHeader`     | Cabeçalho com ícone e título           |
| `.cardIcon`       | Ícone do card (emoji ou SVG)           |
| `.cardTitle`      | Título do card                         |
| `.cardBadge`      | Badge de status (carência, vencimento) |
| `.cardBody`       | Corpo com dados                        |
| `.cardActions`    | Área de botões de ação                 |

---

## 4. Dimensões

- **background:** `#1a241a` ou `--color-surface`
- **border-radius:** `--radius-md` (8px)
- **padding:** `--space-md` a `--space-lg`
- **gap entre cards:** `--space-sm` a `--space-md`
