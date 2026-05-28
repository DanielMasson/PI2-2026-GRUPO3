# Modelos de Dados

> Modelos de dados compartilhados entre **SQLite (local)** e **Firestore (remoto)**.
> Cada modelo define os campos, tipos, validações e exemplo de uso.

---

## 1. Modelo: Usuario

```javascript
const usuario = {
  uuid: "abc123-def456",           // UUID v4 = Firebase UID
  firebase_uid: "abc123def456",    // UID do Firebase Auth
  nome: "João da Silva",          // Nome completo
  email: "joao@email.com",        // E-mail (único)
  telefone: "(49) 99999-0000",    // Telefone
  cargo: "dono",                  // 'dono' | 'peao' (global)
  foto_url: null,                 // URL da foto (Firebase Storage)
  created_at: "2026-01-15T10:30:00.000Z",
  updated_at: "2026-01-15T10:30:00.000Z",
  synced_at: "2026-01-15T10:30:05.000Z",
  sync_status: "sincronizado"
}
```

---

## 2. Modelo: Propriedade

```javascript
const propriedade = {
  uuid: "prop-001",
  nome: "Fazenda Norte",
  localizacao: "Sorriso, MT",
  tamanho_ha: 150.5,              // Hectares (opcional)
  dono_uuid: "abc123-def456",     // UUID do dono
  created_at: "2026-01-15T10:30:00.000Z",
  updated_at: "2026-01-15T10:30:00.000Z",
  synced_at: null,
  sync_status: "novo"
}
```

---

## 3. Modelo: PropriedadeMembro

```javascript
const membro = {
  uuid: "user-456",                // UUID do usuário (= Firebase UID)
  propriedade_uuid: "prop-001",    // UUID da propriedade
  usuario_uuid: "user-456",        // UUID do usuário
  cargo: "peao",                   // 'dono' | 'peao'
  convidado_por: "abc123-def456",  // UUID de quem convidou
  created_at: "2026-01-20T14:00:00.000Z",
  updated_at: "2026-01-20T14:00:00.000Z",
  synced_at: null,
  sync_status: "novo"
}
```

---

## 4. Modelo: Animal

```javascript
const animal = {
  uuid: "ani-00042",
  propriedade_uuid: "prop-001",
  id_interno: "ANI-00042",         // Gerado automaticamente
  id_fisico: "BR-00142",           // Brinco/Tag (opcional)
  nome: "Mimosa",                  // Nome/Apelido (opcional)
  especie: "bovino",               // 'bovino' | 'ovino' | 'suino'
  raca: "Nelore",
  sexo: "femea",                   // 'macho' | 'femea'
  data_nascimento: "2023-03-15",   // YYYY-MM-DD
  peso_inicial: 280.5,             // kg
  pelagem: "Branca malhada",       // Descrição visual (opcional)
  genetica: "3/4 Nelore + 1/4 Angus", // (opcional)
  origem: "Comprada na Fazenda São João", // (opcional)
  mae_uuid: "ani-00010",           // UUID da mãe (opcional)
  pai_uuid: "ani-00003",           // UUID do pai (opcional)
  valor_compra: 2500.00,           // R$ (opcional, pós-MVP)
  status: "ativo",                 // 'ativo' | 'vendido' | 'morto' | 'consumido'
  deleted: 0,                      // 0 = ativo, 1 = deletado
  created_at: "2026-02-01T08:00:00.000Z",
  updated_at: "2026-02-01T08:00:00.000Z",
  synced_at: null,
  sync_status: "novo"
}
```

---

## 5. Modelo: Vacina

```javascript
const vacina = {
  uuid: "vac-001",
  animal_uuid: "ani-00042",
  propriedade_uuid: "prop-001",    // Desnormalizado para queries rápidas
  nome_vacina: "Febre Aftosa",
  obrigatoria: 1,                  // 0 = opcional, 1 = obrigatória
  ciclo_dias: 180,                 // Dias até próxima dose
  data_aplicacao: "2026-01-15",    // YYYY-MM-DD
  proxima_dose: "2026-07-14",      // Calculada: data_aplicacao + ciclo_dias
  lote: "LT-2026-001",
  responsavel: "João",
  valor: 40.00,                    // R$ (opcional, pós-MVP)
  created_at: "2026-01-15T10:30:00.000Z",
  updated_at: "2026-01-15T10:30:00.000Z",
  synced_at: null,
  sync_status: "novo"
}
```

---

## 6. Modelo: Medicamento

```javascript
const medicamento = {
  uuid: "med-001",
  animal_uuid: "ani-00042",
  propriedade_uuid: "prop-001",
  tipo: "vermifugo",               // 'antibiotico'|'vermifugo'|'anti-inflamatorio'|'suplemento'|'antiparasitario'|'outro'
  produto: "Ivermectina 1%",
  dose: "5ml",
  data_aplicacao: "2026-02-10",
  carencia_dias: 28,
  data_liberacao: "2026-03-10",    // Calculada: data_aplicacao + carencia_dias
  responsavel: "Maria",
  observacao: "Aplicação subcutânea",
  valor: 25.00,                    // R$ (opcional, pós-MVP)
  created_at: "2026-02-10T09:00:00.000Z",
  updated_at: "2026-02-10T09:00:00.000Z",
  synced_at: null,
  sync_status: "novo"
}
```

---

## 7. Modelo: Ocorrencia

```javascript
const ocorrencia = {
  uuid: "oco-001",
  animal_uuid: "ani-00042",
  propriedade_uuid: "prop-001",
  data: "2026-03-05",
  sintomas: "Claudicação membro posterior direito",
  tratamento: "Anti-inflamatório + repouso",
  resultado: "recuperado",         // 'aguardando'|'em_tratamento'|'recuperado'|'obito'
  veterinario: "Dr. Carlos",
  created_at: "2026-03-05T14:00:00.000Z",
  updated_at: "2026-03-05T14:00:00.000Z",
  synced_at: null,
  sync_status: "novo"
}
```

---

## 8. Modelo: Pesagem

```javascript
const pesagem = {
  uuid: "pes-001",
  animal_uuid: "ani-00042",
  propriedade_uuid: "prop-001",
  data: "2026-04-01",
  peso: 320.0,                     // kg
  ecc: 3,                          // 1-5 (opcional)
  observacao: "Boa condição",
  created_at: "2026-04-01T07:00:00.000Z",
  updated_at: "2026-04-01T07:00:00.000Z",
  synced_at: null,
  sync_status: "novo"
}
```

---

## 9. Modelo: Reproducao

```javascript
const reproducao = {
  uuid: "rep-001",
  animal_uuid: "ani-00042",        // Fêmea
  propriedade_uuid: "prop-001",
  tipo_cobertura: "inseminacao_artificial", // 'monta_natural'|'inseminacao_artificial'
  data_cobertura: "2025-08-10",
  touro_uuid: "ani-00003",         // UUID do macho (opcional)
  prenhez_confirmada: 1,           // 0 = não, 1 = sim
  data_confirmacao: "2025-10-15",  // Data do exame
  data_previa_parto: "2026-05-22", // Calculada: cobertura + 285d
  data_secagem: "2026-03-24",      // Calculada: parto - 60d
  data_parto: null,                // Preenchida quando parto ocorre
  observacao: "IA com sêmen sexado",
  created_at: "2025-08-10T10:00:00.000Z",
  updated_at: "2025-10-15T14:00:00.000Z",
  synced_at: null,
  sync_status: "modificado"
}
```

---

## 10. Constantes do Sistema

```javascript
export const ESPECIES = ['bovino', 'ovino', 'suino']
export const SEXOS = ['macho', 'femea']
export const STATUS_ANIMAL = ['ativo', 'vendido', 'morto', 'consumido']
export const CARGOS = ['dono', 'peao']
export const SYNC_STATUS = ['novo', 'modificado', 'sincronizado']
export const TIPOS_MEDICAMENTO = ['antibiotico', 'vermifugo', 'anti-inflamatorio', 'suplemento', 'antiparasitario', 'outro']
export const RESULTADOS_OCORRENCIA = ['aguardando', 'em_tratamento', 'recuperado', 'obito']
export const TIPOS_COBERTURA = ['monta_natural', 'inseminacao_artificial']
```

---

## 11. Helper: Gerar UUID

```javascript
// Usar crypto.randomUUID() ou biblioteca
function gerarUUID() {
  return crypto.randomUUID()
}
```
