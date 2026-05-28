# Tratamento de Erros

> Padrão de tratamento de erros do **Propriedade Inteligente**.
> Categorias, mensagens em português e como exibir na UI.

---

## 1. Categorias de Erro

| Categoria          | Origem                    | Exemplo                              |
|--------------------|---------------------------|--------------------------------------|
| Validação          | Frontend (formulários)    | Campo obrigatório vazio              |
| Autenticação       | Firebase Auth             | E-mail/senha incorretos              |
| Permissão          | Firestore Rules           | Peão tenta editar                    |
| Conexão            | Rede/Internet             | Sem conexão, timeout                 |
| Banco local        | SQLite                    | Tabela não existe, disco cheio       |
| Sincronização      | SyncService               | Falha ao pushar para Firestore       |
| Dados              | Lógica de negócio         | GMD impossível (1 pesagem só)        |
| Desconhecido       | Erro inesperado           | Exception não tratada                |

---

## 2. Mensagens de Erro em Português

### 2.1. Validação

| Campo                | Condição             | Mensagem                               |
|----------------------|----------------------|----------------------------------------|
| Nome                 | Vazio                | "Nome é obrigatório"                   |
| E-mail               | Vazio                | "E-mail é obrigatório"                 |
| E-mail               | Formato inválido     | "E-mail inválido"                      |
| Telefone             | Vazio                | "Telefone é obrigatório"               |
| Senha                | Vazio                | "Crie uma senha"                       |
| Senha                | < 6 caracteres       | "Mínimo de 6 caracteres"               |
| Confirmar senha      | Não coincide         | "As senhas não coincidem"              |
| Espécie              | Vazio                | "Selecione a espécie"                  |
| Raça                 | Vazio                | "Raça é obrigatória"                   |
| Sexo                 | Vazio                | "Selecione o sexo"                     |
| Data nascimento      | Vazio                | "Data de nascimento é obrigatória"     |
| Peso                 | Vazio                | "Peso é obrigatório"                   |
| Peso                 | ≤ 0 ou > 1500        | "Peso deve estar entre 1 e 1500 kg"    |
| Brinco               | Vazio                | "Brinco/Tag é obrigatório"             |
| Vacina               | Vazio                | "Selecione a vacina"                   |
| Lote                 | Vazio                | "Informe o lote"                       |
| Responsável          | Vazio                | "Informe o responsável"                |
| Data aplicação       | Vazio                | "Informe a data de aplicação"          |
| Tipo cobertura       | Vazio                | "Selecione o tipo de cobertura"        |
| Data cobertura       | Futura               | "Data não pode ser futura"             |

### 2.2. Autenticação (Firebase Auth)

| Erro Firebase                    | Mensagem exibida                       |
|----------------------------------|----------------------------------------|
| `auth/user-not-found`            | "E-mail ou senha incorretos."          |
| `auth/wrong-password`            | "E-mail ou senha incorretos."          |
| `auth/email-already-in-use`      | "Este e-mail já está cadastrado."      |
| `auth/invalid-email`             | "E-mail inválido."                     |
| `auth/weak-password`             | "Senha muito fraca. Use 6+ caracteres."|
| `auth/too-many-requests`         | "Muitas tentativas. Tente mais tarde." |
| `auth/network-request-failed`    | "Sem conexão. Tente novamente."        |
| `auth/operation-not-allowed`     | "Operação não permitida."              |

### 2.3. Permissão

| Ação tentada              | Mensagem                               |
|---------------------------|----------------------------------------|
| Peão tenta editar         | "Apenas o proprietário pode editar."   |
| Peão tenta excluir        | "Apenas o proprietário pode excluir."  |
| Peão acessa financeiro    | "Acesso restrito ao proprietário."     |
| Usuário não é membro      | "Você não tem acesso a esta propriedade."|

### 2.4. Conexão

| Situação                 | Mensagem                               |
|--------------------------|----------------------------------------|
| Sem internet             | "Sem conexão. Dados salvos localmente."|
| Timeout                  | "Conexão lenta. Tente novamente."      |
| Serviço indisponível     | "Serviço temporariamente indisponível."|
| Reconexão                | "Conexão restaurada. Sincronizando..." |

### 2.5. Sincronização

| Situação                 | Mensagem                               |
|--------------------------|----------------------------------------|
| Falha ao sync            | "Erro ao sincronizar. Tentando novamente."|
| Dados conflitantes       | "Dados atualizados de outro dispositivo."|
| Sync completa            | "Dados sincronizados com sucesso."     |

---

## 3. Como Exibir Erros na UI

### 3.1. Erros de Validação → Inline (abaixo do campo)

```jsx
<Input
  id="nome"
  error={erros.nome}  // "Nome é obrigatório"
/>
```

Renderiza:
```text
┌──────────────────────────┐
│ Nome                     │
│ [________________________]│
│ Nome é obrigatório       │ ← texto vermelho abaixo
└──────────────────────────┘
```

### 3.2. Erros de Formulário → Toast no topo

```jsx
{formError && (
  <div className={styles.formError}>
    {formError}
  </div>
)}
```

Renderiza:
```text
┌──────────────────────────┐
│ ⚠ E-mail ou senha        │
│   incorretos.             │ ← banner vermelho no topo do form
├──────────────────────────┤
│ [E-mail]                 │
│ [Senha]                  │
└──────────────────────────┘
```

### 3.3. Erros de Rede/Conexão → Banner global

```jsx
function ConnectionBanner() {
  const { isOnline } = useOffline()

  if (isOnline) return null

  return (
    <div className={styles.offlineBanner}>
      ☁️❌ Sem conexão. Dados salvos localmente.
    </div>
  )
}
```

Renderiza:
```text
┌──────────────────────────────────┐
│ ☁️❌ Sem conexão. Dados salvos   │
│    localmente.                   │ ← banner fixo no topo
├──────────────────────────────────┤
│ ... conteúdo da tela ...         │
└──────────────────────────────────┘
```

### 3.4. Erros de Sincronização → Badge no BottomNav

```jsx
function SyncBadge() {
  const { status, pendentes, erro } = useSync()

  if (status === 'erro') {
    return <span className={styles.syncError}>☁️⚠ Erro na sync</span>
  }
  if (pendentes > 0) {
    return <span className={styles.syncPending}>☁️📤 {pendentes}</span>
  }
  return <span className={styles.synced}>☁️✅</span>
}
```

### 3.5. Erros de Permissão → Toast temporário

```jsx
function Toast({ mensagem, tipo, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`${styles.toast} ${styles[tipo]}`}>
      {mensagem}
    </div>
  )
}
```

Renderiza:
```text
┌──────────────────────────────────┐
│ ... conteúdo da tela ...         │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ ⚠ Apenas o proprietário     │ │ ← toast no rodapé
│ │   pode editar.              │ │   desaparece em 4s
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

---

## 4. Padrão de Tratamento em Services

### 4.1. Service de negócio

```javascript
// animalService.js
export async function criarAnimal(dados) {
  // Validação
  const erros = validarAnimal(dados)
  if (Object.keys(erros).length > 0) {
    throw new ValidationError(erros)
  }

  try {
    const uuid = await sqlite.inserirAnimal(dados)
    await sync.pendenciar('animais', uuid)
    return { ...dados, uuid }
  } catch (erro) {
    if (erro.code === 'SQLITE_FULL') {
      throw new AppError('Armazenamento cheio. Limpe dados desnecessários.', 'storage')
    }
    throw new AppError('Erro ao salvar animal. Tente novamente.', 'unknown')
  }
}
```

### 4.2. Classes de erro customizadas

```javascript
// utils/errors.js

export class AppError extends Error {
  constructor(mensagem, tipo = 'unknown', detalhes = null) {
    super(mensagem)
    this.name = 'AppError'
    this.tipo = tipo       // 'validation' | 'auth' | 'permission' | 'network' | 'storage' | 'sync' | 'unknown'
    this.detalhes = detalhes
  }
}

export class ValidationError extends AppError {
  constructor(campos) {
    super('Erro de validação', 'validation')
    this.name = 'ValidationError'
    this.campos = campos    // { nome: "Nome é obrigatório", email: "E-mail inválido" }
  }
}
```

### 4.3. Tratamento no componente

```jsx
async function handleSubmit(e) {
  e.preventDefault()
  setFormError('')
  setErros({})

  try {
    await animalService.criarAnimal(dados)
    setSucesso('Animal salvo com sucesso!')
  } catch (erro) {
    if (erro instanceof ValidationError) {
      setErros(erro.campos)           // Erros inline por campo
    } else if (erro.tipo === 'network') {
      setFormError(erro.message)      // Banner no topo
    } else if (erro.tipo === 'permission') {
      showToast(erro.message, 'warning') // Toast
    } else {
      setFormError('Ocorreu um erro inesperado. Tente novamente.')
    }
  }
}
```

---

## 5. Logging de Erros

### 5.1. Log local (SQLite)

```sql
CREATE TABLE error_log (
  uuid        TEXT PRIMARY KEY,
  tabela      TEXT,          -- tabela afetada
  registro_uuid TEXT,        -- registro que falhou
  tipo        TEXT,          -- 'conexao' | 'permissao' | 'desconhecido'
  mensagem    TEXT,
  stack       TEXT,
  created_at  TEXT
);
```

### 5.2. Função de log

```javascript
// utils/logger.js
export async function registrarErro(tabela, registroUuid, tipo, mensagem) {
  await getDb().executeSql(
    `INSERT INTO error_log (uuid, tabela, registro_uuid, tipo, mensagem, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [gerarUUID(), tabela, registroUuid, tipo, mensagem, new Date().toISOString()]
  )
}
```

---

## 6. Resumo de Exibição

| Tipo de erro     | Onde exibir           | Duração     |
|------------------|-----------------------|-------------|
| Validação        | Inline (campo)        | Até corrigir|
| Formulário       | Topo do form          | Até corrigir|
| Permissão        | Toast (rodapé)        | 4 segundos  |
| Conexão          | Banner global (topo)  | Enquanto offline|
| Sync             | Badge no BottomNav    | Até resolver|
| Armazenamento    | Modal de alerta       | Até fechar  |
| Desconhecido     | Toast (rodapé)        | 4 segundos  |
