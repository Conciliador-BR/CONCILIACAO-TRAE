export const useTableNameBuilder = () => {
  const construirNomeTabela = (empresa, operadora) => {
    const empresaStr = typeof empresa === 'string' ? empresa : String(empresa)
    const operadoraStr = typeof operadora === 'string' ? operadora : String(operadora)

    const empresaNormalizada = empresaStr.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')

    const operadoraNormalizada = operadoraStr.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')

    return `vendas_${empresaNormalizada}_${operadoraNormalizada}`
  }

  return {
    construirNomeTabela
  }
}