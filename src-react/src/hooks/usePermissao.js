import { useContext } from 'react'
import { PropriedadeContext } from '../contexts/PropriedadeContext'

export function usePermissao() {
  const { cargo, isDono, isPeao, isMembro } = useContext(PropriedadeContext)

  return {
    cargo,
    isDono,
    isPeao,
    isMembro,
    podeCriar: isDono || isMembro,
    podeEditar: isDono || isMembro,
    podeExcluir: isDono,
  }
}
