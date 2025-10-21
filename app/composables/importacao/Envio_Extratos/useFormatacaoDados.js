export const useFormatacaoDados = () => {
  
  // Função para validar e formatar data
  const formatarData = (data) => {
    if (!data) return null
    
    try {
      // Se já está no formato YYYY-MM-DD
      if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return data
      }
      
      // Se está no formato DD/MM/YYYY
      if (typeof data === 'string' && data.includes('/')) {
        const [dia, mes, ano] = data.split('/')
        if (dia && mes && ano) {
          return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
        }
      }
      
      // Se é um objeto Date
      if (data instanceof Date) {
        return data.toISOString().split('T')[0]
      }
      
      // Tentar converter string para Date
      const dataObj = new Date(data)
      if (!isNaN(dataObj.getTime())) {
        return dataObj.toISOString().split('T')[0]
      }
      
      console.warn('⚠️ Formato de data não reconhecido:', data)
      return null
    } catch (err) {
      console.error('❌ Erro ao formatar data:', err, data)
      return null
    }
  }

  // Função para processar valores monetários
  const formatarValor = (valor) => {
    if (valor === undefined || valor === null || valor === '') {
      return 0
    }

    try {
      let valorString = String(valor).trim()
      
      // Se o valor contém vírgula, assumir que é separador decimal brasileiro
      if (valorString.includes(',')) {
        // Remover pontos (separadores de milhares) e substituir vírgula por ponto
        valorString = valorString.replace(/\./g, '').replace(',', '.')
      }
      
      // Remover qualquer caractere que não seja dígito, ponto ou sinal negativo
      valorString = valorString.replace(/[^\d.-]/g, '')
      
      const valorProcessado = parseFloat(valorString) || 0
      
      // Validar se o valor é um número válido
      if (isNaN(valorProcessado)) {
        console.warn('⚠️ Valor inválido após processamento:', valor)
        return 0
      }

      return valorProcessado
    } catch (err) {
      console.error('❌ Erro ao formatar valor:', err, valor)
      return 0
    }
  }

  // Função para normalizar strings (remover acentos, caracteres especiais)
  const normalizarString = (str) => {
    if (!str) return ''
    
    return str
      .replace(/\s+/g, '_')
      .replace(/-/g, '_')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_]/g, '') // Remove caracteres especiais
      .replace(/_+/g, '_') // Remove underscores duplicados
      .replace(/^_|_$/g, '') // Remove underscores no início e fim
  }

  // Função para truncar texto respeitando limites
  const truncarTexto = (texto, limite) => {
    if (!texto) return ''
    return String(texto).substring(0, limite)
  }

  return {
    formatarData,
    formatarValor,
    normalizarString,
    truncarTexto
  }
}