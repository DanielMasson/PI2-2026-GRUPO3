# Build e Publicação na Play Store

> Processo de build, assinatura e publicação do **Propriedade Inteligente** na Google Play Store.

---

## 1. Build de Produção

### 1.1. Preparar o Código

```bash
# 1. Build do React (gera pasta www/)
npm run build

# 2. Sincronizar com Cordova
npx cordova prepare android

# 3. Build do Android (AAB para Play Store)
npx cordova build android --release
```

### 1.2. Output

```
platforms/android/app/build/outputs/bundle/release/
└── app-release.aab    # Android App Bundle (para Play Store)
```

---

## 2. Assinatura do AAB

### 2.1. Gerar Keystore (primeira vez)

```bash
keytool -genkey -v \
  -keystore propriedade-inteligente.keystore \
  -alias propriedade \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

> **IMPORTANTE:** Guardar o keystore e senha em local seguro. Perder = não conseguir atualizar o app.

### 2.2. Configurar no Cordova

```xml
<!-- platforms/android/app/build.gradle -->
android {
    signingConfigs {
        release {
            storeFile file("propriedade-inteligente.keystore")
            storePassword "senha_do_keystore"
            keyAlias "propriedade"
            keyPassword "senha_da_chave"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

---

## 3. Google Play Console

### 3.1. Criar Conta de Desenvolvedor

1. Acessar https://play.google.com/console
2. Pagar taxa única de $25 USD
3. Preencher dados do desenvolvedor

### 3.2. Criar App

1. **Create App**
2. Nome: "Propriedade Inteligente"
3. Idioma padrão: Português (Brasil)
4. Tipo: App
5. Gratuito ou pago: Gratuito

### 3.3. Preencher Store Listing

| Campo              | Conteúdo                                      |
|--------------------|-----------------------------------------------|
| Título curto       | Gestão de Rebanhos                            |
| Descrição completa | App de gestão rural para pequenos produtores  |
| Screenshots        | 2-8 capturas de tela (phone)                  |
| Ícone              | 512×512 PNG                                   |
| Feature graphic    | 1024×500 PNG                                  |
| Categoria          | Produtividade                                 |
| Classificação      | Livre                                         |
| Política de privacidade | URL obrigatória (pode ser GitHub Pages) |

### 3.4. Upload do AAB

1. **Production → Create new release**
2. Upload: `app-release.aab`
3. Nome da versão: `1.0.0`
4. Notas de versão: "Versão inicial do app de gestão de rebanhos"
5. **Review → Start rollout**

---

## 4. Processo de Revisão

| Etapa             | Tempo estimado | Descrição                          |
|-------------------|:--------------:|------------------------------------|
| Upload            | Imediato       | Envio do AAB                       |
| Revisão Google    | 3-7 dias       | Google verifica conformidade       |
| Publicação        | Horas          | Disponível na Play Store           |

### Requisitos para Aprovação

- [ ] Política de privacidade acessível
- [ ] Screenshots reais do app
- [ ] Ícone com qualidade adequada
- [ ] Sem conteúdo enganoso
- [ ] Permissões justificadas
- [ ] Target SDK 34 (Android 14)
- [ ] App funcional (sem crashes)

---

## 5. Atualizações

```bash
# 1. Incrementar versão no config.xml
# version="1.0.0" → version="1.1.0"

# 2. Build
npm run build
npx cordova prepare android
npx cordova build android --release

# 3. Upload novo AAB na Play Console
# Production → Create new release → Upload
```

---

## 6. Checklist de Lançamento

- [ ] Firebase configurado (Auth + Firestore)
- [ ] Regras de segurança do Firestore aplicadas
- [ ] App testado em dispositivo físico
- [ ] App testado offline (modo avião)
- [ ] Fluxo completo de login/cadastro testado
- [ ] Screenshots capturados
- [ ] Política de privacidade publicada
- [ ] Keystore guardado em local seguro
- [ ] AAB assinado e testado
