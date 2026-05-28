# Custom Hooks

> Hooks reutilizáveis do **Propriedade Inteligente**.
> Cada hook encapsula lógica de acesso a dados, estado local e sincronização.

---

## 1. Estrutura de Arquivos

```text
src/hooks/
├── useAuth.js             # (re-exporta useAuth do AuthContext)
├── usePropriedade.js      # (re-exporta usePropriedade do PropriedadeContext)
├── useSync.js             # (re-exporta useSync do SyncContext)
├── useOffline.js          # (re-exporta useOffline do OfflineContext)
├── useAnimais.js          # CRUD de animais da propriedade atual
├── useAnimal.js           # Dados de um animal específico
├── useVacinas.js          # Vacinas de um animal ou propriedade
├── useMedicamentos.js     # Medicamentos de um animal
├── useOcorrencias.js      # Ocorrências clínicas de um animal
├── usePesagens.js         # Pesagens de um animal + cálculo de GMD
├── useReproducao.js       # Reprodução de uma fêmea
├── useGestantes.js        # Lista de gestações ativas da propriedade
├── usePermissao.js        # Verifica cargo do usuário na propriedade
├── useAlertas.js          # Alertas de vacinas próximas e carência
└── useDebounce.js         # Debounce para campos de busca
```

---

## 2. useAnimais(propriedadeId)

### Responsabilidade
- Lista animais de uma propriedade (do SQLite)
- CRUD de animais
- Atualização automática após operações
- Busca e filtros

### Retorno

```javascript
const {
  animais,              // Array de animais
  carregando,           // boolean — carregando dados
  erro,                 // string|null — erro
  buscar,               // (termo) => void — filtrar por nome/brinco
  criarAnimal,          // (dados) => Promise<animal>
  editarAnimal,         // (uuid, dados) => Promise<animal>
  excluirAnimal,        // (uuid) => Promise<void>
  recarregar,           // () => void — recarregar lista
  filtros,              // { especie, sexo, status }
  setFiltros,           // (filtros) => void
} = useAnimais(propriedadeId)
```

### Implementação

```jsx
// hooks/useAnimais.js
import { useState, useEffect, useCallback } from 'react'
import * as animalService from '../services/animalService'

export function useAnimais(propriedadeId) {
  const [animais, setAnimais] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [termoBusca, setTermoBusca] = useState('')
  const [filtros, setFiltros] = useState({ especie: null, sexo: null, status: 'ativo' })

  const carregar = useCallback(async () => {
    if (!propriedadeId) return
    setCarregando(true)
    setErro(null)
    try {
      const dados = await animalService.listarAnimais(propriedadeId)
      setAnimais(dados)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [propriedadeId])

  useEffect(() => { carregar() }, [carregar])

  // Filtros aplicados em memória
  const animaisFiltrados = animais
    .filter(a => {
      if (termoBusca) {
        const termo = termoBusca.toLowerCase()
        return (
          a.nome?.toLowerCase().includes(termo) ||
          a.id_fisico?.toLowerCase().includes(termo) ||
          a.id_interno?.toLowerCase().includes(termo)
        )
      }
      return true
    })
    .filter(a => !filtros.especie || a.especie === filtros.especie)
    .filter(a => !filtros.sexo || a.sexo === filtros.sexo)
    .filter(a => !filtros.status || a.status === filtros.status)

  async function criarAnimal(dados) {
    const novo = await animalService.criarAnimal({ ...dados, propriedade_uuid: propriedadeId })
    setAnimais(prev => [...prev, novo])
    return novo
  }

  async function editarAnimal(uuid, dados) {
    const atualizado = await animalService.editarAnimal(uuid, dados)
    setAnimais(prev => prev.map(a => a.uuid === uuid ? atualizado : a))
    return atualizado
  }

  async function excluirAnimal(uuid) {
    await animalService.excluirAnimal(uuid)
    setAnimais(prev => prev.filter(a => a.uuid !== uuid))
  }

  function buscar(termo) {
    setTermoBusca(termo)
  }

  return {
    animais: animaisFiltrados,
    carregando,
    erro,
    buscar,
    criarAnimal,
    editarAnimal,
    excluirAnimal,
    recarregar: carregar,
    filtros,
    setFiltros,
  }
}
```

---

## 3. useAnimal(animalId)

### Responsabilidade
- Dados completos de um animal específico
- Dados derivados (idade, GMD, ECC)

### Retorno

```javascript
const {
  animal,               // Dados do animal
  idade,                // { texto: "3 anos e 2 meses", meses: 38 }
  carregando,           // boolean
  erro,                 // string|null
  recarregar,           // () => void
  atualizar,            // (dados) => Promise<void>
} = useAnimal(animalId)
```

---

## 4. useVacinas(animalOuPropriedadeId, tipo)

### Responsabilidade
- Vacinas de um animal ou de uma propriedade inteira
- Alertas de próximas doses

### Retorno

```javascript
const {
  vacinas,              // Array de vacinas
  proximas,             // Vacinas com dose nos próximos 7 dias
  vencidas,             // Vacinas com dose já vencida
  carregando,
  erro,
  registrarVacina,      // (dados) => Promise<vacina>
  editarVacina,         // (uuid, dados) => Promise<vacina>
  excluirVacina,        // (uuid) => Promise<void>
  recarregar,
} = useVacinas(animalId, 'animal')
```

---

## 5. usePesagens(animalId)

### Responsabilidade
- Histórico de pesagens
- Cálculo de GMD (Ganho Médio Diário)
- Cálculo de ECC

### Retorno

```javascript
const {
  pesagens,             // Array de pesagens (ordenadas por data DESC)
  pesoAtual,            // Último peso registrado
  gmd,                  // { valor: 0.85, status: 'bom', cor: 'verde' }
  ecc,                  // { valor: 3, label: 'Ideal', cor: 'verde' }
  carregando,
  erro,
  registrarPesagem,     // (dados) => Promise<pesagem>
  recarregar,
} = usePesagens(animalId)
```

### Cálculo de GMD

```javascript
function calcularGMD(pesagens) {
  if (pesagens.length < 2) return { valor: 0, status: 'sem_dados', cor: 'cinza' }

  const [atual, anterior] = pesagens // já ordenadas DESC
  const dias = (new Date(atual.data) - new Date(anterior.data)) / (1000 * 60 * 60 * 24)
  if (dias <= 0) return { valor: 0, status: 'sem_dados', cor: 'cinza' }

  const valor = (atual.peso - anterior.peso) / dias

  if (valor >= 1.0) return { valor, status: 'otimo', cor: 'verde' }
  if (valor >= 0.5) return { valor, status: 'bom', cor: 'verde' }
  if (valor >= 0.1) return { valor, status: 'regular', cor: 'amarelo' }
  if (valor >= 0) return { valor, status: 'estavel', cor: 'cinza' }
  return { valor, status: 'perda', cor: 'vermelho' }
}
```

---

## 6. useReproducao(animalId)

### Responsabilidade
- Dados reprodutivos de uma fêmea
- Dias restantes até o parto
- Status da gestação

### Retorno

```javascript
const {
  registros,            // Histórico reprodutivo
  gestacaoAtiva,        // Gestação atual (se houver)
  diasRestantes,        // Número de dias até o parto
  statusGestacao,       // { label, cor }
  carregando,
  registrarCobertura,   // (dados) => Promise<reproducao>
  confirmarPrenhez,     // (uuid, dataConfirmacao) => Promise<void>
  registrarParto,       // (uuid, dataParto) => Promise<void>
} = useReproducao(animalId)
```

---

## 7. useGestantes(propriedadeId)

### Responsabilidade
- Lista de todas as gestações ativas da propriedade
- Ordenadas por data prevista de parto

### Retorno

```javascript
const {
  gestantes,            // Array de gestações ativas com dados do animal
  partosProximos,       // Gestações com parto nos próximos 30 dias
  partosAtrasados,      // Gestações com parto já passado (possível aborto)
  carregando,
  recarregar,
} = useGestantes(propriedadeId)
```

---

## 8. useAlertas(propriedadeId)

### Responsabilidade
- Alertas de vacinas próximas/vencidas
- Alertas de animais em carência
- Alertas de partos próximos
- Alertas de GMD negativo

### Retorno

```javascript
const {
  alertas,              // Array de { tipo, titulo, descricao, nivel, tempo }
  carregando,
  recarregar,
} = useAlertas(propriedadeId)
```

### Tipos de alerta

| Tipo               | Nível    | Fonte                        |
|--------------------|----------|------------------------------|
| vacina_vencida     | danger   | vacinas com proxima_dose < hoje |
| vacina_proxima     | warning  | vacinas com proxima_dose ≤ 7d |
| animal_carencia    | info     | medicamentos com data_liberacao ≥ hoje |
| parto_proximo      | warning  | reprodução com dias_restantes ≤ 30 |
| parto_atrasado     | danger   | reprodução com dias_restantes < 0 |
| gmd_negativo       | warning  | pesagens onde GMD < 0 |

---

## 9. usePermissao(propriedadeId)

### Responsabilidade
- Verifica o cargo do usuário na propriedade
- Retorna flags de permissão

### Retorno

```javascript
const {
  cargo,                // 'dono' | 'peao' | null
  isDono,               // boolean
  isPeao,               // boolean
  isMembro,             // boolean
  podeEditar,           // boolean — equivalente a isDono
  podeExcluir,          // boolean — equivalente a isDono
  podeCriar,            // boolean — true para dono e peão
  carregando,
} = usePermissao(propriedadeId)
```

### Uso

```jsx
function FichaAnimal({ propriedadeId }) {
  const { isDono, podeCriar } = usePermissao(propriedadeId)

  return (
    <div>
      {/* Todos podem ver */}
      <DadosAnimal />

      {/* Dono e Peão podem criar */}
      {podeCriar && <Button onClick={handleRegistrarVacina}>Registrar Vacina</Button>}

      {/* Apenas Dono pode editar/excluir */}
      {isDono && (
        <>
          <Button onClick={handleEditar}>Editar</Button>
          <Button variant="ghost" onClick={handleExcluir}>Excluir</Button>
        </>
      )}
    </div>
  )
}
```

---

## 10. useDebounce(valor, delay)

### Responsabilidade
- Debounce de valor para campos de busca
- Evita filtrar a cada keystroke

### Implementação

```jsx
// hooks/useDebounce.js
import { useState, useEffect } from ' useState'

export function useDebounce(valor, delay = 300) {
  const [debounced, setDebounced] = useState(valor)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(valor), delay)
    return () => clearTimeout(timer)
  }, [valor, delay])

  return debounced
}
```

### Uso

```jsx
function ListaAnimais() {
  const [busca, setBusca] = useState('')
  const buscaDebounced = useDebounce(busca, 300)
  const { animais } = useAnimais(propriedadeId)

  // Filtrar com buscaDebounced
  const filtrados = animais.filter(a =>
    a.nome.toLowerCase().includes(buscaDebounced.toLowerCase())
  )
}
```

---

## 11. Resumo dos Hooks

| Hook              | Entrada                   | Retorno principal              | Fonte de dados |
|-------------------|---------------------------|--------------------------------|----------------|
| `useAnimais`      | propriedadeId             | lista, CRUD, busca, filtros    | SQLite         |
| `useAnimal`       | animalId                  | dados, idade, GMD              | SQLite         |
| `useVacinas`      | animalId ou propriedadeId | lista, próximas, vencidas      | SQLite         |
| `useMedicamentos` | animalId                  | lista, carência                | SQLite         |
| `useOcorrencias`  | animalId                  | lista, resultados              | SQLite         |
| `usePesagens`     | animalId                  | lista, GMD, ECC                | SQLite         |
| `useReproducao`   | animalId                  | gestação, dias restantes       | SQLite         |
| `useGestantes`    | propriedadeId             | lista de gestações ativas      | SQLite         |
| `useAlertas`      | propriedadeId             | alertas de vacinas, carência   | SQLite         |
| `usePermissao`    | propriedadeId             | cargo, flags de permissão      | SQLite         |
| `useDebounce`     | valor, delay              | valor com debounce             | —              |
