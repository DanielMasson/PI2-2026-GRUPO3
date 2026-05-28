# Rotas do Aplicativo

> Todas as rotas do **Propriedade Inteligente** definidas no `App.jsx`.
> Decisões: HashRouter, proteção por componentes wrapper (RotaPrivada), sem transições, sem deep linking no MVP.

---

## 1. Tipo de Router

**HashRouter** — URLs com `#` (ex: `http://localhost/#/login`).

**Justificativa:**
- Funciona nativamente no Cordova WebView sem configuração de servidor
- Não requer fallback de rotas no servidor
- Compatível com `file://` protocol (APK offline)

**Implementação:**
```jsx
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          {/* rotas aqui */}
        </Routes>
      </AuthProvider>
    </HashRouter>
  )
}
```

---

## 2. Mapa Completo de Rotas

### 2.1. Rotas Públicas (não requerem autenticação)

| Rota                  | Componente       | Descrição                    |
|-----------------------|------------------|------------------------------|
| `/login`              | Login            | Tela de login                |
| `/cadastro`           | Register         | Cadastro de usuário          |
| `/esqueci-senha`      | ForgotPassword   | Recuperação de senha         |
| `/verificar-codigo`   | VerifyCode       | Verificação de código (4 dígitos) |
| `/criar-senha`        | CreatePassword   | Criação de nova senha        |

### 2.2. Rotas Privadas (requerem autenticação)

| Rota                                              | Componente           | Guarda            | Descrição              |
|---------------------------------------------------|----------------------|-------------------|------------------------|
| `/dashboard`                                      | Dashboard            | RotaPrivada       | Lista de propriedades  |
| `/propriedade/:propriedadeId`                     | PropertyHome         | RotaPrivada       | Painel da propriedade  |
| `/propriedade/:propriedadeId/cadastro-animal`     | CadastroAnimal       | RotaPrivada       | Cadastro de animal     |
| `/propriedade/:propriedadeId/animais`             | ListaAnimais         | RotaPrivada       | Lista de animais       |
| `/propriedade/:propriedadeId/animal/:animalId`    | FichaAnimal          | RotaPrivada       | Ficha individual       |
| `/propriedade/:propriedadeId/saude`               | HealthModule         | RotaPrivada       | Módulo de saúde (abas) |
| `/propriedade/:propriedadeId/reproducao`          | Reproducao           | RotaPrivada       | Controle reprodutivo   |
| `/propriedade/:propriedadeId/producao-leite`      | ProducaoLeite        | RotaPrivada       | Produção leiteira      |
| `/propriedade/:propriedadeId/financeiro`          | Financeiro           | RotaPrivada + Dono| Financeiro             |
| `/configuracoes`                                  | Configuracoes        | RotaPrivada       | Configurações          |
| `/perfil`                                         | Perfil               | RotaPrivada       | Perfil do usuário      |

### 2.3. Rota Raiz

| Rota | Comportamento                        |
|------|--------------------------------------|
| `/`  | `<Navigate to="/login" />` (redireciona) |

---

## 3. Diagrama de Rotas

```text
HashRouter
│
├── / (→ /login)
│
├── Rotas Públicas
│   ├── /login                  → Login
│   ├── /cadastro               → Register
│   ├── /esqueci-senha          → ForgotPassword
│   ├── /verificar-codigo       → VerifyCode
│   └── /criar-senha            → CreatePassword
│
└── Rotas Privadas (RotaPrivada)
    ├── /dashboard              → Dashboard
    │
    └── /propriedade/:id
        ├── /                   → PropertyHome
        ├── /cadastro-animal    → CadastroAnimal
        ├── /animais            → ListaAnimais
        ├── /animal/:animalId   → FichaAnimal
        ├── /saude              → HealthModule
        ├── /reproducao         → Reproducao
        ├── /producao-leite     → ProducaoLeite
        └── /financeiro         → Financeiro (RotaPermissao: Dono)
    
    ├── /configuracoes          → Configuracoes
    └── /perfil                 → Perfil
```

---

## 4. Componentes de Guarda

### 4.1. RotaPrivada

Verifica se o usuário está autenticado via Firebase Auth.

```jsx
function RotaPrivada({ children }) {
  const { usuario, carregando } = useAuth()

  if (carregando) return <TelaCarregamento />
  if (!usuario) return <Navigate to="/login" />

  return children
}
```

### 4.2. RotaPermissao

Verifica se o usuário tem o cargo necessário na propriedade.

```jsx
function RotaPermissao({ children, cargoNecessario }) {
  const { propriedadeId } = useParams()
  const { cargo, carregando } = usePermissao(propriedadeId)

  if (carregando) return <TelaCarregamento />
  if (!cargo) return <Navigate to="/dashboard" />

  if (cargoNecessario === 'dono' && cargo !== 'dono') {
    return <Navigate to={`/propriedade/${propriedadeId}`} />
  }

  return children
}
```

### 4.3. Uso Combinado

```jsx
<Route path="/propriedade/:propriedadeId/financeiro" element={
  <RotaPrivada>
    <RotaPermissao cargoNecessario="dono">
      <Financeiro />
    </RotaPermissao>
  </RotaPrivada>
} />
```

---

## 5. Parâmetros de Rota

| Parâmetro        | Tipo   | Obrigatório | Descrição                            |
|------------------|--------|:-----------:|--------------------------------------|
| `:propriedadeId` | string | Sim         | UUID da propriedade                  |
| `:animalId`      | string | Sim         | UUID do animal                       |

### Acesso aos parâmetros

```jsx
const { propriedadeId, animalId } = useParams()
```

---

## 6. Estado de Navegação

### Via `state` (useLocation)

| Rota                | State esperado                    | Descrição                    |
|---------------------|-----------------------------------|------------------------------|
| `/verificar-codigo` | `{ method: 'email' \| 'sms' }`   | Método de envio do código    |
| `/cadastro-animal`  | `{ edit: 'uuid' }` (query param) | Modo edição de animal        |

```javascript
// Navegar com estado
navigate('/verificar-codigo', { state: { method: 'email' } })

// Ler estado
const location = useLocation()
const method = location.state?.method || 'email'
```

---

## 7. Fluxos de Navegação Principais

### 7.1. Fluxo de Login

```text
/login → [sucesso] → /dashboard
/login → "Esqueceu a senha?" → /esqueci-senha
/login → "Cadastre-se" → /cadastro → [sucesso] → /login
```

### 7.2. Fluxo de Recuperação de Senha

```text
/esqueci-senha → /verificar-codigo → /criar-senha → /login
```

### 7.3. Fluxo Principal (pós-login)

```text
/dashboard → [clica propriedade] → /propriedade/:id
/propriedade/:id → [clica animais] → /propriedade/:id/animais
/propriedade/:id/animais → [clica animal] → /propriedade/:id/animal/:animalId
/propriedade/:id → [clica saúde] → /propriedade/:id/saude
/propriedade/:id → [clica reprodução] → /propriedade/:id/reproducao
/propriedade/:id → [clica financeiro] → /propriedade/:id/financeiro
```

### 7.4. Fluxo de Cadastro de Animal

```text
/propriedade/:id → [+] → /propriedade/:id/cadastro-animal
/propriedade/:id/animais → [+] → /propriedade/:id/cadastro-animal
/propriedade/:id/animal/:id → [editar] → /propriedade/:id/cadastro-animal?edit=:uuid
```

---

## 8. Decisões Registradas

| Decisão               | Escolha                                  |
|-----------------------|------------------------------------------|
| Tipo de router        | HashRouter (compatível com Cordova)      |
| Proteção de rotas     | Componentes wrapper (RotaPrivada)        |
| Permissão por cargo   | RotaPermissao (Dono vs Peão)             |
| Transições            | Nenhuma (navegação instantânea)          |
| Deep linking          | Não no MVP                               |
| Rota padrão           | `/` redireciona para `/login`            |
| Tela não encontrada   | Redireciona para `/dashboard` (se logado) ou `/login` |
