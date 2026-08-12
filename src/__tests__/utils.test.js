import { diasAte, formatarDataBR } from '../utils/datas'
import { gerarUUID } from '../utils/uuid'
import { ESPECIES, SEXOS, DIAS_GESTACAO } from '../constants/sync'
import { validarCpf, formatarCpf, somenteDigitos } from '../utils/cpf'

describe('datas', () => {
  test('diasAte retorna null para data vazia', () => {
    expect(diasAte(null)).toBeNull()
    expect(diasAte('')).toBeNull()
  })

  test('diasAte retorna null para data invalida', () => {
    expect(diasAte('data-invalida')).toBeNull()
  })

  test('diasAte retorna 0 para hoje', () => {
    const hoje = new Date().toISOString().split('T')[0]
    expect(diasAte(hoje)).toBe(0)
  })

  test('diasAte retorna positivo para futuro', () => {
    const hoje = new Date()
    const futuro = new Date(hoje)
    futuro.setDate(futuro.getDate() + 5)
    const iso = futuro.toISOString().split('T')[0]
    expect(diasAte(iso, hoje)).toBe(5)
  })

  test('diasAte retorna negativo para passado', () => {
    const hoje = new Date()
    const passado = new Date(hoje)
    passado.setDate(passado.getDate() - 3)
    const iso = passado.toISOString().split('T')[0]
    expect(diasAte(iso, hoje)).toBe(-3)
  })

  test('formatarDataBR retorna — para vazio', () => {
    expect(formatarDataBR(null)).toBe('—')
    expect(formatarDataBR('')).toBe('—')
  })

  test('formatarDataBR formata corretamente', () => {
    expect(formatarDataBR('2026-08-11')).toBe('11/08/2026')
    expect(formatarDataBR('2025-12-25')).toBe('25/12/2025')
  })

  test('formatarDataBR retorna raw para formato invalido', () => {
    expect(formatarDataBR('11/08/2026')).toBe('11/08/2026')
  })
})

describe('uuid', () => {
  test('gerarUUID retorna string no formato UUID', () => {
    const uuid = gerarUUID()
    expect(typeof uuid).toBe('string')
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })

  test('gerarUUID gera ids unicos', () => {
    const ids = new Set(Array.from({ length: 100 }, () => gerarUUID()))
    expect(ids.size).toBe(100)
  })
})

describe('constants', () => {
  test('ESPECIES contem as especies esperadas', () => {
    expect(ESPECIES).toContain('bovino')
    expect(ESPECIES).toContain('ovino')
    expect(ESPECIES).toContain('suino')
  })

  test('SEXOS contem macho e femea', () => {
    expect(SEXOS).toContain('macho')
    expect(SEXOS).toContain('femea')
  })

  test('DIAS_GESTACAO tem valor para cada especie', () => {
    expect(DIAS_GESTACAO.bovino).toBe(285)
    expect(DIAS_GESTACAO.ovino).toBe(150)
    expect(DIAS_GESTACAO.suino).toBe(114)
  })
})

describe('cpf', () => {
  describe('somenteDigitos', () => {
    test('remove tudo que nao e digito', () => {
      expect(somenteDigitos('123.456.789-00')).toBe('12345678900')
      expect(somenteDigitos('abc123')).toBe('123')
      expect(somenteDigitos('')).toBe('')
    })
  })

  describe('validarCpf', () => {
    test('rejeita CPFs com todos díguos iguais', () => {
      expect(validarCpf('000.000.000-00')).toBe(false)
      expect(validarCpf('111.111.111-11')).toBe(false)
      expect(validarCpf('999.999.999-99')).toBe(false)
    })

    test('rejeita CPFs com menos de 11 dígitos', () => {
      expect(validarCpf('123.456.789-0')).toBe(false)
      expect(validarCpf('1234567890')).toBe(false)
    })

    test('rejeita CPFs com dígitos verificadores incorretos', () => {
      expect(validarCpf('529.982.247-00')).toBe(false)
      expect(validarCpf('111.444.777-00')).toBe(false)
    })

    test('aceita CPFs válidos', () => {
      expect(validarCpf('529.982.247-25')).toBe(true)
      expect(validarCpf('111.444.777-35')).toBe(true)
      expect(validarCpf('347.066.120-04')).toBe(true)
    })

    test('aceita CPF sem formatação', () => {
      expect(validarCpf('11144477735')).toBe(true)
    })
  })

  describe('formatarCpf', () => {
    test('formata CPF completo', () => {
      expect(formatarCpf('52998224708')).toBe('529.982.247-08')
    })

    test('formata parcialmente', () => {
      expect(formatarCpf('529')).toBe('529')
      expect(formatarCpf('529982')).toBe('529.982')
      expect(formatarCpf('529982247')).toBe('529.982.247')
    })

    test('remove formatação existente', () => {
      expect(formatarCpf('529.982.247-08')).toBe('529.982.247-08')
    })

    test('limita a 11 dígitos', () => {
      expect(formatarCpf('5299822470812345')).toBe('529.982.247-08')
    })
  })
})
