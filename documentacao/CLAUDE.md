# CLAUDE.md — Propriedade Inteligente

> Instruções principais para IA guiar o desenvolvimento deste projeto.
> Leia este arquivo antes de qualquer alteração no código.

---

## Visão do Projeto

**Propriedade Inteligente** é um aplicativo mobile para gestão de rebanhos e propriedades rurais.
O app permite o controle individual de cada animal (gestão micro), indo além dos sistemas
existentes como o SISBOV que focam apenas em rastreabilidade sanitária (gestão macro).

- **Instituição:** Instituto Federal Catarinense — Campus Concórdia (SC)
- **Disciplina:** Projeto Integrador II (2026)
- **Público-alvo:** Pequenos e médios produtores rurais (bovinos e ovinos)
- **Região inicial:** Oeste de Santa Catarina

---

## Stack Tecnológica

| Camada             | Tecnologia                           | Versão    |
|--------------------|--------------------------------------|-----------|
| Frontend           | React                                | 18.x+     |
| Mobile Wrapper     | Apache Cordova                       | 12.x      |
| Estilização        | CSS Modules (.module.css)            | —         |
| DB Local           | SQLite (plugin Cordova)              | 3.x       |
| DB Remoto          | Firestore (Firebase)                 | —         |
| Autenticação       | Firebase Auth                        | —         |
| Controle de Versão | Git + GitHub                         | —         |
| Design             | Figma                                | —         |
| Build Android      | Gradle + JDK 17 + Android SDK API 34 | 8.x / 17  |

### Contingência
Se o Cordova apresentar limitações de performance, o projeto migra para **Flutter (Dart)**.

---

## Convenções de Código

### Nomenclatura (PORTUGUÊS)

Toda a nomenclatura do projeto deve ser em **português**:

```
Variáveis:      nomeAnimal, listaPropriedades, vacinasObrigatorias
Funções:        calcularGMD(), registrarVacina(), formatarData()
Componentes:    CadastroAnimal, CalendarioVacinas, FichaAnimal
Arquivos:       cadastro-animal.jsx, calendario-vacinas.module.css
Constantes:     VACINAS_PADRAO, AREAS_PADRAO, TIPOS_ATIVIDADE
Rotas:          /propriedade/:id/cadastro-animal
```

### Estrutura de Arquivos

```
src/
├── App.jsx                    ← Rotas principais (HashRouter)
├── main.jsx                   ← Entry point (ReactDOM)
├── components/                ← Componentes reutilizáveis
│   └── [NomeComponente]/
│       ├── index.jsx
│       └── [NomeComponente].module.css
├── pages/                     ← Telas do aplicativo
│   └── [NomePagina]/
│       ├── index.jsx
│       └── [NomePagina].module.css
├── contexts/                  ← Contexts do React (estado global)
│   └── [NomeContext].jsx
├── hooks/                     ← Hooks customizados
│   └── use[Nome].jsx
├── services/                  ← Serviços (Firebase, API, SQLite)
│   ├── firebase.js
│   ├── banco-local.js         ← SQLite
│   └── sincronizacao.js
├── utils/                     ← Funções utilitárias
│   └── [nome-utilitario].js
├── constants/                 ← Constantes e dados padrão
│   └── [nome-constante].js
├── styles/                    ← CSS global
│   └── [nome].css
└── assets/                    ← Imagens, ícones, fontes
    └── [nome-arquivo]
```

### CSS Modules

Cada componente/página possui seu próprio arquivo `.module.css`:

```jsx
// Importação
import styles from './CadastroAnimal.module.css'

// Uso
<div className={styles.container}>
  <h1 className={styles.titulo}>Cadastro de Animal</h1>
</div>
```

### Gerenciamento de Estado

O projeto usa uma abordagem **mista**:

- **useState/useReducer** → estado local de componentes e formulários
- **Context API** → estado compartilhado entre telas (autenticação, dados do usuário, propriedade ativa)

```jsx
// Estado local (formulários, UI)
const [campos, setCampos] = useState({ nome: '', brinco: '' })

// Estado global (Context)
const { usuario, propriedadeAtiva } = useContext(AppContext)
```

---

## Regras de Desenvolvimento

### 1. Componentes Reutilizáveis
- Componentes em `components/` devem ser genéricos e reutilizáveis
- Componentes específicos de uma tela ficam dentro da pasta da página
- Sempre usar `children` ou props para composição

### 2. Formulários
- Validação client-side obrigatória antes de enviar
- Mensagens de erro em português
- Estado de loading durante operações assíncronas
- Feedback de sucesso após operações

### 3. Navegação
- Usar `react-router-dom` com `HashRouter`
- Rotas definidas em `App.jsx`
- Parâmetros de rota via `useParams()`
- Navegação programática via `useNavigate()`

### 4. Banco de Dados
- **Local (SQLite):** Operações rápidas, sem dependência de internet
- **Remoto (Firestore):** Backup, sincronização e dados compartilhados
- Offline-first: todas as operações salvam localmente primeiro
- Sincronização automática ao detectar conexão

### 5. Acessibilidade
- Botões e elementos interativos: mínimo 48x48px
- Alto contraste para uso sob luz solar
- Fontes sem serifa (Roboto, Inter) acima do tamanho padrão
- Textos alternativos em imagens e ícones

### 6. Autenticação
- Firebase Auth (e-mail/senha)
- Controle multinível: Dono da Propriedade vs Peão/Tratador
- Permissões configuráveis por cargo

---

## Módulos do Sistema

| # | Módulo                          | Prioridade | Sprint | Status  |
|---|--------------------------------|------------|--------|---------|
| 1 | Identificação e Dados Biométricos | Alta       | S5     | A fazer |
| 2 | Saúde e Calendário Sanitário     | Alta       | S6     | A fazer |
| 3 | Desempenho e Produção            | Média      | S6     | A fazer |
| 4 | Gestativo/Reprodutivo            | Alta       | S7     | A fazer |
| 5 | Financeiro Individualizado       | Baixa      | S10    | A fazer |

### Escopo MVP (Sprints 1-9)
- Login/Cadastro de usuário
- Dashboard de propriedades
- Cadastro de animais (Identificação)
- Calendário de vacinas (Saúde)
- Controle de pesagens (Desempenho)
- Controle leiteiro básico

### Escopo Pós-MVP (Sprints 10-13)
- Módulo Gestativo completo
- Módulo Financeiro individualizado
- Sincronização offline-first completa
- Acesso multinível
- Submissão à Play Store

---

## Referências Cruzadas da Documentação

| Arquivo                           | Descrição                                      |
|-----------------------------------|------------------------------------------------|
| `docs/architecture/system-overview.md` | Arquitetura geral do sistema              |
| `docs/architecture/tech-stack.md`      | Detalhes das tecnologias                  |
| `docs/requirements/functional.md`      | Requisitos funcionais (RF01-RF08)         |
| `docs/requirements/non-functional.md`  | Requisitos não funcionais (RNF01-RNF06)   |
| `docs/database/schema.md`              | Modelo de banco de dados                  |
| `docs/database/sync-offline-first.md`  | Estratégia de sincronização               |
| `docs/modules/identification.md`       | Módulo de Identificação                   |
| `docs/modules/health.md`               | Módulo de Saúde                           |
| `docs/modules/performance.md`          | Módulo de Desempenho                      |
| `docs/modules/reproductive.md`         | Módulo Gestativo                          |
| `docs/modules/financial.md`            | Módulo Financeiro                         |
| `docs/pages/*.md`                      | Especificação de cada tela                |
| `docs/components/*.md`                 | Especificação de cada componente          |
| `docs/navigation/routes.md`            | Definição de rotas                        |
| `docs/navigation/flow-diagram.md`      | Fluxo de navegação                        |
| `docs/auth/login-flow.md`              | Fluxo de autenticação                     |
| `docs/auth/permissions.md`             | Controle de acesso                        |
| `docs/design/color-palette.md`         | Paleta de cores                           |
| `docs/design/typography.md`            | Tipografia                                |
| `docs/design/spacing-layout.md`        | Espaçamento e layout                      |
| `docs/design/accessibility.md`         | Acessibilidade                            |
| `docs/api/endpoints.md`                | Endpoints da API (quando aplicável)       |
| `docs/development/setup.md`            | Configuração do ambiente                  |
| `docs/development/cordova-config.md`   | Configuração do Cordova                   |
| `docs/development/build-deploy.md`     | Build e publicação                        |
| `docs/development/testing-strategy.md` | Estratégia de testes                      |
| `docs/sprints/sprint-plan.md`          | Planejamento de sprints                   |
| `docs/sprints/mvp-scope.md`            | Escopo do MVP                             |
| `docs/sprints/post-mvp-scope.md`       | Escopo pós-MVP                            |

---

## Como Usar Este Arquivo

1. **Antes de codificar:** Leia este arquivo + o arquivo do módulo/página específico
2. **Ao criar componentes:** Consulte `docs/components/` para o padrão esperado
3. **Ao modificar rotas:** Consulte `docs/navigation/routes.md`
4. **Ao mexer no banco:** Consulte `docs/database/schema.md`
5. **Ao alterar design:** Consulte `docs/design/`

---

## Atualização deste Arquivo

Este arquivo deve ser atualizado sempre que:
- Uma nova convenção for definida
- Um módulo for concluído (atualizar status na tabela)
- A stack tecnológica mudar
- Novas regras de desenvolvimento forem criadas
