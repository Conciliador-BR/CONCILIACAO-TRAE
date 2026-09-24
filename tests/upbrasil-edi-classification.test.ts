import assert from 'node:assert/strict'
import {
  buildUpbrasilRecebimentosFromParsedFiles,
  buildUpbrasilVendasFromParsedFiles
} from '../server/utils/upbrasilLayoutTxt'

const receiptFile = [
  'A0001.6b20260921044850001532UP BRASIL                     0001000001000001',
  'L020260920RE000002',
  'CV00025806900011000000019505520260808191207120260920V2000000002000000000001000000000190000308345******8756000000000000000000000000000000000000000000000000000100924000000260614000000207827000003',
  'L900000100000000000200000004',
  'A9000005000005'
].join('\n')

const salesFile = [
  'A0001.6b20260920045417001531UP BRASIL                     0001000001000001',
  'L020260919RE000002',
  'CV00025806900011000028139218620260919132442020261004V3000000061940000000022300000005971000308345******6852000000000000000000000000000000000000000000000000000100924000000260614000000442433000003',
  'L900000100000000006194000004',
  'A9000005000005'
].join('\n')

const input = {
  files: [
    {
      fileName: 'UPBRASIL_RECEBIMENTOS_20260920.TXT',
      content: receiptFile
    },
    {
      fileName: 'UPBRASIL_VENDAS_20260919.TXT',
      content: salesFile
    }
  ],
  empresa: 'EMPRESA TESTE',
  ec: '123'
}

const vendas = await buildUpbrasilVendasFromParsedFiles(input)
const recebimentos = await buildUpbrasilRecebimentosFromParsedFiles(input)

assert.equal(vendas.totalRegistros, 1)
assert.equal(vendas.registros[0]?.nsu, '000281392186')
assert.equal(vendas.registros[0]?.data_venda, '2026-09-19')
assert.equal(vendas.registros[0]?.previsao_pgto, '2026-10-04')
assert.equal(vendas.registros[0]?.valor_bruto, 61.94)
assert.equal(vendas.registros[0]?.valor_liquido, 59.71)

assert.equal(recebimentos.totalRegistros, 1)
assert.equal(recebimentos.registros[0]?.nsu, '000000195055')
assert.equal(recebimentos.registros[0]?.data_venda, '2026-08-08')
assert.equal(recebimentos.registros[0]?.data_recebimento, '2026-09-20')
assert.equal(recebimentos.registros[0]?.valor_bruto, 2)
assert.equal(recebimentos.registros[0]?.valor_liquido, 1.9)

console.log('Up Brasil EDI classification test passed.')
