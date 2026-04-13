import { ref } from 'vue'

/**
 * Utilitários para manipulação de datas
 */
export const useDateUtils = () => {
  
  /**
   * Função para criar data de forma segura
   */
  const criarDataSegura = (dataString) => {
    if (!dataString) return null
    
    // Se já é um objeto Date válido
    if (dataString instanceof Date && !isNaN(dataString.getTime())) {
      return new Date(dataString.getFullYear(), dataString.getMonth(), dataString.getDate())
    }
    
    const str = String(dataString).trim()
    
    // Formato YYYY-MM-DD (mais comum vindo do banco)
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [ano, mes, dia] = str.split('-').map(Number)
      return new Date(ano, mes - 1, dia) // mes - 1 porque Date usa 0-11
    }
    
    // Formato DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
      const [dia, mes, ano] = str.split('/').map(Number)
      return new Date(ano, mes - 1, dia)
    }
    
    return null
  }

  /**
   * Helpers de mês (EDATE)
   */
  const isFimDeMes = (data) => {
    const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0).getDate()
    return data.getDate() === ultimoDia
  }

  const adicionarMeses = (data, meses) => {
    const ano = data.getFullYear()
    const mes = data.getMonth()
    const dia = data.getDate()

    const destinoMes = mes + meses
    const destinoAno = ano + Math.floor(destinoMes / 12)
    const mesNormalizado = ((destinoMes % 12) + 12) % 12

    const ultimoDiaDestino = new Date(destinoAno, mesNormalizado + 1, 0).getDate()
    const diaDestino = isFimDeMes(data) ? ultimoDiaDestino : Math.min(dia, ultimoDiaDestino)

    return new Date(destinoAno, mesNormalizado, diaDestino)
  }

  /**
   * Formatar data para o banco (YYYY-MM-DD)
   */
  const formatarDataParaBanco = (data) => {
    if (!data) return null
    
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    const dia = String(data.getDate()).padStart(2, '0')
    
    return `${ano}-${mes}-${dia}`
  }

  return {
    criarDataSegura,
    isFimDeMes,
    adicionarMeses,
    formatarDataParaBanco
  }
}