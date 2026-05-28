# Configuração do Firebase

> Inicialização e configuração do Firebase no **Propriedade Inteligente**.
> Credenciais via `.env`, módulos: Auth + Firestore.

---

## 1. Estrutura de Arquivos

```text
src/
├── services/
│   └── firebase/
│       ├── config.js          # Inicialização do Firebase
│       ├── auth.js            # Funções de autenticação
│       └── firestore.js       # Funções de Firestore
├── .env                       # Variáveis de ambiente (NÃO commitar)
└── .env.example               # Exemplo para novos devs
```

---

## 2. Variáveis de Ambiente

### `.env` (criar manualmente, NÃO commitar)

```env
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=propriedade-inteligente.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=propriedade-inteligente
REACT_APP_FIREBASE_STORAGE_BUCKET=propriedade-inteligente.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123
```

### `.env.example` (commitar como referência)

```env
REACT_APP_FIREBASE_API_KEY=sua-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=seu-projeto
REACT_APP_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=000000000
REACT_APP_FIREBASE_APP_ID=000000000:000000000:web:000000000
```

> **Nota:** O prefixo `REACT_APP_` é obrigatório para Create React App/Vite reconhecer variáveis de ambiente.

---

## 3. Inicialização do Firebase

### `services/firebase/config.js`

```javascript
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
```

---

## 4. SDK Modular vs Compat

O projeto deve usar o **SDK Modular** (tree-shakeable, menor bundle):

```javascript
// ✅ Correto — SDK Modular (v9+)
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'

// ❌ Evitar — SDK Compat (legado, maior bundle)
import firebase from 'firebase/compat/app'
import 'firebase/compat/auth'
import 'firebase/compat/firestore'
```

---

## 5. Regras de Segurança do Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuth() {
      return request.auth != null;
    }

    function isDono(propriedadeId) {
      return isAuth() &&
        exists(/databases/$(database)/documents/propriedade/$(propriedadeId)/membros/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/propriedade/$(propriedadeId)/membros/$(request.auth.uid)).data.cargo == 'dono';
    }

    function isMembro(propriedadeId) {
      return isAuth() &&
        exists(/databases/$(database)/documents/propriedade/$(propriedadeId)/membros/$(request.auth.uid));
    }

    // Usuários
    match /usuarios/{userId} {
      allow read, update: if isAuth() && request.auth.uid == userId;
      allow create: if isAuth();
    }

    // Propriedades
    match /propriedade/{propriedadeId} {
      allow read: if isMembro(propriedadeId);
      allow create: if isAuth();
      allow update, delete: if isDono(propriedadeId);

      // Membros
      match /membros/{membroId} {
        allow read: if isMembro(propriedadeId);
        allow create, delete: if isDono(propriedadeId);
      }

      // Animais
      match /animais/{animalId} {
        allow read: if isMembro(propriedadeId);
        allow create: if isMembro(propriedadeId);
        allow update, delete: if isDono(propriedadeId);

        // Subcoleções de animal
        match /vacinas/{id} {
          allow read: if isMembro(propriedadeId);
          allow create: if isMembro(propriedadeId);
          allow update, delete: if isDono(propriedadeId);
        }
        match /medicamentos/{id} {
          allow read: if isMembro(propriedadeId);
          allow create: if isMembro(propriedadeId);
          allow update, delete: if isDono(propriedadeId);
        }
        match /ocorrencias/{id} {
          allow read: if isMembro(propriedadeId);
          allow create: if isMembro(propriedadeId);
          allow update, delete: if isDono(propriedadeId);
        }
        match /pesagens/{id} {
          allow read: if isMembro(propriedadeId);
          allow create: if isMembro(propriedadeId);
          allow update, delete: if isDono(propriedadeId);
        }
        match /reproducao/{id} {
          allow read: if isMembro(propriedadeId);
          allow create: if isMembro(propriedadeId);
          allow update, delete: if isDono(propriedadeId);
        }
      }
    }
  }
}
```

---

## 6. Índices Compostos Necessários

O Firestore exige índices compostos para queries com múltiplos filtros:

| Coleção   | Campos indexados                          | Uso                           |
|-----------|-------------------------------------------|-------------------------------|
| animais   | `propriedade_uuid`, `deleted`, `nome`     | Listar animais da propriedade |
| animais   | `propriedade_uuid`, `deleted`, `especie`  | Filtrar por espécie           |
| vacinas   | `propriedade_uuid`, `proxima_dose`        | Vacinas próximas do vencimento|

> Os índices são criados automaticamente pelo Firestore ao executar a query pela primeira vez (link no erro).

---

## 7. Dependências Necessárias

```bash
npm install firebase
```

**Pacote:** `firebase` (v10+)

**Módulos utilizados:**
- `firebase/app` — Inicialização
- `firebase/auth` — Autenticação
- `firebase/firestore` — Banco de dados
