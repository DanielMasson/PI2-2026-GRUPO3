# Sprint 10 — Módulo Financeiro (Fluxo de Caixa)

> Visão detalhada da **Sprint 10** (Módulo Financeiro — Fluxo de Caixa e
> Relatórios por Animal/Categoria) do **Propriedade Inteligente**.
> Redação retificada em 09/08 (8 decisões em 2 rodadas AskUserQuestion) —
> escopo anterior (lucratividade, cotação R$/kg, baixa) arquivado em
> `documentacao/modules/financial.md` §14.

---

## 1. Objetivo

Implementar o módulo Financeiro como fluxo de caixa da propriedade com
transações categorizadas (receitas e despesas), ranking de saldo por
animal, relatórios por categoria e série temporal mensal. Suporte opcional
a `animal_uuid` por transação permite associar custos/receitas a um animal
específico sem acoplar módulos (sem `valor_compra` em `animais`, sem
`valor` em `vacinas`/`medicamentos`, sem tabela `baixas`).

---

## 2. Tarefas

| Tarefa                                       | Prioridade | Status      |
|----------------------------------------------|:----------:|:-----------:|
| Migrations: tabelas `transacoes_financeiras` + `categorias_financeiras` (10 seed) | Alta  | Concluída   |
| Queries SQLite: `listarTransacoesPropriedade`, `resumoPorAnimal`, `resumoPorCategoria`, `serieMensalPropriedade`, `excluirTransacao` | Alta | Concluída |
| Service `financeiroService.js` (11 exports) + hook `useFinanceiroPropriedade` + `useFinanceiroAnimal` | Alta | Concluída |
| Dashboard `Financeiro/index.jsx` (form + 3 cards + gráfico saldo mensal) | Alta | Concluída |
| `_SubpageLayout.jsx` (topbar back + 3 tabs) + `Financeiro.module.css` (44 classes) | Alta | Concluída |
| `Listar/index.jsx` (tabela + 5 filtros + excluir `window.confirm`) | Alta | Concluída (11/08) |
| `PorAnimal/index.jsx` (ranking + drill-down expansível `useFinanceiroAnimal`) | Alta | Concluída (11/08) |
| Registrar 3 rotas em `App.jsx` (Dashboard/Listar/PorAnimal) | Alta | Concluída (11/08) |
| Build Vite + verifier adversarial (PASS/PARTIAL/FAIL) | Alta | Em andamento (verifier 429 — reexecutar) |
| Smoke test manual pré-banca (5 cenários completos) | Alta | A fazer |

---

## 3. Entregáveis

Produtor consegue registrar transações financeiras (receitas/despesas) na
propriedade, visualizar a lista com filtros (data, tipo, categoria, animal),
consultar ranking de saldo por animal com drill-down das transações
individuais, e acompanhar o saldo mensal no gráfico do Dashboard.

**Arquivos novos/alterados nesta Sprint:**

| Arquivo | Ação |
|---------|------|
| `src/services/sqlite/migrations.js` | Editado (2 tabelas + 10 seeds) |
| `src/services/sqlite/queries.js` | Editado (5 novas funções) |
| `src/services/financeiroService.js` | Novo |
| `src/hooks/useFinanceiro.js` | Novo |
| `src/pages/Financeiro/index.jsx` | Novo (Dashboard) |
| `src/pages/Financeiro/_SubpageLayout.jsx` | Novo |
| `src/pages/Financeiro/Financeiro.module.css` | Novo (~44 classes) |
| `src/pages/Financeiro/Listar/index.jsx` | Novo (11/08) |
| `src/pages/Financeiro/PorAnimal/index.jsx` | Novo (11/08) |
| `src/App.jsx` | Editado (3 imports + 3 rotas) |
| `documentacao/modules/financial.md` | Reshape completo (11/08) |
| `documentacao/sprints/sprint-10.md` | Criado (11/08) |
| `documentacao/CLAUDE.md` | Atualizar tabela de módulos + status Financeiro (11/08) |

---

## 4. Decisões ratificadas (09/08)

| # | Decisão | Justificativa |
|---|---------|---------------|
| 1 | SQLite-first, sync Firestore opcional | Mesma arquitetura dos demais módulos |
| 2 | 10 categorias seedadas via migration `INSERT OR IGNORE` | Cobre 80% dos casos sem UI de criar categoria |
| 3 | `animal_uuid` opcional em transações | Permite custos por animal sem obrigar acoplamento |
| 4 | Reshape `financial.md` (escopo antigo → escopo novo) | Alinhar doc com implementação real |
| 5 | Criar `sprint-10.md` novo (não absorver em outra sprint) | Sprint 10 dintinta, rastreabilidade clara |
| 6 | Sem `valor_compra`, sem `valor` em vacinas/medicamentos | Evita acoplar Identificação e Saúde |
| 7 | Sem cotação R$/kg, sem tabela `baixas` | Soft delete + `status` em `animais` já cobre venda/morte |
| 8 | Série mensal com 12 pontos (não 24) | Suficiente para banca MVP, gráfico legível |

---

## 5. Documentação relacionada

- `documentacao/modules/financial.md` (reshape completo)
- `documentacao/database/schema.md` (tabelas `transacoes_financeiras`,
  `categorias_financeiras`)
- `documentacao/technical/sync-service.md` (multi-tenant, last-write-wins)
- `documentacao/technical/local-vs-remote-strategy.md`
