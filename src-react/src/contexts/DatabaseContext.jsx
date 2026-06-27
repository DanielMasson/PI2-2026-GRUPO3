import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { initDatabase } from '../services/sqlite/database'

const DatabaseContext = createContext()

export function DatabaseProvider({ children }) {
  const [dbPronto, setDbPronto] = useState(false)
  const [erro, setErro] = useState(null)
  const inicializado = useRef(false)

  useEffect(() => {
    if (inicializado.current) return
    inicializado.current = true

    async function inicializar() {
      try {
        // Aguardar deviceready no Cordova
        if (window.cordova) {
          await new Promise(resolve => {
            document.addEventListener('deviceready', resolve, { once: true })
          })
        }
        await initDatabase()
        setDbPronto(true)
      } catch (e) {
        console.error('[DatabaseContext] Erro ao inicializar banco:', e)
        setErro(e.message)
        // Permitir que o app funcione mesmo com erro no banco
        setDbPronto(true)
      }
    }
    inicializar()
  }, [])

  if (!dbPronto) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#1a1a2e',
        color: '#e0e0e0',
        fontFamily: 'system-ui, sans-serif',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <div style={{ fontSize: '2rem' }}>🔄</div>
        <p>Inicializando banco de dados...</p>
      </div>
    )
  }

  if (erro) {
    console.warn('[DatabaseContext] Banco com erro, prosseguindo com fallback:', erro)
  }

  return (
    <DatabaseContext.Provider value={{ dbPronto, erro }}>
      {children}
    </DatabaseContext.Provider>
  )
}

export function useDatabase() {
  const context = useContext(DatabaseContext)
  if (!context) throw new Error('useDatabase deve ser usado dentro de DatabaseProvider')
  return context
}
