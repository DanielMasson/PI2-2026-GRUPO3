# Ficha Individual do Animal

> **Rota:** `/propriedade/:propriedadeId/animal/:animalId` | **Status:** A fazer | **Sprint:** 5
>
> Tela completa com todos os dados e histórico de um animal individual.

---

## 1. Wireframe

```text
┌──────────────────────────────────┐
│ [←] Ficha do Animal      [✏️]  │
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │ [Foto]  Mimosa               │ │
│ │         BR-00142             │ │
│ │         Bovino · Nelore · ♀ │ │
│ │         3 anos e 2 meses     │ │
│ │         Status: Ativo        │ │
│ └──────────────────────────────┘ │
│                                  │
│ ── IDENTIFICAÇÃO ──              │
│ ID Interno: ANI-00042           │
│ Pelagem: Branca malhada         │
│ Genética: 3/4 Nelore + 1/4 Ang │ │
│ Origem: Comprada na Fazenda SJ  │
│                                  │
│ ── GENEALOGIA ──                 │
│ Mãe: Estrela (ANI-00010)       │
│ Pai: Toro Rei (ANI-00003)      │
│                                  │
│ ── DESEMPENHO ──                 │
│ Peso atual: 345 kg              │
│ GMD: 0.85 kg/dia  [▲]          │
│ ECC: 3/5 [●●●○○]               │
│ Última pesagem: 01/12/2025     │
│                                  │
│ ── SAÚDE ──                      │
│ Próx. vacina: Febre Aftosa     │
│   Vencimento: 15/07/2026 (19d) │ │
│ Em carência: Não                │
│ Última ocorrência: —            │
│                                  │
│ ── REPRODUÇÃO ──                 │
│ Status: Prenhez confirmada      │
│ Parto previsto: 22/05/2026     │
│ Dias restantes: -4 (atrasada!) │ │
│                                  │
│ [Registrar vacina]              │
│ [Registrar pesagem]             │
│ [Registrar ocorrência]          │
│                                  │
│ [Excluir animal] (só Dono)      │
└──────────────────────────────────┘
```

---

## 2. Seções

| Seção         | Dados exibidos                                            |
|---------------|-----------------------------------------------------------|
| Cabeçalho     | Foto, nome, brinco, espécie, raça, sexo, idade, status   |
| Identificação | ID interno, pelagem, genética, origem                     |
| Genealogia    | Mãe (link), pai (link), lista de filhos                   |
| Desempenho    | Peso atual, GMD (com cor), ECC (escala), última pesagem  |
| Saúde         | Próxima vacina, carência, última ocorrência               |
| Reprodução    | Status gestacional, parto previsto, dias restantes        |
| Ações         | Botões para registrar vacina, pesagem, ocorrência         |

---

## 3. Comportamento

### Cálculos em Runtime
- **Idade:** calculada a partir de `data_nascimento`
- **GMD:** calculado entre as 2 últimas pesagens
- **Dias até parto:** `data_previa_parto - hoje`

### Navegação
| Ação                 | Destino                                       |
|----------------------|-----------------------------------------------|
| Editar               | `/propriedade/:id/cadastro-animal?edit=:uuid` |
| Registrar vacina     | `/propriedade/:id/saude?animal=:uuid`         |
| Registrar pesagem    | Modal ou seção inline                         |
| Registrar ocorrência | Modal ou seção inline                         |
| Ver mãe              | `/propriedade/:id/animal/:maeUuid`            |
| Ver pai              | `/propriedade/:id/animal/:paiUuid`            |

---

## 4. Permissões

- Dono e Peão: visualização completa
- Dono: editar e excluir
- Dono e Peão: registrar vacinas, pesagens, ocorrências
- Dono: ver financeiro (pós-MVP)
