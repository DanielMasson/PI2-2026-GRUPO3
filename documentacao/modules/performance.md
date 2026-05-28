# Módulo de Desempenho e Produção

> **Prioridade:** Média | **Sprint:** 6 | **Status:** MVP
>
> Controla o histórico de pesagens, Ganho Médio Diário (GMD), Score de Condição
> Corporal (ECC) e produção leiteira.

---

## 1. Visão Geral

O módulo de Desempenho permite acompanhar a **evolução do peso** e a **produtividade**
de cada animal, gerando indicadores que apoiam decisões de manejo.

```text
┌────────────────────────────────────────────────┐
│          MÓDULO DE DESEMPENHO                  │
│                                                │
│  ┌──────────────┐      ┌───────────────────┐  │
│  │  Pesagens    │      │ Produção Leiteira │  │
│  ├──────────────┤      ├───────────────────┤  │
│  │ Histórico    │      │ Ordenha manhã     │  │
│  │ GMD          │      │ Ordenha tarde     │  │
│  │ ECC          │      │ CCS               │  │
│  │ Gráfico      │      │ Secagem           │  │
│  └──────────────┘      └───────────────────┘  │
└────────────────────────────────────────────────┘
```

---

## 2. Submódulo: Pesagens

### 2.1. Campos do Registro de Pesagem

| Campo            | Tipo   | Obrigatório | Valores               | Descrição                   |
|------------------|--------|:-----------:|-----------------------|-----------------------------|
| `uuid`           | TEXT   | Sim         | UUID v4               | Identificador único         |
| `animal_uuid`    | TEXT   | Sim         | FK → animais.uuid     | Animal pesado               |
| `propriedade_uuid`| TEXT  | Sim         | FK → propriedades     | Propriedade                 |
| `data`           | TEXT   | Sim         | YYYY-MM-DD            | Data da pesagem             |
| `peso`           | REAL   | Sim         | 1–1500 kg             | Peso registrado             |
| `ecc`            | INTEGER| Não         | 1–5                   | Score de Condição Corporal  |
| `observacao`     | TEXT   | Não         | Livre                 | Observações                 |

### 2.2. Ganho Médio Diário (GMD)

O GMD é calculado **em runtime** (não armazenado no banco) entre duas pesagens consecutivas.

**Fórmula:**
```javascript
function calcularGMD(pesoAtual, pesoAnterior, diasEntrePesagens) {
  if (diasEntrePesagens <= 0) return 0
  return (pesoAtual - pesoAnterior) / diasEntrePesagens
}
```

**Interpretação:**
| GMD (kg/dia)   | Status   | Cor      | Significado                    |
|----------------|----------|----------|--------------------------------|
| ≥ 1.0          | Ótimo    | Verde    | Ganho de peso excelente        |
| 0.5 – 0.99     | Bom      | Verde    | Ganho adequado                 |
| 0.1 – 0.49     | Regular  | Amarelo  | Ganho abaixo do esperado       |
| 0              | Estável  | Cinza    | Sem ganho de peso              |
| < 0            | Perda    | Vermelho | Animal perdendo peso (alerta!) |

**Cálculo com SQL:**
```sql
-- GMD de um animal (últimas 2 pesagens)
SELECT
  p1.peso AS peso_atual,
  p2.peso AS peso_anterior,
  julianday(p1.data) - julianday(p2.data) AS dias,
  (p1.peso - p2.peso) / (julianday(p1.data) - julianday(p2.data)) AS gmd
FROM pesagens p1
JOIN pesagens p2 ON p1.animal_uuid = p2.animal_uuid
WHERE p1.animal_uuid = ?
  AND p1.data = (SELECT MAX(data) FROM pesagens WHERE animal_uuid = ?)
  AND p2.data = (
    SELECT MAX(data) FROM pesagens WHERE animal_uuid = ? AND data < (SELECT MAX(data) FROM pesagens WHERE animal_uuid = ?)
  );
```

### 2.3. Score de Condição Corporal (ECC)

Escala visual de 1 a 5 que avalia a cobertura de gordura do animal.

| ECC | Classificação     | Descrição visual                              | Cor      |
|:---:|-------------------|-----------------------------------------------|----------|
| 1   | Muito magro       | Costelas, coluna e quadril muito visíveis     | Vermelho |
| 2   | Magro             | Costelas visíveis, cobertura mínima           | Laranja  |
| 3   | Ideal             | Costelas palpáveis, cobertura uniforme        | Verde    |
| 4   | Gordo             | Costelas difíceis de palp, gordura visível    | Amarelo  |
| 5   | Muito gordo       | Costelas não palpáveis, excesso de gordura    | Laranja  |

**Faixas ideais por categoria:**
- **Matrizes em reprodução:** ECC 2.5–3.5
- **Boi de corte (engorda):** ECC 3–4
- **Novilhos (crescimento):** ECC 2.5–3.5

### 2.4. Alertas de Pesagem

| Condição                        | Alerta                            |
|---------------------------------|-----------------------------------|
| GMD negativo (perda de peso)    | Badge vermelho na ficha do animal |
| Pesagem atrasada (>30 dias)     | Alerta no painel da propriedade   |
| ECC abaixo de 2                 | Alerta de desnutrição             |
| ECC acima de 4                  | Alerta de sobrepeso               |

### 2.5. Validações

```javascript
function validarPesagem({ data, peso, ecc }) {
  const erros = {}
  if (!data) erros.data = 'Informe a data da pesagem'
  if (!peso) erros.peso = 'Informe o peso'
  else if (isNaN(Number(peso)) || Number(peso) < 1 || Number(peso) > 1500)
    erros.peso = 'Peso deve estar entre 1 e 1500 kg'
  if (ecc && (ecc < 1 || ecc > 5))
    erros.ecc = 'ECC deve estar entre 1 e 5'
  return erros
}
```

### 2.6. Permissões

| Operação              | Dono | Peão |
|-----------------------|:----:|:----:|
| Visualizar pesagens   | ✅   | ✅   |
| Registrar pesagem     | ✅   | ✅   |
| Editar pesagem        | ✅   | ❌   |
| Excluir pesagem       | ✅   | ❌   |

---

## 3. Submódulo: Produção Leiteira (Pós-MVP)

> **Sprint:** 6 | **Status:** Implementação parcial no MVP, completo no pós-MVP

### 3.1. Campos do Registro

| Campo              | Tipo   | Obrigatório | Descrição                              |
|--------------------|--------|:-----------:|----------------------------------------|
| `uuid`             | TEXT   | Sim         | UUID v4                                |
| `animal_uuid`      | TEXT   | Sim         | FK → animais.uuid (apenas fêmeas)      |
| `propriedade_uuid` | TEXT   | Sim         | FK → propriedades.uuid                 |
| `data`             | TEXT   | Sim         | YYYY-MM-DD                             |
| `ordenha_manha`    | REAL   | Não         | Litros na ordenha da manhã             |
| `ordenha_tarde`    | REAL   | Não         | Litros na ordenha da tarde             |
| `total_dia`        | REAL   | Sim         | Calculado: manhã + tarde               |
| `ccs`              | INTEGER| Não         | Contagem de Células Somáticas          |

### 3.2. Regras de Negócio

- Apenas **fêmeas bovinas** aparecem na lista de produção leiteira
- Pelo menos uma ordenha (manhã ou tarde) deve ser preenchida
- **CCS acima de 200.000:** Alerta de possível mastite
- **Data de secagem:** Calculada automaticamente quando vinculada a registro reprodutivo
- **Resumo mensal:** Média de produção por vaca e total da propriedade

### 3.3. Indicadores

| Indicador                | Fórmula                                        |
|--------------------------|------------------------------------------------|
| Total do dia             | `ordenha_manha + ordenha_tarde`                |
| Média por vaca           | `total_propriedade / vacas_em_lactacao`        |
| Vacas em lactação        | Contagem de fêmeas com registro nos últimos 7d |
| % Vacas em lactação      | `vacas_lactacao / femeas_total * 100`          |

### 3.4. Permissões

| Operação                    | Dono | Peão |
|-----------------------------|:----:|:----:|
| Visualizar produção         | ✅   | ✅   |
| Registrar ordenha           | ✅   | ✅   |
| Editar registro             | ✅   | ❌   |
| Ver resumo mensal           | ✅   | ✅   |
| Ver CCS e alertas de mastite| ✅   | ✅   |

---

## 4. Telas Relacionadas

| Tela                   | Rota / Localização                           | Descrição                           |
|------------------------|----------------------------------------------|-------------------------------------|
| Ficha do Animal        | `/propriedade/:id/animal/:animalId`          | Seção de Desempenho (pesagens, GMD) |
| Produção de Leite      | `/propriedade/:id/producao-leite` (pós-MVP)  | Registro diário de ordenhas         |
| Painel da Propriedade  | `/propriedade/:id`                           | Resumo de desempenho do rebanho     |

---

## 5. Queries Comuns

### Histórico de pesagens de um animal
```sql
SELECT data, peso, ecc, observacao
FROM pesagens
WHERE animal_uuid = ?
ORDER BY data DESC;
```

### GMD acumulado (primeira pesagem vs última)
```sql
SELECT
  (MAX(peso) - MIN(peso)) / (julianday(MAX(data)) - julianday(MIN(data))) AS gmd_acumulado
FROM pesagens
WHERE animal_uuid = ?
  AND (SELECT COUNT(*) FROM pesagens WHERE animal_uuid = ?) >= 2;
```

### Animais com perda de peso
```sql
SELECT a.uuid, a.nome, a.id_fisico, p1.peso AS peso_atual, p2.peso AS peso_anterior
FROM animais a
JOIN pesagens p1 ON a.uuid = p1.animal_uuid
JOIN pesagens p2 ON a.uuid = p2.animal_uuid
WHERE a.deleted = 0
  AND p1.data = (SELECT MAX(data) FROM pesagens WHERE animal_uuid = a.uuid)
  AND p2.data = (SELECT MAX(data) FROM pesagens WHERE animal_uuid = a.uuid AND data < p1.data)
  AND p1.peso < p2.peso;
```
