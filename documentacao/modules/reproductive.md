# Módulo Gestativo/Reprodutivo

> **Prioridade:** Alta | **Sprint:** 7 | **Status:** MVP
>
> Gerencia o ciclo reprodutivo dos animais, desde a cobertura até o parto,
> incluindo genealogia e controle de gestação.

---

## 1. Visão Geral

O módulo reprodutivo acompanha todo o ciclo: **cobertura → confirmação de prenhez → gestação → secagem → parto**.

```text
┌───────────────────────────────────────────────────────────────────┐
│                   MÓDULO REPRODUTIVO                              │
│                                                                   │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐      │
│  │Cobertura │──►│ Prenhez  │──►│ Gestação │──►│  Parto   │      │
│  │          │   │Confirmada│   │(contagem)│   │          │      │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘      │
│       │                              │                            │
│       │         ┌──────────┐         │                            │
│       └────────►│ Secagem  │◄────────┘                            │
│                 │(-60 dias)│                                      │
│                 └──────────┘                                      │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ GENEALOGIA: Pai (Touro) ← Animal → Mãe (Matriz)         │    │
│  └──────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────┘
```

---

## 2. Campos do Registro Reprodutivo

| Campo               | Tipo    | Obrigatório | Descrição                                    |
|---------------------|---------|:-----------:|----------------------------------------------|
| `uuid`              | TEXT    | Sim         | UUID v4                                      |
| `animal_uuid`       | TEXT    | Sim         | FK → animais.uuid (fêmea)                    |
| `propriedade_uuid`  | TEXT    | Sim         | FK → propriedades.uuid                       |
| `tipo_cobertura`    | TEXT    | Sim         | `'monta_natural'` ou `'inseminacao_artificial'` |
| `data_cobertura`    | TEXT    | Sim         | YYYY-MM-DD                                   |
| `touro_uuid`        | TEXT    | Não         | FK → animais.uuid (macho usado)              |
| `prenhez_confirmada`| INTEGER | Não         | 0 = não confirmada, 1 = confirmada           |
| `data_confirmacao`  | TEXT    | Não         | Data do exame (toque ou ultrassom)           |
| `data_previa_parto` | TEXT    | Não         | Calculada: cobertura + 285 dias (bovinos)    |
| `data_secagem`      | TEXT    | Não         | Calculada: previa_parto − 60 dias            |
| `data_parto`        | TEXT    | Não         | Preenchida quando o parto ocorre             |
| `observacao`        | TEXT    | Não         | Observações sobre o processo                 |

---

## 3. Regras de Negócio

### 3.1. Duração da Gestação

| Espécie | Duração (dias) | Secagem (dias antes) |
|---------|:--------------:|:--------------------:|
| Bovino  | 285            | 60                   |
| Ovino   | 150            | —                    |

### 3.2. Cálculos Automáticos

```javascript
function calcularDatasReproducao(dataCobertura, especie) {
  const cobertura = new Date(dataCobertura + 'T00:00:00')
  const diasGestacao = especie === 'ovino' ? 150 : 285
  const diasSecagem = especie === 'ovino' ? 0 : 60

  const dataPreviaParto = new Date(cobertura)
  dataPreviaParto.setDate(dataPreviaParto.getDate() + diasGestacao)

  const dataSecagem = new Date(dataPreviaParto)
  dataSecagem.setDate(dataSecagem.getDate() - diasSecagem)

  return {
    data_previa_parto: dataPreviaParto.toISOString().split('T')[0],
    data_secagem: diasSecagem > 0 ? dataSecagem.toISOString().split('T')[0] : null,
  }
}
```

### 3.3. Status da Gestação

| Dias até o parto | Status         | Cor      | Ação                      |
|:----------------:|----------------|----------|---------------------------|
| > 60             | Gestante       | Verde    | Acompanhar                |
| 30–60            | Pré-parto      | Amarelo  | Preparar parto            |
| 0–30             | Parto próximo  | Laranja  | Alerta urgente            |
| < 0              | Atrasada       | Vermelho | Verificar possível aborto |
| Parto registrado | Parida         | Azul     | Atualizar dados           |

### 3.4. Confirmação de Prenhez

- Exame de toque retal ou ultrassom
- Ao confirmar: `prenhez_confirmada = 1`, `data_confirmacao = data do exame`
- Contador de dias regressivos é exibido na ficha do animal

### 3.5. Data de Secagem

- Calculada automaticamente: `data_previa_parto − 60 dias`
- Gera alerta na data de secagem para interromper a ordenha
- Vinculada ao módulo de produção leiteira (pós-MVP)

### 3.6. Registro de Parto

- Preencher `data_parto` quando o parto ocorre
- Opcionalmente criar automaticamente o registro do bezerro (animal filho)

---

## 4. Validações

```javascript
function validarReproducao({ tipoCobertura, dataCobertura }) {
  const erros = {}
  if (!tipoCobertura) erros.tipoCobertura = 'Selecione o tipo de cobertura'
  if (!dataCobertura) erros.dataCobertura = 'Informe a data da cobertura'
  
  const hoje = new Date()
  const cobertura = new Date(dataCobertura)
  if (cobertura > hoje) erros.dataCobertura = 'Data não pode ser futura'
  
  return erros
}
```

---

## 5. Genealogia

### 5.1. Vinculação

- **Mãe (Matriz):** Selecionada automaticamente como a fêmea que recebeu a cobertura
- **Pai (Touro/Pajem):** Selecionado no registro de cobertura via busca de animais machos

### 5.2. Busca de Pais

```sql
-- Listar machos disponíveis como touro
SELECT uuid, nome, id_fisico, raca
FROM animais
WHERE propriedade_uuid = ?
  AND sexo = 'macho'
  AND deleted = 0
  AND status = 'ativo'
ORDER BY nome ASC;
```

### 5.3. Exibição na Ficha

```text
┌─────────────────────────────────┐
│ Genealogia                      │
├─────────────────────────────────┤
│ Mãe: Estrela (ANI-00010)       │
│ Pai: Toro Rei (ANI-00003)      │
│                                 │
│ Filhos:                         │
│ • Bezerro 01 (ANI-00050) - 2026│
│ • Bezerro 02 (ANI-00063) - 2027│
└─────────────────────────────────┘
```

---

## 6. Permissões

| Operação                    | Dono | Peão |
|-----------------------------|:----:|:----:|
| Visualizar registros        | ✅   | ✅   |
| Registrar cobertura         | ✅   | ✅   |
| Confirmar prenhez           | ✅   | ✅   |
| Registrar parto             | ✅   | ✅   |
| Editar registro             | ✅   | ❌   |
| Excluir registro            | ✅   | ❌   |
| Ver genealogia completa     | ✅   | ✅   |

---

## 7. Telas Relacionadas

| Tela                    | Rota                                           | Descrição                    |
|-------------------------|------------------------------------------------|------------------------------|
| Controle Reprodutivo    | `/propriedade/:id/reproducao`                  | Lista de gestações ativas    |
| Ficha do Animal         | `/propriedade/:id/animal/:animalId`            | Seção reprodutiva na ficha   |
| Registrar Cobertura     | `/propriedade/:id/animal/:animalId/reproducao` | Formulário de cobertura      |

---

## 8. Queries Comuns

### Gestações ativas de uma propriedade
```sql
SELECT r.*, a.nome AS nome_animal, a.id_fisico,
       CAST(julianday(r.data_previa_parto) - julianday('now') AS INTEGER) AS dias_restantes
FROM reproducao r
JOIN animais a ON r.animal_uuid = a.uuid
WHERE r.propriedade_uuid = ?
  AND r.data_parto IS NULL
  AND a.deleted = 0
ORDER BY r.data_previa_parto ASC;
```

### Partos previstos nos próximos 30 dias
```sql
SELECT r.*, a.nome AS nome_animal
FROM reproducao r
JOIN animais a ON r.animal_uuid = a.uuid
WHERE r.data_previa_parto BETWEEN date('now') AND date('now', '+30 days')
  AND r.data_parto IS NULL
  AND a.deleted = 0
ORDER BY r.data_previa_parto ASC;
```

### Histórico reprodutivo de uma fêmea
```sql
SELECT r.*, a_touro.nome AS nome_touro
FROM reproducao r
LEFT JOIN animais a_touro ON r.touro_uuid = a_touro.uuid
WHERE r.animal_uuid = ?
ORDER BY r.data_cobertura DESC;
```
