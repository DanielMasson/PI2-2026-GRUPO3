import { createContext, useContext, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import * as propriedadeService from '../services/propriedadeService'

export const PropriedadeContext = createContext()

export function PropriedadeProvider({ children }) {
  const { usuario } = useAuth()
  const [propriedade, setPropriedade] = useState(null)
  const [propriedadeId, setPropriedadeId] = useState(null)
  const [cargo, setCargo] = useState(null)
  const [carregando, setCarregando] = useState(false)

  const selecionarPropriedade = useCallback(async (uuid) => {
    setCarregando(true)
    try {
      const prop = await propriedadeService.buscarPropriedade(uuid)
      setPropriedade(prop)
      setPropriedadeId(uuid)

      // Buscar cargo do usuário nesta propriedade
      const membros = await propriedadeService.listarMembros(uuid)
      const membro = membros.find(m => m.usuario_uuid === usuario?.uuid)
      setCargo(membro?.cargo || 'dono')
    } catch {
      // Se não encontrar, definir cargo padrão
      setCargo('dono')
    } finally {
      setCarregando(false)
    }
  }, [usuario])

  const limparPropriedade = useCallback(() => {
    setPropriedade(null)
    setPropriedadeId(null)
    setCargo(null)
  }, [])

  return (
    <PropriedadeContext.Provider value={{
      propriedadeId,
      propriedade,
      cargo,
      isDono: cargo === 'dono',
      isPeao: cargo === 'peao',
      isMembro: cargo !== null,
      carregando,
      selecionarPropriedade,
      limparPropriedade,
    }}>
      {children}
    </PropriedadeContext.Provider>
  )
}

export function usePropriedade() {
  const context = useContext(PropriedadeContext)
  if (!context) throw new Error('usePropriedade deve ser usado dentro de PropriedadeProvider')
  return context
}
