# Estratégia de Testes

> Abordagem de testes do **Propriedade Inteligente**: QA manual, testes em campo e beta testing.

---

## 1. Visão Geral

O projeto utiliza **testes manuais** como abordagem principal, com foco em:

```text
┌────────────────────────────────────────────────────────────┐
│                    ESTRATÉGIA DE TESTES                    │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ Testes de    │  │ Testes em    │  │ Beta Testing     │ │
│  │ Desenvolvimento│ │ Campo        │  │ (usuários reais) │ │
│  ├──────────────┤  ├──────────────┤  ├──────────────────┤ │
│  │ Manual       │  │ Offline      │  │ Usuários rurais  │ │
│  │ Emulador     │  │ Luz solar    │  │ Feedback real    │ │
│  │ Dispositivo  │  │ Conectividade│  │ Iteração rápida  │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

> **Nota:** Testes automatizados (Jest, Cypress) são pós-MVP.

---

## 2. Testes de Desenvolvimento

### 2.1. Checklist por Feature

Para cada feature implementada, verificar:

| #  | Teste                                        | Tipo    |
|----|----------------------------------------------|---------|
| 1  | Fluxo principal funciona (happy path)        | Manual  |
| 2  | Validações de formulário funcionam           | Manual  |
| 3  | Mensagens de erro aparecem corretamente      | Manual  |
| 4  | Navegação entre telas funciona               | Manual  |
| 5  | Dados persistem ao fechar e reabrir o app    | Manual  |
| 6  | Layout responsivo em diferentes tamanhos     | Manual  |

### 2.2. Cenários de Erro

| Cenário                           | Teste                                |
|-----------------------------------|--------------------------------------|
| Campos obrigatórios vazios        | Mensagens de erro em português       |
| E-mail inválido                   | Validação regex funciona             |
| Senha < 6 caracteres              | Alerta exibido                       |
| Senhas não coincidem              | Erro de confirmação                  |
| Firebase Auth: e-mail duplicado   | "Este e-mail já está cadastrado"     |
| Firebase Auth: muitas tentativas  | "Tente mais tarde"                   |

### 2.3. Testes de Navegação

| Ação                            | Resultado esperado                |
|---------------------------------|-----------------------------------|
| Login sucesso                   | Vai para /dashboard               |
| Login erro                      | Mensagem de erro no formulário    |
| Clica propriedade               | Vai para /propriedade/:id         |
| Botão voltar                    | Volta para tela anterior          |
| Usuário não logado + rota privada| Redireciona para /login          |

---

## 3. Testes em Campo

### 3.1. Teste de Offline

| Passo | Ação                           | Resultado esperado                |
|:-----:|--------------------------------|-----------------------------------|
| 1     | Abrir app com internet         | Dashboard carrega normalmente     |
| 2     | Ativar modo avião              | App continua funcionando          |
| 3     | Cadastrar um animal            | Animal salvo no SQLite            |
| 4     | Cadastrar uma vacina           | Vacina salva no SQLite            |
| 5     | Fechar e reabrir o app         | Dados persistem                   |
| 6     | Desativar modo avião           | Dados sincronizam automaticamente |
| 7     | Verificar Firestore            | Dados aparecem no remoto          |

### 3.2. Teste de Sincronização

| Passo | Ação                           | Resultado esperado                |
|:-----:|--------------------------------|-----------------------------------|
| 1     | Cadastrar animal offline       | Badge "Aguardando sync"           |
| 2     | Conectar à internet            | Badge muda para "Sincronizado"    |
| 3     | Editar animal no Device A      | updated_at atualizado             |
| 4     | Abrir Device B com mesma conta | Device B vê dados do Device A     |

### 3.3. Teste de Acessibilidade em Campo

| Teste                          | Validação                            |
|--------------------------------|--------------------------------------|
| Leitura sob luz solar direta   | Texto legível a 30cm de distância    |
| Toque com luvas                | Botões grandes o suficiente (52px+)  |
| Uso com uma mão                | Ações principais acessíveis          |
| Conexão instável               | App não crasha, exibe estado offline |

---

## 4. Beta Testing

### 4.1. Distribuição

1. **Google Play Console** → Testing → Internal testing
2. Adicionar testadores por e-mail
3. Gerar link de convite
4. Testadores instalam via link

### 4.2. Perfil dos Beta Testers

| Perfil              | Quantidade | Objetivo                          |
|---------------------|:----------:|-----------------------------------|
| Produtor rural      | 3-5        | Validar usabilidade em campo      |
| Estudante IFC       | 2-3        | Testar fluxos completos           |
| Desenvolvedor       | 1-2        | Identificar bugs técnicos         |

### 4.3. Coleta de Feedback

| Método              | Ferramenta                         |
|---------------------|------------------------------------|
| Formulário de bugs  | Google Forms                       |
| Captura de tela     | Compartilhamento via WhatsApp      |
| Reunião de feedback | Google Meet (15 min por tester)    |

### 4.4. Checklist de Beta

- [ ] App não crasha em uso normal
- [ ] Offline funciona corretamente
- [ ] Sync funciona após reconexão
- [ ] Telas são legíveis no campo
- [ ] Botões são fáceis de tocar
- [ ] Fluxo de login é intuitivo
- [ ] Cadastro de animal é claro
- [ ] Alertas de vacina são úteis
- [ ] Performance aceitável (sem travamentos)

---

## 5. Testes Automatizados (Pós-MVP)

### 5.1. Unit Tests (Jest)

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

| Teste                          | Arquivo                        |
|--------------------------------|--------------------------------|
| Validar formulário de animal   | `utils/__tests__/validacao.test.js` |
| Calcular GMD                   | `utils/__tests__/desempenho.test.js` |
| Calcular datas reprodutivas    | `utils/__tests__/reproducao.test.js` |
| Formatar data pt-BR           | `utils/__tests__/datas.test.js` |

### 5.2. E2E Tests (Cypress — futuro)

| Teste                          | Descrição                              |
|--------------------------------|----------------------------------------|
| Login → Dashboard              | Fluxo completo de autenticação         |
| Cadastro de Animal             | Formulário completo                    |
| Offline → Online Sync          | Sincronização automática               |
| Permissões Dono vs Peão        | Botões aparecem/desaparecem            |

---

## 6. Critérios de Aceite para Lançamento

| Critério                           | Obrigatório | Status |
|------------------------------------|:-----------:|:------:|
| Login funciona (online)            | Sim         | —      |
| Cadastro funciona (online)         | Sim         | —      |
| CRUD de animais funciona           | Sim         | —      |
| Offline funciona                   | Sim         | —      |
| Sync funciona                      | Sim         | —      |
| App não crasha em uso normal       | Sim         | —      |
| Touch targets ≥ 48px               | Sim         | —      |
| Contraste ≥ 4.5:1                  | Sim         | —      |
| Beta test com 3+ usuários          | Desejável   | —      |
| Performance sem travamentos        | Sim         | —      |
