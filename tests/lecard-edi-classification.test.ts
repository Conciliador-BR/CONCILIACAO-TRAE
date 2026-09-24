import assert from 'node:assert/strict'
import {
  buildLecardRecebimentosFromParsedFiles,
  buildLecardVendasFromParsedFiles
} from '../server/utils/lecardLayoutTxt'

type Field = [start: number, value: string]

const buildLine = (length: number, fields: Field[]) => {
  const chars = Array.from({ length }, () => ' ')

  for (const [start, value] of fields) {
    for (let index = 0; index < value.length; index += 1) {
      chars[start + index] = value[index]
    }
  }

  return chars.join('')
}

const buildTransaction = ({
  nsu,
  saleDate,
  paymentDate
}: {
  nsu: string
  saleDate: string
  paymentDate: string
}) => buildLine(251, [
  [0, 'CV'],
  [2, '000258069000110'],
  [17, nsu.padStart(12, '0')],
  [29, saleDate],
  [37, '120000'],
  [43, '1'],
  [44, paymentDate],
  [52, 'V'],
  [53, '1'],
  [54, '00000010000'],
  [65, '00000000500'],
  [76, '00000000000'],
  [87, '00000009500'],
  [98, '000000******0000000'],
  [197, '000000123456'],
  [209, '076'],
  [212, '115']
])

const fileContent = [
  buildLine(75, [
    [0, 'A0'],
    [2, '001.7d'],
    [8, '20260924'],
    [16, '120000'],
    [28, 'LECARD']
  ]),
  buildLine(20, [[0, 'L020260908']]),
  buildTransaction({
    nsu: '123456',
    saleDate: '20260908',
    paymentDate: '20260923'
  }),
  buildLine(20, [[0, 'L020260923']]),
  buildTransaction({
    nsu: '654321',
    saleDate: '20260923',
    paymentDate: '20261020'
  })
].join('\n')

const input = {
  files: [{
    fileName: 'LECARD_20260923.TXT',
    content: fileContent,
    referenceDate: '20260923'
  }],
  empresa: 'EMPRESA TESTE',
  ec: '123'
}

const vendas = await buildLecardVendasFromParsedFiles(input)
const recebimentos = await buildLecardRecebimentosFromParsedFiles(input)

assert.equal(vendas.totalRegistros, 1)
assert.equal(vendas.registros[0]?.nsu, '000000654321')
assert.equal(vendas.registros[0]?.data_venda, '2026-09-23')
assert.equal(vendas.registros[0]?.previsao_pgto, '2026-10-20')
assert.equal(vendas.registros[0]?.valor_bruto, 100)
assert.equal(vendas.registros[0]?.valor_liquido, 95)

assert.equal(recebimentos.totalRegistros, 1)
assert.equal(recebimentos.registros[0]?.nsu, '000000123456')
assert.equal(recebimentos.registros[0]?.data_venda, '2026-09-08')
assert.equal(recebimentos.registros[0]?.data_recebimento, '2026-09-23')
assert.equal(recebimentos.registros[0]?.valor_bruto, 100)
assert.equal(recebimentos.registros[0]?.valor_liquido, 95)

console.log('LeCard EDI classification test passed.')
