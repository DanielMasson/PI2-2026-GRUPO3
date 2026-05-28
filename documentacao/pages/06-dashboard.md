# Tela de Dashboard (Lista de Propriedades)

> **Rota:** `/dashboard` | **Status:** Implementada | **Sprint:** 3–4
>
> Tela principal após login. Exibe todas as propriedades do usuário logado.

---

## 1. Arquivo

- **Componente:** `pages/Dashboard/index.jsx`
- **Estilo:** `pages/Dashboard/Dashboard.module.css`

---

## 2. Wireframe

```text
┌──────────────────────────────────┐
│ [←] Propriedades         [👤]   │
│ Bom dia, [Nome]!                 │
├──────────────────────────────────┤
│ [🔍 Buscar propriedade...]      │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ [Prop 001] Fazenda Norte    │ │
│ │ 📍 Sorriso, MT              │ │
│ │ 🐄 240 animais · 8 lotes    │ │
│ │              [✏️] [🗑️]      │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ [Prop 002] Sítio Bela Vista │ │
│ │ 📍 Rio Verde, GO            │ │
│ │ 🐄 85 animais · 3 lotes     │ │
│ │              [✏️] [🗑️]      │ │
│ └──────────────────────────────┘ │
│                                  │
│        [+ Nova Propriedade]      │
├──────────────────────────────────┤
│  [🏠 Home]  [＋]  [⚙️ Ajustes]  │
└──────────────────────────────────┘
```

---

## 3. Componentes

| Componente    | Tipo       | Descrição                               |
|---------------|------------|-----------------------------------------|
| Topbar        | `<header>` | Nome do app + avatar do usuário         |
| Input busca   | Input      | Busca por nome, brinco, localização     |
| Card prop.    | `<div>`    | Card com dados da propriedade           |
| Button editar | `<button>` | Editar propriedade (apenas Dono)        |
| Button excluir| `<button>` | Excluir propriedade (apenas Dono)       |
| Button add    | Button     | Adicionar nova propriedade              |
| BottomNav     | BottomNav  | Navegação inferior                      |

---

## 4. Comportamento

### Estado
```javascript
const [busca, setBusca] = useState('')
const [propriedades, setPropriedades] = useState([])
```

### Busca
- Filtra por nome, brinco ou localização (case-insensitive)

### Ações
| Ação           | Permissão | Descrição                          |
|----------------|-----------|------------------------------------|
| Ver propriedade| Dono/Peão | Navega para `/propriedade/:id`     |
| Editar         | Dono      | Modal de edição                    |
| Excluir        | Dono      | Confirmação → remove               |
| Adicionar      | Dono/Peão | Modal/tela de criação              |
| Logout         | Todos     | Navega para `/login`               |

### BottomNav
- Home: ativo
- +: abre modal de nova propriedade
- Ajustes: navega para configurações

---

## 5. Permissões

- Requer autenticação (`RotaPrivada`)
- Dono: CRUD completo de propriedades
- Peão: vê propriedades onde é membro, sem editar/excluir
