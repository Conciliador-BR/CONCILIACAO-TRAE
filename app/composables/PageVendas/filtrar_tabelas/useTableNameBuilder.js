export const useTableNameBuilder = () => {
  const normalizarOperadoraTabela = (operadora) => {
    const valor = String(operadora || '').trim().toUpperCase()
    if (valor === 'SAFRAPAY' || valor === 'SAFRA PAY') return 'SAFRA'
    return operadora
  }

  const construirNomeTabela = (empresa, operadora) => {
    const empresaStr = typeof empresa === 'string' ? empresa : String(empresa)
    const operadoraCanonica = normalizarOperadoraTabela(operadora)
    const operadoraStr = typeof operadoraCanonica === 'string' ? operadoraCanonica : String(operadoraCanonica)

    const empresaNormalizada = empresaStr.toLowerCase()
      .replace(/\s+/g, '_')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
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
