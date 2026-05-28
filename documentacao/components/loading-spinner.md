# Componente LoadingSpinner

> **Status:** Implementado (inline via Button isLoading) | **Padrão simples**
>
> Indicador de carregamento usado em botões e durante operações assíncronas.

---

## 1. Uso Atual (via Button)

```jsx
<Button isLoading={isLoading}>
  Salvar animal
</Button>
// Quando isLoading=true, exibe "Carregando..." no lugar do children
```

---

## 2. Padrão de Loading

### Em Botões
- Texto muda para "Carregando..."
- Botão desabilitado (`disabled`)
- Cursor muda para `not-allowed`

### Em Telas (planejado)
- Spinner centralizado na tela
- Usado durante carregamento inicial de dados do SQLite

---

## 3. Implementação Futura (Componente Dedicado)

```jsx
function LoadingSpinner({ size = 'md', texto }) {
  return (
    <div className={styles.spinnerWrapper}>
      <div className={`${styles.spinner} ${styles[size]}`} />
      {texto && <p className={styles.spinnerText}>{texto}</p>}
    </div>
  )
}
```

### Props planejadas

| Prop     | Tipo   | Obrigatório | Descrição                          |
|----------|--------|:-----------:|------------------------------------|
| `size`   | string | Não         | `'sm'` (16px), `'md'` (32px), `'lg'` (48px) |
| `texto`  | string | Não         | Texto abaixo do spinner            |

---

## 4. Uso no Projeto

| Local                    | Tipo        | Descrição                              |
|--------------------------|-------------|----------------------------------------|
| Button (isLoading)       | Texto       | "Carregando..." no botão               |
| Login submit             | Texto       | Loading no botão de login              |
| Cadastro submit          | Texto       | Loading no botão de cadastro           |
| Sync automática (futuro) | Spinner     | Indicador de sincronização em background|
