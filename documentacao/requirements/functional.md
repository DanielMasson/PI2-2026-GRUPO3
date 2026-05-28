# Requisitos Funcionais (RF01–RF08)

> Lista completa dos requisitos funcionais do **Propriedade Inteligente**.
> Cada requisito possui ID, descrição, prioridade, sprint e critérios de aceite.

---

## Tabela Resumo

| ID    | Requisito                                | Prioridade | Sprint | Status  |
|-------|------------------------------------------|------------|--------|---------|
| RF01  | Cadastro e Autenticação de Usuário       | Alta       | S1–S2  | A fazer |
| RF02  | Gestão de Propriedades                   | Alta       | S3–S4  | A fazer |
| RF03  | Cadastro Individual de Animais           | Alta       | S5     | A fazer |
| RF04  | Calendário Sanitário e Vacinas           | Alta       | S6     | A fazer |
| RF05  | Controle de Desempenho e Peso            | Média      | S6     | A fazer |
| RF06  | Controle Leiteiro                        | Média      | S6     | A fazer |
| RF07  | Controle Reprodutivo                     | Alta       | S7     | A fazer |
| RF08  | Financeiro Individualizado               | Baixa      | S10    | A fazer |

---

## RF01 — Cadastro e Autenticação de Usuário

**Prioridade:** Alta | **Sprint:** S1–S2

### Descrição
O sistema deve permitir que o usuário se cadastre (nome, e-mail, senha) e faça login
para acessar o aplicativo. A autenticação é feita via Firebase Auth (e-mail/senha).

### Funcionalidades
- Tela de login com campos de e-mail e senha
- Tela de cadastro com validações (e-mail válido, senha mínima de 6 caracteres)
- Recuperação de senha por e-mail (envio de código de verificação)
- Criação de nova senha após verificação do código
- Redirecionamento automático ao dashboard após login bem-sucedido

### Critérios de Aceite
- [ ] Usuário consegue criar conta com nome, e-mail e senha
- [ ] Validação de e-mail inválido exibe mensagem de erro em português
- [ ] Senha com menos de 6 caracteres exibe alerta
- [ ] Login redireciona para o Dashboard
- [ ] Recuperação de senha envia código por e-mail
- [ ] Sessão persiste após fechar e reabrir o app (token Firebase)

### Telas Relacionadas
- `pages/Login/` — Tela de Login
- `pages/Cadastro/` — Cadastro de Usuário
- `pages/EsqueciSenha/` — Recuperação de Senha
- `pages/VerificarCodigo/` — Verificação de Código
- `pages/CriarSenha/` — Criação de Nova Senha

---

## RF02 — Gestão de Propriedades

**Prioridade:** Alta | **Sprint:** S3–S4

### Descrição
O usuário autenticado deve conseguir criar e gerenciar propriedades rurais.
Cada propriedade é a unidade principal de organização — os animais pertencem a uma propriedade.

### Funcionalidades
- Dashboard com lista de propriedades do usuário
- Cadastro de propriedade (nome, localização, tamanho em hectares)
- Acesso ao painel da propriedade (visão geral com estatísticas)
- Edição e exclusão de propriedade (apenas para o Dono)

### Critérios de Aceite
- [ ] Dashboard exibe todas as propriedades vinculadas ao usuário logado
- [ ] Cadastro exige nome e localização (tamanho é opcional)
- [ ] Clicar na propriedade abre o Painel da Propriedade
- [ ] Painel exibe resumo: total de animais, alertas de vacinas, produção recente
- [ ] Apenas o Dono pode editar/excluir a propriedade

### Telas Relacionadas
- `pages/Dashboard/` — Lista de Propriedades
- `pages/PropriedadeHome/` — Painel da Propriedade

---

## RF03 — Cadastro Individual de Animais

**Prioridade:** Alta | **Sprint:** S5

### Descrição
O sistema deve permitir o cadastro individual de cada animal com dados biométricos
completos, gerando uma ficha técnica detalhada para acompanhamento.

### Funcionalidades
- Cadastro de animal com: ID interno (automático), ID físico (brinco/colar),
  nome/apelido, espécie, raça, sexo, data de nascimento, peso inicial,
  pelagem/sinais, genética, origem
- Lista de animais da propriedade com busca e filtros
- Ficha individual do animal com todos os dados e histórico
- Edição e exclusão de animal (apenas para o Dono)

### Critérios de Aceite
- [ ] Formulário exige: espécie, raça, sexo e data de nascimento
- [ ] ID interno é gerado automaticamente (sequencial ou UUID)
- [ ] ID físico é opcional (para quem usa brinco/colar)
- [ ] Lista de animais exibe busca por nome, brinco ou ID
- [ ] Ficha individual mostra todos os dados + histórico de eventos
- [ ] Campos numéricos (peso) aceitam valores decimais
- [ ] Data de nascimento calcula idade automaticamente (meses/anos)

### Telas Relacionadas
- `pages/ListaAnimais/` — Lista de Animais
- `pages/CadastroAnimal/` — Cadastro/Edição de Animal
- `pages/FichaAnimal/` — Ficha Individual do Animal

---

## RF04 — Calendário Sanitário e Vacinas

**Prioridade:** Alta | **Sprint:** S6

### Descrição
O sistema deve gerenciar o calendário de vacinas e tratamentos sanitários de cada
animal, com alertas automáticos para doses de reforço e controle de período de carência.

### Funcionalidades
- Checklist de vacinas obrigatórias por espécie/raça (constantes padrão do sistema)
- Registro de aplicação: data, vacina, lote, responsável
- Alertas automáticos X dias antes da dose de reforço
- Controle de vermifugação e medicamentos
- Período de carência: cronômetro que indica se o animal pode ser abatido/ordenhado
- Registro de ocorrências clínicas (sintomas, tratamento, resultado)
- Movimentação diária do animal (local de contenção/pasto)

### Critérios de Aceite
- [ ] Calendário exibe vacinas pendentes e aplicadas
- [ ] Alerta visual (banner) para vacinas próximas do vencimento
- [ ] Período de carência exibe contagem regressiva em dias
- [ ] Animal em carência recebe tag/badge visual na lista
- [ ] Ocorrências clínicas são vinculadas ao animal e à data
- [ ] Vacinas padrão são carregadas automaticamente ao criar animal

### Telas Relacionadas
- `pages/CalendarioVacinas/` — Calendário de Vacinas
- `pages/ControleMedicamentos/` — Controle de Medicamentos
- `pages/OcorrenciasClinicas/` — Ocorrências Clínicas
- `pages/LocalizacaoAnimal/` — Localização/Movimentação

---

## RF05 — Controle de Desempenho e Peso

**Prioridade:** Média | **Sprint:** S6

### Descrição
O sistema deve registrar o histórico de pesagens de cada animal e calcular
indicadores de desempenho como o Ganho Médio Diário (GMD) e o Score de
Condição Corporal (ECC).

### Funcionalidades
- Registro de pesagem: data + peso em kg
- Histórico de pesagens em tabela e gráfico
- Cálculo automático do GMD (peso atual − peso anterior) / dias
- Score de Condição Corporal (ECC): escala visual de 1 a 5
- Alertas para pesagens atrasadas (frequência configurável)

### Critérios de Aceite
- [ ] Pesagem exige data e peso (mínimo 1 kg, máximo 1500 kg)
- [ ] GMD é calculado automaticamente entre duas pesagens consecutivas
- [ ] ECC é selecionável via escala visual (1=magro, 5=obeso)
- [ ] Histórico exibe tabela com todas as pesagens do animal
- [ ] Valor negativo de GMD (perda de peso) é destacado em vermelho

### Telas Relacionadas
- `pages/FichaAnimal/` — Seção de Desempenho dentro da Ficha

---

## RF06 — Controle Leiteiro

**Prioridade:** Média | **Sprint:** S6

### Descrição
O sistema deve permitir o registro diário da produção de leite de vacas em lactação,
incluindo dados de qualidade e controle de secagem.

### Funcionalidades
- Registro diário: ordenha manhã + ordenha tarde (litros)
- Qualidade do leite: CCS (Contagem de Células Somáticas) — indicador de mastite
- Data de secagem: agendamento para parada de ordenha antes do próximo parto
- Resumo mensal: média de produção, total produzido
- Indicador: porcentagem de vacas em lactação

### Critérios de Aceite
- [ ] Registro exige pelo menos um valor (manhã ou tarde)
- [ ] CCS é campo numérico opcional com valor de referência (>200.000 = alerta)
- [ ] Data de secagem gera alerta automático X dias antes
- [ ] Resumo mensal calcula média e total automaticamente
- [ ] Apenas fêmeas da espécie bovina aparecem na lista de produção leiteira

### Telas Relacionadas
- `pages/ProducaoLeite/` — Produção de Leite

---

## RF07 — Controle Reprodutivo

**Prioridade:** Alta | **Sprint:** S7

### Descrição
O sistema deve gerenciar o ciclo reprodutivo dos animais, desde a cobertura
(monta natural ou inseminação artificial) até o parto, incluindo genealogia.

### Funcionalidades
- Registro de cobertura: data, tipo (monta natural / IA), touro/pajem utilizado
- Confirmação de prenhez: checkbox + data do exame (toque/ultrassom)
- Contador de dias regressivos até a data provável do parto (~285 dias para bovinos)
- Data de secagem calculada automaticamente (60 dias antes do parto)
- Genealogia: vínculo com ID do Pai (Touro) e Mãe (Matriz)

### Critérios de Aceite
- [ ] Registro de cobertura exige data e tipo
- [ ] Confirmação de prenhez atualiza status visual do animal
- [ ] Contador de dias regressivos exibe progresso visual (barra/círculo)
- [ ] Data de secagem é calculada automaticamente (parto − 60 dias)
- [ ] Genealogia permite vincular pai e mãe por busca de ID/nome
- [ ] Alerta visual quando parto está próximo (últimos 30 dias)

### Telas Relacionadas
- `pages/Reproducao/` — Controle Reprodutivo

---

## RF08 — Financeiro Individualizado

**Prioridade:** Baixa | **Sprint:** S10 (Pós-MVP)

### Descrição
O sistema deve calcular o custo acumulado de cada animal e indicar sua
lucratividade, registrando também a baixa (venda, morte ou consumo próprio).

### Funcionalidades
- Custo acumulado: valor de compra + somatório de vacinas + medicamentos + ração estimada
- Indicador de lucratividade: custo total vs valor de mercado atual (baseado no peso)
- Registro de baixa: motivo (venda, morte, consumo próprio) + valor recebido
- Relatório financeiro por animal e por propriedade

### Critérios de Aceite
- [ ] Custo de compra é registrado no cadastro do animal
- [ ] Vacinas e medicamentos são somados automaticamente ao custo
- [ ] Valor de mercado é estimado com base no peso × cotação@/kg (configurável)
- [ ] Lucratividade é exibida como indicador verde (lucro) / vermelho (prejuízo)
- [ ] Baixa remove o animal da lista ativa mas mantém no histórico
- [ ] Relatório financeiro mostra custo total e lucro/prejuízo por animal

### Telas Relacionadas
- `pages/Financeiro/` — Financeiro Individualizado

---

## Priorização por Sprint

```text
Sprint 1-2:  RF01 (Autenticação)
Sprint 3-4:  RF02 (Propriedades)
Sprint 5:    RF03 (Cadastro de Animais)
Sprint 6:    RF04 (Vacinas) + RF05 (Desempenho) + RF06 (Leite)
Sprint 7:    RF07 (Reprodução)
─────────────── MVP ───────────────
Sprint 10:   RF08 (Financeiro)
```

---

## Notas

- Todos os textos de interface e mensagens de erro devem estar em **português**.
- Todos os requisitos devem funcionar em **modo offline** (RF04 do RNF).
- O módulo financeiro (RF08) é pós-MVP e pode ser simplificado ou adiado.
