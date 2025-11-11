export const useTableNameBuilder = () => {
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
    const operadoraNormalizada = normalize(operadora)
    return `recebimento_${empresaNormalizada}_${operadoraNormalizada}`
  }

  return {
    construirNomeTabela
  }
}