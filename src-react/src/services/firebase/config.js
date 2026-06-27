import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'

// Configuração lida de variáveis de ambiente Vite (prefixo VITE_).
// O apiKey é público por design em apps Firebase client; segurança vem das
// regras do Auth/DB, não do segredo do apiKey.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// Persistência local — sobrevive ao reload do browser mas não cruza domínios.
// `await` no top-level funciona em ESM do Vite.
await setPersistence(auth, browserLocalPersistence)

export default app
