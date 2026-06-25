# Equipe de Desenvolvimento

> Documento institucional do **Propriedade Inteligente** (IFC — Campus Concórdia, SC).
> Projeto Integrador II — período 2025/2.
>
> Perfil de cada integrante com resumo de responsabilidades, entregas principais e
> artefatos produzidos ao longo dos 13 sprints previstos no `sprints/sprint-plan.md`.

---

## 1. Daniel — Backend & Banco de Dados

**Cargo interno:** Líder técnico / Engenheiro de Backend & Dados

**Resumo da função:** Responsável pela arquitetura do banco SQLite local (9 tabelas
do MVP) e do Firestore remoto, pela camada de serviços da aplicação e pela
supervisão da integração frontend-backend. Define contratos de API, padroniza o
esquema de UUID v4 / `sync_status` e conduz revisões de PR voltadas ao modelo
de dados.

**Responsabilidades:**
- Modelagem e manutenção do schema SQL (`documentacao/database/schema.md`).
- Implementação da camada `services/` (vacinas, medicamentos, reprodução etc.).
- Padronização das colunas de metadados (`uuid`, `created_at`, `updated_at`,
  `synced_at`, `sync_status`, `deleted`).
- Definição dos endpoints Firestore em `documentacao/api/endpoints.md` e das
  `data-models.md`.
- Code review da camada de dados e supervisão técnica do time de frontend.
- Suporte à migração SQLite ↔ Firestore no contexto offline-first
  (`documentacao/technical/local-vs-remote-strategy.md`).

**Entregas principais (plausíveis ao longo do projeto):**
- Schema relacional das 9 tabelas MVP com índices e FKs seletivas.
- Diagrama ER (`mermaid`) da relação usuários ↔ propriedades ↔ animais e módulos.
- Mapeamento SQLite ↔ Firestore mantendo o `uuid` como chave estável.
- Fórmulas de cálculo encapsuladas em `services/` (GMD = `(peso_atual − peso_anterior) / dias`;
  `data_previa_parto = cobertura + 285d`; `data_secagem = parto − 60d`; carência etc.).
- Constantes centralizadas: `ESPECIES`, `STATUS_ANIMAL`, `TIPOS_MEDICAMENTO`,
  `RESULTADOS_OCORRENCIA`, `TIPOS_COBERTURA`, `CARGOS`, `SYNC_STATUS`.

---

## 2. Arthur — Frontend Funcional

**Cargo interno:** Engenheiro Frontend (módulos funcionais)

**Resumo da função:** Desenvolve a maior parte das telas e fluxos de cadastro
dos três módulos de domínio — **Identificação (RF03)**, **Saúde (RF04/05/06)**
e **Financeiro (RF08)**. Trabalha em parceria com a Gabriela na prototipação
das telas e é o principal consumidor da camada de serviços do Daniel.

**Responsabilidades:**
- Páginas de cadastro, listagem e ficha individual de animais
  (`documentacao/pages/10-animal-registration.md`, `08-animal-list.md`,
  `09-animal-profile.md`).
- Módulo de Saúde completo com 4 abas (vacinas, medicamentos, ocorrências,
  localização) — sprints 6 do plano.
- Telas de pesagens e ordenha com cálculo de GMD e contagem regressiva de
  carência (`documentacao/modules/health.md`, `modules/performance.md`).
- Módulo Financeiro no pós-MVP (sprint 10).
- Formulários com validação reativa, máscaras (data, peso, hectares) e
  suporte à edição inline.

**Entregas principais:**
- Fluxo ponta-a-ponta de cadastro/edição/soft delete do animal.
- Calendário de vacinas com projeção automática de `proxima_dose`.
- Tela de medicamentos com contagem regressiva de `data_liberacao`.
- Tela de ocorrências clínicas com mudança de `resultado`
  (`aguardando` → `em_tratamento` → `recuperado`/`obito`).

---

## 3. Gabriela — Design e Prototipação

**Cargo interno:** Designer de Interfaces & UX Researcher

**Resumo da função:** Líder da área de design. Constrói no Figma o sistema
visual de toda a aplicação (tema escuro, ícones emoji, tipografia para uso em
campo), prototipa fluxos em alta fidelidade, executa testes de usabilidade
com produtores-piloto e mantém a documentação visual do produto.

**Responsabilidades:**
- Design system no Figma: paleta (`design/color-palette.md`),
  tipografia (`design/typography.md`), espaçamentos (`design/spacing-layout.md`)
  e acessibilidade (`design/accessibility.md`).
- Protótipos de alta fidelidade antes da implementação das telas pelo Arthur
  e pela Gabrielle.
- Testes de usabilidade com 3-5 produtores-piloto (rurais, baixa escolaridade
  digital, leitura sob luz solar intensa).
- Documentação visual anexada a cada `documentacao/pages/*.md`.
- Decisões macro: emoji como affordance primária, Bottom Nav de 80 px,
  `var(--color-background)` claro para cadernos técnicos e fundo `#0f1a0f`
  para uso rural sob sol.

**Entregas principais:**
- Biblioteca de componentes no Figma coerente com `documentacao/components/*.md`.
- Fluxos-protótipo das jornadas críticas: login, cadastro de animal,
  aplicação de vacina, registro de cobertura e parto.
- Relatórios de usabilidade com ajustes priorizados (ex.: aumentar fonte,
  contraste mínimo AA, ícone único por intenção).

---

## 4. Gabrielle — Componentes, Perfil & Autenticação

**Cargo interno:** Engenheira Frontend (componentes & módulo de identidade)

**Resumo da função:** Responsável pelos componentes reutilizáveis da aplicação
(`Button`, `Input`, `Select`, `Modal`, `Card`, `SearchBar`, `AlertBanner`,
`LoadingSpinner`, `StatBox`, `BottomNav`) e pelo módulo de identidade do
usuário — login, cadastro, recuperação de senha, dashboard e perfil
(perfis `01-login.md` a `06-dashboard.md` e `19-user-profile.md`).

**Responsabilidades:**
- Implementação e curadoria da biblioteca de componentes com CSS Modules.
- Fluxo de autenticação completo (sprints 1-2) integrado à `auth-flow.md` e
  às permissões em `auth/permissions.md`.
- Tratamento de erros do Firebase Auth + camada de persistência de sessão
  (Rota Privada).
- Dashboard inicial do usuário com lista de propriedades.
- Perfil do usuário, edição e troca de foto.
- Documentação inline nos componentes (`documentacao/components/*.md`) com
  boas práticas de acessibilidade e uso em campo.

**Entregas principais:**
- `BottomNav` com altura 80 px, ícones emoji e estado ativo visível sob
  luz solar.
- `Input` variante `dark` (rural) com foco de alto contraste.
- Fluxo de login → dashboard → property home → cadastro de animal.
- Componente de “Rota Privada” que redireciona para Login caso o `firebase_uid`
  esteja ausente em `usuarios`.

---

## 5. Gabriel — Sincronização, Testes de Integração & Validação de Campo

**Cargo interno:** Engenheiro de Sincronização & Validação

**Resumo da função:** Único responsável pelo pipeline de sincronização
local ↔ nuvem (`documentacao/technical/sync-service.md`,
`database/sync-offline-first.md`) e pelos testes de integração ponta-a-ponta.
Além disso, registra e acompanha bugs, conduz a validação de campo com
usuários reais e produz os relatórios de validação do sistema.

**Responsabilidades:**
- Implementar e manter o `SyncService` (push de `sync_status IN ('novo','modificado')`,
  pull de mudanças remotas, reconciliação de UUIDs).
- Testar fluxos com 2+ dispositivos (criação do mesmo animal em ambos, sem
  duplicação).
- Testar modo avião e reconexão (sprint 9).
- Testar uso em campo sob luz solar direta, com luvas e conexão 3G instável.
- Registrar/acompanhar bugs (issue tracker interno) e conduzir correção em
  parceria com Daniel e Arthur.
- Coordenar o programa de beta testing com 3-5 produtores (sprint 9).

**Entregas principais:**
- `SyncService` com fila de pendências e idempotência por UUID.
- Plano de testes de integração (`development/testing-strategy.md`).
- Relatórios quinzenais de validação de campo com ajustes de UX/alinhamento
  priorizados.
- Backlog de bugs com severidade, reprodutor e status.

---

## 6. Hugo — QA & Automação de Testes

**Cargo interno:** Engenheiro de QA / Automação

**Resumo da função:** (Cargo criado para esta versão do projeto.) Responsável
por construir e manter a suíte de testes automatizados da camada de serviços
e dos fluxos críticos da UI, além de definir critérios de aceitação por
sprint junto aos donos das entregas (Daniel/Arthur/Gabrielle). Assessora o
Gabriel nos testes de integração e fecha os critérios de pronto do MVP.

**Responsabilidades:**
- Implementar testes unitários da camada `services/` (cálculos como GMD,
  `proxima_dose`, `data_previa_parto`, `data_liberacao`, contagem regressiva
  de carência).
- Testes de migrações SQL idempotentes (`project-sqlite-idempotent-migrations`)
  e checagem de constraints (FKs seletivas, ranges de ECC 1-5, etc.).
- Suíte end-to-end para fluxos críticos: login → propriedade → animal →
  vacina → medicamento → sync offline → reconexão.
- Montar pipeline de CI executando `vitest` e lint como pré-requisito para
  merge.
- Apoiar o Gabriel na revisão de relatórios de bugs de campo — triagem,
  reprodutibilidade e severidade.
- Manter `development/testing-strategy.md` atualizado com cobertura atual e
  casos críticos por módulo.

**Entregas principais:**
- Suíte de testes unitários para os cálculos de domínio (regressões cobertas).
- E2E cobrindo o caminho feliz: cadastro de animal → aplicação de vacina →
  registro de cobertura → confirmação de prenhez → parto.
- Pipeline de CI (lint + testes) bloqueando merges que quebrem cobertura.
- Relatório de cobertura por sprint para a defesa do projeto.

---

## 7. Resumo cruzado — Quem cuida do quê

| Tema / artefato                                              | Daniel | Arthur | Gabriela | Gabrielle | Gabriel | Hugo   |
|--------------------------------------------------------------|:------:|:------:|:--------:|:---------:|:-------:|:-----:|
| Schema SQLite / Firestore                                    |   ★   |        |          |           |    ◐     |   ◐   |
| Camada de serviços (services/)                              |   ★   |   ◐    |          |           |    ◐     |       |
| Módulo Identificação (cadastro/QR/Lista)                    |   ◐   |   ★    |    ◐     |     ◐     |    ◐     |   ◐   |
| Módulo Saúde (vacinas/medicamentos/ocorrências)              |   ◐   |   ★    |    ◐     |           |    ◐     |   ◐   |
| Módulo Reprodução                                            |   ◐   |   ★    |    ◐     |           |    ◐     |   ◐   |
| Módulo Financeiro                                            |   ◐   |   ★    |    ◐     |           |    ◐     |   ◐   |
| Design System (Figma, paleta, tipografia)                    |        |   ◐    |    ★     |     ◐     |          |       |
| Componentes reutilizáveis (BottomNav, Input, Modal...)       |        |   ◐    |    ◐     |     ★     |          |   ◐   |
| Login / Cadastro / Perfil / Dashboard                        |   ◐   |   ◐    |    ◐     |     ★     |          |       |
| Sincronização offline ↔ nuvem                                |   ◐   |        |          |           |    ★     |   ◐   |
| Testes de unidade                                            |   ◐   |   ◐    |          |           |    ◐     |   ★   |
| Testes E2E / integração                                      |   ◐   |   ◐    |          |           |    ★     |   ◐   |
| Validação em campo (luz solar, baixa escolaridade)           |        |   ◐    |    ★     |           |    ★     |       |
| Registro/acompanhamento de bugs                              |   ◐   |   ◐    |    ◐     |     ◐     |    ★     |   ◐   |

> Legenda: ★ principal · ◐ colaborador · (em branco) não envolvido diretamente.

---

_Documento elaborado para fins de apresentação do projeto. As entregas e os
nomes seguem os papéis combinados em equipe como parte do Projeto Integrador II
do IFC — Campus Concórdia._
