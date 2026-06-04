export const useTableNameBuilder = () => {
  const normalizarOperadoraTabela = (operadora) => {
    const valor = String(operadora || '').trim().toUpperCase()
    if (valor === 'SAFRAPAY' || valor === 'SAFRA PAY') return 'SAFRA'
    return operadora
  }

  const normalize = (str) => {
    return String(str)
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/-/g, '_')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  const construirNomeTabela = (empresa, operadora) => {
    const empresaNormalizada = normalize(empresa)
    const operadoraNormalizada = normalize(normalizarOperadoraTabela(operadora))
    return `recebimento_${empresaNormalizada}_${operadoraNormalizada}`
  }

  return {
    construirNomeTabela
  }
}
