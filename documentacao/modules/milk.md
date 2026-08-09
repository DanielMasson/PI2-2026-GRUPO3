# Módulo de Desempenho Leiteiro

> **Prioridade:** Alta | **Sprint:** 8 | **Status:** MVP
>
> Controla a produção diária de leite por vaca, com gráficos de série temporal,
> comparativo entre animais, médias históricas 7/30/90 dias e alertas automáticos
> de queda brusca de produção.

---

## 1. Visão Geral

O módulo é dividido em **5 sub-features**, acessíveis por sub-rotas com tabs
(padão Reproducao, não `?aba=` do HealthModule):

```text
┌─────────────────────────────────────────────────────────────┐
│                MÓDULO DE DESEMPENHO LEITEIRO               │
│                                                           │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────┐│
│  │Registro │ │Gráficos │ │Comparat. │ │Histórico│ │Alerta││
│  └────┬────┘ └────┬────┘ └────┬─────┘ └────┬────┘ └───┬──┘│
│       │           │           │            │          │    │
│       ▼           ▼           ▼            ▼          ▼    │
│  Batch diário  SVG curva   Ranking      Médias    Queda ≥20%│
│  manha+tarde   animal/     descend.    7/30/90 dias dia-a-dia│
│  + CCS         propriedade por total                ou ≥30% │
│                                                          7d  │
└─────────────────────────────────────────────────────────────┘
```

### Sub-rotas

```
/propriedade/:propriedadeId/producao-leite              → Registro (batch diário)
/propriedade/:propriedadeId/producao-leite/graficos     → Gráficos (SVG)
/propriedade/:propriedadeId/producao-leite/comparativo  → Comparativo (ranking)
/propriedade/:propriedadeId/producao-leite/historico    → Histórico (médias)
/propriedade/:propriedadeId/producao-leite/alertas      → Alertas (queda)
```

---

## 2. Schema — tabela `producao_leite`

| Campo              | Tipo     | Obrigatório | Descrição                              |
|--------------------|:--------:|:-----------:|----------------------------------------|
| `uuid`             | TEXT     | Sim         | UUID v4                                |
| `animal_uuid`      | TEXT     | Sim         | FK → animais.uuid                      |
| `propriedade_uuid` | TEXT     | Sim         | FK → propriedades.uuid (desnormalizado)|
| `data`             | TEXT     | Sim         | ISO `YYYY-MM-DD`                       |
| `manha_litros`     | REAL     | Não         | Litros da ordenha da manhã (0 se vazia)|
| `tarde_litros`     | REAL     | Não         | Litros da ordenha da tarde (0 se vazia)|
| `ccs`              | INTEGER  | Não         | Contagem Células Somáticas (alerta >200k)|
| `observacao`       | TEXT     | Não         | Observação livre                       |
| `sync_status`      | TEXT     | Sim         | 'pendente' \| 'sincronizado'           |
| `updated_at`       | INTEGER  | Sim         | Epoch ms (last-write-wins)             |
| `deleted`          | INTEGER  | Sim         | 0 \| 1 (soft delete)                   |

Tabela já wired no sync SQLite↔Firestore (`migrations.js`, `pushQueue.js`,
`pullEngine.js`, `firestore.rules`) desde a Sprint de Sync (06/08).

---

## 3. Submódulo: Registro Diário

Tela padrão (`pages/ProducaoLeite/index.jsx`). Batch entry de todas as vacas
em lactação da propriedade num único formulário.

### Campos por animal
- `manha_litros` (number, step 0.1)
- `tarde_litros` (number, step 0.1)
- `ccs` (number, opcional — alerta vermelho se >200.000)
- `observacao` (texto livre, opcional)

### Indicadores no rodapé
- Produção hoje (L)
- Média por vaca (L/dia)
- Vacas em lactação (count)
- Alertas CCS (count de vacas com CCS >200.000)

### Filtro de animais
Apenas `especie = 'bovino' AND sexo = 'femea'` (simplificação MVP — não há
campo "em_lactacao" explícito; todas as fêmeas bovinas são consideradas aptas).

### Validação
- Tentar salvar sem registrar nenhuma ordenha para alguma vaca dispara toast
  inline (não mais `alert()` nativo — bug S7-style corrigido).
- Toast auto-limpa em 4 segundos.

---

## 4. Submódulo: Gráficos

`pages/ProducaoLeite/Graficos/index.jsx` + `components/GraficoLinha`.

### Componente `GraficoLinha`
SVG artesanal, sem dependência externa. Props:

```jsx
<GraficoLinha
  data={[{ dia: '2026-08-01', valor: 12.5 }, ...]}
  width={600}     // viewBox
  height={220}
  cor="#c8a97e"
  unidade="L"
/>
```

Render:
- Eixo x (bottom) + eixo y (left)
- `<polyline>` com pontos normalizados para viewBox
- Rótulos: primeiro dia (esq) + últimoultimo dia (dir)
- Marcadores min/max no topo
- Unidade no canto superior direito
- `role="img"` + `aria-label` para acessibilidade
- Sem animação, sem hover, sem tooltip

### Filtros da tela de Gráficos
- Modo: Propriedade (agregado) | Animal (individual)
- Vaca (se modo animal): dropdown das fêmeas bovinas ativas
- Período: 7 / 30 / 90 dias

### Queries
- `serieAnimal(animalUuid, propriedadeUuid, dias)` → `[{dia, total_litros}]`
- `seriePropriedade(propriedadeUuid, dias)` → `[{dia, total_litros, vacas_ordenhadas}]`

Em modo propriedade, exibe também pico de vacas ordenhadas no período.

---

## 5. Submódulo: Comparativo

`pages/ProducaoLeite/Comparativo/index.jsx`. Ranking de animais por produção
total recente vs total anterior (janelas equivalentes).

### Filtros
- Período: 7 OU 30 dias (vs equivalentes anteriores)

### Colunas
| # | Animal | Total atual | Total anterior | Variação |
|---|--------|-------------|---------------|----------|

### Badge de variação (color scale)
| Range           | Classe CSS              | Cor       |
|-----------------|-------------------------|-----------|
| pct > 0         | pctBadgePositivo        | Verde     |
| -10 ≤ pct ≤ 0  | pctBadgeNeutro          | Cinza     |
| -20 ≤ pct < -10| pctBadgeAmarelo         | Amarelo   |
| -30 ≤ pct < -20| pctBadgeLaranja         | Laranja   |
| pct < -30       | pctBadgeVermelho        | Vermelho  |

### Query
`comparativoAnimais(propriedadeUuid, dias)` retorna
`[{uuid, nome, id_fisico, total_recente, total_anterior}]` ordenado por
`total_recente DESC`. JS calcula `delta = total_recente - total_anterior` e
`pct = delta / total_anterior * 100`.

---

## 6. Submódulo: Média Histórica

`pages/ProducaoLeite/Historico/index.jsx`. Três cards de média móvel +
gráfico série 90 dias.

### Cards
| Período | Média diária | Dias com registro | Total período |
|---------|--------------|-------------------|---------------|
| 7 dias  | L/dia        | N                 | L             |
| 30 dias | L/dia        | N                 | L             |
| 90 dias | L/dia        | N                 | L             |

### Query
`mediaHistoricaPropriedade(propriedadeUuid)` — uma query com 6 subselects
retornando `{media_7d, dias_7d, media_30d, dias_30d, media_90d, dias_90d}`.

Abaixo dos cards, gráfico da série de 90 dias (`useSeriePropriedade(propriedadeId, 90)`).

---

## 7. Submódulo: Alerta de Queda

`pages/ProducaoLeite/Alertas/index.jsx`. Detecta quedas bruscas de produção
e agrupa por severidade.

### Thresholds
- Variação dia-a-dia ≤ -20% (total hoje vs ontem) → alerta
- Variação média 7d vs 7d-anterior ≤ -30% → alerta

### Severidade (atribuída em JS)
| Variação mais crítica      | Severidade |
|----------------------------|------------|
| ≤ -50%                     | Crítica    |
| -50% < var ≤ -30%          | Severa     |
| -30% < var ≤ -20%          | Moderada   |

### Query
`alertasQuedaLeite(propriedadeUuid)` — CTEs:
- `ultima_data`: maior `data` registrada na propriedade
- `hoje`: agregado de ordenhas em `ultima_data`
- `ante`: agregado de ordenhas um dia antes
- `seteA`: média diária dos últimos 7 dias
- `seteAnt`: média diária dos 7 dias anteriores

Retorna `[{uuid, nome, id_fisico, total_dia, total_dia_anterior,
variacao_dia_dia, variacao_7d}]`. JS atribui `severidade` e agrupa.

### Empty state
"Nenhuma queda brusca detectada. Produção estável."

---

## 8. Telas → Rotas

| Tela         | Rota                                                     | Componente                       |
|--------------|----------------------------------------------------------|----------------------------------|
| Registro     | `/propriedade/:id/producao-leite`                        | `ProducaoLeite`                  |
| Gráficos     | `/propriedade/:id/producao-leite/graficos`               | `ProducaoLeiteGraficos`          |
| Comparativo  | `/propriedade/:id/producao-leite/comparativo`            | `ProducaoLeiteComparativo`       |
| Histórico    | `/propriedade/:id/producao-leite/historico`              | `ProducaoLeiteHistorico`         |
| Alertas      | `/propriedade/:id/producao-leite/alertas`                | `ProducaoLeiteAlertas`           |

App.jsx: rota base na linha 64 + 4 rotas irmãs imediatamente após.

---

## 9. Queries SQL (queries.js)

Todas as queries filtram:
```sql
WHERE a.especie = 'bovino' AND a.sexo = 'femea' AND a.deleted = 0
```

### Q1 — serieAnimal
```sql
SELECT pl.data AS dia,
       SUM(COALESCE(pl.manha_litros,0) + COALESCE(pl.tarde_litros,0)) AS total_litros
FROM producao_leite pl
JOIN animais a ON a.uuid = pl.animal_uuid
WHERE pl.animal_uuid = ?
  AND pl.propriedade_uuid = ?
  AND pl.deleted = 0
  AND pl.data >= date('now', ?)
GROUP BY pl.data
ORDER BY pl.data ASC
```

### Q2 — seriePropriedade
```sql
SELECT pl.data AS dia,
       SUM(COALESCE(pl.manha_litros,0) + COALESCE(pl.tarde_litros,0)) AS total_litros,
       COUNT(DISTINCT pl.animal_uuid) AS vacas_ordenhadas
FROM producao_leite pl
JOIN animais a ON a.uuid = pl.animal_uuid
WHERE pl.propriedade_uuid = ?
  AND pl.deleted = 0
  AND a.especie = 'bovino' AND a.sexo = 'femea' AND a.deleted = 0
  AND pl.data >= date('now', ?)
GROUP BY pl.data
ORDER BY pl.data ASC
```

### Q3 — comparativoAnimais
 Usa `CASE WHEN pl.data >= date('now', ?) THEN ... ELSE ... END` para particionar
 total_recente vs total_anterior em uma única passada. Retorna ordenado por
 `total_recente DESC`.

### Q4 — mediaHistoricaPropriedade
```sql
SELECT
  (SELECT AVG(total) FROM (... 7 dias))  AS media_7d,
  (SELECT COUNT(*) FROM (... 7 dias))    AS dias_7d,
  ... 30 dias ...
  ... 90 dias ...
```

### Q5 — alertasQuedaLeite
CTEs `ultima_data`, `hoje`, `ante`, `seteA`, `seteAnt`. Filtra por
`variacao_dia_dia <= -20 OR variacao_7d <= -30`. Ordena por
`COALESCE(variacao_7d, 9999) ASC, COALESCE(variacao_dia_dia, 9999) ASC`
(NULLs em último — compatível com SQLite do Cordova).

---

## 10. Permissões

Mesma herança de `animais` — quem acessa a propriedade vê produção dela.
Sem controle granular por submódulo (mesma permissão do Registro vale para
Gráficos/Comparativo/Histórico/Alertas).

Multi-tenant: cada conta Firebase = tenant isolado em `users/{uid}/`.
`propriedade_uuid` em cada linha de `producao_leite` garante isolamento.

---

## 11. Limitações

1. **Datas UTC** — `date('now', ?)` opera em UTC; produtor que registra às 23h
   BRT pode ver a ordenha no dia seguinte. Documentado; aceitável para MVP.
2. **Sem sync de analytics computados** — apenas linhas de `producao_leite`
   são sincronizadas. Médias, séries e alertas são computados em runtime
   por query SQLite local. Se duas máquinas sincronizam, cada uma recalcula.
3. **Gráfico sem animação/interação** — SVG minimalista. Sem hover, sem
   tooltip, sem zoom. Decisão ratificada para evitar dependências externas.
4. **Sem índice SQL** em `producao_leite` — volume rural esperado
   (<10k rows/propriedade-ano) tornam índice desnecessário no MVP. Se
   performance degradar em larga escala, documentar e adicionar.
5. **Filtro de vacas em lactação simplificado** — todas as fêmeas bovinas
   são consideradas aptas. Sem campo explícito `em_lactacao` no schema.
6. **CCS não persistido pelo service** — campo existe na tabela mas o
   `registrarOrdenha` atual envia `observacao` e litros. CCS fica registrado
   apenas se cords de UI futuras passarem `ccs` no payload (atualmente UI
   coleta mas `handleSalvar` não inclui no payload — known gap).

---

## 12. Módulo relacionado: Corte

Animais **não leiteiros** (machos bovinos de engorda + ovinos + caprinos
de qualquer sexo) são tratados no módulo **Desempenho de Corte**
(Sprint 8.5 — ver `corte.md`), não aqui. O módulo Leiteiro foca em fêmeas
bovinas em lactação; o módulo de Corte foca em animais de engorda, com
métricas de peso/GMD/ECC em vez de litros/CCS.

Padrão arquitetural idêntico (5 sub-rotas, GraficoLinha reusado, alerts em
3 categorias, batch entry), mas tabela diferente (`pesagens` vs
`producao_leite`) e filtro SQL complementar.
