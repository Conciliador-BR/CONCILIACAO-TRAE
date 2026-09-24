import assert from 'node:assert/strict'
import {
  normalizeAleloCnpj,
  parseAleloRemoteFileName,
  selectAleloRemoteFiles
} from '../server/utils/aleloRemoteSftp'

const aleloFile = '20260912_0313_ALELO_02_1008237725_00258069000110_0021_PRD_0000923.TXT'
const naipFile = '20260913_0407_NAIP_04_1008237725_00258069000110_0021_PRD_0000924.txt'
const aleloFileWithoutExtension = '20260912_0313_ALELO_02_1008237725_00258069000110_0021_PRD_0000923'
const otherCompanyFile = '20260913_0407_ALELO_04_1008237725_12345678000199_0021_PRD_0000925.txt'

assert.equal(normalizeAleloCnpj('25.806.900/0110'), '00258069000110')
assert.equal(normalizeAleloCnpj('00258069000110'), '00258069000110')
assert.equal(normalizeAleloCnpj(''), '')

assert.deepEqual(parseAleloRemoteFileName(aleloFile), {
  fileName: aleloFile,
  brand: 'ALELO',
  referenceDate: '20260912',
  cnpj: '00258069000110'
})

assert.deepEqual(parseAleloRemoteFileName(naipFile), {
  fileName: naipFile,
  brand: 'NAIP',
  referenceDate: '20260913',
  cnpj: '00258069000110'
})

assert.equal(parseAleloRemoteFileName(aleloFileWithoutExtension)?.cnpj, '00258069000110')
assert.equal(parseAleloRemoteFileName('processados'), null)
assert.equal(parseAleloRemoteFileName('arquivo_invalido.txt'), null)
assert.equal(parseAleloRemoteFileName('20260913_0407_OUTRA_04_1008237725_00258069000110_0021_PRD_0000924.txt'), null)

const selected = selectAleloRemoteFiles([
  aleloFile,
  naipFile,
  otherCompanyFile,
  'processados'
], '258069000110')

assert.equal(selected.length, 2)
assert.deepEqual(selected.map(item => item.brand), ['ALELO', 'NAIP'])
assert.ok(selected.every(item => item.cnpj === '00258069000110'))

console.log('Alelo remote file selection test passed.')
