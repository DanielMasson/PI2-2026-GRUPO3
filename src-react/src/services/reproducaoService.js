import * as sqlite from './sqlite/queries'
import * as animalService from './animalService'
import { DIAS_GESTACAO, DIAS_SECAGEM } from '../constants/sync'

export async function registrarCobertura(dados) {
  // Calcular data_previa_parto e data_secagem se não fornecidas
  const animal = await sqlite.buscarAnimal(dados.animal_uuid)
  const diasGestacao = DIAS_GESTACAO[animal?.especie] || DIAS_GESTACAO.bovino

  if (!dados.data_previa_parto && dados.data_cobertura) {
    const dataParto = new Date(dados.data_cobertura)
    dataParto.setDate(dataParto.getDate() + diasGestacao)
    dados.data_previa_parto = dataParto.toISOString().split('T')[0]
  }

  if (!dados.data_secagem && dados.data_previa_parto) {
    const dataSecagem = new Date(dados.data_previa_parto)
    dataSecagem.setDate(dataSecagem.getDate() - DIAS_SECAGEM)
    dados.data_secagem = dataSecagem.toISOString().split('T')[0]
  }

  const uuid = await sqlite.inserirReproducao(dados)
  return await sqlite.buscarReproducao(uuid)
}

export async function listarReproducao(animalUuid) {
  return await sqlite.listarReproducao(animalUuid)
}

export async function listarReproducaoPropriedade(propriedadeUuid) {
  return await sqlite.listarReproducaoPropriedade(propriedadeUuid)
}

export async function listarGestantes(propriedadeUuid) {
  return await sqlite.listarGestantes(propriedadeUuid)
}

export async function listarCoberturas(propriedadeUuid) {
  return await sqlite.listarCoberturasRep(propriedadeUuid)
}

// Sprint 7: tri-state — coberturas com diagnóstico negativo
export async function listarFalhas(propriedadeUuid) {
  return await sqlite.listarFalhasRep(propriedadeUuid)
}

// Sprint 7: tri-state — gestações finalizadas (paridas)
export async function listarParidas(propriedadeUuid) {
  return await sqlite.listarParidasRep(propriedadeUuid)
}

// Sprint 7: tri-state — cancelar/diagnosticar negativo (falha de cobertura)
export async function cancelarCobertura(uuid, motivo) {
  const data = new Date().toISOString().split('T')[0]
  const previa = await sqlite.buscarReproducao(uuid)
  const obsAnterior = previa?.observacao || ''
  const obsNova = motivo
    ? `[Falha ${data}] ${motivo}${obsAnterior ? ` | ${obsAnterior}` : ''}`.slice(0, 500)
    : obsAnterior
  await sqlite.atualizarReproducao(uuid, {
    prenhez_confirmada: 0,
    resultado: 'negativa',
    observacao: obsNova,
  })
  return await sqlite.buscarReproducao(uuid)
}

export async function confirmarPrenhez(uuid, dataConfirmacao) {
  const data = typeof dataConfirmacao === 'string'
    ? dataConfirmacao
    : dataConfirmacao?.data_confirmacao || new Date().toISOString().split('T')[0]

  await sqlite.atualizarReproducao(uuid, {
    prenhez_confirmada: 1,
    data_confirmacao: data,
  })
}

export async function registrarParto(uuid, dataParto, cria = null) {
  // Aceita: string ISO (caso legado), Date, ou objeto { dataParto, sexoFilhote, pesoFilhote, brincoFilhote, nome }
  let data, payload = null
  if (typeof dataParto === 'string') {
    data = dataParto
  } else if (dataParto instanceof Date) {
    data = dataParto.toISOString().split('T')[0]
  } else if (dataParto && typeof dataParto === 'object') {
    data = dataParto.dataParto || dataParto.data_parto || new Date().toISOString().split('T')[0]
    if (dataParto.sexoFilhote || dataParto.sexo_filhote) {
      payload = {
        nome: dataParto.nome || dataParto.nomeFilhote || dataParto.nome_filhote || null,
        sexo: dataParto.sexoFilhote || dataParto.sexo_filhote,
        peso_inicial: dataParto.pesoFilhote || dataParto.peso_filhote || null,
        id_fisico: dataParto.brincoFilhote || dataParto.id_fisico || dataParto.brinco || null,
      }
    }
  } else {
    data = new Date().toISOString().split('T')[0]
  }

  await sqlite.atualizarReproducao(uuid, { data_parto: data, resultado: 'parida' })

  // Cria opcional
  let criaCriada = null
  const tentativa = payload || cria
  if (tentativa && tentativa.sexo) {
    const previa = await sqlite.buscarReproducao(uuid)
    if (previa?.animal_uuid) {
      const matriz = await sqlite.buscarAnimal(previa.animal_uuid)
      const nomeFinal = tentativa.nome || (tentativa.id_fisico
        ? `Cria de ${new Date(data + 'T00:00:00').getFullYear()} - ${tentativa.id_fisico}`
        : `Cria de ${new Date(data + 'T00:00:00').getFullYear()}`)
      criaCriada = await animalService.criarAnimal({
        propriedade_uuid: matriz?.propriedade_uuid || previa.propriedade_uuid,
        nome: nomeFinal,
        id_fisico: tentativa.id_fisico || null,
        especie: matriz?.especie || 'bovino',
        raca: tentativa.raca || matriz?.raca || null,
        sexo: tentativa.sexo,
        data_nascimento: data,
        peso_inicial: tentativa.peso_inicial || null,
        pelagem: matriz?.pelagem || null,
        mae_uuid: previa.animal_uuid,
        pai_uuid: previa.touro_uuid || null,
        origem: 'nascido_propriedade',
      })
    }
  }

  return { parto: await sqlite.buscarReproducao(uuid), criaCriada }
}

export function diasAteParto(dataPrevista) {
  if (!dataPrevista) return null
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const previa = new Date(dataPrevista + 'T00:00:00')
  return Math.ceil((previa - hoje) / (1000 * 60 * 60 * 24))
}
