# Requisitos Não Funcionais (RNF01–RNF06)

> Requisitos técnicos e de qualidade do **Propriedade Inteligente**.
> Estes requisitos definem **como** o sistema deve funcionar, não **o que** ele faz.

---

## Tabela Resumo

| ID     | Requisito                                    | Prioridade | Status  |
|--------|----------------------------------------------|------------|---------|
| RNF01  | Offline-First com Sincronização Automática   | Alta       | A fazer |
| RNF02  | Interface de Alto Contraste e Acessibilidade | Média      | A fazer |
| RNF03  | Compatibilidade Android 14 (API 34)          | Alta       | A fazer |
| RNF04  | Comunicação HTTPS Criptografada              | Alta       | A fazer |
| RNF05  | Acesso Multinível com Permissões             | Média      | A fazer |
| RNF06  | Modo de Exibição Simplificado/Especializado  | Baixa      | A fazer |

---

## RNF01 — Offline-First com Sincronização Automática

**Prioridade:** Alta | **Impacto:** Todo o sistema

### Descrição
O aplicativo deve funcionar **integralmente sem conexão com a internet**. Todas as
operações (cadastro, edição, exclusão) devem ser persistidas localmente no SQLite.
Quando houver conexão disponível, os dados devem ser sincronizados automaticamente
com o Firestore.

### Especificações Técnicas
- **Banco local:** SQLite via plugin `cordova-sqlite-storage`
- **Banco remoto:** Firestore (Firebase)
- **Estratégia de sync:** Background sync ao detectar conexão
- **Controle de status:** Cada registro possui flag `status`:
  - `novo` — criado localmente, nunca sincronizado
  - `modificado` — alterado localmente após última sync
  - `sincronizado` — dados locais e remotos idênticos
- **Resolução de conflitos:** Timestamp mais recente vence (Last Write Wins)
- **Fila de sincronização:** Operações pendentes são processadas em ordem cronológica

### Critérios de Aceite
- [ ] App abre normalmente sem conexão (modo avião)
- [ ] Cadastro de animal funciona offline e persiste no SQLite
- [ ] Ao conectar à internet, dados são enviados ao Firestore automaticamente
- [ ] Status de sincronização é visível na interface (ícone/badge)
- [ ] Conflitos são resolvidos sem perda de dados
- [ ] Fila de sync não duplica registros no Firestore

### Dependências
- Hook: `useSincronizacao.js`
- Service: `sincronizacao.js`
- Plugin: `cordova-sqlite-storage`

---

## RNF02 — Interface de Alto Contraste e Acessibilidade

**Prioridade:** Média | **Impacto:** UI/UX global

### Descrição
A interface deve ser otimizada para uso em **condições adversas de iluminação**
(luz solar direta no campo), com botões grandes, fontes legíveis e alto contraste
de cores.

### Especificações Técnicas
- **Paleta de cores:** Verde Esmeralda (#2E7D32), Branco (#FFFFFF), Vermelho Alerta (#D32F2F)
- **Contraste mínimo:** Razão 4.5:1 (WCAG 2.1 AA) para texto normal
- **Botões interativos:** Mínimo 48×48px (diretriz Google Material Design)
- **Fontes:** Roboto (títulos) e Inter (corpo), sem serifa
- **Tamanho base:** 16px mínimo para texto corpo
- **Toque:** Áreas de toque não devem se sobrepor

### Critérios de Aceite
- [ ] Razão de contraste ≥ 4.5:1 em todos os textos
- [ ] Botões possuem área mínima de 48×48px
- [ ] Fontes sem serifa (Roboto, Inter) com tamanho ≥ 16px
- [ ] Textos alternativos em todos os ícones e imagens
- [ ] Elementos interativos possuem feedback visual ao toque
- [ ] Teste de legibilidade sob luz solar direta (validação em campo)

### Referências
- Documento: `docs/design/color-palette.md`
- Documento: `docs/design/typography.md`
- Documento: `docs/design/accessibility.md`

---

## RNF03 — Compatibilidade Android 14 (API 34)

**Prioridade:** Alta | **Impacto:** Build e publicação

### Descrição
O aplicativo deve ser compilado e publicado para **Android 14 (API 34)**,
que é o alvo atual exigido pelo Google Play Store para novos aplicativos.

### Especificações Técnicas
- **Target SDK:** API 34 (Android 14)
- **Min SDK:** API 24 (Android 7.0) — para cobertura de dispositivos mais antigos
- **Build Tool:** Gradle 8.x com JDK 17
- **Plugins Cordova:** Todos devem ser compatíveis com API 34
- **Permissões:** Solicitar permissões em tempo de execução (runtime permissions)

### Critérios de Aceite
- [ ] APK/AAB é compilado sem erros com target SDK 34
- [ ] App roda em emulador com Android 14 (Pixel 4, API 34)
- [ ] App roda em dispositivo físico com Android 14
- [ ] Permissões (storage, câmera) são solicitadas em runtime
- [ ] Google Play Console aceita o AAB para publicação
- [ ] App funciona em dispositivos com Android 7.0+ (min SDK 24)

### Dependências
- Cordova CLI 12.x
- Android Studio (SDK Manager com API 34)
- JDK 17 (OpenJDK)

---

## RNF04 — Comunicação HTTPS Criptografada

**Prioridade:** Alta | **Impacto:** Segurança de dados

### Descrição
Toda comunicação entre o aplicativo e serviços externos (Firebase, APIs) deve
ocorrer exclusivamente via **HTTPS** com certificados válidos. Dados sensíveis
(senhas, tokens) nunca devem ser transmitidos em texto plano.

### Especificações Técnicas
- **Protocolo:** HTTPS (TLS 1.2+)
- **Firebase:** Todas as chamadas ao Firestore e Firebase Auth já utilizam HTTPS nativamente
- **Network Security Config:** Configuração do Android para bloquear HTTP
- **Token de autenticação:** JWT do Firebase Auth é enviado em cada requisição ao Firestore
- **Senhas:** Nunca armazenadas localmente (apenas token de sessão Firebase)

### Critérios de Aceite
- [ ] Nenhuma requisição HTTP (sem S) é feita pelo app
- [ ] Network Security Config bloqueia tráfego HTTP não seguro
- [ ] Token JWT é gerenciado pelo SDK Firebase (não armazenado manualmente)
- [ ] Senhas não são salvas em SharedPreferences ou SQLite
- [ ] Certificados SSL inválidos bloqueiam a conexão (sem bypass)
- [ ] Inspeção de tráfego (ex: Charles Proxy) mostra apenas HTTPS

### Referências
- Documento: `docs/api/authentication.md`

---

## RNF05 — Acesso Multinível com Permissões

**Prioridade:** Média | **Impacto:** Lógica de negócio e segurança

### Descrição
O sistema deve implementar **dois níveis de acesso** para os usuários de uma
propriedade: **Dono da Propriedade** e **Peão/Tratador**, cada um com permissões
distintas.

### Especificações Técnicas

| Ação                       | Dono | Peão/Tratador |
|----------------------------|------|---------------|
| Visualizar dados           | ✅   | ✅            |
| Criar registros (vacinas, pesagens) | ✅ | ✅ |
| Editar registros           | ✅   | ❌            |
| Excluir registros          | ✅   | ❌            |
| Gerenciar propriedade      | ✅   | ❌            |
| Convidar/remover membros   | ✅   | ❌            |
| Ver financeiro             | ✅   | ❌            |
| Alterar configurações      | ✅   | ❌            |

### Regras de Segurança (Firestore)
```javascript
// Exemplo de regra no Firestore
match /propriedades/{propriedadeId} {
  allow read: if isMembro(propriedadeId);
  allow write: if isDono(propriedadeId);
  
  match /animais/{animalId} {
    allow read: if isMembro(propriedadeId);
    allow create: if isMembro(propriedadeId);
    allow update, delete: if isDono(propriedadeId);
  }
}
```

### Critérios de Aceite
- [ ] Cadastro define o criador como Dono automaticamente
- [ ] Dono pode convidar outros usuários (por e-mail) como Peão
- [ ] Peão vê apenas botões de criar/visualizar (sem editar/excluir)
- [ ] Regras do Firestore bloqueiam escrita indevida no backend
- [ ] Interface esconde botões de ação baseado no nível de acesso
- [ ] Nível de acesso é verificado em cada operação (frontend + backend)

### Referências
- Documento: `docs/auth/permissions.md`

---

## RNF06 — Modo de Exibição Simplificado/Especializado

**Prioridade:** Baixa | **Impacto:** UX (Pós-MVP)

### Descrição
O sistema deve oferecer dois modos de exibição de informações, adaptando a
complexidade da interface ao perfil do usuário e à situação de uso.

### Modos
1. **Modo Simplificado:** Interface reduzida com apenas informações essenciais.
   Ideal para o Peão/Tratador em campo (rápido, direto).
2. **Modo Especializado:** Interface completa com todos os dados técnicos.
   Ideal para o Dono ou para consultas detalhadas.

### Exemplo (Ficha do Animal)
| Campo             | Simplificado | Especializado |
|-------------------|:------------:|:-------------:|
| Nome/Brinco       | ✅           | ✅            |
| Espécie/Raça      | ✅           | ✅            |
| Peso Atual        | ✅           | ✅            |
| Próxima Vacina    | ✅           | ✅            |
| GMD               | ❌           | ✅            |
| ECC               | ❌           | ✅            |
| Genealogia        | ❌           | ✅            |
| Custo Acumulado   | ❌           | ✅            |

### Critérios de Aceite
- [ ] Toggle para alternar entre modos nas configurações do usuário
- [ ] Modo simplificado oculta dados técnicos avançados
- [ ] Modo especializado exibe todos os campos disponíveis
- [ ] Preferência do modo é persistida localmente
- [ ] Modo padrão para Peão é Simplificado

---

## Validação em Campo

Alguns requisitos não funcionais precisam de **validação prática em campo**,
não apenas testes técnicos:

| Requisito | Validação Necessária |
|-----------|----------------------|
| RNF01 (Offline) | Testar em propriedade rural sem sinal de celular |
| RNF02 (Contraste) | Testar sob luz solar direta no pasto |
| RNF05 (Permissões) | Testar com Dono e Peão simultaneamente |
| RNF06 (Modos) | Testar com usuário real (produtor rural) |

---

## Conformidade

- **WCAG 2.1 AA:** Acessibilidade (RNF02)
- **Google Play Policy:** Android 14 target (RNF03)
- **LGPD:** Proteção de dados pessoais (RNF04)
- **Firebase Security Rules:** Controle de acesso (RNF05)
