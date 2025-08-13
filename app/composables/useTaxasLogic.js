export const useTaxasLogic = () => {
  // Mapeamento de campos
  const columnFieldMap = {
    empresa: 'empresa',
    adquirente: 'adquirente', 
    bandeira: 'bandeira',
    modalidade: 'modalidade',
    parcelas: 'parcelas',
    taxa: 'percentualTaxa',
    dataCorte: 'dataCorte'
  }

  // Títulos das colunas
  const columnTitles = {
    empresa: 'Nome Empresa',
    adquirente: 'Adquirente',
    bandeira: 'Bandeira', 
    modalidade: 'Modalidade',
    parcelas: 'Parcelas',
    taxa: 'Taxa (%)',
    dataCorte: 'Data de Corte'
  }

  // Larguras base das colunas
  const baseColumnWidths = {
    empresa: 200,
    adquirente: 150,
    bandeira: 130,
    modalidade: 160,
    parcelas: 100,
    taxa: 120,
    dataCorte: 150,
    acoes: 80
  }

  const updateTaxa = (taxas, index, column, value, salvarCallback) => {
    const field = columnFieldMap[column] || column
    if (['parcelas', 'percentualTaxa', 'dataCorte'].includes(field)) {
      taxas.value[index][field] = parseFloat(value) || 0
    } else {
      taxas.value[index][field] = value
    }
    salvarCallback()
  }

  const adicionarTaxa = (taxas, empresaSelecionada, salvarCallback) => {
    const novaTaxa = {
      id: Date.now(),
      empresa: empresaSelecionada || '',
      adquirente: '',
      bandeira: '',
      modalidade: '',
      parcelas: 1,
      percentualTaxa: 0,
      dataCorte: 1
    }
    taxas.value.push(novaTaxa)
    salvarCallback()
  }

  const removerTaxa = (taxas, index, salvarCallback) => {
    taxas.value.splice(index, 1)
    salvarCallback()
  }

  const calcularTaxaMedia = (taxas) => {
    if (taxas.length === 0) return 0
    const soma = taxas.reduce((total, taxa) => total + (taxa.percentualTaxa || 0), 0)
    return soma / taxas.length
  }

  return {
    columnFieldMap,
    columnTitles,
    baseColumnWidths,
    updateTaxa,
    adicionarTaxa,
    removerTaxa,
    calcularTaxaMedia
  }
}