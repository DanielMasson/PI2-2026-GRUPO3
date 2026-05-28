# Painel da Propriedade

> **Rota:** `/propriedade/:propriedadeId` | **Status:** Implementada | **Sprint:** 3–4
>
> Visão geral de uma propriedade: alertas, produção leiteira, rebanho e financeiro.

---

## 1. Arquivo

- **Componente:** `pages/PropertyHome/index.jsx`
- **Estilo:** `pages/PropertyHome/PropertyHome.module.css`

---

## 2. Wireframe

```text
┌──────────────────────────────────┐
│ [←] Fazenda Norte     [🔔] [⚙️]│
│      Sorriso, MT                 │
├──────────────────────────────────┤
│ ⚡ Alertas                       │
│ ┌──────────────────────────────┐ │
│ │ 🩺 Vacinação em atraso      │ │
│ │ 14 animais com vacina venc.  │ │
│ │ Há 2 horas                   │ │
│ └──────────────────────────────┘ │
│                                  │
│ 🥛 Produção de Leite             │
│ ┌──────────────────────────────┐ │
│ │ Última coleta: 17/05/2025   │ │
│ │ Total    │ Média/vaca        │ │
│ │    — L   │      — L          │ │
│ │ Lactação │ Meta diária       │ │
│ │     —    │      — L          │ │
│ └──────────────────────────────┘ │
│                                  │
│ 🐄 Resumo do Rebanho             │
│ ┌──────────────────────────────┐ │
│ │ 240 animais · 8 lotes        │ │
│ │ Total │ Lotes │ Prenhas │ Vaz │ │
│ │  240  │   8   │    —    │  —  │ │
│ │ Macho │ Fêmea                │ │
│ │    —  │    —                 │ │
│ └──────────────────────────────┘ │
│                                  │
│ 💰 Financeiro                    │
│ ┌──────────────────────────────┐ │
│ │ Resumo: Maio 2025           │ │
│ │ Receita  │ Despesas          │ │
│ │     —    │      —            │ │
│ │ Saldo: — │ [████████░░] 0%   │ │
│ └──────────────────────────────┘ │
├──────────────────────────────────┤
│ [🏠] [🐄] [🌾] [📋] [👤]      │
└──────────────────────────────────┘
```

---

## 3. Seções

### 3.1. Topbar
- Botão voltar → `/dashboard`
- Nome e localização da propriedade
- Botões: notificações, configurações

### 3.2. Alertas
- Cards de alerta com tipos: `danger`, `warning`, `info`
- Tipos de alerta: vacinação em atraso, produção abaixo da meta, animal em carência
- Se vazio: "Nenhum alerta no momento ✓"

### 3.3. Produção de Leite
- Data da última coleta
- Total coletado, média por vaca, vacas em lactação, meta diária
- Placeholder "+ adicionar gráfico de produção"

### 3.4. Resumo do Rebanho
- Total de animais, lotes ativos
- Prenhas, vazias, machos, fêmeas
- Placeholder "+ adicionar imagem da propriedade"

### 3.5. Financeiro
- Período atual (mês/ano)
- Receita, despesas, saldo estimado
- Barra de progresso da meta mensal
- Badge: positivo (verde) ou negativo (vermelho)

### 3.6. BottomNav
| Aba     | Ícone | Ação                        |
|---------|-------|-----------------------------|
| Início  | 🏠    | Tela atual                  |
| Animais | 🐄    | Cadastro de animais         |
| Lotes   | 🌾    | Gestão de lotes (futuro)    |
| Tarefas | 📋    | Tarefas pendentes (futuro)  |
| Perfil  | 👤    | Perfil do usuário (futuro)  |

---

## 4. Permissões

- Requer autenticação
- Dono e Peão: visualização completa
- Dono: acesso a configurações e notificações
