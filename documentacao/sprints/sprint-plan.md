# Planejamento de Sprints

> Planejamento geral do **Propriedade Inteligente** — Sprints 1 a 13.
> Cada sprint tem duração de 2 semanas (10 dias úteis).

---

## 1. Visão Geral

```text
Sprint 1-2:   Autenticação (RF01)                    ███
Sprint 3-4:   Propriedades (RF02)                     ███
Sprint 5:     Cadastro de Animais (RF03)              ██
Sprint 6:     Saúde + Desempenho (RF04+RF05+RF06)     ███
Sprint 7:     Reprodução (RF07)                       ██
Sprint 8:     Configurações + Perfil                  ██
Sprint 9:     Testes + Integração                     ██
─────────────── MVP ──────────────────────────────────
Sprint 10:    Financeiro (RF08)                       ██
Sprint 11:    Melhorias UX                            ██
Sprint 12:    Otimizações de performance               ██
Sprint 13:    Preparação para produção                 ██
```

---

## 2. Sprints Detalhados

### Sprint 1–2: Autenticação (RF01)

**Objetivo:** Sistema completo de login, cadastro e recuperação de senha.

| Tarefa                                  | Prioridade | Status |
|-----------------------------------------|:----------:|:------:|
| Tela de Login                           | Alta       | ✅ Feito|
| Tela de Cadastro                        | Alta       | ✅ Feito|
| Tela de Esqueci Senha                   | Alta       | ✅ Feito|
| Tela de Verificar Código                | Alta       | ✅ Feito|
| Tela de Criar Senha                     | Alta       | ✅ Feito|
| Integração Firebase Auth                | Alta       | A fazer|
| Validações de formulário                | Alta       | ✅ Feito|
| Tratamento de erros Firebase            | Média      | A fazer|
| Persistência de sessão                  | Alta       | A fazer|
| Componente RotaPrivada                  | Alta       | A fazer|

**Entregáveis:** Usuário consegue criar conta, logar, recuperar senha e manter sessão.

---

### Sprint 3–4: Propriedades (RF02)

**Objetivo:** CRUD de propriedades e convite de membros.

| Tarefa                                  | Prioridade | Status |
|-----------------------------------------|:----------:|:------:|
| Dashboard com lista de propriedades     | Alta       | ✅ Feito|
| Cadastro de propriedade                 | Alta       | A fazer|
| Edição de propriedade                   | Alta       | A fazer|
| Exclusão de propriedade                 | Média      | A fazer|
| Convite de membros (peão)               | Alta       | A fazer|
| Painel da propriedade (PropertyHome)    | Alta       | ✅ Feito|
| Integração Firestore                    | Alta       | A fazer|
| SQLite + Sync                           | Alta       | A fazer|

**Entregáveis:** Usuário cria propriedades, convida membros e acessa o painel.

---

### Sprint 5: Cadastro de Animais (RF03)

**Objetivo:** Ficha técnica completa de cada animal.

| Tarefa                                  | Prioridade | Status |
|-----------------------------------------|:----------:|:------:|
| Formulário de cadastro de animal        | Alta       | ✅ Feito|
| Adicionar campos: espécie, pelagem, genética | Alta  | A fazer|
| Lista de animais com busca e filtros    | Alta       | A fazer|
| Ficha individual do animal              | Alta       | A fazer|
| Modo edição de animal                   | Alta       | A fazer|
| Soft delete (exclusão lógica)           | Alta       | A fazer|
| Integração SQLite + Firestore           | Alta       | A fazer|

**Entregáveis:** Usuário cadastra, lista, edita e visualiza fichas de animais.

---

### Sprint 6: Saúde + Desempenho (RF04+RF05+RF06)

**Objetivo:** Calendário de vacinas, medicamentos, pesagens e produção leiteira.

| Tarefa                                  | Prioridade | Status |
|-----------------------------------------|:----------:|:------:|
| Módulo de Saúde (4 abas)                | Alta       | ✅ Feito|
| Calendário de vacinas                   | Alta       | ✅ Feito|
| Controle de medicamentos                | Alta       | ✅ Feito|
| Ocorrências clínicas                    | Alta       | ✅ Feito|
| Localização/movimentação                | Média      | ✅ Feito|
| Registro de pesagens                    | Alta       | A fazer|
| Cálculo de GMD                          | Alta       | A fazer|
| Score ECC                               | Média      | A fazer|
| Controle leiteiro (pós-MVP parcial)     | Baixa      | A fazer|
| Alertas de vacinas próximas             | Alta       | A fazer|

**Entregáveis:** Módulo de saúde completo, pesagens funcionais, alertas visuais.

---

### Sprint 7: Reprodução (RF07)

**Objetivo:** Ciclo reprodutivo completo: cobertura → parto.

| Tarefa                                  | Prioridade | Status |
|-----------------------------------------|:----------:|:------:|
| Registro de cobertura                   | Alta       | A fazer|
| Confirmação de prenhez                  | Alta       | A fazer|
| Contador de dias até parto              | Alta       | A fazer|
| Cálculo de secagem                      | Alta       | A fazer|
| Registro de parto                       | Alta       | A fazer|
| Genealogia (pai/mãe)                    | Alta       | A fazer|
| Barra de progresso visual               | Média      | A fazer|

**Entregáveis:** Módulo reprodutivo funcional com genealogia.

---

### Sprint 8: Configurações + Perfil

**Objetivo:** Telas de configurações, perfil e gerenciamento de membros.

| Tarefa                                  | Prioridade | Status |
|-----------------------------------------|:----------:|:------:|
| Tela de Configurações                   | Alta       | A fazer|
| Tela de Perfil do Usuário               | Alta       | A fazer|
| Gerenciar membros (convidar/remover)    | Alta       | A fazer|
| Configurações de sincronização          | Média      | A fazer|
| Preferências do usuário                 | Baixa      | A fazer|

**Entregáveis:** Usuário gerencia perfil, membros e preferências.

---

### Sprint 9: Testes + Integração

**Objetivo:** Testes de integração, correção de bugs e validação em campo.

| Tarefa                                  | Prioridade | Status |
|-----------------------------------------|:----------:|:------:|
| Testes manuais de fluxos completos      | Alta       | A fazer|
| Testes offline (modo avião)             | Alta       | A fazer|
| Testes de sync (2+ dispositivos)        | Alta       | A fazer|
| Testes em campo (luz solar)             | Alta       | A fazer|
| Correção de bugs                        | Alta       | A fazer|
| Beta testing (3-5 usuários)             | Média      | A fazer|
| Otimização de performance               | Média      | A fazer|

**Entregáveis:** App estável, testado e pronto para produção.

---

## 3. Marcos (Milestones)

| Marco                    | Sprint | Data estimada | Critério de conclusão              |
|--------------------------|:------:|:-------------:|-------------------------------------|
| Autenticação funcional   | 2      | Semana 4      | Login, cadastro e sessão funcionam  |
| CRUD Animais             | 5      | Semana 10     | Ficha completa de animal funciona   |
| Módulo de Saúde          | 6      | Semana 12     | Vacinas e medicamentos registrados  |
| **MVP Completo**         | 9      | Semana 18     | App funcional para beta testing     |
| Financeiro               | 10     | Semana 20     | Custo/lucro por animal funciona     |
| **Produção**             | 13     | Semana 26     | App publicado na Play Store         |

---

## 4. Dependências entre Sprints

```text
Sprint 1-2 (Auth) ──► Sprint 3-4 (Propriedades) ──► Sprint 5 (Animais)
                                                         │
                    ┌────────────────────────────────────┤
                    │                                    │
                    ▼                                    ▼
              Sprint 6 (Saúde)                   Sprint 7 (Reprodução)
                    │                                    │
                    └──────────┬─────────────────────────┘
                               ▼
                    Sprint 8 (Configurações)
                               │
                               ▼
                    Sprint 9 (Testes) ──► MVP
                               │
                               ▼
                    Sprint 10 (Financeiro)
                               │
                               ▼
                    Sprint 11-13 (Melhorias + Produção)
```
