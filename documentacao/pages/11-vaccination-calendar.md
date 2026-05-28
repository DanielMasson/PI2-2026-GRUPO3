# Calendário de Vacinas

> **Rota:** `/propriedade/:propriedadeId/saude` (aba Vacinas) | **Status:** Implementada | **Sprint:** 6
>
> Exibe vacinas obrigatórias e pendentes, com alertas de vencimento e registro de aplicação.

---

## 1. Arquivo

- **Componente:** `pages/HealthModule/index.jsx` (aba "vacinas")
- **Estilo:** `pages/HealthModule/HealthModule.module.css`

---

## 2. Wireframe

```text
┌──────────────────────────────────┐
│ [←] Módulo de Saúde             │
│ Propriedade: Fazenda Norte       │
├──────────────────────────────────┤
│ [Vacinas] [Medicamentos]         │
│ [Ocorrências] [Localização]      │
├──────────────────────────────────┤
│                                  │
│ Calendário de Vacinas            │
│ ┌──────────────────────────────┐ │
│ │ 🔴 Febre Aftosa             │ │
│ │ Obrigatória · Ciclo: 180d   │ │
│ │ Próxima dose: 15/07/2025    │ │
│ │ Animais: Mimosa, Trovão...  │ │
│ │ [Registrar aplicação]       │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 🟡 Brucelose                │ │
│ │ Obrigatória · Ciclo: 365d   │ │
│ │ Próxima dose: 01/08/2025    │ │
│ │ [Registrar aplicação]       │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 🟢 Clostridioses            │ │
│ │ Opcional · Ciclo: 180d      │ │
│ │ Próxima dose: 20/06/2025    │ │
│ │ [Registrar aplicação]       │ │
│ └──────────────────────────────┘ │
│                                  │
│ ── Registrar Vacina ──           │
│ Animal: [▼ Mimosa (BR-00142)]   │
│ Vacina: [▼ Febre Aftosa]        │
│ Data: [__/__/____]              │
│ Lote: [____________________]    │
│ Responsável: [________________] │
│                                  │
│ [Limpar]           [Salvar]     │
└──────────────────────────────────┘
```

---

## 3. Dados Padrão (existentes no código)

```javascript
const VACINAS_PADRAO = [
  { id: 1, nome: 'Febre Aftosa', proxima: '2025-07-15', ciclo: 180, obrigatoria: true },
  { id: 2, nome: 'Brucelose', proxima: '2025-08-01', ciclo: 365, obrigatoria: true },
  { id: 3, nome: 'Clostridioses', proxima: '2025-06-20', ciclo: 180, obrigatoria: false },
  { id: 4, nome: 'Raiva', proxima: '2025-09-10', ciclo: 365, obrigatoria: false },
]
```

---

## 4. Comportamento

### Status Visual de Vacinas
| Dias até vencer | Cor      | Status    |
|:---------------:|----------|-----------|
| < 0             | Vermelho | Vencida   |
| 0–7             | Laranja  | Urgente   |
| 8–30            | Amarelo  | Próxima   |
| > 30            | Verde    | OK        |

### Formulário de Registro
- Animal: select com animais da propriedade
- Vacina: select com vacinas cadastradas
- Data: date picker
- Lote: texto
- Responsável: texto

---

## 5. Permissões

| Ação                   | Dono | Peão |
|------------------------|:----:|:----:|
| Visualizar calendário  | ✅   | ✅   |
| Registrar aplicação    | ✅   | ✅   |
| Editar aplicação       | ✅   | ❌   |
| Excluir aplicação      | ✅   | ❌   |
