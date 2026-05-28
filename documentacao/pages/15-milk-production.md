# Produção de Leite

> **Rota:** `/propriedade/:propriedadeId/producao-leite` | **Status:** Pós-MVP | **Sprint:** 6
>
> Registro diário de ordenhas, qualidade do leite (CCS) e controle de secagem.

---

## 1. Wireframe

```text
┌──────────────────────────────────┐
│ [←] Produção de Leite            │
│ Propriedade: Fazenda Norte       │
├──────────────────────────────────┤
│                                  │
│ Produção de Hoje (26/05/2026)    │
│ ┌──────────────────────────────┐ │
│ │ Mimosa (BR-00142)            │ │
│ │ Manhã: [12.5] L              │ │
│ │ Tarde: [10.0] L              │ │
│ │ Total: 22.5 L                │ │
│ │ CCS: [150000]                │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Estrela (BR-00310)           │ │
│ │ Manhã: [8.0] L               │ │
│ │ Tarde: [____] L              │ │
│ │ Total: 8.0 L                 │ │
│ │ CCS: [____]                  │ │
│ └──────────────────────────────┘ │
│                                  │
│ ── Resumo do Mês ──              │
│ Média por vaca: 18.2 L/dia      │
│ Total mensal: 546 L             │
│ Vacas em lactação: 2 de 4       │
│ CCS alerta (>200k): 0 vacas     │
│                                  │
│ [Salvar registros]               │
└──────────────────────────────────┘
```

---

## 2. Regras

- Apenas fêmeas bovinas aparecem na lista
- Pelo menos uma ordenha (manhã ou tarde) obrigatória
- CCS acima de 200.000 = alerta de possível mastite
- Vacas com data de secagem atingida = removidas da lista de ordenha

---

## 3. Permissões

| Ação                  | Dono | Peão |
|-----------------------|:----:|:----:|
| Visualizar produção   | ✅   | ✅   |
| Registrar ordenha     | ✅   | ✅   |
| Editar registro       | ✅   | ❌   |
| Ver resumo mensal     | ✅   | ✅   |
