# Roteiro de Apresentação — MVP Propriedade Inteligente

> **Formato:** 12 minutos totais (8 min slides + 5 min demo ao vivo)

---

## Abertura — 90s

### Slide 1 — Capa 

- **Título:** Propriedade Inteligente
- **Subtítulo:** Gestão individual de rebanhos para pequenos e médios produtores rurais
- **Instituição:** Instituto Federal Catarinense — Campus Concórdia (SC)
- **Disciplina:** Projeto Integrador II —
- **Apresentador:** falar pra plateia


---

## Seção 1 — Contexto e problema — ~3min

### Slide 3 — Contexto rural 

- **Pecuária no Oeste Catarinense:** conversa inicial citando dados como: `[Nº rebanhos bovinos]`, `[Nº pequenos produtores]`, `[Nº propriedades leiteiras]` (preencher com dados do IBGE/Epagri se tiver)
- **Como acontece hoje:** controle em caderno/planilha/WhatsApp
- Visual: foto/vídeo curto de uso em campo (opcional)

### Slide 4 — O problema que resolvemos 

- **Diagnóstico:** controle de rebanho no Brasil é majoritariamente sanitário (SISBOV — gestão macro, não individual)
- **Lacuna:** faltam ferramentas que façam **gestão micro por animal** — cada cabeça com sua ficha viva
- Frase-âncora: *"O produtor sabe a contagem do rebanho, mas não sabe quanto cada animal rendeu, custou, ou se está atrasado na vacina."*
- **Por isso esse projeto existe:** tornar essa gestão micro acessível a quem não usa ERP nem tem internet estável.

### Slide 5 — Público-alvo 

- **Primário:** pequenos e médios produtores rurais — bovinos e ovinos
- **Região-piloto:** Oeste de Santa Catarina
- **Validação inicial:** bloco de Medicina Veterinária — IFC Concórdia
- **Características de uso que importam:**
  - uso em campo sob luz solar intensa
  - conexões 3G/4G instáveis
  - baixa escolaridade digital (em parte)

---

## Seção 2 — A solução — ~4min

### Slide 6 — O que é o Propriedade Inteligente 

- Definição em uma frase: *"App mobile de gestão individual de rebanho, com operação offline-first."*
- Tabela de **capacidades-chave** (uma linha cada):

  | Capacidade                                       | Quem usa              | Quando                |
  |--------------------------------------------------|-----------------------|-----------------------|
  | Ficha técnica por animal                          | produtor/encarregado  | no dia a dia          |
  | Calendário de vacinas com projeção de próxima dose| peão/encarregado      | no manejo             |
  | Pesagens com cálculo automático de GMD            | técnico               | na balança            |
  | Controle leiteiro básico                          | ordenhador            | na sala de ordenha    |
  | Reprodução: cobertura → prenhez → parto           | veterinário/encarregado| estação de monta     |
  | Membros da propriedade (donos/peões/visit.)      | dono                  | administração         |

### Slide 7 — Módulos do MVP 

Cinco cards/módulos (um por slide ou combinados):

1. **Identificação e Dados Biométricos** — S5 ✅
2. **Saúde e Calendário Sanitário** — S6 ✅ (vacinas, medicamentos, ocorrências)
3. **Desempenho e Produção** — S6 ✅ (pesagens + GMD; produção leiteira)
4. **Gestativo/Reprodutivo** — S7 ✅ (cobertura → prenhez → parto)
5. **Módulo Financeiro** — S10 🟡 (pós-MVP — escopo visível, não implementado no MVP)

- Box embaixo: "Pós-MVP (S10–S13): financeiro, melhorias UX, performance, publicação Play Store"

### Slide 8 — Diferenciais técnicos 

Três bullets visuais (frases claras, sem jargão):

- 🌐 **Funciona offline**: app grava no celular e sincroniza em segundo plano. *(detalhes em §banco de dados)*
- 📱 **Pensado para campo**: tema escuro, fontes grandes, ícones emoji, BottomNav de 80 px — testado sob sol.
- 🔍 **Um animal, uma ficha**: nada de planilha genérica. Você vê histórico, custo e alertas de cada cabeça.

---

## Seção 3 — Estágio de produção — ~2min

### Slide 9 — Status por sprint 

Tabela-resumo (cores visíveis: ✅ verde, 🟡 amarelo, ⚪ cinza):

| Sprint | Escopo                                 | Status MVP                    |
|--------|----------------------------------------|-------------------------------|
| 1–2    | Autenticação (Login/Cadastro)          | ✅ — Firebase Auth integrado  |
| 3–4    | Propriedades (CRUD + membros)          | ⚪ escopo detalhado em doc    |
| 5      | Cadastro de animais                    | ✅                            |
| 6      | Saúde / Desempenho                     | ✅                            |
| 7      | Reprodução                             | ✅                            |
| 8      | Configurações + Perfil                 | ✅                            |
| 9      | Testes + Integração                    | 🟡 — em curso                 |
|--------| **MVP completo ao fim da S9**          |                               |
| 10–13  | Financeiro + UX + perf + Play Store    | ⚪ pós-MVP                    |

> ⚠️ Observação importante para a banca: S3–S4 (Propriedades/membros) está com escopo em documento — apresentar honestamente quais módulos foram codificados e quais foram só especificados.

### Slide 10 — Estado técnico recente 

- Build local: `npm run build` → verde, ~600ms, bundle ≈ 541 kB (gzip 150 kB)
- Stack final: React 19 + Cordova 13 (Android) + SQLite + Firebase (Auth + Firestore)
- App rodando em emulador Android (`./gradlew`)
- Plano de testes: suíte unitária para `services/`, E2E para o caminho feliz (login → propriedade → animal → ciclo vacinal)


---

## Seção 4 — Banco de dados & arquitetura — ~2min

### Slide 11 — Modelo de dados: 9 tabelas SQLite 

| # | Tabela                | Função                          | Soft delete? |
|---|-----------------------|---------------------------------|--------------|
| 1 | `usuarios`            | usuário autenticado             | —            |
| 2 | `propriedades`        | propriedades rurais             | —            |
| 3 | `propriedade_membros` | vínculo usuário ↔ propriedade   | —            |
| 4 | `animais`             | ficha individual                | ✅ sim       |
| 5 | `vacinas`             | calendário vacinal              | —            |
| 6 | `medicamentos`        | tratamentos + carência          | —            |
| 7 | `ocorrencias`         | sintomas + tratamento           | —            |
| 8 | `pesagens`            | histórico + GMD                 | —            |
| 9 | `reproducao`          | cobertura → parto               | —            |

- **Colunas de sync (todas as tabelas):** `uuid`, `created_at`, `updated_at`, `synced_at`, `sync_status`, `deleted` (só em animais)
- Backend: schema versionado via `migrations.js` (idempotente), executado em boot do app
- Pós-MVP: + `producao_leite`, `financeiro`, `areas_fazenda`

### Slide 12 — Offline-first & sincronização 

```
   📱 celular (SQLite)  ⇄  ☁️ Firestore
        │                       │
   1º grava local         depois empurra
   (sem rede = ok)       (fila de pendências)
```

**Regras-chave:**

- **Push:** linhas com `sync_status IN ('novo','modificado')`
- **Pull:** mudanças remotas desde `last_synced_at`
- **Chave estável:** UUID v4 local — mesma identidade entre local e nuvem
- **Resolução de conflitos:** relógio do servidor vence (a detalhar)
- Plano de teste de campo: modo avião de verdade, reconexão, 2 dispositivos criando o mesmo animal

### Slide 13 — Stack & decisões técnicas 

- `documentacao/CLAUDE.md` lista a stack; 1 linha por camada:
  - Front: React 19 + CSS Modules
  - Mobile: Apache Cordova 13 (Android)
  - DB local: SQLite plugin oficial
  - DB remoto: Firestore
  - Auth: Firebase Auth
  - CI: lint + unit tests
- Curva de contingência planejada: Flutter (Dart), só se Cordova travar performance

---

## Seção 5 — Demo ao vivo — **5 min**

### Slide 14 — Roteiro da demo 

Sequência curta:

1. **Login/cadastro** (30s) —  mostra o fluxo Firebase Auth
2. **Selecionar/criar propriedade** (30s) — *(atenção: se S3 está só documentada, falar "ainda em desenvolvimento; hoje trabalha com propriedade ativa de teste")*
3. **Cadastrar um animal** (60s) —mostra ficha
4. **Disparar fluxo de saúde** (90s):
   - Aplicar uma vacina com data retroativa
   - Ver o cálculo da `proxima_dose`
   - Visualizar histórico sanitário
   - *(se der tempo: registrar pesagem → ver GMD animado; ver prenhez/parto → projeção `data_previa_parto`)*
5. **Demonstrar offline** (30s) —  ativar modo avião → criar um novo animal → religar → ver fila de sync esvaziar (`sync_status: novo → sincronizado`)

---

## Seção 6 — Qualidade, planos e considerações finais — ~2min

### Slide 15 — Estratégia de testes 

- **Unit:** camada `services/` (GMD, `proxima_dose`, `data_previa_parto`, `data_liberacao`, contagem regressiva de carência, validação de ECC 1-5)
- **Migração:** migrations idempotentes + checagem de FKs/constraints
- **E2E:** caminho feliz — cadastro → vacina → cobertura → prenhez → parto (sob CI)
- **Integração manual (campo):** luz solar direta, luvas, 3G instável
- **CI:** lint + `vitest` como pré-requisito de merge
- Relatório de cobertura por sprint (entrega informal à banca)

### Slide 16 — Roadmap pós-MVP & cronograma 

Em duas colunas:

| Sprint | Próximos passos                                                    |
|--------|-------------------------------------------------------------------|
| **S10**  | Financeiro individualizado (custo/animal, lucro/rebanho)         |
| **S11**  | Melhorias de UX com base no feedback do beta (3-5 produtores)    |
| **S12**  | Otimizações: code-splitting, lazy por rota, melhorar offline-first|
| **S13**  | Hardening: app em produção, teste Play Console, monitoramento    |

**Linha do tempo visual:**

| Etapa                       | Início            | Fim                  |
|-----------------------------|-------------------|----------------------|
| Sprints 1–9 (MVP)           | `[DATA INÍCIO]`   | `[DATA ENTREGA MVP]` |
| Sprints 10–13 (pós-MVP)     | `[DATA PÓS-MVP 1]`| `[DATA FINAL]`       |
| Defesa Apresentação          | —                 | `[DATA APRESENTAÇÃO]`|


### Slide 17 — Considerações finais / Trabalhos futuros 

Três bullets honestos para a banca:

- **Validação de campo ainda em curso:** beta com 3-5 produtores da região está agendado
- **Sincronização em ambiente multi-dispositivo:** previsto para refinamento durante o beta
- **Publicação na Play Store:** meta para o fim do projeto (S13)

Recomendação para a banca: a entrega atual cobre o "MVP" do escopo definido (Identificação + Saúde + Desempenho + Reprodução + Autenticação), com financeiro e melhorias UX programados para o ciclo de sprints posteriores.

---

## Encerramento — 30s

### Slide 18 — Perguntas 

- Capa final com nomes/logo/contato:  etl. — Projeto Integrador II — IFC Concórdia"
- a sessãde perguntas; os outros respondem conforme a pergunta
- Plano de distribuição da palavra:
  - Perguntas sobre **stack/banco/sync** →iel - Perguntas sobre **módulos funcionais** untas sobre **autenticação/UI** → 
  - Perguntas sobre **testes** → 
  - Perguntas sobre **UX/público** → 


| # | Sec        | Slide | Tema                          | Quem fala                          |
|---|------------|-------|-------------------------------|-------------------------------------|
| 1 | Abertura   | 1     | Capa                          |                     |
| 2 | Abertura   | 2     | Quem somos                    |                     |
| 3 | Contexto   | 3     | Contexto rural                |                     |
| 4 | Contexto   | 4     | Problema                      |                     |
| 5 | Contexto   | 5     | Público-alvo                  |                     |
| 6 | Solução    | 6     | O que é                       |                     |
| 7 | Solução    | 7     | Módulos do MVP                |                     |
| 8 | Solução    | 8     | Diferenciais técnicos         |                     |
| 9 | Estágio    | 9     | Status por sprint             |                     |
|10 | Estágio    |10     | Estado técnico                |                     |
|11 | Arquitetura|11     | Banco (9 tabelas)             |                     |
|12 | Arquitetura|12     | Offline-first/sync            |                     |
|13 | Arquitetura|13     | Stack                         |                     |
|14 | Demo       |14     | Roteiro demo                  |                     |
|15 | Qualidade  |15     | Estratégia de testes          |                     |
|16 | Encerram.  |16     | Roadmap & cronograma          |                     |
|17 | Encerram.  |17     | Trabalhos futuros             |                     |
|18 | Encerram.  |18     | Perguntas                     |                     |



---

_Roteiro elaborado em 2026-06-25. Documento institucional — Propriedade Inteligente é um projeto do IFC Campus Concórdia, SC._
