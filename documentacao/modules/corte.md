# Módulo de Desempenho de Corte

> **Prioridade:** Alta | **Sprint:** 8.5 | **Status:** MVP
>
> Controla o ganho de peso diário (GMD) de animais de corte — machos bovinos
> de engorda + ovinos + caprinos de qualquer sexo — com gráfico de evolução,
> ranking de eficiência, médias históricas e alertas de perda/estagnação/abate.

---

## 1. Visão Geral

O módulo é dividido em **5 sub-features**, acessíveis por sub-rotas com tabs
(padrão Reproducao e Leite, não `?aba=` do HealthModule):

```text
┌────────────────────────────────────────────────────────────────┐
│               MÓDULO DE DESEMPENHO DE CORTE                    │
│                                                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌─────────┐ │
│  │Registro │ │Gráficos │ │Ranking  │ │Histórico │ │Alertas  │ │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬─────┘ └────┬────┘ │
│       │           │           │           │           │       │
│       ▼           ▼           ▼           ▼           ▼       │
│  Batch diário  SVG curva   Ranking      Médias     Perda GMD<0 │
│  peso + ECC    peso animal  por GMD     GMD 7/30/90 Estagnação │
│  + obs         ou propriedade          + ECC médio  Pronto     │
│                                                       abate    │
└────────────────────────────────────────────────────────────────┘
```

### Recorte de animais aptos

```sql
WHERE a.deleted = 0
  AND (
    (a.especie = 'bovino' AND a.sexo = 'macho')
    OR a.especie IN ('ovino', 'caprino')
  )
```

Fêmeas bovinas ficam no módulo Desempenho Leiteiro (Sprint 8). Equinos,
suínos e aves ficam de fora (gap conhecido, §11).

### Sub-rotas

```
/propriedade/:propriedadeId/corte              → Registro (batch)
/propriedade/:propriedadeId/corte/graficos     → Gráficos (SVG)
/propriedade/:propriedadeId/corte/ranking      → Ranking por GMD
/propriedade/:propriedadeId/corte/historico    → Histórico (médias 7/30/90d)
/propriedade/:propriedadeId/corte/alertas      → Alertas (3 categorias)
```

---

## 2. Schema — tabela `pesagens` + coluna `peso_abate_estimado`

### Tabela `pesagens` (já existente desde Sprint 6)

| Campo              | Tipo     | Obrigatório | Descrição                          |
|--------------------|:--------:|:-----------:|------------------------------------|
| `uuid`             | TEXT     | Sim         | UUID v4                            |
| `animal_uuid`      | TEXT     | Sim         | FK → animais.uuid                  |
| `propriedade_uuid` | TEXT     | Sim         | FK → propriedades.uuid (desnorm.)  |
| `data`             | TEXT     | Sim         | ISO `YYYY-MM-DD`                   |
| `peso`             | REAL     | Sim         | Peso em kg                         |
| `ecc`              | INTEGER  | Não         | Escore Condição Corporal 1-9       |
| `observacao`       | TEXT     | Não         | Observação livre                   |
| `sync_status`      | TEXT     | Sim         | 'pendente' \| 'sincronizado'       |
| `updated_at`       | INTEGER  | Sim         | Epoch ms (last-write-wins)         |
| `deleted`          | INTEGER  | Sim         | 0 \| 1 (soft delete)               |

Tabela já wired no sync SQLite↔Firestore (`migrations.js`, `pushQueue.js`,
`pullEngine.js`, `firestore.rules`) desde a Sprint de Sync (06/08).

### Coluna `animais.peso_abate_estimado REAL`

(Já existente desde Sprint 6, `migrations.js:282`.) Usada no alerta "Pronto
para abate": dispara quando `peso_atual >= 0.95 * peso_abate_estimado`.

---

## 3. Submódulo: Registro Batch

`pages/Corte/index.jsx`. Batch entry de todos os animais de corte da
propriedade num único formulário (mesmo padrão de `ProducaoLeite/index.jsx`).

### Campos por animal
- `peso` (number, step 0.1, min 0) — obrigatório para salvar
- `ecc` (integer, 1-9, opcional)
- `observacao` (texto livre, opcional)

### Indicadores no rodapé
- Animais de corte (count)
- GMD médio do rebanho (kg/dia)
- ECC médio (com count de pesagens com ECC)
- Alertas (count: animais com GMD<0 OU peso ≥95% do abate estimado)

### Badges por animal
- **GMD colorido** (5 statuses): Ótimo (≥1.0), Bom (≥0.5), Regular (≥0.1),
  Estável (≥0), Perda (<0) — calculado em JS a partir das pesagens já
  carregadas do animal.
- **Pronto p/ abate** se `peso_atual >= 0.95 * peso_abate_estimado`.

### Validação
- `alert()` nativo proibido — toast inline (4s auto-clear).
- Tentar salvar sem peso em nenhum animal dispara erro inline.

---

## 4. Submódulo: Gráficos

`pages/Corte/Graficos/index.jsx` — reusa `components/GraficoLinha` (SVG
artesanal, sem dependência externa, Sprint 8 leiteiro).

### Filtros
- Modo: Propriedade (peso médio agregado) | Animal (curva individual)
- Vaca (se modo animal): dropdown dos animais aptos corte
- Período: 7 / 30 / 90 dias

### Queries
- `seriePesoAnimal(animalUuid, propriedadeUuid, dias)` → `[{dia, peso, ecc}]`
- `seriePesoPropriedade(propriedadeUuid, dias)` → `[{dia, peso_medio, animais_pesados}]`

Em modo propriedade, exibe também pico de animais pesados no período.

---

## 5. Submódulo: Ranking

`pages/Corte/Ranking/index.jsx`. Ranking de animais por GMD (kg/dia) na
janela selecionada.

### Filtros
- Período: 7 OU 30 dias

### Colunas
| # | Animal | GMD | Peso atual | Peso anterior | Ganho total |
|---|--------|-----|------------|---------------|-------------|

### Badge de GMD (color scale)
| Range              | Classe CSS         | Cor       |
|--------------------|--------------------|-----------|
| gmd ≥ 0.5          | pctBadgePositivo   | Verde     |
| 0.1 ≤ gmd < 0.5   | pctBadgeAmarelo    | Amarelo   |
| 0 ≤ gmd < 0.1     | pctBadgeNeutro     | Cinza     |
| gmd < 0            | pctBadgeVermelho   | Vermelho  |
| gmd IS NULL        | pctBadgeNeutro    | Cinza     |

### Query
`rankingGmdAnimais(propriedadeUuid, dias)` — SQL calcula GMD via
`ROW_NUMBER() OVER (PARTITION BY animal ORDER BY data)` para identificar
primeira e última pesagem na janela, e `julianday()` para diff de dias.
Retorna `[{uuid, nome, id_fisico, gmd, peso_atual, peso_anterior,
total_ganho}]` ordenado por `gmd DESC`.

---

## 6. Submódulo: Média Histórica

`pages/Corte/Historico/index.jsx`. Três cards de média móvel GMD + ECC
médio + gráfico série 90 dias.

### Cards
| Período | GMD médio | Dias com pesagem |
|---------|-----------|------------------|
| 7 dias  | kg/dia    | N                |
| 30 dias | kg/dia    | N                |
| 90 dias | kg/dia    | N                |

Linha extra: ECC médio 90 dias (0-9).

### Query
`mediaHistoricaGmdPropriedade(propriedadeUuid)` — uma query com 6 subselects
retornando `{gmd_media_7d, gmd_dias_7d, gmd_media_30d, gmd_dias_30d,
gmd_media_90d, gmd_dias_90d, ecc_medio_90d}`.

Abaixo dos cards, gráfico da série de 90 dias
(`useSeriePesoPropriedade(propriedadeId, 90)`).

---

## 7. Submódulo: Alertas

`pages/Corte/Alertas/index.jsx`. Detecta 3 categorias de alerta e agrupa
por tipo.

### Thresholds
| Tipo        | Condição                                                    |
|-------------|-------------------------------------------------------------|
| perda       | GMD na janela de 7 dias < 0                                 |
| estagnacao  | 0 ≤ GMD < 0.3 kg/dia na janela de 7 dias E ≥3 pesagens     |
| pronto_abate| última pesagem ≥ 95% do `peso_abate_estimado`               |

### Coloração por tipo
| Tipo        | Classe CSS              | Cor       |
|-------------|-------------------------|-----------|
| perda       | alerta_critica          | Vermelho  |
| estagnacao  | alerta_moderada         | Amarelo   |
| pronto_abate| alerta_severa            | Laranja   |

### Query
`alertasCortePropriedade(propriedadeUuid)` — CTEs:
- `pesagens_janela`: pesagens dos últimos 7 dias dos animais aptos corte.
- `gmd_janela`: GMD por animal via `ROW_NUMBER()` + `julianday()`.
- `ultima_pesagem`: última pesagem por animal (com `peso_abate_estimado`).

Retorna `[{uuid, nome, id_fisico, tipo_alerta, gmd, peso_atual,
peso_abate_estimado, pct_abate}]`. JS agrupa em 3 buckets por `tipo_alerta`.

### Empty state
"Nenhum alerta. Rebanho estável e sem animais prontos para abate."

---

## 8. Telas → Rotas

| Tela         | Rota                                               | Componente                |
|--------------|----------------------------------------------------|---------------------------|
| Registro     | `/propriedade/:id/corte`                           | `Corte`                   |
| Gráficos     | `/propriedade/:id/corte/graficos`                  | `CorteGraficos`           |
| Ranking      | `/propriedade/:id/corte/ranking`                   | `CorteRanking`            |
| Histórico    | `/propriedade/:id/corte/historico`                 | `CorteHistorico`          |
| Alertas      | `/propriedade/:id/corte/alertas`                   | `CorteAlertas`            |

App.jsx: 5 rotas irmãs (1 base + 4 sub-rotas) após `/producao-leite/alertas`.

---

## 9. Queries SQL (queries.js)

Todas as queries filtram:
```sql
WHERE a.deleted = 0
  AND (
    (a.especie = 'bovino' AND a.sexo = 'macho')
    OR a.especie IN ('ovino', 'caprino')
  )
```

### Q1 — seriePesoAnimal
```sql
SELECT p.data AS dia, p.peso, p.ecc
FROM pesagens p
INNER JOIN animais a ON p.animal_uuid = a.uuid
WHERE p.animal_uuid = ? AND p.propriedade_uuid = ?
  AND p.deleted = 0 AND a.deleted = 0
  AND ((a.especie = 'bovino' AND a.sexo = 'macho') OR a.especie IN ('ovino', 'caprino'))
  AND p.data >= date('now', ?)
ORDER BY p.data ASC
```

### Q2 — seriePesoPropriedade
```sql
SELECT p.data AS dia,
       AVG(p.peso) AS peso_medio,
       COUNT(DISTINCT p.animal_uuid) AS animais_pesados
FROM pesagens p
INNER JOIN animais a ON p.animal_uuid = a.uuid
WHERE p.propriedade_uuid = ?
  AND p.deleted = 0 AND a.deleted = 0
  AND ((a.especie = 'bovino' AND a.sexo = 'macho') OR a.especie IN ('ovino', 'caprino'))
  AND p.data >= date('now', ?)
GROUP BY p.data
ORDER BY p.data ASC
```

### Q3 — rankingGmdAnimais
Usa `ROW_NUMBER() OVER (PARTITION BY animal_uuid ORDER BY data)` para marcar
primeira (rn=1) e última (rn_desc=1) pesagem na janela, depois
`julianday()` calcula diff de dias. GMD = (peso_ultima - peso_primeira) /
diff_dias. Retorna ordenado por `gmd DESC`.

### Q4 — mediaHistoricaGmdPropriedade
```sql
SELECT
  (SELECT AVG(gmd) FROM (... 7 dias))   AS gmd_media_7d,
  (SELECT COUNT(*) FROM (... 7 dias))   AS gmd_dias_7d,
  ... 30 dias ...
  ... 90 dias ...
  (SELECT AVG(ecc) FROM pesagens ... 90 dias ...) AS ecc_medio_90d
```

### Q5 — alertasCortePropriedade
CTEs `pesagens_janela`, `gmd_janela`, `ultima_pesagem`.
`CASE` atribui `tipo_alerta` ('pronto_abate' = 1, 'perda' = 2,
'estagnacao' = 3) a partir das condições. Ordena por
`tipo_alerta ASC, a.nome ASC` (NULLs tratados via `COALESCE(x, 9999) ASC`).

---

## 10. Permissões

Mesma herança de `animais` e `producao_leite` — quem acessa a propriedade
 vê pesagens dela. Sem controle granular por submódulo.

Multi-tenant: cada conta Firebase = tenant isolado em `users/{uid}/`.
`propriedade_uuid` em cada linha de `pesagens` garante isolamento.

---

## 11. Limitações

1. **Datas UTC** — `date('now', ?)` opera em UTC; produtor que registra às 23h
   BRT pode ver a pesagem no dia seguinte. Aceitável para MVP (análogo ao
   leiteiro).

2. **Sem sync de analytics computados** — apenas linhas de `pesagens`
   são sincronizadas. Médias, rankings e alertas são computados em runtime.
   Se duas máquinas sincronizam, cada uma recalcula.

3. **Gráfico sem animação/interação** — SVG minimalista. Sem hover, sem
   tooltip, sem zoom. Decisão ratificada para evitar dependências externas
   (reutiliza `GraficoLinha` do leiteiro).

4. **ECC sem validação 1-9 server-side** — SQLite INTEGER aceita qualquer
   valor. UI usa `<input min="1" max="9" type="number">`. Service faz
   `ecc >= 1 && ecc <= 9` antes de salvar.

5. **Equinos, suínos, aves fora do escopo** — apenas bovinos machos + ovinos
   + caprinos são considerados corte. Outras espécies não aparecem em
   nenhum submódulo deste módulo.

6. **Filtro "macho bovino" simplificado** — não há campo `destinacao`
   explícito (corte vs reprodução). Tudo que é macho bovino é considerado
   engorda. Se houver machos reprodutores, eles aparecem no Corte;
   documentado como limitação aceitável para MVP rural.

7. **Estagnação exige ≥3 pesagens na janela 7d** — se o produtor só pesou
   2 vezes na semana, mesmo com GMD baixo, o alerta não dispara. Evita
   falso-positivo com poucas amostras.

8. **Abate dispara a 95%** — margem de 5% abaixo do peso-alvo evita alerta
   tardio (peso já no abate) e dá tempo de programar transporte.

---

## 12. Módulo relacionado: Leite

Fêmeas bovinas (`especie='bovino' AND sexo='femea'`) são tratadas no
módulo **Desempenho Leiteiro** (Sprint 8 — ver `milk.md`), não aqui.
O módulo de Corte foca em animais de engorda (machos bovinos + ovinos +
caprinos), com métricas de peso/GMD/ECC em vez de litros/CCS.
