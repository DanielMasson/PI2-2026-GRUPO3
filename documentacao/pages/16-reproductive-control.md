# Controle Reprodutivo

> **Rota:** `/propriedade/:propriedadeId/reproducao` | **Status:** A fazer | **Sprint:** 7
>
> Gerencia coberturas, confirmação de prenhez, contagem regressiva de parto e genealogia.

---

## 1. Wireframe

```text
┌──────────────────────────────────┐
│ [←] Controle Reprodutivo         │
│ Propriedade: Fazenda Norte       │
├──────────────────────────────────┤
│                                  │
│ [Gestantes] [Histórico]          │
│                                  │
│ Gestações Ativas                 │
│ ┌──────────────────────────────┐ │
│ │ 🐄 Mimosa (BR-00142)        │ │
│ │ IA · Cobertura: 10/08/2025  │ │
│ │ Prenhez: ✅ Confirmada      │ │
│ │ ┌──────────────────────────┐│ │
│ │ │ ████████████░░░  85%     ││ │
│ │ │ Parto previsto: 22/05/26 ││ │
│ │ │ Dias restantes: -4       ││ │
│ │ └──────────────────────────┘│ │
│ │ Touro: Toro Rei (BR-0003) │ │
│ │ Secagem: 24/03/2026 (OK)   │ │
│ └──────────────────────────────┘ │
│                                  │
│ ── Registrar Cobertura ──        │
│ Animal (fêmea): [▼ Mimosa]     │
│ Tipo: ( ) Monta  ( ) IA        │
│ Data: [__/__/____]              │
│ Touro: [▼ Toro Rei]            │
│                                  │
│ [Limpar]           [Salvar]     │
└──────────────────────────────────┘
```

---

## 2. Componentes

| Componente          | Tipo       | Descrição                              |
|---------------------|------------|----------------------------------------|
| Topbar              | `<header>` | Título + botão voltar                  |
| Tabs                | `<div>`    | Gestantes / Histórico                  |
| Card gestação       | `<div>`    | Dados da gestação + barra de progresso |
| Barra progresso     | `<div>`    | Contagem visual até o parto            |
| Formulário cobertura| `<form>`   | Registro de nova cobertura             |

---

## 3. Status de Gestação

| Dias até o parto | Status      | Cor      | Ação                 |
|:----------------:|-------------|----------|----------------------|
| > 60             | Gestante    | Verde    | Acompanhar           |
| 30–60            | Pré-parto   | Amarelo  | Preparar parto       |
| 0–30             | Parto próximo | Laranja | Alerta urgente       |
| < 0              | Atrasada    | Vermelho | Verificar aborto     |
| Parto ocorrido   | Parida      | Azul     | Atualizar registro   |

---

## 4. Ações

| Ação                  | Permissão | Descrição                        |
|-----------------------|-----------|----------------------------------|
| Registrar cobertura   | Dono/Peão | Formulário de cobertura          |
| Confirmar prenhez     | Dono/Peão | Checkbox + data do exame         |
| Registrar parto       | Dono/Peão | Data do parto + criar bezerro    |
| Editar registro       | Dono      | Editar dados da cobertura        |
| Excluir registro      | Dono      | Remover registro reprodutivo     |

---

## 5. Permissões

| Ação                    | Dono | Peão |
|-------------------------|:----:|:----:|
| Visualizar gestações    | ✅   | ✅   |
| Registrar cobertura     | ✅   | ✅   |
| Confirmar prenhez       | ✅   | ✅   |
| Registrar parto         | ✅   | ✅   |
| Editar registro         | ✅   | ❌   |
| Excluir registro        | ✅   | ❌   |
| Ver genealogia completa | ✅   | ✅   |
