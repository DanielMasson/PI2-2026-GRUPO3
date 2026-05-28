# Localização e Movimentação

> **Rota:** `/propriedade/:propriedadeId/saude` (aba Localização) | **Status:** Implementada | **Sprint:** 6
>
> Registra a localização atual e movimentação dos animais nas áreas da propriedade.

---

## 1. Arquivo

- **Componente:** `pages/HealthModule/index.jsx` (aba "localizacao")
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
│ Localização Atual dos Animais    │
│ ┌──────────────────────────────┐ │
│ │ Mimosa (BR-00142)           │ │
│ │ 📍 Pasto Norte              │ │
│ │ ☀️ Pastagem · 26/05 08:30   │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Trovão (BR-00201)           │ │
│ │ 📍 Curral Central           │ │
│ │ 💊 Tratamento · 25/05 14:00 │ │
│ └──────────────────────────────┘ │
│                                  │
│ ── Registrar Movimentação ──     │
│ Animal: [▼ Selecione...]       │
│ Área: [▼ Pasto Norte]          │
│ Tipo: [▼ Pastagem]             │
│ Data: [__/__/____]             │
│ Hora: [__:__]                  │
│ Observação: [_________________] │
│                                  │
│ [Limpar]           [Salvar]     │
└──────────────────────────────────┘
```

---

## 3. Áreas Padrão

```javascript
const AREAS_PADRAO = [
  'Pasto Norte', 'Pasto Sul', 'Curral Central',
  'Cocheira', 'Área de Quarentena', 'Bebedouro Leste'
]
```

---

## 4. Tipos de Atividade

| Tipo         | Ícone | Cor     |
|--------------|:-----:|---------|
| Sono         | 🌙    | Cinza   |
| Alimentação  | 🌿    | Verde   |
| Pastagem     | ☀️    | Amarelo |
| Tratamento   | 💊    | Vermelho|
| Outro        | 📌    | Cinza   |

---

## 5. Permissões

| Ação                  | Dono | Peão |
|-----------------------|:----:|:----:|
| Visualizar localização| ✅   | ✅   |
| Registrar movimentação| ✅   | ✅   |
| Editar movimentação   | ✅   | ❌   |
| Excluir movimentação  | ✅   | ❌   |
