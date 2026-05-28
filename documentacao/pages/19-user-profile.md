# Perfil do Usuário

> **Rota:** `/perfil` | **Status:** A fazer | **Sprint:** 8
>
> Exibe e permite edição dos dados do perfil do usuário logado.

---

## 1. Wireframe

```text
┌──────────────────────────────────┐
│ [←] Meu Perfil                   │
├──────────────────────────────────┤
│                                  │
│        ┌──────────┐              │
│        │  [Foto]  │              │
│        │  + alterar│              │
│        └──────────┘              │
│                                  │
│ Nome                             │
│ [________________________]       │
│                                  │
│ E-mail                           │
│ joao@email.com (não editável)   │
│                                  │
│ Telefone                         │
│ [________________________]       │
│                                  │
│ Cargo                            │
│ Dono                             │
│                                  │
│ [  Salvar alterações  ]          │
│                                  │
│ ── Propriedades ──               │
│ 🏡 Fazenda Norte (Dono)         │
│ 🏡 Sítio Bela Vista (Peão)      │
│                                  │
└──────────────────────────────────┘
```

---

## 2. Campos

| Campo     | Editável | Descrição                          |
|-----------|:--------:|------------------------------------|
| Foto      | Sim      | Upload de foto de perfil           |
| Nome      | Sim      | Nome completo                      |
| E-mail    | Não      | Exibição apenas (definido no Auth) |
| Telefone  | Sim      | Número de telefone                 |
| Cargo     | Não      | Dono ou Peão (definido por propriedade) |

---

## 3. Ações

| Ação               | Descrição                                    |
|--------------------|----------------------------------------------|
| Alterar foto       | Selecionar da galeria ou câmera              |
| Salvar alterações  | Atualiza nome e telefone no Firestore + SQLite |
| Ver propriedades   | Lista de propriedades onde o usuário é membro|

---

## 4. Permissões

- Qualquer usuário autenticado pode ver e editar seu próprio perfil
- E-mail não pode ser alterado (definido no cadastro via Firebase Auth)
