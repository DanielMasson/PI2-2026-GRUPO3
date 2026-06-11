// src-react/src/data/healthData.js
// Referência: hoje = 20/05/2026

export function diasAte(dataStr) {
  const hoje = new Date()
  const alvo = new Date(dataStr + 'T00:00:00')
  return Math.ceil((alvo - hoje) / 86400000)
}

export function formatarData(dataStr) {
  if (!dataStr) return '—'
  return new Date(dataStr + 'T00:00:00').toLocaleDateString('pt-BR')
}

export function calcularStatusAnimal(animal) {
  const vacinaVencida = animal.vacinas.some(v => diasAte(v.proxima) < 0)
  const ocorrenciaAberta = animal.ocorrencias.some(
    o => o.resultado === 'Em tratamento' || o.resultado === 'Aguardando avaliação'
  )
  const ferimentoAberto = animal.ferimentos.some(f => f.status === 'aberto')
  if (vacinaVencida || ocorrenciaAberta || ferimentoAberto) return 'urgente'

  const vacinaProxima = animal.vacinas.some(v => {
    const d = diasAte(v.proxima)
    return d >= 0 && d <= 30
  })
  const emCarencia = animal.medicamentos.some(m => diasAte(m.dataLiberacao) > 0)
  const ferimentoEmTrat = animal.ferimentos.some(f => f.status === 'em_tratamento')
  if (vacinaProxima || emCarencia || ferimentoEmTrat) return 'atencao'

  return 'ok'
}

export function getCarenciaAtiva(animal) {
  const ativas = animal.medicamentos.filter(m => diasAte(m.dataLiberacao) > 0)
  if (ativas.length === 0) return null
  const sorted = [...ativas].sort((a, b) => diasAte(b.dataLiberacao) - diasAte(a.dataLiberacao))
  return { produto: sorted[0].produto, dias: diasAte(sorted[0].dataLiberacao) }
}

export const ANIMAIS_SAUDE = [
  {
    id: 'BR-00142',
    nome: 'Mimosa',
    brinco: 'BR-00142',
    raca: 'Nelore',
    sexo: 'Fêmea',
    peso: 340,
    dataNascimento: '2020-03-15',
    lote: 'A3',
    vacinas: [
      { id: 1, nome: 'Febre Aftosa', ultimaAplicacao: '2026-01-15', proxima: '2026-07-15', ciclo: 180, lote: 'LT-2026-001', responsavel: 'João Silva', obrigatoria: true },
      { id: 2, nome: 'Brucelose', ultimaAplicacao: '2025-08-01', proxima: '2026-08-01', ciclo: 365, lote: 'LT-2025-018', responsavel: 'Maria Souza', obrigatoria: true },
      { id: 3, nome: 'Clostridioses', ultimaAplicacao: '2025-12-05', proxima: '2026-06-05', ciclo: 180, lote: 'LT-2025-032', responsavel: 'João Silva', obrigatoria: false },
    ],
    medicamentos: [
      { id: 1, produto: 'Ivermectina 1%', tipo: 'Antiparasitário', dose: '5ml', dataAplicacao: '2026-04-20', dataLiberacao: '2026-06-15', carencia: 56, responsavel: 'Dr. Carlos', observacao: 'Aplicação preventiva trimestral' },
    ],
    ferimentos: [],
    ocorrencias: [],
  },
  {
    id: 'BR-00201',
    nome: 'Trovão',
    brinco: 'BR-00201',
    raca: 'Angus',
    sexo: 'Macho',
    peso: 520,
    dataNascimento: '2019-07-22',
    lote: 'B1',
    vacinas: [
      { id: 1, nome: 'Febre Aftosa', ultimaAplicacao: '2026-01-10', proxima: '2026-07-10', ciclo: 180, lote: 'LT-2026-001', responsavel: 'João Silva', obrigatoria: true },
      { id: 2, nome: 'Raiva', ultimaAplicacao: '2025-09-10', proxima: '2026-09-10', ciclo: 365, lote: 'LT-2025-025', responsavel: 'Dr. Carlos', obrigatoria: false },
    ],
    medicamentos: [],
    ferimentos: [
      { id: 1, tipo: 'Corte', localizacao: 'Pata traseira direita', gravidade: 'leve', data: '2026-05-10', tratamento: 'Limpeza e spray cicatrizante', status: 'em_tratamento', observacao: 'Causado por arame farpado' },
    ],
    ocorrencias: [],
  },
  {
    id: 'BR-00310',
    nome: 'Estrela',
    brinco: 'BR-00310',
    raca: 'Gir',
    sexo: 'Fêmea',
    peso: 290,
    dataNascimento: '2021-11-05',
    lote: 'A1',
    vacinas: [
      { id: 1, nome: 'Febre Aftosa', ultimaAplicacao: '2026-01-15', proxima: '2026-07-15', ciclo: 180, lote: 'LT-2026-001', responsavel: 'João Silva', obrigatoria: true },
      { id: 2, nome: 'Clostridioses', ultimaAplicacao: '2025-10-20', proxima: '2026-04-20', ciclo: 180, lote: 'LT-2025-030', responsavel: 'João Silva', obrigatoria: false },
    ],
    medicamentos: [],
    ferimentos: [],
    ocorrencias: [
      { id: 1, data: '2026-05-12', sintomas: 'Tosse persistente, febre leve, perda de apetite', tratamento: 'Antibiótico Enrofloxacina 5mg/kg por 5 dias', resultado: 'Em tratamento', veterinario: 'Dr. Carlos Mendes' },
    ],
  },
  {
    id: 'BR-00415',
    nome: 'Gaúcho',
    brinco: 'BR-00415',
    raca: 'Hereford',
    sexo: 'Macho',
    peso: 480,
    dataNascimento: '2018-05-30',
    lote: 'B2',
    vacinas: [
      { id: 1, nome: 'Febre Aftosa', ultimaAplicacao: '2026-01-15', proxima: '2026-07-15', ciclo: 180, lote: 'LT-2026-001', responsavel: 'João Silva', obrigatoria: true },
      { id: 2, nome: 'Brucelose', ultimaAplicacao: '2026-02-01', proxima: '2027-02-01', ciclo: 365, lote: 'LT-2026-005', responsavel: 'Maria Souza', obrigatoria: true },
    ],
    medicamentos: [],
    ferimentos: [],
    ocorrencias: [],
  },
  {
    id: 'BR-00518',
    nome: 'Boneca',
    brinco: 'BR-00518',
    raca: 'Nelore',
    sexo: 'Fêmea',
    peso: 310,
    dataNascimento: '2022-01-18',
    lote: 'A2',
    vacinas: [
      { id: 1, nome: 'Febre Aftosa', ultimaAplicacao: '2026-01-15', proxima: '2026-07-15', ciclo: 180, lote: 'LT-2026-001', responsavel: 'João Silva', obrigatoria: true },
    ],
    medicamentos: [
      { id: 1, produto: 'Oxitetraciclina 200mg/ml', tipo: 'Antibiótico', dose: '10ml', dataAplicacao: '2026-05-15', dataLiberacao: '2026-07-15', carencia: 61, responsavel: 'Dr. Carlos', observacao: 'Tratamento de infecção respiratória' },
    ],
    ferimentos: [],
    ocorrencias: [],
  },
]
