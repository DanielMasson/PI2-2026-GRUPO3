# Endpoints e Estrutura de Dados

> Estrutura de dados do **Propriedade Inteligente** no Firestore e operações CRUD.
> O app não possui API REST própria — toda comunicação é feita via Firebase SDK.

---

## 1. Arquitetura de Dados

```text
┌──────────────┐     ┌───────────────────────┐
│  React App   │────►│  Firebase SDK          │
│  (Cordova)   │◄────│  (Firestore + Auth)    │
└──────┬───────┘     └───────────┬───────────┘
       │                         │
       ▼                         ▼
  ┌─────────┐            ┌─────────────┐
  │ SQLite  │            │  Firestore  │
  │ (local) │ ◄──sync──► │  (remoto)   │
  └─────────┘            └─────────────┘
```

**Não existe API REST.** O Firebase SDK faz as chamadas diretamente ao Firestore.

---

## 2. Operações Firestore por Coleção

### 2.1. usuarios

| Operação | Método SDK | Caminho | Quem executa |
|----------|------------|---------|--------------|
| Criar    | `set()`    | `usuarios/{uid}` | Cadastro (auto) |
| Ler      | `get()`    | `usuarios/{uid}` | Login (auto) |
| Atualizar| `update()` | `usuarios/{uid}` | Perfil do usuário |

### 2.2. propriedade

| Operação | Método SDK | Caminho | Quem executa |
|----------|------------|---------|--------------|
| Criar    | `add()`    | `propriedade/` | Dono |
| Listar   | `where()`  | `propriedade/` (onde membros/{uid} existe) | Dono/Peão |
| Ler      | `get()`    | `propriedade/{id}` | Dono/Peão |
| Atualizar| `update()` | `propriedade/{id}` | Dono |
| Excluir  | `delete()` | `propriedade/{id}` | Dono |

### 2.3. propriedade/{id}/membros

| Operação | Método SDK | Caminho | Quem executa |
|----------|------------|---------|--------------|
| Criar    | `set()`    | `.../membros/{uid}` | Dono (convite) |
| Listar   | `get()`    | `.../membros/` | Dono/Peão |
| Excluir  | `delete()` | `.../membros/{uid}` | Dono |

### 2.4. propriedade/{id}/animais

| Operação | Método SDK | Caminho | Quem executa |
|----------|------------|---------|--------------|
| Criar    | `add()`    | `.../animais/` | Dono/Peão |
| Listar   | `get()`    | `.../animais/` | Dono/Peão |
| Ler      | `get()`    | `.../animais/{id}` | Dono/Peão |
| Atualizar| `update()` | `.../animais/{id}` | Dono |
| Excluir  | `update()` | `.../animais/{id}` (soft delete) | Dono |

### 2.5. Subcoleções de animais (vacinas, medicamentos, ocorrencias, pesagens, reproducao)

| Operação | Método SDK | Caminho | Quem executa |
|----------|------------|---------|--------------|
| Criar    | `add()`    | `.../animais/{id}/{sub}/` | Dono/Peão |
| Listar   | `get()`    | `.../animais/{id}/{sub}/` | Dono/Peão |
| Atualizar| `update()` | `.../animais/{id}/{sub}/{id}` | Dono |
| Excluir  | `delete()` | `.../animais/{id}/{sub}/{id}` | Dono |

---

## 3. Queries Comuns no Firestore

### Listar propriedades do usuário
```javascript
const snapshot = await db.collection('propriedade')
  .where(`membros.${user.uid}.cargo`, 'in', ['dono', 'peao'])
  .get()
```

### Listar animais ativos de uma propriedade
```javascript
const snapshot = await db.collection('propriedade')
  .doc(propriedadeId)
  .collection('animais')
  .where('deleted', '==', false)
  .where('status', '==', 'ativo')
  .orderBy('nome')
  .get()
```

### Vacinas próximas do vencimento
```javascript
const snapshot = await db.collectionGroup('vacinas')
  .where('proxima_dose', '<=', dataLimite)
  .get()
```

---

## 4. Autenticação Firebase

| Método                           | Uso                |
|----------------------------------|--------------------|
| `createUserWithEmailAndPassword` | Cadastro           |
| `signInWithEmailAndPassword`     | Login              |
| `sendPasswordResetEmail`         | Recuperação senha  |
| `updatePassword`                 | Criar nova senha   |
| `updateProfile`                  | Atualizar displayName |
| `signOut`                        | Logout             |
| `onAuthStateChanged`             | Listener de sessão |

---

## 5. Limitações do Firestore

| Limitação                | Valor           | Impacto no projeto           |
|--------------------------|:---------------:|------------------------------|
| Tamanho de documento     | 1 MB            | Nenhum (dados pequenos)      |
| Writes por segundo       | 1 por doc       | Sync em batch resolve        |
| Reads por dia            | 50.000 (free)   | Suficiente para MVP          |
| Collection group queries | Requer índice   | Criar índices para vacinas   |
