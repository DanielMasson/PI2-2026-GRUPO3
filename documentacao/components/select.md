# Componente Select

> **Status:** A fazer | **Prioridade:** Alta (Sprint 5)
>
> Select/Dropdown reutilizável para seleção de opções em formulários.

---

## 1. Uso (planejado)

```jsx
<Select
  id="especie"
  name="especie"
  label="Espécie"
  value={fields.especie}
  onChange={handleChange}
  error={erros.especie}
  options={[
    { valor: 'bovino', label: 'Bovino' },
    { valor: 'ovino', label: 'Ovino' },
    { valor: 'suino', label: 'Suíno' },
  ]}
  placeholder="Selecione a espécie"
/>
```

---

## 2. Props (planejadas)

| Prop          | Tipo      | Obrigatório | Descrição                                |
|---------------|-----------|:-----------:|------------------------------------------|
| `id`          | string    | Sim         | ID do select                             |
| `name`        | string    | Sim         | Nome do campo                            |
| `label`       | string    | Não         | Label acima do select                    |
| `value`       | string    | Sim         | Valor selecionado                        |
| `onChange`     | function  | Sim         | Handler de mudança                       |
| `options`     | array     | Sim         | Lista de `{ valor, label }`              |
| `placeholder` | string    | Não         | Texto da opção padrão                    |
| `error`       | string    | Não         | Mensagem de erro                         |
| `required`    | boolean   | Não         | Campo obrigatório                        |

---

## 3. Comportamento

- Visual idêntico ao Input (borda, raio, padding)
- Seta indicadora de dropdown
- Focus: borda verde
- Erro: borda vermelha + mensagem
- Touch target ≥ 48px

---

## 4. Uso no Projeto

| Local                        | Opções                           |
|------------------------------|----------------------------------|
| Cadastro de Animal           | Espécie (Bovino/Ovino/Suíno)    |
| Cadastro de Animal           | Sexo (Macho/Fêmea)              |
| Cadastro de Animal           | Mãe (busca de fêmeas)           |
| Cadastro de Animal           | Pai (busca de machos)           |
| HealthModule                 | Animal (lista da propriedade)   |
| HealthModule                 | Tipo de medicamento             |
| HealthModule                 | Área de localização             |
| Reprodução                   | Tipo de cobertura               |
