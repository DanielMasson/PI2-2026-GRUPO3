# Escopo do MVP

> Definição do que está dentro e fora do **Mínimo Produto Viável (MVP)**.
> O MVP cobre Sprints 1 a 9.

---

## 1. O que é o MVP

O MVP do Propriedade Inteligente é o **primeiro versão funcional** do aplicativo que
permite a um produtor rural:

1. Criar uma conta e fazer login
2. Cadastrar propriedades
3. Registrar animais individualmente
4. Controlar vacinas e medicamentos
5. Registrar pesagens e acompanhar desempenho
6. Controlar o ciclo reprodutivo
7. Funcionar offline e sincronizar quando houver internet

---

## 2. Requisitos Funcionais no MVP

| RF     | Requisito                         | Sprint | Status  |
|--------|-----------------------------------|:------:|:-------:|
| RF01   | Cadastro e Autenticação           | 1–2    | A fazer |
| RF02   | Gestão de Propriedades            | 3–4    | A fazer |
| RF03   | Cadastro Individual de Animais    | 5      | A fazer |
| RF04   | Calendário Sanitário e Vacinas    | 6      | A fazer |
| RF05   | Controle de Desempenho e Peso     | 6      | A fazer |
| RF06   | Controle Leiteiro (parcial)       | 6      | A fazer |
| RF07   | Controle Reprodutivo              | 7      | A fazer |
| RF08   | Financeiro Individualizado        | —      | ❌ Pós-MVP |

---

## 3. Requisitos Não Funcionais no MVP

| RNF    | Requisito                                    | Status  |
|--------|----------------------------------------------|:-------:|
| RNF01  | Offline-First com Sincronização              | A fazer |
| RNF02  | Interface de Alto Contraste                  | A fazer |
| RNF03  | Compatibilidade Android 14 (API 34)          | A fazer |
| RNF04  | Comunicação HTTPS Criptografada              | A fazer |
| RNF05  | Acesso Multinível (Dono vs Peão)             | A fazer |
| RNF06  | Modo de Exibição Simplificado                | ❌ Pós-MVP |

---

## 4. Telas do MVP

| #  | Tela                      | Rota                                          | Status    |
|----|---------------------------|-----------------------------------------------|:---------:|
| 1  | Login                     | `/login`                                      | ✅ Feito  |
| 2  | Cadastro                  | `/cadastro`                                   | ✅ Feito  |
| 3  | Esqueci Senha             | `/esqueci-senha`                              | ✅ Feito  |
| 4  | Verificar Código          | `/verificar-codigo`                           | ✅ Feito  |
| 5  | Criar Senha               | `/criar-senha`                                | ✅ Feito  |
| 6  | Dashboard                 | `/dashboard`                                  | ✅ Feito  |
| 7  | Painel da Propriedade     | `/propriedade/:id`                            | ✅ Feito  |
| 8  | Cadastro de Animal        | `/propriedade/:id/cadastro-animal`            | ✅ Feito  |
| 9  | Lista de Animais          | `/propriedade/:id/animais`                    | A fazer   |
| 10 | Ficha do Animal           | `/propriedade/:id/animal/:animalId`           | A fazer   |
| 11 | Módulo de Saúde           | `/propriedade/:id/saude`                      | ✅ Feito  |
| 12 | Reprodução                | `/propriedade/:id/reproducao`                 | A fazer   |
| 13 | Configurações             | `/configuracoes`                              | A fazer   |
| 14 | Perfil                    | `/perfil`                                     | A fazer   |

---

## 5. Funcionalidades Fora do MVP

| Funcionalidade                     | Motivo                           | Sprint planejado |
|------------------------------------|----------------------------------|:----------------:|
| Financeiro Individualizado (RF08)  | Complexidade, depende de outros  | 10               |
| Modo de Exibição Simplificado      | UX refinada, não essencial       | 11               |
| Produção Leiteira completa         | Requer dados reais para validar  | 10               |
| Controle de lotes/áreas            | Não impacta fluxo principal      | 11               |
| Notificações push                  | Requer configuração adicional    | 12               |
| Relatórios PDF/Excel               | Pós-validação com usuários       | 12               |
| Geolocalização de animais          | Requer GPS nativo, complexidade  | 12               |
| Upload de fotos (Câmera)           | Plugin nativo adicional          | 12               |
| Dark mode                          | Estética, não funcional          | 13               |
| Suporte a tablet                   | Layout adicional                 | 13               |

---

## 6. Critérios de Conclusão do MVP

O MVP é considerado **concluído** quando:

- [ ] Usuário consegue criar conta e fazer login
- [ ] Usuário consegue criar propriedades e convidar membros
- [ ] Usuário consegue cadastrar animais com dados completos
- [ ] Usuário consegue registrar vacinas e medicamentos
- [ ] Usuário consegue registrar pesagens e ver GMD
- [ ] Usuário consegue registrar cobertura e acompanhar gestação
- [ ] App funciona offline e sincroniza quando online
- [ ] Dono tem acesso total, Peão tem acesso parcial
- [ ] App não crasha em uso normal
- [ ] Interface é legível sob luz solar
- [ ] Beta testing com 3+ usuários completado

---

## 7. Duração Estimada

| Fase                  | Sprints | Semanas |
|-----------------------|:-------:|:-------:|
| MVP                   | 1–9     | 18      |
| Pós-MVP               | 10–13   | 8       |
| **Total**             | 1–13    | **26**  |
