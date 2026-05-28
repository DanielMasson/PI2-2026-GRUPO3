# Componente StatBox

> **Status:** Implementado (inline no PropertyHome) | **Padrão reutilizado**
>
> Exibe um valor numérico com label e unidade de medida.

---

## 1. Uso (padrão atual)

```jsx
<StatBox
  label="Total"
  value={240}
  unit="animais"
  sub="8 lotes ativos"
  className={styles.herdStat}
/>
```

---

## 2. Props

| Prop        | Tipo      | Obrigatório | Descrição                          |
|-------------|-----------|:-----------:|------------------------------------|
| `label`     | string    | Sim         | Texto descritivo (ex: "Total")     |
| `value`     | number    | Sim         | Valor numérico (ex: 240)           |
| `unit`      | string    | Não         | Unidade (ex: "L", "kg", "animais")|
| `sub`       | string    | Não         | Texto secundário abaixo do valor   |
| `className` | string    | Não         | Classe CSS customizada             |

---

## 3. Estrutura

```text
┌──────────────────────┐
│ LABEL                │
│ 240 animais          │
│ 8 lotes ativos       │
└──────────────────────┘
```

| Elemento       | Descrição                            |
|----------------|--------------------------------------|
| `herdStatLabel`| Texto do label em caixa alta         |
| `herdStatValue`| Valor numérico em destaque           |
| `milkStatUnit` | Unidade ao lado do valor             |
| `herdStatSub`  | Texto secundário com opacidade       |

---

## 4. Dimensões

- **Background:** `rgba(255,255,255,0.04)` ou `--color-surface`
- **Border:** `1px solid rgba(255,255,255,0.06)`
- **Border-radius:** `--radius-sm`
- **Padding:** `--space-sm` + `--space-md`
- **Font-size do valor:** `--font-size-lg`

---

## 5. Uso no Projeto

| Tela              | Valores exibidos                              |
|-------------------|-----------------------------------------------|
| PropertyHome      | Total animais, lotes, prenhas, machos, fêmeas |
| PropertyHome      | Litros coletados, média/vaca, lactação, meta  |
| PropertyHome      | Receita, despesas, saldo                      |
| AnimalProfile     | Peso atual, GMD, ECC                          |
