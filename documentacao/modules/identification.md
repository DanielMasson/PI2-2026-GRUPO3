# Módulo de Identificação e Dados Biométricos

> **Prioridade:** Alta | **Sprint:** 5 | **Status:** MVP
>
> Responsável pela ficha técnica individual de cada animal, incluindo identificadores,
> dados biométricos, genética e origem.

---

## 1. Visão Geral

O módulo de Identificação é o **coração do sistema** — todos os outros módulos
(vacinas, pesagens, reprodução, financeiro) se vinculam a um animal cadastrado aqui.

```text
┌─────────────────────────────────────────────────┐
│           MÓDULO DE IDENTIFICAÇÃO               │
│                                                 │
│  ┌───────────┐  ┌───────────┐  ┌─────────────┐ │
│  │ Identific.│  │ Biometria │  │ Genealogia  │ │
│  │ Primários │  │           │  │             │ │
│  ├───────────┤  ├───────────┤  ├─────────────┤ │
│  │ ID interno│  │ Espécie   │  │ Mãe (UUID)  │ │
│  │ ID físico │  │ Raça      │  │ Pai (UUID)  │ │
│  │ Nome      │  │ Sexo      │  │ Origem      │ │
│  │ Status    │  │ Nasc.     │  │ Genética    │ │
│  └───────────┘  │ Peso ini. │  └─────────────┘ │
│                 │ Pelagem   │                   │
│                 └───────────┘                   │
└─────────────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
   Módulo Saúde   Módulo Desemp.  Módulo Reprod.
```

---

## 2. Campos do Animal

### 2.1. Identificadores Primários

| Campo         | Tipo   | Obrigatório | Descrição                                    |
|---------------|--------|:-----------:|----------------------------------------------|
| `uuid`        | TEXT   | Sim         | UUID v4, gerado automaticamente              |
| `id_interno`  | TEXT   | Sim         | ID sequencial gerado pelo app (ex: ANI-00001)|
| `id_fisico`   | TEXT   | Não         | Número do brinco, colar ou tag               |
| `nome`        | TEXT   | Não         | Nome ou apelido do animal                    |
| `status`      | TEXT   | Sim         | `'ativo'` / `'vendido'` / `'morto'` / `'consumido'` |

### 2.2. Biometria e Características

| Campo            | Tipo   | Obrigatório | Valores aceitos                       |
|------------------|--------|:-----------:|---------------------------------------|
| `especie`        | TEXT   | Sim         | `'bovino'` / `'ovino'` / `'suino'`   |
| `raca`           | TEXT   | Sim         | Texto livre (ex: "Nelore", "Santa Inês") |
| `sexo`           | TEXT   | Sim         | `'macho'` / `'femea'`                |
| `data_nascimento`| TEXT   | Sim         | ISO 8601 (YYYY-MM-DD)                |
| `peso_inicial`   | REAL   | Sim         | Em kg (mín: 1, máx: 1500)            |
| `pelagem`        | TEXT   | Não         | Descrição visual (ex: "Branca malhada") |

### 2.3. Genealogia e Origem

| Campo        | Tipo   | Obrigatório | Descrição                                    |
|--------------|--------|:-----------:|----------------------------------------------|
| `genetica`   | TEXT   | Não         | Composição genética (ex: "1/2 Angus + 1/2 Nelore") |
| `origem`     | TEXT   | Não         | De onde veio (ex: "Comprado na Fazenda São João") |
| `mae_uuid`   | TEXT   | Não         | UUID da mãe (FK → animais.uuid)              |
| `pai_uuid`   | TEXT   | Não         | UUID do pai (FK → animais.uuid)              |

### 2.4. Metadados de Sincronização

| Campo        | Tipo    | Padrão          |
|--------------|---------|-----------------|
| `created_at` | TEXT    | ISO 8601        |
| `updated_at` | TEXT    | ISO 8601        |
| `synced_at`  | TEXT    | NULL            |
| `sync_status`| TEXT    | `'novo'`        |
| `deleted`    | INTEGER | `0`             |

---

## 3. Regras de Negócio

### 3.1. Geração de ID Interno

```javascript
function gerarIdInterno(sequenciaAtual) {
  const proximo = sequenciaAtual + 1
  return `ANI-${String(proximo).padStart(5, '0')}`
  // Exemplos: ANI-00001, ANI-00002, ANI-00042
}
```

O ID interno é sequencial por propriedade. O contador é mantido no SQLite:

```sql
-- Contador de IDs por propriedade
CREATE TABLE contadores (
    propriedade_uuid TEXT PRIMARY KEY,
    ultimo_id_animal INTEGER DEFAULT 0
);
```

### 3.2. Cálculo Automático de Idade

```javascript
function calcularIdade(dataNascimento) {
  const hoje = new Date()
  const nascimento = new Date(dataNascimento + 'T00:00:00')
  const meses = (hoje.getFullYear() - nascimento.getFullYear()) * 12
    + (hoje.getMonth() - nascimento.getMonth())
  
  if (meses < 12) return `${meses} meses`
  const anos = Math.floor(meses / 12)
  const restoMeses = meses % 12
  return restoMeses > 0 ? `${anos} anos e ${restoMeses} meses` : `${anos} anos`
}
```

### 3.3. Validações do Formulário

```javascript
function validarAnimal({ especie, raca, sexo, dataNascimento, pesoInicial }) {
  const erros = {}

  if (!especie) erros.especie = 'Selecione a espécie'
  if (!raca.trim()) erros.raca = 'Raça é obrigatória'
  if (!sexo) erros.sexo = 'Selecione o sexo'
  if (!dataNascimento) erros.dataNascimento = 'Data de nascimento é obrigatória'
  if (!pesoInicial) erros.pesoInicial = 'Peso é obrigatório'
  else if (isNaN(Number(pesoInicial)) || Number(pesoInicial) <= 0)
    erros.pesoInicial = 'Peso inválido'
  else if (Number(pesoInicial) > 1500)
    erros.pesoInicial = 'Peso máximo: 1500 kg'

  return erros
}
```

### 3.4. Soft Delete (Exclusão)

Animais não são removidos permanentemente — são marcados como `deleted = 1`:

```javascript
async function excluirAnimal(animalUuid) {
  await db.run(
    `UPDATE animais SET deleted = 1, updated_at = ?, sync_status = 'modificado' WHERE uuid = ?`,
    [new Date().toISOString(), animalUuid]
  )
  // No Firestore:
  await firestore.update(`propriedade/${propId}/animais/${animalUuid}`, {
    deleted: true,
    updated_at: serverTimestamp()
  })
}
```

**Motivo:** Preservar histórico financeiro e genealógico.

---

## 4. Telas Relacionadas

### 4.1. Lista de Animais (`pages/ListaAnimais/`)

**Rota:** `/propriedade/:propriedadeId/animais`

**Componentes:**
- Barra de busca (por nome, brinco, ID)
- Filtros: espécie, sexo, status
- Cards de animal: nome, brinco, espécie, idade, peso atual
- Badge de carência (se animal tiver medicamento em período de carência)
- Botão "+" para cadastrar novo animal (Dono e Peão)
- Botões editar/excluir (apenas Dono)

**Ordenação padrão:** Nome alfabético (A-Z)

### 4.2. Cadastro de Animal (`pages/AnimalRegistration/`)

**Rota:** `/propriedade/:propriedadeId/cadastro-animal`

**Componentes existentes (código):**
- Input: Nome do animal
- Input: Brinco/Tag
- Input: Raça
- Input: Peso (kg) — tipo number
- Input: Data de nascimento — tipo date
- Select: Sexo (Macho / Fêmea)
- Botões: Limpar / Salvar animal

**Campos a adicionar (MVP):**
- Select: Espécie (Bovino / Ovino / Suíno)
- Input: Pelagem/Sinais
- Input: Genética
- Input: Origem
- Select: Mãe (busca de animais fêmeas da mesma propriedade)
- Select: Pai (busca de animais machos da mesma propriedade)

### 4.3. Ficha Individual (`pages/FichaAnimal/`)

**Rota:** `/propriedade/:propriedadeId/animal/:animalId`

**Seções da ficha:**

```text
┌─────────────────────────────────────────┐
│ FICHA DO ANIMAL                         │
├─────────────────────────────────────────┤
│ [Foto]  Nome: Mimosa                    │
│         Brinco: BR-00142                │
│         Espécie: Bovino · Raça: Nelore  │
│         Sexo: Fêmea · 3 anos e 2 meses │
├─────────────────────────────────────────┤
│ IDENTIFICAÇÃO                           │
│ ID Interno: ANI-00042                   │
│ ID Físico: BR-00142                     │
│ Status: Ativo                           │
│ Pelagem: Branca malhada                 │
│ Genética: 3/4 Nelore + 1/4 Angus       │
│ Origem: Comprada na Fazenda São João    │
├─────────────────────────────────────────┤
│ GENEALOGIA                              │
│ Mãe: Estrela (ANI-00010)               │
│ Pai: Toro Rei (ANI-00003)              │
├─────────────────────────────────────────┤
│ DESEMPENHO (resumo)                     │
│ Peso inicial: 280 kg                    │
│ Peso atual: 345 kg                      │
│ GMD: 0.85 kg/dia                        │
│ ECC: 3/5                                │
├─────────────────────────────────────────┤
│ SAÚDE (resumo)                          │
│ Próxima vacina: Febre Aftosa (15/07)    │
│ Em carência: Não                        │
│ Última ocorrência: Claudicação (01/05)  │
├─────────────────────────────────────────┤
│ [Editar]  [Excluir]  [Histórico]        │
└─────────────────────────────────────────┘
```

---

## 5. Constantes do Módulo

```javascript
const ESPECIES = [
  { valor: 'bovino', label: 'Bovino', icon: '🐄' },
  { valor: 'ovino', label: 'Ovino', icon: '🐑' },
  { valor: 'suino', label: 'Suíno', icon: '🐷' },
]

const SEXOS = [
  { valor: 'macho', label: 'Macho' },
  { valor: 'femea', label: 'Fêmea' },
]

const STATUS_ANIMAL = [
  { valor: 'ativo', label: 'Ativo', cor: 'verde' },
  { valor: 'vendido', label: 'Vendido', cor: 'azul' },
  { valor: 'morto', label: 'Morto', cor: 'vermelho' },
  { valor: 'consumido', label: 'Consumo próprio', cor: 'cinza' },
]
```

---

## 6. Impacto em Outros Módulos

| Módulo        | Relação com Identificação                              |
|---------------|--------------------------------------------------------|
| Saúde         | Vacinas, medicamentos e ocorrências são vinculados ao `animal_uuid` |
| Desempenho    | Pesagens e GMD são calculados por `animal_uuid`        |
| Reprodutivo   | Cobertura e parto são vinculados à fêmea (`animal_uuid`) |
| Financeiro    | Custos são acumulados por `animal_uuid`                |

---

## 7. Queries Comuns

### Listar animais ativos de uma propriedade
```sql
SELECT uuid, id_interno, id_fisico, nome, especie, raca, sexo,
       data_nascimento, peso_inicial
FROM animais
WHERE propriedade_uuid = ? AND deleted = 0 AND status = 'ativo'
ORDER BY nome ASC;
```

### Buscar animal por nome ou brinco
```sql
SELECT * FROM animais
WHERE propriedade_uuid = ? AND deleted = 0
  AND (nome LIKE '%' || ? || '%' OR id_fisico LIKE '%' || ? || '%')
ORDER BY nome ASC;
```

### Listar fêmeas para vínculo de mãe
```sql
SELECT uuid, nome, id_fisico, raca
FROM animais
WHERE propriedade_uuid = ? AND deleted = 0 AND sexo = 'femea' AND status = 'ativo'
ORDER BY nome ASC;
```

### Listar machos para vínculo de pai
```sql
SELECT uuid, nome, id_fisico, raca
FROM animais
WHERE propriedade_uuid = ? AND deleted = 0 AND sexo = 'macho' AND status = 'ativo'
ORDER BY nome ASC;
```
