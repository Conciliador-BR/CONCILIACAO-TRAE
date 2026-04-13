/**
 * Utilitários para cálculo de feriados e dias úteis
 */
export const useHolidayUtils = () => {
  
  // Lista de feriados nacionais brasileiros (formato: MM-DD)
  const feriadosNacionais = [
    '01-01', // Confraternização Universal
    '04-21', // Tiradentes
    '05-01', // Dia do Trabalhador
    '06-19', // Corpus Christi
    '09-07', // Independência do Brasil
    '10-12', // Nossa Senhora Aparecida
    '11-02', // Finados
    '11-15', // Proclamação da República
    '12-25', // Natal
    // Feriados móveis precisariam ser calculados separadamente (Carnaval, Páscoa, etc.)
  ]
  
  /**
   * Função para verificar se é feriado
   */
  const ehFeriado = (data) => {
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    const dia = String(data.getDate()).padStart(2, '0')
    const dataFormatada = `${mes}-${dia}`
    
    return feriadosNacionais.includes(dataFormatada)
  }

  /**
   * Função para ajustar para o próximo dia útil (considerando fins de semana e feriados)
   */
  const ajustarParaProximoDiaUtil = (data) => {
    const dataAjustada = new Date(data)
    while (dataAjustada.getDay() === 0 || dataAjustada.getDay() === 6 || ehFeriado(dataAjustada)) {
      dataAjustada.setDate(dataAjustada.getDate() + 1)
    }
    return dataAjustada
  }

  /**
   * Adicionar dias úteis a uma data (FUNÇÃO ANTIGA - mantida para compatibilidade)
   */
  const adicionarDiasUteis = (dataInicial, diasUteis) => {
    const data = new Date(dataInicial)
    let diasAdicionados = 0
    
    while (diasAdicionados < diasUteis) {
      data.setDate(data.getDate() + 1)
      
      // Verificar se é dia útil (segunda a sexta: 1-5)
      const diaSemana = data.getDay()
      if (diaSemana >= 1 && diaSemana <= 5 && !ehFeriado(data)) {
        diasAdicionados++
      }
    }
    
    return data
  }

  /**
   * Adicionar dias corridos e ajustar para próximo dia útil se necessário
   * Esta é a lógica CORRETA conforme as adquirentes:
   * - Adiciona X dias corridos (incluindo fins de semana)
   * - Se a data final cair em feriado/fim de semana, ajusta para próximo dia útil
   */
  const adicionarDiasCorridos = (dataInicial, diasCorridos) => {
    const data = new Date(dataInicial)
    
    // Adicionar dias corridos (incluindo fins de semana)
    data.setDate(data.getDate() + diasCorridos)
    
    // Se cair em feriado ou fim de semana, ajustar para próximo dia útil
    return ajustarParaProximoDiaUtil(data)
  }

  return {
    feriadosNacionais,
    ehFeriado,
    ajustarParaProximoDiaUtil,
    adicionarDiasUteis,
    adicionarDiasCorridos
  }
}