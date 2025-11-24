export const useConfigCartoes = () => {
  // Função para normalizar strings
  const normalizar = (str) => {
    return str.toString()
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^A-Z0-9\s]/g, '') // Remove caracteres especiais, mantém espaços
  }

  // Adquirentes (normalizados)
  const adquirentes = [
    'PAGSEGURO',
    'REDE',
    'STONE',
    'UNICA',
    'GETNET',
    'CAIXA',
    'CIELO',
    'SAFRA',
    'BIN'
  ]

  // Bandeiras (normalizadas)
  const bandeiras = [
    'VISA',
    'MASTERCARD',
    'AMERICAN EXPRESS',
    'AMEX',
    'HIPERCARD',
    'BANESCARD',
    'ELO',
    'CABAL'
  ]

  // Modalidades (normalizadas)
  const modalidades = [
    'DEBITO',
    'CREDITO',
    'PARCELADO',
    'VOUCHERS'
  ]

  // Funções para obter dados
  const getAdquirentes = () => {
    return adquirentes
  }

  const getBandeiras = () => {
    return bandeiras
  }

  const getModalidades = () => {
    return modalidades
  }

  // Função para obter todas as configurações
  const getConfigCartoes = () => {
    return {
      adquirentes,
      bandeiras,
      modalidades
    }
  }

  return {
    getAdquirentes,
    getBandeiras,
    getModalidades,
    getConfigCartoes
  }
}