# Fluxo de Navegação entre Telas

> Diagrama completo de navegação do **Propriedade Inteligente**.
> Mostra como o usuário transita entre telas e quais ações disparam cada navegação.

---

## 1. Fluxo Geral do Aplicativo

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE NAVEGAÇÃO                          │
│                                                                     │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐                   │
│  │   LOGIN   │───►│ DASHBOARD │───►│PROPRIEDADE│                   │
│  └─────┬─────┘    └─────┬─────┘    └─────┬─────┘                   │
│        │                │                │                          │
│        │                │        ┌───────┼───────┬───────┐         │
│        │                │        ▼       ▼       ▼       ▼         │
│        │                │   ┌────────┐┌──────┐┌──────┐┌────────┐  │
│        │                │   │ANIMAIS ││SAÚDE ││REPROD││FINANCE.│  │
│        │                │   └───┬────┘└──────┘└──────┘└────────┘  │
│        │                │       │                                   │
│        │                │       ▼                                   │
│        │                │  ┌──────────┐                            │
│        │                │  │  FICHA   │                            │
│        │                │  │  ANIMAL  │                            │
│        │                │  └──────────┘                            │
│        │                │                                           │
│        ▼                ▼                                           │
│  ┌───────────┐    ┌───────────┐                                    │
│  │  CADASTRO │    │  CONFIG.  │                                    │
│  └───────────┘    │  PERFIL   │                                    │
│                   └───────────┘                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Fluxo de Autenticação (Detalhado)

```text
┌────────┐     ┌────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│ LOGIN  │────►│ESQUECI │────►│ VERIFICAR  │────►│   CRIAR    │────►│   LOGIN    │
│        │     │ SENHA  │     │   CÓDIGO   │     │   SENHA    │     │ (re-login) │
└───┬────┘     └────────┘     └────────────┘     └────────────┘     └────────────┘
    │
    │ "Cadastre-se"
    ▼
┌────────┐     ┌────────┐
│CADASTRO│────►│ LOGIN  │
└────────┘     └────────┘

Navegação com estado:
  /esqueci-senha → /verificar-codigo  { state: { method: 'email' } }
```

---

## 3. Fluxo do Dashboard

```text
                         ┌──────────────┐
                         │   DASHBOARD  │
                         │              │
                         │ [prop cards] │
                         │ [busca]      │
                         │ [+] add      │
                         └──────┬───────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                  │
              ▼                 ▼                  ▼
    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
    │  PROPRIEDADE │   │  CONFIGURAÇÕES│   │    PERFIL    │
    │    HOME      │   │              │   │              │
    └──────────────┘   └──────────────┘   └──────────────┘
```

---

## 4. Fluxo da Propriedade (Detalhado)

```text
                    ┌───────────────────────┐
                    │   PROPERTY HOME       │
                    │                       │
                    │ Alertas │ Leite │ Reb.│
                    │ Financeiro            │
                    └───────────┬───────────┘
                                │
     ┌──────────┬───────────┬───┼────┬───────────┬──────────┐
     │          │           │   │    │           │          │
     ▼          ▼           ▼   │    ▼           ▼          ▼
┌─────────┐┌────────┐┌─────────┐│┌─────────┐┌────────┐┌─────────┐
│ ANIMAIS ││ SAÚDE  ││ REPROD. │││  LEITE  ││FINANCE.││ CONFIG. │
│ (lista) ││(abas)  ││         │││         ││        ││         │
└────┬────┘└────────┘└─────────┘│└─────────┘└────────┘└─────────┘
     │                          │
     │  [clica animal]          │
     ▼                          │
┌──────────┐                    │
│  FICHA   │◄───────────────────┘
│  ANIMAL  │
│          │
│ [vacina] │──► /saude?animal=:uuid
│ [pesagem]│──► modal inline
│ [ocorr.] │──► modal inline
│ [editar] │──► /cadastro-animal?edit=:uuid
└──────────┘
```

---

## 5. Fluxo do Módulo de Saúde (Abas)

```text
┌──────────────────────────────────────────┐
│           HEALTH MODULE                  │
│                                          │
│  [Vacinas] [Medicamentos] [Ocorrências]  │
│  [Localização]                           │
│                                          │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────┐  ┌────────────┐          │
│  │   VACINAS  │  │MEDICAMENTOS│          │
│  │            │  │            │          │
│  │ [calendário]│  │ [tratam.] │          │
│  │ [registrar]│  │ [registrar]│          │
│  └────────────┘  └────────────┘          │
│                                          │
│  ┌────────────┐  ┌────────────┐          │
│  │ OCORRÊNCIAS│  │ LOCALIZAÇÃO│          │
│  │            │  │            │          │
│  │ [sintomas] │  │ [áreas]    │          │
│  │ [resultado]│  │ [moviment.]│          │
│  └────────────┘  └────────────┘          │
└──────────────────────────────────────────┘
```

---

## 6. Fluxo de Cadastro de Animal

```text
┌──────────────────┐
│ CADASTRO ANIMAL  │
│                  │
│ [campos form]    │
│                  │
│ [Limpar] [Salvar]│
└────────┬─────────┘
         │
         │ Salvar sucesso
         ▼
    ┌──────────┐
    │ Mensagem │
    │ sucesso  │
    │ (3s)     │
    └──────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  Limpar    Voltar
  form      para lista
```

---

## 7. Navegação via BottomNav

### Em Dashboard
```text
[🏠 Home]  →  /dashboard (atual)
[  ＋  ]   →  Modal "Adicionar propriedade"
[⚙️ Ajustes] →  /configuracoes
```

### Em PropertyHome
```text
[🏠] →  /propriedade/:id (atual)
[🐄] →  /propriedade/:id/animais
[🌾] →  /propriedade/:id/lotes (futuro)
[📋] →  /propriedade/:id/tarefas (futuro)
[👤] →  /perfil
```

---

## 8. Navegação com Parâmetros

| Origem                          | Destino                                     | Parâmetros                      |
|---------------------------------|---------------------------------------------|---------------------------------|
| Dashboard (card propriedade)    | `/propriedade/:propriedadeId`               | `propriedadeId` (UUID)          |
| PropertyHome (card animal)      | `/propriedade/:id/animal/:animalId`         | `propriedadeId`, `animalId`     |
| FichaAnimal (editar)            | `/propriedade/:id/cadastro-animal?edit=:uuid`| Query: `edit=uuid`             |
| EsqueciSenha                    | `/verificar-codigo`                         | State: `{ method: 'email' }`   |

---

## 9. Ações de Navegação por Tela

| Tela                  | Ação                      | Destino                               |
|-----------------------|---------------------------|---------------------------------------|
| Login                 | "Log-in" sucesso          | `/dashboard`                          |
| Login                 | "Esqueceu a senha?"       | `/esqueci-senha`                      |
| Login                 | "Cadastre-se"             | `/cadastro`                           |
| Cadastro              | Cadastro sucesso          | `/login`                              |
| EsqueciSenha          | Enviar código             | `/verificar-codigo`                   |
| VerificarCodigo       | Código correto            | `/criar-senha`                        |
| CriarSenha            | Senha atualizada          | `/login`                              |
| Dashboard             | Clica propriedade         | `/propriedade/:id`                    |
| Dashboard             | Botão "+"                 | Modal de nova propriedade             |
| PropertyHome          | Clica "Animais"           | `/propriedade/:id/animais`            |
| PropertyHome          | Clica "Saúde"             | `/propriedade/:id/saude`              |
| PropertyHome          | Clica "Financeiro"        | `/propriedade/:id/financeiro`         |
| PropertyHome          | Botão voltar              | `/dashboard`                          |
| ListaAnimais          | Clica animal              | `/propriedade/:id/animal/:animalId`   |
| ListaAnimais          | Botão "+"                 | `/propriedade/:id/cadastro-animal`    |
| FichaAnimal           | Editar                    | `/propriedade/:id/cadastro-animal`    |
| FichaAnimal           | Registrar vacina          | `/propriedade/:id/saude`              |
| FichaAnimal           | Ver mãe/pai               | `/propriedade/:id/animal/:uuid`       |
| CadastroAnimal        | Salvar sucesso            | Limpa form (permanece na tela)        |
| HealthModule          | Registrar vacina          | Formulário inline na aba              |
| Financeiro            | Registrar baixa           | Modal de confirmação                  |
| Configurações         | Sair da conta             | `/login`                              |

---

## 10. Histórico e Botão Voltar

### Comportamento do botão "←"

| Tela                  | Botão voltar vai para            |
|-----------------------|----------------------------------|
| PropertyHome          | `/dashboard`                     |
| ListaAnimais          | `/propriedade/:id`               |
| FichaAnimal           | `/propriedade/:id/animais`       |
| CadastroAnimal        | `/propriedade/:id/animais`       |
| HealthModule          | `/dashboard`                     |
| Reproducao            | `/dashboard`                     |
| Financeiro            | `/propriedade/:id`               |
| Configurações         | `/dashboard`                     |
| Perfil                | `/dashboard`                     |

### Implementação

```javascript
const navigate = useNavigate()

// Botão voltar
<button onClick={() => navigate(-1)}>←</button>

// Voltar para rota específica
<button onClick={() => navigate('/dashboard')}>←</button>
```

---

## 11. Redirecionamentos Automáticos

| Condição                              | Redirecionamento para       |
|---------------------------------------|-----------------------------|
| Rota `/` acessada                     | `/login`                    |
| Usuário não logado acessa rota privada| `/login`                    |
| Usuário logado acessa rota pública    | `/dashboard`                |
| Peão acessa `/financeiro`             | `/propriedade/:id`          |
| Rota inexistente (logado)             | `/dashboard`                |
| Rota inexistente (não logado)         | `/login`                    |
