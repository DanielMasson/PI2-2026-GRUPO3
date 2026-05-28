# Configuração do Apache Cordova

> Configuração do `config.xml` e plugins do Cordova para o **Propriedade Inteligente**.

---

## 1. config.xml

```xml
<?xml version='1.0' encoding='utf-8'?>
<widget id="br.edu.ifc.propriedadeinteligente" version="1.0.0"
        xmlns="http://www.w3.org/ns/widgets"
        xmlns:cdv="http://cordova.apache.org/ns/1.0">

    <name>Propriedade Inteligente</name>
    <description>Gestão inteligente de rebanhos rurais</description>
    <author email="equipe@ifc.edu.br" href="https://ifc.edu.br">
        Equipe IFC - Projeto Integrador II
    </author>

    <content src="index.html" />

    <!-- Acesso à internet -->
    <access origin="*" />
    <allow-navigation href="*" />
    <allow-intent href="http://*/*" />
    <allow-intent href="https://*/*" />

    <!-- Preferências -->
    <preference name="Orientation" value="portrait" />
    <preference name="AndroidStatusBarBackgroundColor" value="#1a241a" />
    <preference name="StatusBarOverlaysWebView" value="false" />
    <preference name="SplashScreenDelay" value="3000" />
    <preference name="SplashScreen" value="screen" />
    <preference name="AutoHideSplashScreen" value="true" />
    <preference name="FadeSplashScreen" value="true" />
    <preference name="FadeSplashScreenDuration" value="500" />

    <!-- Android -->
    <platform name="android">
        <preference name="android-minSdkVersion" value="24" />
        <preference name="android-targetSdkVersion" value="34" />
        <preference name="AndroidXEnabled" value="true" />
        <preference name="GradlePluginGoogleServicesEnabled" value="true" />
        <preference name="GradlePluginGoogleServicesVersion" value="4.3.15" />

        <edit-config file="app/src/main/AndroidManifest.xml" mode="merge"
                     target="/manifest/application">
            <application android:usesCleartextTraffic="false" />
        </edit-config>

        <resource-file src="google-services.json"
                       target="app/google-services.json" />
    </platform>

    <!-- Plugins -->
    <plugin name="cordova-sqlite-storage" spec="^6.0.0" />
</widget>
```

---

## 2. Plugins Instalados

| Plugin                    | Versão  | Uso                                |
|---------------------------|:-------:|------------------------------------|
| `cordova-sqlite-storage`  | 6.x     | Banco de dados SQLite local        |
| `cordova-plugin-whitelist`| (built) | Controle de acesso à rede          |

### Plugins Futuros (pós-MVP)

| Plugin                        | Uso                                |
|-------------------------------|------------------------------------|
| `cordova-plugin-camera`       | Tirar foto do animal               |
| `cordova-plugin-network-info` | Detectar status da conexão         |
| `cordova-plugin-geolocation`  | Localização GPS da propriedade     |

---

## 3. Permissões Android

```xml
<!-- Permissões no AndroidManifest.xml (gerado automaticamente) -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

---

## 4. Build Configurations

### Debug
```bash
npx cordova build android --debug
# Gera APK em: platforms/android/app/build/outputs/apk/debug/
```

### Release
```bash
npx cordova build android --release
# Gera AAB em: platforms/android/app/build/outputs/bundle/release/
```

### Assinar APK (para Play Store)
```bash
# Gerar keystore (primeira vez)
keytool -genkey -v -keystore propriedade-inteligente.keystore \
  -alias propriedade -keyalg RSA -keysize 2048 -validity 10000

# Assinar
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore propriedade-inteligente.keystore app-release-unsigned.apk propriedade
```
