# Financeiro Individualizado

> **Rota:** `/propriedade/:propriedadeId/financeiro` | **Status:** Pós-MVP | **Sprint:** 10
>
> Exibe custos acumulados, valor de mercado e lucratividade de cada animal.

---

## 1. Wireframe

```text
┌──────────────────────────────────┐
│ [←] Financeiro                   │
│ Propriedade: Fazenda Norte       │
├──────────────────────────────────┤
│                                  │
│ [Por Animal] [Resumo]            │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 🐄 Mimosa (BR-00142)        │ │
│ │ Custo total: R$ 3.055,00    │ │
│ │ Valor mercado: R$ 1.897,50  │ │
│ │ ▼ Prejuízo: R$ -1.157,50    │ │
│ │    (-37,9%)                  │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 🐄 Trovão (BR-00201)        │ │
│ │ Custo total: R$ 4.200,00    │ │
│ │ Valor mercado: R$ 5.060,00  │ │
│ │ ▲ Lucro: R$ +860,00         │ │
│ │    (+20,5%)                  │ │
│ └──────────────────────────────┘ │
│                                  │
│ ── Resumo Geral ──               │
│ Investimento total: R$ 732.000  │
│ Valor estimado: R$ 924.000      │
│ Resultado: ▲ R$ +192.000        │
│ Retorno: +26,2%                 │
└──────────────────────────────────┘
```

---

## 2. Componentes

| Componente       | Tipo       | Descrição                              |
|------------------|------------|----------------------------------------|
| Topbar           | `<header>` | Título + botão voltar                  |
| Tabs             | `<div>`    | Por Animal / Resumo                    |
| Card financeiro  | `<div>`    | Custos, valor mercado, resultado       |
| Badge resultado  | `<span>`   | Verde (lucro) / Vermelho (prejuízo)    |
| Barra progresso  | `<div>`    | Meta financeira mensal                 |

---

## 3. Detalhes por Animal

```text
┌───────────────────────────────────────┐
│ Financeiro — Mimosa (BR-00142)        │
├───────────────────────────────────────┤
│ CUSTOS                                │
│ Compra:            R$ 2.500,00        │
│ Vacinas (3):       R$   120,00        │
│ Medicamentos (2):  R$    85,00        │
│ ─────────────────────────────         │
│ TOTAL:             R$ 2.705,00        │
├───────────────────────────────────────┤
│ VALOR DE MERCADO                      │
│ Peso: 345 kg × R$ 5,50/kg           │
│ Estimativa: R$ 1.897,50               │
├───────────────────────────────────────┤
│ RESULTADO                             │
│ ▼ Prejuízo: R$ -807,50 (-29,9%)     │
└───────────────────────────────────────┘
```

---

## 4. Ações de Baixa

| Ação         | Descrição                                    |
|--------------|----------------------------------------------|
| Registrar venda   | Data + valor recebido + comprador        |
| Registrar morte   | Data + observação                        |
| Registrar consumo | Data + observação                        |

---

## 5. Permissões

| Ação                      | Dono | Peão |
|---------------------------|:----:|:----:|
| Ver financeiro do animal  | ✅   | ❌   |
| Ver resumo geral          | ✅   | ❌   |
| Registrar baixa           | ✅   | ❌   |
| Configurar cotação        | ✅   | ❌   |
