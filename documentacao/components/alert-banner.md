# Componente AlertBanner

> **Status:** Implementado (inline no PropertyHome) | **Padrão reutilizado**
>
> Exibe alertas visuais com ícone, título, descrição e nível de severidade.

---

## 1. Uso (padrão atual)

```jsx
<div className={`${styles.alertCard} ${styles.alertDanger}`}>
  <span className={styles.alertIcon}>🩺</span>
  <div>
    <div className={styles.alertTitle}>Vacinação em atraso</div>
    <div className={styles.alertDesc}>14 animais com vacina vencida no lote A3</div>
    <div className={styles.alertTime}>Há 2 horas</div>
  </div>
</div>
```

---

## 2. Tipos de Alerta

| Tipo       | Borda esquerda       | Fundo gradiente             | Uso                        |
|------------|----------------------|-----------------------------|----------------------------|
| `danger`   | `#c0392b` (vermelho) | `rgba(192,57,43,0.07)`     | Vacina vencida, óbito      |
| `warning`  | `#e67e22` (laranja)  | `rgba(230,126,34,0.07)`    | Produção abaixo da meta    |
| `info`     | `#2980b9` (azul)     | `rgba(41,128,185,0.07)`    | Informações gerais         |

---

## 3. Estrutura

```text
┌──────────────────────────────────┐
│ 🩺 Vacinação em atraso          │
│ 14 animais com vacina vencida    │
│ Há 2 horas                       │
└──────────────────────────────────┘
```

| Elemento     | Descrição                           |
|--------------|-------------------------------------|
| `alertIcon`  | Emoji ou SVG à esquerda             |
| `alertTitle` | Título em negrito                   |
| `alertDesc`  | Descrição em texto menor            |
| `alertTime`  | Timestamp com opacidade reduzida    |

---

## 4. Dimensões

- **Borda esquerda:** 3px sólida
- **Border-radius:** `--radius-md`
- **Padding:** `--space-md` + `--space-lg`
- **Background:** gradiente lateral da cor de severidade

---

## 5. Estado Vazio

Quando não há alertas:
```jsx
<div className={styles.noAlerts}>
  Nenhum alerta no momento ✓
</div>
```

- Borda tracejada
- Texto centralizado em cinza
