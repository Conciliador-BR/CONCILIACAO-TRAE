const operadorasConhecidas = ['unica', 'stone', 'cielo', 'rede', 'getnet', 'safra', 'sipag', 'azulzinha']
const operadoraValida = (operadora) => /^[A-Za-z0-9À-ÿ _-]+$/.test(String(operadora || '').trim())
const normalizarOperadora = (valor) => String(valor || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]/g, '')
const mapaOperadoras = {
  pagbank: 'pagseguro',
  pagseguro: 'pagseguro',
  safra: 'safra',
  safrapay: 'safra'
}
const operadorasPermitidas = new Set(operadorasConhecidas)

const operadorasEmpresa = ['AZULZINHA', 'REDE']
const operadorasBrutas = operadorasEmpresa.length > 0
  ? [...operadorasEmpresa, 'azulzinha']
  : ['azulzinha']
const operadorasParaBuscar = [...new Set(operadorasBrutas)]
  .map(op => mapaOperadoras[normalizarOperadora(op)] || normalizarOperadora(op))
  .filter(op => op && operadoraValida(op) && operadorasPermitidas.has(op))

console.log(operadorasParaBuscar)
