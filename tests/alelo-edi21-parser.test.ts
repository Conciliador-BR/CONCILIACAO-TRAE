import assert from 'node:assert/strict'
import { AleloEdi21Parser } from '../server/utils/aleloEdi21Parser'
import {
  buildAleloRecebimentosFromParsedFiles,
  buildAleloVendasFromParsedFiles
} from '../server/utils/aleloLayoutTxt'

const fixedLine = (
  recordType: string,
  fields: Array<[start: number, value: string]> = []
) => {
  const chars = Array(500).fill(' ')
  const write = (start: number, value: string) => {
    const offset = start - 1
    String(value).split('').forEach((char, index) => {
      chars[offset + index] = char
    })
  }

  write(1, recordType)
  fields.forEach(([start, value]) => write(start, value))
  return chars.join('')
}

const header = (fileType: '01' | '02' | '04' | '05', brand: 'ALELO' | 'NAIP') => fixedLine('00', [
  [3, '000001008237725'],
  [18, '20260924'],
  [26, '20260923'],
  [34, '20260923'],
  [42, 'D'],
  [43, '0000923'],
  [50, brand.padEnd(5, ' ')],
  [55, fileType],
  [57, 'edi@empresa.com'.padEnd(50, ' ')],
  [107, '002.1'],
  [112, '00258069000110']
])

const movement = fixedLine('01', [
  [3, 'CHAVE-VENDA-000000000000000001'],
  [33, '000001008237725'],
  [48, '000001008237726'],
  [63, '00258069'],
  [71, '01 '],
  [95, '20260923'],
  [103, '20260923'],
  [111, '20260923'],
  [119, '142530'],
  [125, '20261020'],
  [133, '+'],
  [134, '0000106450000'],
  [147, '+'],
  [148, '0000103270000'],
  [161, '-'],
  [162, '0000003180000'],
  [175, '0000002987300'],
  [188, '0000000000000'],
  [201, '0046'],
  [205, '01'],
  [207, '01'],
  [209, '007'],
  [212, '005'],
  [215, '637514******7016000'],
  [234, 'TERM0001'],
  [242, 'AUTH1234'],
  [250, '500003'],
  [256, '0001'],
  [260, '01234'],
  [265, '00000000123456'],
  [279, '000000000000000123'],
  [297, '101']
])

const payment = ({
  key,
  status,
  amount,
  paymentType = 'R',
  operationNumber = '',
  anticipationNetValue = '',
  anticipationDiscountValue = '',
  unifiedPaymentId = '000000000001'
}: {
  key: string
  status: '001' | '003' | '004' | '005'
  amount: string
  paymentType?: 'R' | 'A'
  operationNumber?: string
  anticipationNetValue?: string
  anticipationDiscountValue?: string
  unifiedPaymentId?: string
}) => fixedLine('02', [
  [3, '000001008237726'],
  [18, '00258069'],
  [26, '000001008237725'],
  [41, key.padEnd(30, ' ')],
  [71, paymentType],
  [72, status],
  [81, '20260924'],
  [89, '20260924'],
  [97, '20260924'],
  [105, '+'],
  [106, amount.padStart(18, '0')],
  [124, operationNumber.padStart(9, '0')],
  [133, '+'],
  [134, anticipationNetValue.padStart(18, '0')],
  [152, anticipationDiscountValue.padStart(18, '0')],
  [170, '0001'],
  [174, '01234'],
  [179, '00000000123456'],
  [209, '20260924'],
  [217, unifiedPaymentId]
])

const multibenefitPayment = ({
  status,
  amount
}: {
  status: '003' | '004'
  amount: string
}) => fixedLine('03', [
  [3, 'CHAVE-DIVIDIDA-000000000000001'],
  [33, 'IP-0000000000000000000000000001'],
  [63, '000001008237726'],
  [78, '00258069'],
  [86, 'EC'],
  [88, status],
  [96, '20260924'],
  [104, '+'],
  [105, amount.padStart(18, '0')],
  [123, 'UR-0001'.padEnd(50, ' ')],
  [173, 'CONTRATO-0001'.padEnd(50, ' ')],
  [223, '0001'],
  [227, '01234'],
  [232, '00000000123456'],
  [246, '000000000001']
])

const parser = new AleloEdi21Parser()
const parsedSales = parser.parse([
  header('01', 'ALELO'),
  movement,
  fixedLine('99', [[3, '00000000001'], [14, '000001']])
].join('\r\n'))

assert.equal(parsedSales.header?.layoutVersion, '002.1')
assert.equal(parsedSales.header?.fileType, '01')
assert.equal(parsedSales.movements.length, 1)
assert.equal(parsedSales.movements[0]?.nsuDoc, '500003')
assert.equal(parsedSales.movements[0]?.grossValue, 106.45)
assert.equal(parsedSales.movements[0]?.netValue, 103.27)
assert.equal(parsedSales.movements[0]?.administrationFeeValue, -3.18)

const sales = await buildAleloVendasFromParsedFiles({
  files: [{
    fileName: '20260924_0313_ALELO_01_1008237725_00258069000110_0021_PRD_0000923.txt',
    content: [header('01', 'ALELO'), movement].join('\n')
  }],
  empresa: 'EMPRESA TESTE',
  ec: '1008237725'
})

assert.equal(sales.totalRegistros, 1)
assert.equal(sales.registros[0]?.adquirente, 'ALELO')
assert.equal(sales.registros[0]?.modalidade, 'ALIMENTACAO')
assert.equal(sales.registros[0]?.nsu, '500003')
assert.equal(sales.registros[0]?.data_venda, '2026-09-23')
assert.equal(sales.registros[0]?.previsao_pgto, '2026-10-20')
assert.equal(sales.registros[0]?.valor_bruto, 106.45)
assert.equal(sales.registros[0]?.despesa_mdr, 3.18)
assert.equal(sales.registros[0]?.valor_liquido, 103.27)

const receipts = await buildAleloRecebimentosFromParsedFiles({
  files: [
    {
      fileName: '20260924_0313_ALELO_02_1008237725_00258069000110_0021_PRD_0000924.txt',
      content: [
        header('02', 'ALELO'),
        payment({ key: 'CHAVE-AGENDADA-000000000000001', status: '001', amount: '106450000' }),
        payment({ key: 'CHAVE-EFETIVA-0000000000000001', status: '003', amount: '103270000' }),
        payment({
          key: 'CHAVE-ARV-000000000000000000001',
          status: '003',
          amount: '100000000',
          paymentType: 'A',
          operationNumber: '123',
          anticipationNetValue: '90000000',
          anticipationDiscountValue: '10000000'
        })
      ].join('\n')
    },
    {
      fileName: '20260924_0407_NAIP_05_1008237725_00258069000110_0021_PRD_0000925.txt',
      content: [
        header('05', 'NAIP'),
        payment({ key: 'CHAVE-DIVIDIDA-000000000000001', status: '005', amount: '75000000' }),
        multibenefitPayment({ status: '003', amount: '50000000' }),
        multibenefitPayment({ status: '004', amount: '25000000' })
      ].join('\n')
    }
  ],
  empresa: 'EMPRESA TESTE',
  ec: '1008237725'
})

assert.equal(receipts.totalRegistros, 3)
assert.equal(receipts.registros[0]?.nsu, 'CHAVE-EFETIVA-0000000000000001')
assert.equal(receipts.registros[0]?.data_venda, null)
assert.equal(receipts.registros[0]?.data_recebimento, '2026-09-24')
assert.equal(receipts.registros[0]?.valor_bruto, 103.27)
assert.equal(receipts.registros[0]?.valor_liquido, 103.27)
assert.equal(receipts.registros[1]?.modalidade, 'ANTECIPACAO')
assert.equal(receipts.registros[1]?.valor_bruto, 100)
assert.equal(receipts.registros[1]?.despesa, 10)
assert.equal(receipts.registros[1]?.valor_liquido, 90)
assert.equal(receipts.registros[2]?.adquirente, 'NAIP')
assert.equal(receipts.registros[2]?.modalidade, 'MULTIBENEFICIOS')
assert.equal(receipts.registros[2]?.nsu, 'CHAVE-DIVIDIDA-000000000000001')
assert.equal(receipts.registros[2]?.valor_bruto, 50)
assert.equal(receipts.registros[2]?.valor_liquido, 50)

assert.throws(
  () => parser.parse('00INVALIDO'),
  /500 posicoes/
)

console.log('Alelo EDI 2.1 parser and classification test passed.')
