import { getFirestore } from 'firebase/firestore'
import app from './config'

// Instância única do Firestore para o app.
// Reusa o `app` já inicializado em config.js — não chama initializeApp de novo.
export const db = getFirestore(app)
