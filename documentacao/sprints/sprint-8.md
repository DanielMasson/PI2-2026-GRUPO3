# Sprint 08 — Desempenho Leiteiro Avançado

> Visão detalhada da **Sprint 08** (Desempenho Leiteiro) do **Propriedade Inteligente**.
> Conteúdo extraído de `documentacao/sprints/sprint-plan.md` (seção "Sprint 8: Desempenho Leiteiro Avançado").

---

## 1. Objetivo

Aprofundar o controle leiteiro e gráficos de produção.

---

## 2. Tarefas

| Tarefa                                   | Prioridade | Status    |
|------------------------------------------|:----------:|:---------:|
| Tela de registro de produção diária      | Alta       | ✅ Feito  |
| Gráficos de produção leiteira            | Alta       | ✅ Feito  |
| Comparativo entre animais                | Média      | ✅ Feito  |
| Média histórica por propriedade          | Média      | ✅ Feito  |
| Alerta de queda brusca de produção       | Média      | ✅ Feito  |

**Evidência (08/08):**
- Tarefa 1 — `src/pages/ProducaoLeite/index.jsx` (batch diário + resumo mês + alertas CCSInline) já existia desde S6; bug `registrarOrdenha` retornando animal em vez da ordenha foi corrigido (`src/services/producaoLeiteService.js:11-14` + `buscarProducaoLeite` em `queries.js`).
- Tarefa 2 — `src/pages/ProducaoLeite/Graficos/index.jsx` + `src/components/GraficoLinha` (SVG artesanal, sem dependência). Filtros: modo propriedade/animal × período 7/30/90 dias.
- Tarefa 3 — `src/pages/ProducaoLeite/Comparativo/index.jsx` com ranking ordenado por `total_recente DESC`, badges coloridos por faixa de variação.
- Tarefa 4 — `src/pages/ProducaoLeite/Historico/index.jsx` com 3 cards (7/30/90 dias) + gráfico série 90d.
- Tarefa 5 — `src/pages/ProducaoLeite/Alertas/index.jsx` com thresholds 20% (dia-a-dia) e 30% (média 7d vs anterior), severidades critica/severa/moderada.
- Bugs S7-style: `alert()` nativo substituído por toast inline em `index.jsx`.

---

## 3. Entregáveis

Produtor visualiza curvas de produção leiteira por animal e por propriedade, compara animais entre períodos, consulta médias históricas 7/30/90 dias e recebe alertas automáticos quando a produção cai bruscamente (≥20% dia-a-dia ou ≥30% média 7d).

### Sub-rotas (padrão Reproducao)

```
/propriedade/:propriedadeId/producao-leite              → Registro diário
/propriedade/:propriedadeId/producao-leite/graficos     → Gráficos SVG
/propriedade/:propriedadeId/producao-leite/comparativo  → Ranking entre animais
/propriedade/:propriedadeId/producao-leite/historico    → Médias 7/30/90 dias
/propriedade/:propriedadeId/producao-leite/alertas      → Alertas de queda
```

---

## 4. Documentação relacionada

- `documentacao/modules/milk.md`
- `documentacao/modules/corte.md`
- `documentacao/modules/performance.md`

---

## 3.5 Submódulo Corte (Sprint 8.5)

> Extensão do Sprint 8 para cobrir animais **não leiteiros** (machos bovinos
> de engorda + ovinos + caprinos de qualquer sexo). Fêmeas bovinas continuam
> no módulo Leiteiro. Decision ratified em AskUserQuestion 08/08.

### Decisões estruturais (08/08)

1. **Módulo separado** na PropertyHome (não toggle com Leite).
2. **4 métricas**: GMD por animal + Gráfico evolução peso + Ranking por GMD
   + Alerta peso abate.
3. **Batch diário/mensal** (igual ao batch leiteiro), ECC opcional (1-9).
4. **3 alertas**: Perda (GMD<0) + Estagnação (GMD<0.3 sustentado ≥3 pesagens)
   + Pronto para abate (peso ≥95% peso_abate_estimado).

### Infra pré-existente auditada antes do plano

Surpresa estrutural: a infra de pesagem já estava madura desde Sprint 6.
A Sprint 8.5 adicionou apenas a UI + analytics de propriedade + batch:

- Tabela `pesagens` ✅ (migrations.js).
- Queries CRUD ✅ (`listarPesagens`, `inserirPesagem`, etc — queries.js).
- `pesagemService.calcularGMD()` ✅.
- `usePesagens` ✅ (GMD 5-status + ECC).
- `animais.peso_abate_estimado REAL` ✅.
- Sync layer ✅.

### Sub-rotas (padrão Reproducao/Leite)

```
/propriedade/:id/corte              → Registro batch (peso + ECC + obs)
/propriedade/:id/corte/graficos     → Gráficos SVG (reutiliza GraficoLinha)
/propriedade/:id/corte/ranking      → Ranking por GMD
/propriedade/:id/corte/historico    → Médias GMD 7/30/90 dias + ECC médio
/propriedade/:id/corte/alertas      → 3 categorias (perda/estagnação/abate)
```

### PropertyNav — 5º item adicionado

`PropertyNav/index.jsx` NAV_ITEMS ganhou `{ key: 'corte', label: 'Corte',
icone: '🥩' }`. 5 wrappers `PropertyNavWithRoute`/`handleNav` atualizados
(ProducaoLeite, Reproducao, Animais, AnimalRegistration, PropertyHome).
`.navLabel` font-size ajustado para 11px (de 12px) para evitar quebra de
linha com 5 items.

### Tarefas (Sprint 8.5)

| Tarefa                                | Prioridade | Status   |
|---------------------------------------|:----------:|:--------:|
| Tela de registro batch de pesagem     | Alta       | ✅ Feito |
| Gráficos de evolução de peso          | Alta       | ✅ Feito |
| Ranking por GMD entre animais         | Média      | ✅ Feito |
| Média histórica GMD 7/30/90           | Média      | ✅ Feito |
| Alertas perda/estagnação/abate        | Média      | ✅ Feito |

**Evidência (08/08):**
- 5 queries SQL analíticas em `queries.js` (linhas 1632+) + 5 wrappers em
  `pesagemService.js` + 5 hooks em `usePesagemAnalise.js` (novo).
- `pages/Corte/index.jsx` (Registro batch) + 4 sub-páginas (Graficos/Ranking/
  Historico/Alertas) + `_SubpageLayout.jsx` + `Corte.module.css`.
- 5 rotas irmãs em `App.jsx` + 5º item em `PropertyNav`.
- Wrappers `PropertyNavWithRoute` atualizados em 5 páginas existentes.
- `documentacao/modules/corte.md` criado (~250 linhas, espelha milk.md).
- Filtro SQL: `(a.especie='bovino' AND a.sexo='macho') OR a.especie IN
  ('ovino','caprino')` aplicado em todas as 5 queries.
- Sem `alert()` nativo (toast inline). Sem `NULLS LAST` (COALESCE 9999).

**Recorte de animais aptos:** machos bovinos + ovinos + caprinos.
**Fora do escopo:** equinos, suínos, aves (gap conhecido documentado em
corte.md §11.5).
