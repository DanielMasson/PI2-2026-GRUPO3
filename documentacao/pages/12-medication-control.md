# Controle de Medicamentos

> **Rota:** `/propriedade/:propriedadeId/saude` (aba Medicamentos) | **Status:** Implementada | **Sprint:** 6
>
> Registra tratamentos, vermifugação e controla período de carência.

---

## 1. Arquivo

- **Componente:** `pages/HealthModule/index.jsx` (aba "medicamentos")
- **Estilo:** `pages/HealthModule/HealthModule.module.css`

---

## 2. Wireframe

```text
┌──────────────────────────────────┐
│ [←] Módulo de Saúde             │
├──────────────────────────────────┤
│ [Vacinas] [Medicamentos]         │
│ [Ocorrências] [Localização]      │
├──────────────────────────────────┤
│                                  │
│ Tratamentos Recentes             │
│ ┌──────────────────────────────┐ │
│ │ 💊 Ivermectina 1%           │ │
│ │ Animal: Mimosa (BR-00142)   │ │
│ │ Data: 01/05/2025 · 5ml      │ │
│ │ 🔴 Carência: 12 dias rest.  │ │
│ │ Liberação: 29/05/2025       │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 💊 Oxitetraciclina          │ │
│ │ Animal: Trovão (BR-00201)   │ │
│ │ Data: 15/04/2025 · 10ml     │ │
│ │ 🟢 Liberado                 │ │
│ └──────────────────────────────┘ │
│                                  │
│ ── Registrar Tratamento ──       │
│ Animal: [▼ Mimosa (BR-00142)]   │
│ Tipo: [▼ Vermífugo]             │
│ Produto: [____________________] │
│ Dose: [____________________]    │
│ Data: [__/__/____]              │
│ Responsável: [________________] │
│                                  │
│ [Limpar]           [Salvar]     │
└──────────────────────────────────┘
```

---

## 3. Status de Carência

| Dias restantes | Cor      | Status            |
|:--------------:|----------|-------------------|
| < 0            | Cinza    | Liberado          |
| 0              | Amarelo  | Libera hoje       |
| 1–14           | Laranja  | Em carência       |
| > 14           | Vermelho | Carência longa    |

---

## 4. Permissões

| Ação                   | Dono | Peão |
|------------------------|:----:|:----:|
| Visualizar tratamentos | ✅   | ✅   |
| Registrar tratamento   | ✅   | ✅   |
| Editar tratamento      | ✅   | ❌   |
| Excluir tratamento     | ✅   | ❌   |
