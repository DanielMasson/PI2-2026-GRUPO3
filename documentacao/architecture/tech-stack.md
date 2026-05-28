# Tech Stack (Tecnologias, Versões e Justificativas)

> Detalhamento das tecnologias utilizadas no projeto **Propriedade Inteligente**, incluindo versões, motivações e trade-offs.

---

## 1. Resumo Geral

| Camada | Tecnologia | Versão | Status |
|---|---|---|---|
| Frontend | React | 18.x+ | MVP |
| Mobile Wrapper | Apache Cordova | 12.x | MVP |
| Estilização | CSS Modules | — | MVP |
| DB Local | SQLite | 3.x | MVP |
| DB Remoto | Firestore | — | MVP |
| Autenticação | Firebase Auth | — | MVP |
| Design | Figma | — | MVP |
| Build Android | Gradle + JDK 17 + Android SDK API 34 | 8.x / 17 | MVP |

---

## 2. Frontend: React

### Versão
- **18.x+** (compatível com Create React App e Vite)

### Justificativa
- **Ecossistema maduro:** Grande quantidade de bibliotecas e comunidade ativa.
- **Componentização:** Facilita a criação de UI reutilizável (Input, Button, Card).
- **Hooks:** Permite gerenciamento de estado e efeitos colaterais de forma clara.
- **Equipe:** Membros já possuem familiaridade com JavaScript/React.

### Alternativas Consideradas
- **Vue.js:** Equipe menos familiarizada.
- **Angular:** Considerado "demasiado pesado" para um MVP de aplicativo mobile simples.
- **Flutter:** Requisito de contingência (ver abaixo).

---

## 3. Mobile Wrapper: Apache Cordova

### Versão
- **12.x**

### Justificativa
- **Acesso Nativo:** Permite uso de SQLite, Câmera e Geolocalização.
- **Publicação:** Gera APK/AAB para Google Play Store.
- **Código Base:** Aproveita 100% do código React desenvolvido.

### Trade-offs
- **Performance:** A performance de renderização é inferior a apps nativos ou Flutter.
- **UI:** Limitações na fluidez de animações complexas.
- **Contingência:** Se Cordova apresentar limitações críticas de performance ou UX, o projeto migra para **Flutter** (conforme decisão do projeto).

---

## 4. Estilização: CSS Modules

### Justificativa
- **Escopo Local:** Evita conflitos de nomes de classes (ex: `.container` em telas diferentes).
- **Simplicidade:** Não requer pré-processadores como Sass ou Less.
- **Performance:** Carrega apenas os estilos necessários para o componente renderizado.

### Alternativas Consideradas
- **Tailwind CSS:** Requer configuração complexa e pode gerar classes muito longas.
- **Styled Components:** Adiciona dependência externa e overhead de JavaScript.

---

## 5. Banco de Dados Local: SQLite

### Plugin
- `cordova-sqlite-storage` (versão estável)

### Justificativa
- **Persistência:** Dados sobrevivem ao fechamento do app e reinicialização do dispositivo.
- **SQL:** Suporta consultas complexas (JOINs entre animais, vacinas e ocorrências).
- **Capacidade:** Armzena dezenas de milhares de registros sem degradação de performance.
- **Offline:** Garante que o app funcione sem internet (requisito RNF01).

### Alternativas Consideradas
- **LocalStorage/AsyncStorage:** Limite de 5-10MB, sem suporte a SQL.
- **Realm:** Requer configuração mais complexa e aumenta o tamanho do APK.

---

## 6. Banco de Dados Remoto: Firestore

### Justificativa
- **Integração:** Integra nativamente com Firebase Auth.
- **Tempo Real:** Permite atualização instantânea (útil para sincronização futura).
- **Escalabilidade:** Gerenciado pelo Google, sem necessidade de configurar servidores.
- **Offline SDK:** O SDK do Firestore já possui suporte a cache offline.

### Alternativas Consideradas
- **Supabase/BaaS:** Equipe mais familiarizada com Firebase.
- **API REST Própria:** Requer backend e DevOps, aumentando a complexidade do projeto.

---

## 7. Autenticação: Firebase Auth

### Justificativa
- **Segurança:** Gerencia tokens, senhas e autenticação de forma segura.
- **Métodos:** Suporta login por E-mail/Senha (método escolhido).
- **Custo:** Gratuito para o volume esperado de usuários.

### Regras de Segurança (Firestore)
- Usuários só podem ler/escrever dados de propriedades onde são **Donos** ou **Membros**.
- **Donos** possuem acesso total (CRUD).
- **Membros (Peões)** possuem acesso parcial (apenas leitura e criação de registros de manejo).

---

## 8. Build Android: Gradle + JDK

### Especificações
- **JDK:** OpenJDK 17 (recomendado para Cordova 12+)
- **Android SDK:** API 34 (Android 14)
- **Gradle:** 8.x (gerenciado pelo Android Studio)

### Justificativa
- **Compatibilidade:** API 34 é o alvo atual do Google Play Store.
- **Estabilidade:** JDK 17 é a versão LTS mais recente suportada pelo Cordova.

---

## 9. Design: Figma

### Justificativa
- **Colaboração:** Permite que designers e desenvolvedores trabalhem no mesmo arquivo.
- **Prototipagem:** Permite criar protótipos clicáveis para validação com usuários.
- **Handoff:** Gera especificações de medida, cor e tipografia automaticamente.

---

## 10. Estratégia de Contingência (Flutter)

Se o Cordova apresentar problemas críticos de:
1. **Performance:** Lentidão em listas grandes (>1000 animais).
2. **UX:** Animações travadas ou toque não responsivo.
3. **Plugin:** Limitação grave em algum plugin nativo.

**Ação:** Migrar o frontend para **Flutter (Dart)**, mantendo o mesmo design e lógica de negócio.

---

## 11. Dependências de Desenvolvimento

| Dependência | Uso |
|---|---|
| `react-router-dom` | Navegação (HashRouter) |
| `cordova-sqlite-storage` | Banco de dados local |
| `firebase` | Auth e Firestore |
| `react-icons` | Ícones (Feather Icons) |
| `date-fns` | Manipulação de datas |

---

## 12. Ambiente de Desenvolvimento Recomendado

- **IDE:** VS Code + Extensões (ESLint, Prettier, React Snippets)
- **Emulador:** Android Studio (Pixel 4, API 34)
- **Testes em Dispositivo:** Celular Android com modo desenvolvedor ativado
- **Controle de Versão:** Git (GitHub)
