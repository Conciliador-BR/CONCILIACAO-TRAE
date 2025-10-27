export const useFormatacaoDados = () => {
  // Função para normalizar data para formato DD/MM/YYYY
  const formatarData = (data) => {
    if (!data) return null
    
    try {
      // Se já está no formato DD/MM/YYYY, retornar como está
      if (typeof data === 'string' && data.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return data
      }
      
      // Se está no formato YYYY-MM-DD, converter para DD/MM/YYYY
      if (typeof data === 'string' && data.match(/^\d{4}-\d{2}-\d{2}/)) {
        const [ano, mes, dia] = data.split('-')
        return `${dia}/${mes}/${ano}`
      }
      
      // Se é um objeto Date, converter
      const dateObj = new Date(data)
      if (!isNaN(dateObj.getTime())) {
        const dia = String(dateObj.getDate()).padStart(2, '0')
        const mes = String(dateObj.getMonth() + 1).padStart(2, '0')
        const ano = dateObj.getFullYear()
        return `${dia}/${mes}/${ano}`
      }
      
      return null
    } catch (error) {
      return null
    }
  }

  // Função para normalizar nome de empresa
  const normalizarNomeEmpresa = (nome) => {
    return nome
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/-/g, '_')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  // Função para normalizar nome de operadora
  const normalizarNomeOperadora = (operadora) => {
    return operadora
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/-/g, '_')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  return {
    formatarData,
    normalizarNomeEmpresa,
    normalizarNomeOperadora
  }
}