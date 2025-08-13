export const useConfigCartoes = () => {
  // Adquirentes
  const adquirentes = [
    'PagSeguro',
    'Rede',
    'Stone',
    'Única',
    'Getnet',
    'Caixa',
    'Cielo',
    'Safra',
    'Bin'
  ]

  // Bandeiras
  const bandeiras = [
    'Visa',
    'Mastercard',
    'American Express',
    'Amex',
    'Hipercard',
    'Banescard',
    'Elo',
    'Cabal'
  ]

  // Modalidades
  const modalidades = [
    'Débito',
    'Crédito',
    'Parcelado'
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