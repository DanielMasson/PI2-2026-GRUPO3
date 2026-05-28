# Lista de Animais

> **Rota:** `/propriedade/:propriedadeId/animais` | **Status:** A fazer | **Sprint:** 5
>
> Exibe todos os animais ativos de uma propriedade com busca, filtros e ações rápidas.

---

## 1. Wireframe

```text
┌──────────────────────────────────┐
│ [←] Animais              [＋]   │
│ Propriedade: Fazenda Norte       │
├──────────────────────────────────┤
│ [🔍 Buscar por nome, brinco...] │
│                                  │
│ [Todos] [Bovinos] [Ovinos]      │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 🐄 Mimosa  BR-00142         │ │
│ │ Bovino · Nelore · Fêmea     │ │
│ │ 3 anos · 345 kg             │ │
│ │ ⚠️ Carência: 12d            │ │
│ │ [Ver ficha →]               │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 🐄 Trovão  BR-00201         │ │
│ │ Bovino · Angus · Macho      │ │
│ │ 2 anos · 410 kg             │ │
│ │ [Ver ficha →]               │ │
│ └──────────────────────────────┘ │
│                                  │
├──────────────────────────────────┤
│ [🏠] [🐄] [🌾] [📋] [👤]      │
└──────────────────────────────────┘
```

---

## 2. Componentes

| Componente       | Tipo       | Descrição                              |
|------------------|------------|----------------------------------------|
| Topbar           | `<header>` | Título + botão adicionar               |
| Input busca      | Input      | Busca por nome, brinco, ID             |
| Filtro tabs      | `<div>`    | Filtro por espécie                     |
| Card animal      | `<div>`    | Dados resumidos do animal              |
| Badge carência   | `<span>`   | Badge vermelho se em período de carência|
| BottomNav        | BottomNav  | Navegação inferior                     |

---

## 3. Comportamento

### Busca
- Filtra por nome, brinco ou ID interno (case-insensitive)

### Filtros
| Filtro    | Comportamento                    |
|-----------|----------------------------------|
| Todos     | Exibe todos os animais ativos    |
| Bovinos   | Filtra por `especie = 'bovino'`  |
| Ovinos    | Filtra por `especie = 'ovino'`   |

### Ordenação
- Padrão: nome alfabético (A-Z)
- Alternativas: data de nascimento, peso atual

### Ações por Card
| Ação         | Permissão | Descrição                           |
|--------------|-----------|-------------------------------------|
| Ver ficha    | Dono/Peão | Navega para ficha individual        |
| Editar       | Dono      | Navega para edição do animal        |
| Excluir      | Dono      | Confirmação → soft delete           |

---

## 4. Permissões

- Dono e Peão: visualizar lista e acessar fichas
- Dono: editar e excluir animais
- Dono e Peão: cadastrar novos animais
