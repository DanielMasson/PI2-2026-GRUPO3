# Componente Modal

> **Status:** A fazer | **Prioridade:** Alta (Sprint 8)
>
> Modal/diálogo para confirmações, formulários inline e exibição de detalhes.

---

## 1. Uso (planejado)

```jsx
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  titulo="Excluir animal"
  tipo="confirmacao"
>
  <p>Tem certeza que deseja excluir Mimosa (BR-00142)?</p>
  <div className={styles.modalActions}>
    <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
    <Button variant="danger" onClick={handleExcluir}>Excluir</Button>
  </div>
</Modal>
```

---

## 2. Props (planejadas)

| Prop       | Tipo      | Obrigatório | Descrição                                    |
|------------|-----------|:-----------:|----------------------------------------------|
| `isOpen`   | boolean   | Sim         | Controla visibilidade do modal               |
| `onClose`  | function  | Sim         | Handler para fechar o modal                  |
| `titulo`   | string    | Sim         | Título do modal                              |
| `children` | node      | Sim         | Conteúdo do modal                            |
| `tipo`     | string    | Não         | `'confirmacao'` / `'formulario'` / `'info'`  |

---

## 3. Tipos de Modal

### Confirmação
- Título + mensagem + botões Confirmar/Cancelar
- **Uso:** Excluir animal, remover membro, baixa de animal

### Formulário
- Título + campos de input + botões Salvar/Cancelar
- **Uso:** Adicionar propriedade, registrar vacina rápida

### Informação
- Título + conteúdo + botão Fechar
- **Uso:** Detalhes de um registro, termos de uso

---

## 4. Comportamento

- Overlay escuro (backdrop) com opacidade 0.5
- Modal centralizado vertical e horizontalmente
- Fechar ao clicar no backdrop
- Fechar ao pressionar Escape
- Ficar dentro do modal (focus trap)
- Animação de entrada/saída

---

## 5. Dimensões

- **Largura máxima:** 400px (mobile: 90vw)
- **Border-radius:** `--radius-lg` (16px)
- **Padding:** `--space-lg` (24px)
- **Backdrop:** rgba(0, 0, 0, 0.5)
- **z-index:** 1000

---

## 6. Acessibilidade

- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby` vinculado ao título
- Focus trap (tab não sai do modal)
- Fechar com Escape
