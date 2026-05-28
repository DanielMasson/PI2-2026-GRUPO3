# Módulo de Saúde e Calendário Sanitário

> **Prioridade:** Alta | **Sprint:** 6 | **Status:** MVP
>
> Automatiza o plano sanitário da propriedade, controlando vacinas, medicamentos,
> ocorrências clínicas e localização/movimentação dos animais.

---

## 1. Visão Geral

O módulo de Saúde é dividido em **4 submódulos**, acessíveis por abas na tela de Saúde:

```text
┌──────────────────────────────────────────────────────────┐
│                  MÓDULO DE SAÚDE                         │
│                                                          │
│  ┌──────────┐ ┌──────────────┐ ┌────────────┐ ┌───────┐ │
│  │  Vacinas │ │ Medicamentos │ │Ocorrências │ │ Local │ │
│  └────┬─────┘ └──────┬───────┘ └─────┬──────┘ └───┬───┘ │
│       │              │               │            │      │
│  ┌────▼─────┐ ┌──────▼───────┐ ┌─────▼──────┐ ┌───▼───┐ │
│  │Calendário│ │ Tratamentos  │ │  Clínicas  │ │Áreas/ │ │
│  │de Vacinas│ │ e Carência   │ │ Sintomas   │ │Lotes  │ │
│  └──────────┘ └──────────────┘ └────────────┘ └───────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Submódulo: Vacinas

### 2.1. Vacinas Padrão por Espécie

O sistema carrega automaticamente um calendário de vacinas obrigatórias ao cadastrar um animal.

#### Bovinos
| Vacina             | Ciclo (dias) | Obrigatória | Observação                    |
|--------------------|:------------:|:-----------:|-------------------------------|
| Febre Aftosa       | 180          | Sim         | Semestral (obrigatória por lei)|
| Brucelose          | 365          | Sim         | Anual (fêmeas 3-8 meses)      |
| Clostridioses      | 365          | Sim         | Anual                          |
| Raiva              | 365          | Não         | Recomendada em áreas endêmicas |
| Botulismo          | 365          | Não         | Recomendada                    |
| Leptospirose       | 180          | Não         | Semestral                      |

#### Ovinos
| Vacina             | Ciclo (dias) | Obrigatória | Observação                    |
|--------------------|:------------:|:-----------:|-------------------------------|
| Clostridioses      | 180          | Sim         | Semestral                      |
| Raiva              | 365          | Não         | Recomendada                    |
| Paratifo           | 365          | Não         | Recomendada                    |

### 2.2. Campos do Registro de Vacina

| Campo            | Tipo   | Obrigatório | Descrição                              |
|------------------|--------|:-----------:|----------------------------------------|
| `uuid`           | TEXT   | Sim         | UUID v4                                |
| `animal_uuid`    | TEXT   | Sim         | FK → animais.uuid                      |
| `propriedade_uuid`| TEXT  | Sim         | FK → propriedades.uuid (desnormalizado)|
| `nome_vacina`    | TEXT   | Sim         | Nome da vacina                         |
| `obrigatoria`    | INTEGER| Sim         | 0 = opcional, 1 = obrigatória         |
| `ciclo_dias`     | INTEGER| Não         | Dias até próxima dose                  |
| `data_aplicacao` | TEXT   | Sim         | YYYY-MM-DD                             |
| `proxima_dose`   | TEXT   | Não         | Calculada: data_aplicacao + ciclo_dias |
| `lote`           | TEXT   | Não         | Lote da vacina                         |
| `responsavel`    | TEXT   | Não         | Nome de quem aplicou                   |

### 2.3. Regras de Negócio

- **Próxima dose calculada automaticamente:** `proxima_dose = data_aplicacao + ciclo_dias`
- **Alerta de vencimento:** Banner vermelho quando `proxima_dose <= hoje + 7 dias`
- **Vacinas obrigatórias:** Carregadas automaticamente ao cadastrar animal
- **Status visual:**
  - Vencida (dias < 0): vermelho
  - Urgente (dias ≤ 7): laranja
  - Próxima (dias ≤ 30): amarelo
  - OK (dias > 30): verde

### 2.4. Validações

```javascript
function validarVacina({ vacinaId, animal, data, lote, responsavel }) {
  const erros = {}
  if (!vacinaId) erros.vacinaId = 'Selecione a vacina'
  if (!animal) erros.animal = 'Selecione o animal'
  if (!data) erros.data = 'Informe a data de aplicação'
  if (!lote.trim()) erros.lote = 'Informe o lote'
  if (!responsavel.trim()) erros.responsavel = 'Informe o responsável'
  return erros
}
```

### 2.5. Permissões

| Operação              | Dono | Peão |
|-----------------------|:----:|:----:|
| Visualizar calendário | ✅   | ✅   |
| Registrar aplicação   | ✅   | ✅   |
| Editar aplicação      | ✅   | ❌   |
| Excluir aplicação     | ✅   | ❌   |

---

## 3. Submódulo: Medicamentos

### 3.1. Tipos de Medicamento

| Tipo               | Exemplo                  | Carência típica |
|--------------------|--------------------------|:---------------:|
| Antibiótico        | Oxitetraciclina          | 28 dias         |
| Vermífugo          | Ivermectina 1%           | 28 dias         |
| Anti-inflamatório  | Flunixina Meglumina      | 15 dias         |
| Suplemento         | Vitaminas ADE            | 0 dias          |
| Antiparasitário    | Cipermetrina             | 14 dias         |
| Outro              | —                        | Configurável    |

### 3.2. Campos do Registro de Medicamento

| Campo            | Tipo   | Obrigatório | Descrição                              |
|------------------|--------|:-----------:|----------------------------------------|
| `uuid`           | TEXT   | Sim         | UUID v4                                |
| `animal_uuid`    | TEXT   | Sim         | FK → animais.uuid                      |
| `propriedade_uuid`| TEXT  | Sim         | FK → propriedades.uuid                 |
| `tipo`           | TEXT   | Sim         | Tipo do medicamento                    |
| `produto`        | TEXT   | Sim         | Nome do produto                        |
| `dose`           | TEXT   | Sim         | Dose aplicada (ex: "5ml")              |
| `data_aplicacao` | TEXT   | Sim         | YYYY-MM-DD                             |
| `carencia_dias`  | INTEGER| Não         | Período de carência em dias            |
| `data_liberacao` | TEXT   | Não         | Calculada: data_aplicacao + carencia   |
| `responsavel`    | TEXT   | Não         | Nome de quem aplicou                   |
| `observacao`     | TEXT   | Não         | Observações sobre o tratamento         |

### 3.3. Regras de Negócio

- **Data de liberação calculada automaticamente:** `data_liberacao = data_aplicacao + carencia_dias`
- **Contagem regressiva:** Exibe quantos dias faltam para o animal sair da carência
- **Badge de carência na lista de animais:** Animal em carência recebe tag vermelha
- **Animal em carência NÃO pode ser abatido nem ordenhado** (alerta visual)

### 3.4. Status de Carência

```javascript
function statusCarencia(dataLiberacao) {
  const dias = diasAte(dataLiberacao)
  if (dias < 0) return { label: 'Liberado', cor: 'verde' }
  if (dias === 0) return { label: 'Libera hoje', cor: 'amarelo' }
  return { label: `Carência: ${dias}d`, cor: 'vermelho' }
}
```

### 3.5. Permissões

| Operação              | Dono | Peão |
|-----------------------|:----:|:----:|
| Visualizar tratamentos| ✅   | ✅   |
| Registrar tratamento  | ✅   | ✅   |
| Editar tratamento     | ✅   | ❌   |
| Excluir tratamento    | ✅   | ❌   |

---

## 4. Submódulo: Ocorrências Clínicas

### 4.1. Campos do Registro

| Campo         | Tipo   | Obrigatório | Descrição                                      |
|---------------|--------|:-----------:|------------------------------------------------|
| `uuid`        | TEXT   | Sim         | UUID v4                                        |
| `animal_uuid` | TEXT   | Sim         | FK → animais.uuid                              |
| `propriedade_uuid`| TEXT| Sim         | FK → propriedades.uuid                         |
| `data`        | TEXT   | Sim         | YYYY-MM-DD                                     |
| `sintomas`    | TEXT   | Sim         | Descrição dos sintomas observados              |
| `tratamento`  | TEXT   | Não         | Tratamento aplicado                            |
| `resultado`   | TEXT   | Não         | Estado atual (padrão: 'aguardando')            |
| `veterinario` | TEXT   | Não         | Nome do veterinário responsável                |

### 4.2. Resultados Possíveis

| Resultado              | Cor visual | Descrição                         |
|------------------------|:----------:|-----------------------------------|
| `aguardando`           | Cinza      | Aguardando avaliação              |
| `em_tratamento`        | Amarelo    | Em tratamento                     |
| `recuperado`           | Verde      | Animal recuperado                 |
| `obito`                | Vermelho   | Animal veio a óbito               |

### 4.3. Permissões

| Operação              | Dono | Peão |
|-----------------------|:----:|:----:|
| Visualizar ocorrências| ✅   | ✅   |
| Registrar ocorrência  | ✅   | ✅   |
| Editar ocorrência     | ✅   | ❌   |
| Excluir ocorrência    | ✅   | ❌   |

---

## 5. Submódulo: Localização e Movimentação

### 5.1. Áreas Padrão da Propriedade

O sistema permite cadastrar áreas/lotes da fazenda e registrar a movimentação dos animais.

```javascript
const AREAS_PADRAO = [
  'Pasto Norte', 'Pasto Sul', 'Curral Central',
  'Cocheira', 'Área de Quarentena', 'Bebedouro Leste'
]
```

### 5.2. Campos do Registro de Movimentação

| Campo         | Tipo   | Obrigatório | Descrição                                    |
|---------------|--------|:-----------:|----------------------------------------------|
| `uuid`        | TEXT   | Sim         | UUID v4                                      |
| `animal_uuid` | TEXT   | Sim         | FK → animais.uuid                            |
| `propriedade_uuid`| TEXT| Sim         | FK → propriedades.uuid                       |
| `area`        | TEXT   | Sim         | Nome da área (lista ou personalizada)        |
| `tipo`        | TEXT   | Sim         | Tipo de atividade                            |
| `data`        | TEXT   | Sim         | YYYY-MM-DD                                   |
| `hora`        | TEXT   | Não         | HH:MM                                        |
| `observacao`  | TEXT   | Não         | Observações sobre o animal                   |

### 5.3. Tipos de Atividade

| Tipo           | Ícone | Cor     | Descrição               |
|----------------|:-----:|:-------:|-------------------------|
| `sono`         | 🌙    | Cinza   | Sono / Descanso         |
| `alimentacao`  | 🌿    | Verde   | Alimentação             |
| `pastagem`     | ☀️    | Amarelo | Pastagem                |
| `tratamento`   | 💊    | Vermelho| Tratamento              |
| `outro`        | 📌    | Cinza   | Outro                   |

### 5.4. Visão Atual

A tela exibe a **última localização registrada** de cada animal em cards:

```text
┌─────────────────────────────────┐
│ Localização Atual dos Animais   │
├─────────────────────────────────┤
│ Mimosa (BR-00142)               │
│ Pasto Norte · ☀️ Pastagem       │
│ 26/05/2026 às 08:30             │
├─────────────────────────────────┤
│ Trovão (BR-00201)               │
│ Curral Central · 💊 Tratamento  │
│ 25/05/2026 às 14:00             │
└─────────────────────────────────┘
```

### 5.5. Permissões

| Operação              | Dono | Peão |
|-----------------------|:----:|:----:|
| Visualizar localização| ✅   | ✅   |
| Registrar movimentação| ✅   | ✅   |
| Editar movimentação   | ✅   | ❌   |
| Excluir movimentação  | ✅   | ❌   |

---

## 6. Telas Relacionadas

| Tela                      | Rota                                                    | Descrição                    |
|---------------------------|---------------------------------------------------------|------------------------------|
| Calendário de Vacinas     | `/propriedade/:id/saude` (aba Vacinas)                  | Calendário + registro        |
| Controle de Medicamentos  | `/propriedade/:id/saude` (aba Medicamentos)             | Tratamentos + carência       |
| Ocorrências Clínicas      | `/propriedade/:id/saude` (aba Ocorrências)              | Sintomas + resultado         |
| Localização               | `/propriedade/:id/saude` (aba Localização)              | Áreas + movimentação         |

---

## 7. Queries Comuns

### Vacinas próximas do vencimento
```sql
SELECT v.*, a.nome AS nome_animal, a.id_fisico
FROM vacinas v
JOIN animais a ON v.animal_uuid = a.uuid
WHERE v.proxima_dose <= date('now', '+7 days')
  AND a.deleted = 0
ORDER BY v.proxima_dose ASC;
```

### Animais em período de carência
```sql
SELECT m.*, a.nome AS nome_animal, a.id_fisico
FROM medicamentos m
JOIN animais a ON m.animal_uuid = a.uuid
WHERE m.data_liberacao >= date('now')
  AND a.deleted = 0
ORDER BY m.data_liberacao ASC;
```

### Última localização de cada animal
```sql
SELECT l.*, a.nome AS nome_animal
FROM (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY animal_uuid ORDER BY data DESC, hora DESC) AS rn
  FROM movimentacoes
) l
JOIN animais a ON l.animal_uuid = a.uuid
WHERE l.rn = 1 AND a.deleted = 0;
```
