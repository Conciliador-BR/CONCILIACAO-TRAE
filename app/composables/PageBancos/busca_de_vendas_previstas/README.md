# Composable de Depósitos do Extrato Detalhado

## Descrição

O `useDepositosExtrato` é um composable que conecta a coluna "depósito" do container de movimentações com os dados do extrato detalhado. Ele busca automaticamente os depósitos correspondentes por data e adquirente.

## Funcionalidades

### 1. Busca de Depósitos por Data e Adquirente

```javascript
const { buscarDepositosPorDataAdquirente } = useDepositosExtrato()

// Buscar depósitos para uma data e adquirente específicos
const totalDepositos = buscarDepositosPorDataAdquirente('03/09/2025', 'UNICA')
// Retorna: 500 (se houver 5 depósitos de 100 reais cada)
```

### 2. Lógica Especial para UNICA

Quando o adquirente for "UNICA", o sistema busca por duas palavras-chave no extrato:
- "UNICA"
- "TRIPAG"

```javascript
// Para adquirente UNICA, busca por ambas as palavras
const depositosUnica = buscarDepositosPorDataAdquirente('03/09/2025', 'UNICA')
// Busca transações que contenham "UNICA" OU "TRIPAG" na descrição
```

### 3. Integração Automática

O composable principal `useBuscaVendasPrevistas` já integra automaticamente os depósitos:

```javascript
const {
  movimentacoes,
  temDadosExtrato,
  totalDepositosPeriodo,
  buscarDepositosPorDataAdquirente
} = useBancosVendas()

// Os dados de movimentacoes já incluem a coluna 'deposito' calculada
movimentacoes.value.forEach(mov => {
  console.log(`Data: ${mov.data}`)
  console.log(`Adquirente: ${mov.adquirente}`)
  console.log(`Previsto: ${mov.previsto}`)
  console.log(`Depósito: ${mov.deposito}`) // ← Calculado automaticamente
  console.log(`Saldo: ${mov.saldoConciliacao}`) // ← Inclui depósitos
})
```

## Exemplo Prático

### Cenário
- Data: 03/09/2025
- Adquirente: UNICA
- Extrato detalhado tem 5 transações de R$ 100,00 cada com descrição "TRIPAG"

### Resultado
```javascript
const depositos = buscarDepositosPorDataAdquirente('03/09/2025', 'UNICA')
console.log(depositos) // 500.00

// Na tabela de movimentações aparecerá:
// Data: 03/09/2025 | Adquirente: UNICA | Depósito: R$ 500,00
```

## Adquirentes Suportados

O sistema reconhece automaticamente os seguintes adquirentes:
- UNICA (busca por "UNICA" ou "TRIPAG")
- STONE
- CIELO
- REDE
- GETNET
- SAFRAPAY
- MERCADOPAGO
- PAGSEGURO

## Estados Disponíveis

```javascript
const {
  temDadosExtrato,        // boolean - se há dados carregados
  totalDepositosPeriodo,  // number - total de depósitos no período
  transacoes             // array - transações do extrato
} = useDepositosExtrato()
```

## Métodos Disponíveis

```javascript
const {
  buscarDepositosPorDataAdquirente,  // (data, adquirente) => number
  buscarDepositosAgrupadosPorData,   // (dataInicial, dataFinal) => object
  carregarDadosExtrato              // (filtros) => Promise
} = useDepositosExtrato()
```