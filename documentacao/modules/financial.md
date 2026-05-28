# Módulo Financeiro Individualizado

> **Prioridade:** Baixa | **Sprint:** 10 | **Status:** Pós-MVP
>
> Calcula o custo acumulado de cada animal, indica lucratividade e registra baixas
> (venda, morte ou consumo próprio).

---

## 1. Visão Geral

O módulo Financeiro é **pós-MVP** — será implementado após a validação dos módulos
core (Identificação, Saúde, Desempenho, Reprodutivo). Ele responde a pergunta-chave:

> *"Este animal está me dando lucro ou prejuízo?"*

```text
┌───────────────────────────────────────────────────────┐
│              MÓDULO FINANCEIRO                        │
│                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Custos    │  │ Lucratividade│  │    Baixa     │ │
│  ├─────────────┤  ├──────────────┤  ├──────────────┤ │
│  │ Compra      │  │ Custo total  │  │ Venda        │ │
│  │ Vacinas     │  │ Valor mercado│  │ Morte        │ │
│  │ Medicamentos│  │ Lucro/Prej.  │  │ Consumo      │ │
│  │ Ração est.  │  │ Indicador    │  │ Registro     │ │
│  └─────────────┘  └──────────────┘  └──────────────┘ │
└───────────────────────────────────────────────────────┘
```

---

## 2. Cálculo de Custos

### 2.1. Composição do Custo Acumulado

O custo de cada animal é a soma de todos os investimentos registrados:

```javascript
function calcularCustoAnimal(animalUuid) {
  const custoCompra = buscarCustoCompra(animalUuid)     // Valor pago na aquisição
  const custoVacinas = somarCustoVacinas(animalUuid)    // Soma de vacinas aplicadas
  const custoMedicamentos = somarCustoMedicamentos(animalUuid) // Soma de medicamentos
  const custoRacao = estimarCustoRacao(animalUuid)      // Estimativa de ração (opcional)

  return {
    compra: custoCompra,
    vacinas: custoVacinas,
    medicamentos: custoMedicamentos,
    racao: custoRacao,
    total: custoCompra + custoVacinas + custoMedicamentos + custoRacao
  }
}
```

### 2.2. Fontes de Custo

| Fonte            | Origem dos dados                     | Obrigatório |
|------------------|--------------------------------------|:-----------:|
| Compra           | Campo `valor_compra` no cadastro do animal | Sim (MVP)   |
| Vacinas          | Tabela `vacinas` (campo `valor` a ser adicionado) | Sim |
| Medicamentos     | Tabela `medicamentos` (campo `valor` a ser adicionado) | Sim |
| Ração            | Estimativa baseada em kg/dia × preço/kg | Não (pós-MVP) |

### 2.3. Campos Adicionais Necessários

Para o módulo financeiro funcionar, é preciso adicionar campos nas tabelas existentes:

**Tabela `animais` (campo adicional):**
```sql
ALTER TABLE animais ADD COLUMN valor_compra REAL DEFAULT 0;
```

**Tabela `vacinas` (campo adicional):**
```sql
ALTER TABLE vacinas ADD COLUMN valor REAL DEFAULT 0;
```

**Tabela `medicamentos` (campo adicional):**
```sql
ALTER TABLE medicamentos ADD COLUMN valor REAL DEFAULT 0;
```

---

## 3. Lucratividade

### 3.1. Valor de Mercado Estimado

O valor de mercado é uma **estimativa** baseada no peso atual e numa cotação configurável:

```javascript
function estimarValorMercado(pesoAtual, cotacaoPorKg) {
  return pesoAtual * cotacaoPorKg
}
```

**Configuração da cotação:**
- Por padrão: R$ 5,50/kg (boi gordo — valor aproximado SC 2026)
- Configurável pelo dono nas configurações da propriedade

### 3.2. Indicador de Lucratividade

```javascript
function calcularLucratividade(custoTotal, valorMercado) {
  const resultado = valorMercado - custoTotal
  const percentual = custoTotal > 0 ? (resultado / custoTotal) * 100 : 0

  return {
    resultado,          // Positivo = lucro, Negativo = prejuízo
    percentual,         // % de retorno
    status: resultado >= 0 ? 'lucro' : 'prejuízo'
  }
}
```

### 3.3. Exibição na Interface

```text
┌───────────────────────────────────────┐
│ Financeiro — Mimosa (BR-00142)        │
├───────────────────────────────────────┤
│ CUSTOS                                │
│ Compra:          R$ 2.500,00          │
│ Vacinas (3):     R$   120,00          │
│ Medicamentos (2):R$    85,00          │
│ Ração estimada:  R$   350,00          │
│ ─────────────────────────────         │
│ TOTAL:           R$ 3.055,00          │
├───────────────────────────────────────┤
│ VALOR DE MERCADO                      │
│ Peso atual: 345 kg × R$ 5,50/kg      │
│ Estimativa: R$ 1.897,50               │
├───────────────────────────────────────┤
│ RESULTADO                             │
│ ▼ Prejuízo: R$ -1.157,50 (-37,9%)    │
│ (animal ainda em crescimento)         │
└───────────────────────────────────────┘
```

### 3.4. Cores do Indicador

| Status    | Cor      | Significado                    |
|-----------|----------|--------------------------------|
| Lucro     | Verde    | Valor mercado > Custo total    |
| Empate    | Amarelo  | Valor mercado ≈ Custo total    |
| Prejuízo  | Vermelho | Valor mercado < Custo total    |

---

## 4. Baixa de Animal

### 4.1. Motivos de Baixa

| Motivo            | Código       | Descrição                                    |
|-------------------|--------------|----------------------------------------------|
| Venda             | `'vendido'`  | Animal vendido a terceiros                   |
| Morte             | `'morto'`    | Animal veio a óbito                          |
| Consumo próprio   | `'consumido'`| Animal abatido para consumo da família       |

### 4.2. Campos do Registro de Baixa

| Campo            | Tipo   | Obrigatório | Descrição                              |
|------------------|--------|:-----------:|----------------------------------------|
| `animal_uuid`    | TEXT   | Sim         | UUID do animal                         |
| `motivo`         | TEXT   | Sim         | `'vendido'` / `'morto'` / `'consumido'` |
| `data_baixa`     | TEXT   | Sim         | YYYY-MM-DD                             |
| `valor_recebido` | REAL   | Não         | Valor da venda (se vendido)            |
| `comprador`      | TEXT   | Não         | Nome do comprador (se vendido)         |
| `observacao`     | TEXT   | Não         | Observações sobre a baixa              |

### 4.3. Fluxo de Baixa

```javascript
async function registrarBaixa(animalUuid, { motivo, dataBaixa, valorRecebido, comprador }) {
  // 1. Atualizar status do animal
  await db.run(
    `UPDATE animais SET status = ?, updated_at = ?, sync_status = 'modificado' WHERE uuid = ?`,
    [motivo, new Date().toISOString(), animalUuid]
  )

  // 2. Registrar detalhes da baixa (tabela opcional pós-MVP)
  await db.run(
    `INSERT INTO baixas (uuid, animal_uuid, motivo, data_baixa, valor_recebido, comprador, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'novo')`,
    [gerarUUID(), animalUuid, motivo, dataBaixa, valorRecebido || 0, comprador || null, new Date().toISOString(), new Date().toISOString()]
  )

  // 3. Se venda, calcular resultado financeiro
  if (motivo === 'vendido') {
    const custoTotal = await calcularCustoAnimal(animalUuid)
    const resultado = valorRecebido - custoTotal.total
    // Exibir resultado: lucro ou prejuízo na venda
  }
}
```

### 4.4. Animal Inativo

- Animais com `status != 'ativo'` são **excluídos da lista principal**
- São acessíveis via filtro "Inativos" ou no histórico da propriedade
- Dados financeiros são preservados (soft delete já aplicado)

---

## 5. Relatório Financeiro (Pós-MVP)

### 5.1. Resumo por Propriedade

```text
┌─────────────────────────────────────────┐
│ Financeiro — Fazenda Norte (Maio 2026)  │
├─────────────────────────────────────────┤
│ Animais ativos:        240              │
│ Investimento total:    R$ 732.000,00    │
│ Valor mercado estimado:R$ 924.000,00    │
│ Resultado estimado:    R$ +192.000,00   │
│ Retorno:               +26,2%           │
├─────────────────────────────────────────┤
│ Vendas no mês:         5 animais        │
│ Receita com vendas:    R$ 28.500,00     │
│ Mortes no mês:         1 animal         │
│ Perda com mortes:      R$ 4.200,00      │
└─────────────────────────────────────────┘
```

### 5.2. Resumo por Animal

Para cada animal na lista, exibir badge de lucratividade:

```text
Mimosa (BR-00142)   ▼ -R$ 1.157,50   (em crescimento)
Trovão (BR-00201)   ▲ +R$   850,00   (pronto para venda)
Estrela (BR-00310)   ▲ +R$ 2.100,00   (alta produtividade)
```

---

## 6. Permissões

| Operação                      | Dono | Peão |
|-------------------------------|:----:|:----:|
| Ver financeiro do animal      | ✅   | ❌   |
| Ver financeiro da propriedade | ✅   | ❌   |
| Registrar baixa               | ✅   | ❌   |
| Configurar cotação            | ✅   | ❌   |
| Ver relatório financeiro      | ✅   | ❌   |

---

## 7. Queries Comuns

### Custo acumulado de um animal
```sql
SELECT
  a.valor_compra AS compra,
  COALESCE(SUM(v.valor), 0) AS total_vacinas,
  COALESCE(SUM(m.valor), 0) AS total_medicamentos,
  a.valor_compra + COALESCE(SUM(v.valor), 0) + COALESCE(SUM(m.valor), 0) AS custo_total
FROM animais a
LEFT JOIN vacinas v ON v.animal_uuid = a.uuid
LEFT JOIN medicamentos m ON m.animal_uuid = a.uuid
WHERE a.uuid = ?
GROUP BY a.uuid;
```

### Ranking de lucratividade (mais lucrativos primeiro)
```sql
SELECT
  a.uuid, a.nome, a.id_fisico,
  a.peso_inicial,
  (SELECT MAX(peso) FROM pesagens WHERE animal_uuid = a.uuid) AS peso_atual,
  a.valor_compra + COALESCE((SELECT SUM(valor) FROM vacinas WHERE animal_uuid = a.uuid), 0)
    + COALESCE((SELECT SUM(valor) FROM medicamentos WHERE animal_uuid = a.uuid), 0) AS custo_total
FROM animais a
WHERE a.deleted = 0 AND a.status = 'ativo'
ORDER BY custo_total ASC;
```

### Vendas realizadas
```sql
SELECT a.nome, a.id_fisico, b.data_baixa, b.valor_recebido, b.comprador
FROM baixas b
JOIN animais a ON b.animal_uuid = a.uuid
WHERE b.propriedade_uuid = ? AND b.motivo = 'vendido'
ORDER BY b.data_baixa DESC;
```

---

## 8. Dependências para Implementação

Para completar o módulo financeiro, é preciso:

| Dependência                           | Status   | Módulo       |
|---------------------------------------|----------|--------------|
| Campo `valor_compra` no cadastro animal| A fazer  | Identificação|
| Campo `valor` nos registros de vacinas | A fazer  | Saúde        |
| Campo `valor` nos registros de medicamentos | A fazer | Saúde     |
| Campo `peso_atual` (pesagem mais recente) | Já existe | Desempenho |
| Tabela `baixas` (registro de vendas/mortes) | A fazer | Este módulo|
| Configuração de cotação R$/kg         | A fazer  | Configurações|

---

## 9. Resumo

| Aspecto              | Decisão                                      |
|----------------------|----------------------------------------------|
| Status               | Pós-MVP (Sprint 10)                          |
| Cálculo de custos    | Compra + Vacinas + Medicamentos + Ração (opt.)|
| Valor de mercado     | Peso atual × cotação configurável             |
| Indicador            | Lucro (verde) / Prejuízo (vermelho)           |
| Baixa                | Soft delete + tabela de registro de baixa     |
| Acesso               | Exclusivo para Dono                           |
