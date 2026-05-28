# Ocorrências Clínicas

> **Rota:** `/propriedade/:propriedadeId/saude` (aba Ocorrências) | **Status:** Implementada | **Sprint:** 6
>
> Registra sintomas, tratamentos e resultados de ocorrências clínicas dos animais.

---

## 1. Arquivo

- **Componente:** `pages/HealthModule/index.jsx` (aba "ocorrencias")
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
│ Ocorrências Clínicas             │
│ ┌──────────────────────────────┐ │
│ │ 🩺 Claudicação               │ │
│ │ Animal: Mimosa (BR-00142)   │ │
│ │ Data: 01/05/2025             │ │
│ │ Sintomas: Membro posterior   │ │
│ │ Resultado: 🟡 Em tratamento  │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 🩺 Diarreia                  │ │
│ │ Animal: Trovão (BR-00201)   │ │
│ │ Data: 20/04/2025             │ │
│ │ Resultado: 🟢 Recuperado     │ │
│ └──────────────────────────────┘ │
│                                  │
│ ── Registrar Ocorrência ──       │
│ Animal: [▼ Selecione...]       │
│ Sintomas: [____________________] │
│ Tratamento: [_________________] │
│ Veterinário: [________________] │
│                                  │
│ [Limpar]           [Salvar]     │
└──────────────────────────────────┘
```

---

## 3. Resultados

| Resultado       | Cor      | Badge             |
|-----------------|----------|-------------------|
| Aguardando      | Cinza    | "Aguardando"      |
| Em tratamento   | Amarelo  | "Em tratamento"   |
| Recuperado      | Verde    | "Recuperado"      |
| Óbito           | Vermelho | "Óbito"           |

---

## 4. Permissões

| Ação                  | Dono | Peão |
|-----------------------|:----:|:----:|
| Visualizar ocorrências| ✅   | ✅   |
| Registrar ocorrência  | ✅   | ✅   |
| Editar ocorrência     | ✅   | ❌   |
| Excluir ocorrência    | ✅   | ❌   |
