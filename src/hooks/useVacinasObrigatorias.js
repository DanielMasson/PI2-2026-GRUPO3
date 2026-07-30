import { useState, useEffect, useCallback } from 'react'
import * as vacinaObrigatoriaService from '../services/vacinaObrigatoriaService'
import * as sqlite from '../services/sqlite/queries'

// Hook da lista-config de vacinas obrigatórias por propriedade.
// Recebe `animalUuid` opcional — quando presente, filtra por especie+sexo do animal
// (espécies=NULL e sexo=NULL aplicam a todos).
export function useVacinasObrigatorias(propriedadeUuid, animalUuid = null) {
  const [vacinas, setVacinas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!propriedadeUuid) return
    setCarregando(true)
    setErro(null)
    try {
      let dados
      if (animalUuid) {
        const animal = await sqlite.buscarAnimal(animalUuid)
        const especie = animal?.especie ?? null
        const sexo = animal?.sexo ?? null
        dados = await vacinaObrigatoriaService.listarVacinasObrigatoriasParaAnimal(
          propriedadeUuid, especie, sexo
        )
      } else {
        dados = await vacinaObrigatoriaService.listarVacinasObrigatorias(propriedadeUuid)
      }
      setVacinas(dados)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [propriedadeUuid, animalUuid])

  useEffect(() => { carregar() }, [carregar])

  async function registrarVacinaObrigatoria(dados) {
    const resultado = await vacinaObrigatoriaService.registrarVacinaObrigatoria(dados)
    await carregar()
    return resultado
  }

  async function editarVacinaObrigatoria(uuid, dados) {
    await vacinaObrigatoriaService.editarVacinaObrigatoria(uuid, dados)
    await carregar()
  }

  async function desativarVacinaObrigatoria(uuid) {
    await vacinaObrigatoriaService.desativarVacinaObrigatoria(uuid)
    await carregar()
  }

  return {
    vacinas,
    carregando,
    erro,
    registrarVacinaObrigatoria,
    editarVacinaObrigatoria,
    desativarVacinaObrigatoria,
    recarregar: carregar,
  }
}
