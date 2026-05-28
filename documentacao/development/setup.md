# Configuração do Ambiente de Desenvolvimento

> Guia completo para configurar o ambiente de desenvolvimento do **Propriedade Inteligente**.

---

## 1. Pré-requisitos

| Ferramenta       | Versão        | Download                                    |
|------------------|:-------------:|---------------------------------------------|
| Node.js          | v20.x LTS     | https://nodejs.org                          |
| npm              | 10.x+         | Incluído com Node.js                        |
| JDK              | OpenJDK 17    | https://adoptium.net                        |
| Android Studio   | Latest stable | https://developer.android.com/studio        |
| Git              | 2.x+          | https://git-scm.com                         |
| VS Code          | Latest        | https://code.visualstudio.com               |

---

## 2. Configuração do Android Studio

### 2.1. SDK Manager
1. Abrir Android Studio → Settings → Appearance & Behavior → System Settings → Android SDK
2. Instalar:
   - **Android 14 (API 34)** — SDK Platform
   - **Android SDK Build-Tools** 34.x
   - **Android SDK Platform-Tools**
   - **Android SDK Command-line Tools**

### 2.2. Variáveis de Ambiente

```bash
# Linux/macOS — adicionar ao ~/.bashrc ou ~/.zshrc
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# Windows — adicionar ao System Environment Variables
ANDROID_HOME = C:\Users\{user}\AppData\Local\Android\Sdk
ANDROID_SDK_ROOT = %ANDROID_HOME%
# Adicionar ao PATH:
# %ANDROID_HOME%\platform-tools
# %ANDROID_HOME%\tools
# %ANDROID_HOME%\tools\bin
```

### 2.3. Emulador
1. Tools → Device Manager → Create Device
2. Selecionar: **Pixel 4** (ou similar)
3. System Image: **API 34** (Android 14)
4. Finish → Start Emulator

---

## 3. Configuração do Projeto

### 3.1. Clonar e Instalar

```bash
# Clonar repositório
git clone https://github.com/equipe/propriedade-inteligente.git
cd propriedade-inteligente

# Instalar dependências
npm install

# Verificar Cordova
npx cordova --version
```

### 3.2. Configurar Cordova

```bash
# Adicionar plataforma Android
npx cordova platform add android

# Verificar requisitos
npx cordova requirements android

# Instalar plugins
npx cordova plugin add cordova-sqlite-storage
```

### 3.3. Firebase

1. Criar projeto no [Firebase Console](https://console.firebase.google.com)
2. Habilitar:
   - **Authentication** → Email/Password
   - **Cloud Firestore** → Modo produção
3. Baixar `google-services.json` → colocar em `platforms/android/app/`
4. Configurar regras de segurança do Firestore

---

## 4. Executar em Desenvolvimento

### 4.1. Web (para testes rápidos de UI)

```bash
npm start
# Abre em http://localhost:3000
```

> **Nota:** SQLite e plugins nativos NÃO funcionam no browser. Usar apenas para testar layout e navegação.

### 4.2. Emulador Android

```bash
# Build e rodar no emulador
npx cordova emulate android
```

### 4.3. Dispositivo Físico

```bash
# Ativar modo desenvolvedor no celular:
# Settings → About Phone → Build Number (tocar 7x)
# Settings → Developer Options → USB Debugging (ON)

# Conectar celular via USB e rodar:
npx cordova run android
```

---

## 5. Extensões VS Code Recomendadas

| Extensão                  | Uso                              |
|---------------------------|----------------------------------|
| ESLint                    | Linting de JavaScript/JSX        |
| Prettier                  | Formatação automática            |
| ES7+ React/Redux Snippets| Snippets de React                |
| Auto Rename Tag           | Renomear tags HTML/JSX           |
| Color Highlight           | Preview de cores no código       |
| CSS Modules               | Suporte a CSS Modules            |
| GitLens                   | Histórico Git inline             |

---

## 6. Estrutura de Pastas

```text
propriedade-inteligente/
├── platforms/              # Código nativo gerado (NÃO editar manualmente)
├── plugins/                # Plugins Cordova instalados
├── www/                    # Build de produção (gerado por npm run build)
├── src/                    # Código fonte React
│   ├── components/         # Componentes reutilizáveis
│   ├── pages/              # Telas do aplicativo
│   ├── contexts/           # Context API (estado global)
│   ├── hooks/              # Custom hooks
│   ├── services/           # Serviços (Firebase, SQLite)
│   ├── utils/              # Funções utilitárias
│   ├── styles/             # CSS global e variáveis
│   ├── assets/             # Imagens, logos, ícones
│   └── App.jsx             # Componente raiz
├── config.xml              # Configuração do Cordova
├── package.json            # Dependências npm
└── README.md               # Documentação do projeto
```

---

## 7. Troubleshooting

| Problema                              | Solução                                      |
|---------------------------------------|----------------------------------------------|
| `cordova: command not found`          | `npm install -g cordova` ou usar `npx`       |
| `ANDROID_HOME not set`                | Configurar variáveis de ambiente             |
| `SDK location not found`              | Criar `local.properties` com `sdk.dir`       |
| `Could not find gradle`               | Instalar via Android Studio → SDK Manager    |
| `Java version incompatible`           | Instalar JDK 17 (não 11 nem 21)             |
| `Plugin not found`                    | Verificar nome correto do plugin             |
| Emulador lento                        | Ativar HAXM/VT-x na BIOS                    |
