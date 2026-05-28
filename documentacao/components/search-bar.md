# Componente SearchBar

> **Status:** Implementado (inline) | **Padrão reutilizado** em Dashboard, ListaAnimais
>
> Campo de busca com ícone de lupa e filtragem em tempo real.

---

## 1. Uso (padrão atual)

```jsx
const [busca, setBusca] = useState('')

<div className={styles.searchWrapper}>
  <span className={styles.searchIcon}>🔍</span>
  <input
    className={styles.searchInput}
    type="text"
    placeholder="Buscar propriedade..."
    value={busca}
    onChange={e => setBusca(e.target.value)}
  />
</div>
```

---

## 2. Comportamento

- **Filtragem em tempo real** (sem botão de busca)
- Filtra por múltiplos campos (nome, brinco, localização)
- Case-insensitive
- Sem debounce (executa a cada keystroke)

---

## 3. Estrutura

```text
┌──────────────────────────────────┐
│ 🔍 Buscar propriedade...        │
└──────────────────────────────────┘
```

| Elemento      | Descrição                          |
|---------------|------------------------------------|
| `searchIcon`  | Ícone de lupa à esquerda           |
| `searchInput` | Input de texto com placeholder     |

---

## 4. Dimensões

- **Altura:** 48px (touch target mínimo)
- **Border-radius:** `--radius-md`
- **Padding:** `--space-md`
- **Ícone:** Alinhado à esquerda, centralizado verticalmente

---

## 5. Uso no Projeto

| Tela            | Busca por                              |
|-----------------|----------------------------------------|
| Dashboard       | Nome, brinco, localização da propriedade|
| ListaAnimais    | Nome, brinco, ID do animal             |
| HealthModule    | Nome do animal na lista de vacinas     |
