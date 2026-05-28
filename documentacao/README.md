# Propriedade Inteligente

> Sistema mobile de controle de rebanho para produtores rurais.
> Gestão individual de animais com foco em pecuária de precisão acessível.

---

## Sobre o Projeto

O **Propriedade Inteligente** é um aplicativo mobile desenvolvido como Projeto Integrador II
no Instituto Federal Catarinense — Campus Concórdia (SC).

O sistema preenche uma lacuna no mercado de gestão rural: enquanto sistemas como o SISBOV
focam em rastreabilidade sanitária (gestão macro), o Propriedade Inteligente oferece
**controle individual de cada animal** (gestão micro), permitindo ao produtor:

- Criar fichas técnicas detalhadas por animal
- Controlar calendário de vacinas e tratamentos
- Acompanhar ganho de peso e produção leiteira
- Gerenciar ciclo reprodutivo
- Analisar custos e lucratividade por animal
- Trabalhar offline com sincronização automática

---

## Público-Alvo

- Pequenos e médios produtores rurais
- Pecuária de corte e leite (bovinos e ovinos)
- Região inicial: Oeste de Santa Catarina
- Validação: bloco de Medicina Veterinária do IFC Campus Concórdia

---

## Stack Tecnológica

| Camada           | Tecnologia                    | Versão  |
|------------------|-------------------------------|---------|
| Frontend         | React                         | 18.x+   |
| Mobile           | Apache Cordova                | 12.x    |
| Estilização      | CSS Modules                   | —       |
| DB Local         | SQLite (plugin Cordova)       | 3.x     |
| DB Remoto        | Firestore (Firebase)          | —       |
| Autenticação     | Firebase Auth                 | —       |
| Build Android    | Gradle + JDK 17 + SDK API 34  | 8.x     |
| Design           | Figma                         | —       |
| Versionamento   | Git + GitHub                  | —       |

---

## Estrutura do Projeto

```
src/
├── App.jsx                       ← Rotas principais (HashRouter)
├── main.jsx                      ← Entry point
├── components/                   ← Componentes reutilizáveis
│   ├── BottomNav/                ← Navegação inferior
│   ├── Button/                   ← Botões (primary, ghost)
│   ├── Card/                     ← Cards de conteúdo
│   ├── Input/                    ← Campos de formulário
│   ├── Modal/                    ← Modais e diálogos
│   ├── Select/                   ← Dropdowns
│   ├── SearchBar/                ← Barra de busca
│   ├── StatBox/                  ← Caixas de estatísticas
│   └── AlertBanner/              ← Alertas visuais
├── pages/                        ← Telas do aplicativo
│   ├── Login/                    ← Autenticação
│   ├── Cadastro/                 ← Cadastro de usuário
│   ├── EsqueciSenha/             ← Recuperação de senha
│   ├── VerificarCodigo/          ← Verificação de código
│   ├── CriarSenha/               ← Nova senha
│   ├── Dashboard/                ← Lista de propriedades
│   ├── PropriedadeHome/          ← Painel da propriedade
│   ├── ListaAnimais/             ← Lista de animais
│   ├── FichaAnimal/              ← Perfil individual do animal
│   ├── CadastroAnimal/           ← Cadastro/edição de animal
│   ├── CalendarioVacinas/        ← Vacinas e alertas
│   ├── ControleMedicamentos/     ← Medicamentos e carência
│   ├── OcorrenciasClinicas/      ← Ocorrências clínicas
│   ├── LocalizacaoAnimal/        ← Movimentação na fazenda
│   ├── ProducaoLeite/            ← Controle leiteiro
│   ├── Reproducao/               ← Controle reprodutivo
│   ├── Financeiro/               ← Custos e lucratividade
│   ├── ConfiguracoesPropriedade/ ← Configurações
│   └── PerfilUsuario/            ← Perfil do usuário
├── contexts/                     ← Contexts do React
│   ├── AutenticacaoContext.jsx   ← Estado de autenticação
│   ├── PropriedadeContext.jsx    ← Propriedade ativa
│   └── AnimalContext.jsx         ← Dados do rebanho
├── hooks/                        ← Hooks customizados
│   ├── useAutenticacao.js
│   ├── useBancoLocal.js          ← SQLite
│   ├── useSincronizacao.js       ← Offline-first
│   └── useNotificacoes.js
├── services/                     ← Serviços e integrações
│   ├── firebase.js               ← Config Firebase
│   ├── banco-local.js            ← Operações SQLite
│   ├── sincronizacao.js          ← Sync local ↔ Firestore
│   └── autenticacao.js           ← Auth Firebase
├── utils/                        ← Funções utilitárias
│   ├── datas.js                  ← Formatação e cálculo de datas
│   ├── validacoes.js             ← Validações de formulário
│   ├── calculos-pecuarios.js     ← GMD, custos, carência
│   └── mascaras.js               ← Máscaras de input
├── constants/                    ← Constantes do sistema
│   ├── vacinas-padrao.js         ← Vacinas obrigatórias por raça
│   ├── racas.js                  ← Lista de raças
│   ├── areas-fazenda.js          ← Áreas/pastos padrão
│   └── permissoes.js             ← Níveis de acesso
├── styles/                       ← CSS global
│   └── global.css
└── assets/                       ← Recursos estáticos
    ├── logo.png
    └── icons/
```

---

## Módulos do Sistema

### 1. Identificação e Dados Biométricos (Prioridade: Alta)
Cadastro individual com ID interno, ID físico (brinco/colar), dados de origem,
espécie, raça, sexo, idade, peso, pelagem e genética.

### 2. Saúde e Calendário Sanitário (Prioridade: Alta)
Calendário de vacinas com alertas, controle de vermifugação, registro de
tratamentos clínicos, período de carência e movimentação diária.

### 3. Desempenho e Produção (Prioridade: Média)
Histórico de pesagens, cálculo de GMD (Ganho Médio Diário), Score de Condição
Corporal (ECC), controle leiteiro diário e qualidade do leite (CCS).

### 4. Gestativo/Reprodutivo (Prioridade: Alta)
Ciclo de cobertura (monta/IA), confirmação de prenhez, previsão de parto,
data de secagem e genealogia (pai/mãe).

### 5. Financeiro Individualizado (Prioridade: Baixa)
Custo acumulado por animal (compra + vacinas + medicamentos + ração),
indicador de lucratividade e registro de baixa (venda/morte/consumo).

---

## Funcionalidades Técnicas

### Offline-First
- SQLite local armazena todas as operações
- Sincronização automática com Firestore ao detectar conexão
- Controle de status: novo / modificado / sincronizado

### Acesso Multinível
- **Dono da Propriedade:** acesso total (CRUD completo)
- **Peão/Tratador:** acesso parcial (registros de manejo, sem exclusão)

### Interface
- Mobile-first com Bottom Navigation Bar
- Alto contraste para uso sob luz solar
- Botões mínimos de 48x48px
- Fontes sem serifa (Roboto, Inter)

---

## Requisitos Não Funcionais

| ID     | Descrição                                        | Prioridade |
|--------|--------------------------------------------------|------------|
| RNF01  | Offline-first com sincronização automática        | Alta       |
| RNF02  | Interface alto contraste, botões grandes          | Média      |
| RNF03  | Compatível com Android 14 (API 34)                | Alta       |
| RNF04  | Comunicação HTTPS criptografada                   | Alta       |
| RNF05  | Acesso multinível com permissões                  | Média      |
| RNF06  | Modo de exibição simplificado/especializado       | Baixa      |

---

## Como Rodar o Projeto

### Pré-requisitos
- Node.js 20.x LTS
- JDK 17
- Android SDK API 34
- Apache Cordova CLI
- Firebase (conta configurada)

### Instalação
```bash
# Clonar repositório
git clone [URL_DO_REPOSITORIO]

# Instalar dependências
npm install

# Rodar em desenvolvimento (browser)
npm start

# Build para Android via Cordova
cordova build android
```

### Estrutura de Pastas do Cordova
```
propriedade-inteligente/
├── platforms/          ← Plataformas nativas (Android)
├── plugins/            ← Plugins Cordova (SQLite, Camera)
├── www/                ← Código web (src/ compilado)
├── config.xml          ← Configuração do Cordova
└── src/                ← Código fonte React
```

---

## Equipe

| Nome                                 | Papel                |
|--------------------------------------|----------------------|
| Daniel Augusto Masson                | Dev Backend          |
| Arthur Stein Calixto de Araujo       | Frontend             |
| Gabriela Langer Wobeto               | Designer UI/UX       |
| Gabrielle Victória Ferreira Nunes    | Designer/Componentes |
| Gabriel Antônio Wildner Sonza        | Testes de Campo      |
| Hugo Cezar Rizolli Campagnaro        | Gestão de API        |

### Orientadores
- Prof. Heitor Scalco Neto
- Prof. Danimar Veriato

---

## Instituição

Instituto Federal Catarinense — Campus Concórdia
Projeto Integrador II — 2026
Concórdia, Santa Catarina, Brasil

---

## Documentação

Consulte a pasta `docs/` para documentação completa do projeto.
Veja `CLAUDE.md` para instruções de desenvolvimento para IA.
