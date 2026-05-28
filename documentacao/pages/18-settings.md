# Configurações

> **Rota:** `/configuracoes` | **Status:** A fazer | **Sprint:** 8
>
> Configurações gerais do app: perfil, preferências de sincronização, dados da propriedade.

---

## 1. Wireframe

```text
┌──────────────────────────────────┐
│ [←] Configurações                │
├──────────────────────────────────┤
│                                  │
│ ── CONTA ──                      │
│ [👤] Editar perfil               │
│ [🔔] Notificações                │
│ [🔒] Alterar senha               │
│                                  │
│ ── PROPRIEDADE ──                │
│ [🏡] Dados da propriedade       │
│ [👥] Gerenciar membros           │
│ [🌾] Gerenciar lotes/áreas       │
│                                  │
│ ── SINCRONIZAÇÃO ──              │
│ [☁️] Status: Sincronizado        │
│ [   ] Sync automática       [ON] │
│ [   ] Apenas Wi-Fi          [OFF]│
│ [   ] Intervalo: 5 min           │
│ [🔄] Forçar sincronização        │
│                                  │
│ ── SOBRE ──                      │
│ [ℹ️] Versão 1.0.0               │
│ [📄] Termos de uso               │
│                                  │
│ [🚪] Sair da conta               │
└──────────────────────────────────┘
```

---

## 2. Seções

### 2.1. Conta
| Item              | Descrição                                    |
|-------------------|----------------------------------------------|
| Editar perfil     | Alterar nome, e-mail, foto                   |
| Notificações      | Configurar alertas de vacinas, partos, etc.  |
| Alterar senha     | Redefinir senha via Firebase Auth             |

### 2.2. Propriedade
| Item                 | Descrição                                    |
|----------------------|----------------------------------------------|
| Dados da propriedade | Nome, localização, tamanho                   |
| Gerenciar membros    | Convidar/remover peões                       |
| Gerenciar lotes      | Cadastrar áreas/lotes da fazenda             |

### 2.3. Sincronização
| Item                | Descrição                                    |
|---------------------|----------------------------------------------|
| Status              | Sincronizado / Pendente / Erro               |
| Sync automática     | Toggle on/off                                |
| Apenas Wi-Fi        | Sync só em Wi-Fi                             |
| Intervalo           | Frequência de sync automática (5/15/30 min)  |
| Forçar sincronização| Executa sync manual imediata                  |

### 2.4. Sobre
| Item           | Descrição                |
|----------------|--------------------------|
| Versão         | Número da versão do app  |
| Termos de uso  | Link para termos         |

### 2.5. Logout
- Botão "Sair da conta"
- Chama `firebase.auth().signOut()`
- Navega para `/login`

---

## 3. Permissões

| Item                    | Dono | Peão |
|-------------------------|:----:|:----:|
| Editar perfil           | ✅   | ✅   |
| Notificações            | ✅   | ✅   |
| Alterar senha           | ✅   | ✅   |
| Dados da propriedade    | ✅   | ❌   |
| Gerenciar membros       | ✅   | ❌   |
| Gerenciar lotes         | ✅   | ❌   |
| Configurações de sync   | ✅   | ✅   |
| Sair da conta           | ✅   | ✅   |
