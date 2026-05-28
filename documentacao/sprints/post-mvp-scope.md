# Escopo Pós-MVP

> Funcionalidades que serão implementadas após o MVP do **Propriedade Inteligente**.
> Pós-MVP cobre Sprints 10 a 13.

---

## 1. Visão Geral

```text
Sprint 10:  Financeiro (RF08)              ██
Sprint 11:  Melhorias UX                   ██
Sprint 12:  Otimizações + Features nativas  ██
Sprint 13:  Preparação para produção        ██
```

---

## 2. Sprint 10: Financeiro (RF08)

**Objetivo:** Cálculo de custos, lucratividade e registro de baixas.

| Tarefa                                  | Prioridade | Módulo       |
|-----------------------------------------|:----------:|:-------------|
| Adicionar campo `valor_compra` no animal| Alta       | Identificação|
| Adicionar campo `valor` em vacinas      | Alta       | Saúde        |
| Adicionar campo `valor` em medicamentos | Alta       | Saúde        |
| Calcular custo acumulado por animal     | Alta       | Financeiro   |
| Estimar valor de mercado (peso × cotação)| Alta      | Financeiro   |
| Indicador de lucratividade (verde/vermelho)| Alta    | Financeiro   |
| Registrar baixa (venda/morte/consumo)   | Alta       | Financeiro   |
| Configuração de cotação R$/kg           | Média      | Config.      |
| Resumo financeiro por propriedade       | Média      | Financeiro   |
| Acesso exclusivo para Dono              | Alta       | Auth         |

**Entregáveis:** Usuário vê custo, valor de mercado e lucro/prejuízo por animal.

---

## 3. Sprint 11: Melhorias de UX

**Objetivo:** Refinar a experiência do usuário com base no feedback do beta testing.

| Tarefa                                  | Prioridade | Descrição                       |
|-----------------------------------------|:----------:|---------------------------------|
| Correção de bugs do beta                | Alta       | Issues reportados pelos testers |
| Melhorias de performance (listas)       | Alta       | Virtualização de listas grandes |
| Modo de exibição simplificado           | Média      | Interface reduzida para Peão    |
| Gerenciamento de lotes/áreas            | Média      | Cadastrar áreas da fazenda      |
| Melhoria de feedback visual             | Média      | Toast messages, animações       |
| Melhoria de formulários                 | Média      | Autocomplete, selects melhores  |
| Dark mode (opcional)                    | Baixa      | Tema escuro                     |

---

## 4. Sprint 12: Otimizações e Features Nativas

**Objetivo:** Adicionar funcionalidades que dependem de plugins nativos.

| Tarefa                                  | Prioridade | Plugin/Descrição                |
|-----------------------------------------|:----------:|---------------------------------|
| Controle leiteiro completo (RF06)       | Alta       | Tela de produção diária         |
| Notificações push de vacinas            | Alta       | `cordova-plugin-firebase`       |
| Upload de fotos (câmera)                | Média      | `cordova-plugin-camera`         |
| Geolocalização da propriedade           | Média      | `cordova-plugin-geolocation`    |
| Backup/Restore de dados                 | Média      | Exportar/importar SQLite        |
| Relatórios em PDF                       | Baixa      | Gerar PDF com dados do rebanho  |
| Suporte a tablet                        | Baixa      | Layout adaptado                 |

---

## 5. Sprint 13: Preparação para Produção

**Objetivo:** Estabilidade, performance e preparação para publicação.

| Tarefa                                  | Prioridade | Descrição                       |
|-----------------------------------------|:----------:|---------------------------------|
| Testes finais em campo                  | Alta       | Luz solar, offline, conectividade|
| Otimização de performance               | Alta       | Reduzir tempo de carga          |
| Tratamento de erros globais             | Alta       | Error boundaries, crash reports |
| Limpeza de código                       | Média      | Remover console.logs, debug     |
| Documentação atualizada                 | Média      | Atualizar docs após mudanças    |
| Preparação da Play Store                | Alta       | Screenshots, descrição, ícone   |
| Publicação na Play Store                | Alta       | Upload do AAB                   |
| Plano de manutenção                     | Média      | Como atualizar, monitorar bugs  |

---

## 6. Priorização por Valor vs Esforço

### Alto valor, baixo esforço (fazer primeiro)
- Financeiro básico (RF08)
- Notificações de vacinas
- Correção de bugs do beta

### Alto valor, alto esforço (planejar bem)
- Controle leiteiro completo
- Modo simplificado
- Backup/Restore

### Baixo valor, baixo esforço (quando sobrar tempo)
- Dark mode
- Suporte a tablet
- Relatórios PDF

### Baixo valor, alto esforço (evitar)
- Geolocalização completa
- Integração com outros apps

---

## 7. Critérios de Conclusão

O projeto é considerado **completo** quando:

- [ ] Financeiro funcional (RF08)
- [ ] Notificações de vacinas funcionam
- [ ] Beta testing concluído com sucesso
- [ ] App publicado na Play Store
- [ ] Sem bugs críticos conhecidos
- [ ] Performance aceitável em dispositivos modestos
- [ ] Documentação atualizada
