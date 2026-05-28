# Cadastro/Edição de Animal

> **Rota:** `/propriedade/:propriedadeId/cadastro-animal` | **Status:** Implementada | **Sprint:** 5
>
> Formulário para cadastrar um novo animal ou editar um existente.

---

## 1. Arquivo

- **Componente:** `pages/AnimalRegistration/index.jsx`
- **Estilo:** `pages/AnimalRegistration/AnimalRegistration.module.css`

---

## 2. Wireframe

```text
┌──────────────────────────────────┐
│ [←] Cadastro de Animal           │
├──────────────────────────────────┤
│                                  │
│ Nome do animal                   │
│ [________________________]       │
│                                  │
│ Brinco/Tag                       │
│ [________________________]       │
│                                  │
│ Espécie                          │
│ [▼ Bovino / Ovino / Suíno]      │
│                                  │
│ Raça                             │
│ [________________________]       │
│                                  │
│ Sexo                             │
│ ( ) Macho  ( ) Fêmea            │
│                                  │
│ Peso (kg)                        │
│ [________________________]       │
│                                  │
│ Data de Nascimento               │
│ [__/__/____]                     │
│                                  │
│ Pelagem/Sinais                   │
│ [________________________]       │
│                                  │
│ Genética                         │
│ [________________________]       │
│                                  │
│ Origem                           │
│ [________________________]       │
│                                  │
│ [Limpar]          [Salvar]       │
│                                  │
│ ✓ Animal salvo com sucesso!      │
└──────────────────────────────────┘
```

---

## 3. Campos

### Obrigatórios (existentes)
| Campo              | Tipo     | Validação                           |
|--------------------|----------|-------------------------------------|
| Nome do animal     | text     | Obrigatório                         |
| Brinco/Tag         | text     | Obrigatório                         |
| Raça               | text     | Obrigatório                         |
| Peso (kg)          | number   | Obrigatório, > 0, ≤ 1500           |
| Data de nascimento | date     | Obrigatório                         |
| Sexo               | radio    | Obrigatório (Macho / Fêmea)         |

### Obrigatórios (adicionar)
| Campo     | Tipo     | Validação                |
|-----------|----------|--------------------------|
| Espécie   | select   | Obrigatório              |

### Opcionais
| Campo         | Tipo   | Descrição                      |
|---------------|--------|--------------------------------|
| Pelagem       | text   | Descrição visual               |
| Genética      | text   | Composição genética            |
| Origem        | text   | Histórico de procedência       |
| Mãe (matriz)  | select | Busca de fêmeas da propriedade |
| Pai (touro)   | select | Busca de machos da propriedade |
| Valor compra  | number | Valor pago na aquisição        |

---

## 4. Comportamento

### Modo Cadastro (padrão)
- Todos os campos vazios
- Botão "Salvar animal" → cria registro

### Modo Edição (com `?edit=:uuid`)
- Campos preenchidos com dados existentes
- Botão "Salvar alterações" → atualiza registro

### Validações (existentes)
```javascript
function validarForm({ nome, brinco, raca, peso, dataNascimento, sexo }) {
  const erros = {}
  if (!nome.trim()) erros.nome = 'Nome é obrigatório'
  if (!brinco.trim()) erros.brinco = 'Brinco/Tag é obrigatório'
  if (!raca.trim()) erros.raca = 'Raça é obrigatória'
  if (!peso) erros.peso = 'Peso é obrigatório'
  else if (isNaN(Number(peso)) || Number(peso) <= 0) erros.peso = 'Peso inválido'
  if (!dataNascimento) erros.dataNascimento = 'Data de nascimento é obrigatória'
  if (!sexo) erros.sexo = 'Selecione o sexo'
  return erros
}
```

### Após salvar
- Exibe mensagem de sucesso (3 segundos)
- Limpa formulário (modo cadastro)
- ou Volta para lista (modo edição)

---

## 5. Permissões

- Dono e Peão: cadastrar novo animal
- Dono: editar animal existente
- Peão: não pode acessar modo edição
