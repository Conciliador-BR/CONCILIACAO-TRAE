export const useVendasMapping = () => {
  // Mapeamento de colunas do VendasContainer para campos da tabela vendas_operadoras_unica
  const columnMapping = {
    dataVenda: 'data_venda',
    modalidade: 'modalidade',
    nsu: 'nsu',
    vendaBruta: 'valor_bruto',
    vendaLiquida: 'valor_liquido',
    taxaMdr: 'taxa_mdr',
    despesaMdr: 'despesa_mdr',
    numeroParcelas: 'numero_parcelas',
    bandeira: 'bandeira',
    valorAntecipado: 'valor_antecipacao',
    despesasAntecipacao: 'despesa_antecipacao',
    valorLiquidoAntec: 'valor_liquido_antecipacao',
    empresa: 'empresa',
    matriz: 'matriz',
    adquirente: 'adquirente'
  }

  // Mapeamento reverso (da tabela para o componente)
  const reverseMapping = Object.fromEntries(
    Object.entries(columnMapping).map(([key, value]) => [value, key])
  )

  // Converter dados da tabela para formato do componente
  const mapFromDatabase = (dbRecord) => {
    const mapped = { id: dbRecord.id }
    Object.entries(reverseMapping).forEach(([dbField, componentField]) => {
      let value = dbRecord[dbField] || (typeof dbRecord[dbField] === 'number' ? 0 : '')
      
      // Converter data do formato do banco (YYYY-MM-DD) para formato brasileiro (DD/MM/YYYY)
      if (componentField === 'dataVenda' && value && typeof value === 'string') {
        // Se a data está no formato YYYY-MM-DD, converter para DD/MM/YYYY
        if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [ano, mes, dia] = value.split('-')
          value = `${dia}/${mes}/${ano}`
        }
      }
      
      mapped[componentField] = value
    })
    return mapped
  }

  // Converter dados do componente para formato da tabela
  const mapToDatabase = (componentRecord) => {
    const mapped = {}
    Object.entries(columnMapping).forEach(([componentField, dbField]) => {
      if (componentRecord[componentField] !== undefined) {
        let value = componentRecord[componentField]
        
        // Converter data do formato brasileiro (DD/MM/YYYY) para formato do banco (YYYY-MM-DD)
        if (componentField === 'dataVenda' && value && typeof value === 'string') {
          // Se a data está no formato DD/MM/YYYY, converter para YYYY-MM-DD
          if (value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            const [dia, mes, ano] = value.split('/')
            value = `${ano}-${mes}-${dia}`
          }
        }
        
        mapped[dbField] = value
      }
    })
    return mapped
  }

  return {
    columnMapping,
    reverseMapping,
    mapFromDatabase,
    mapToDatabase
  }
}