export const useAuditoriaStatus = () => {
  const getAuditoriaLabel = (venda) => {
    const status = venda.auditoria
    if (status === 'Conciliado') return 'Conciliado'
    
    const previsao = venda.previsaoPgto
    if (!previsao || previsao === '-') return status || 'Não conciliado'
    
    try {
      // Parse DD/MM/YYYY
      const parts = previsao.split('/')
      if (parts.length !== 3) return status || 'Não conciliado'
      
      const dia = parseInt(parts[0], 10)
      const mes = parseInt(parts[1], 10) - 1
      const ano = parseInt(parts[2], 10)
      
      const dataPrevista = new Date(ano, mes, dia)
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      
      // Comparar datas (ignorando hora)
      if (dataPrevista < hoje) return 'Atrasado'
      return 'A receber'
    } catch (e) {
      return status || 'Não conciliado'
    }
  }

  const getRowClassByStatus = (venda) => {
    const status = getAuditoriaLabel(venda)
    if (status === 'Conciliado') return 'bg-green-50 hover:bg-green-100 text-green-900'
    if (status === 'Atrasado') return 'bg-red-50 hover:bg-red-100 text-red-900'
    // 'A receber' ou outros: padrão (preto/cinza) - mas vamos deixar transparente para que o striped/hover padrão funcione, ou definir cor neutra
    // O usuário disse: "se tiver A receber, deixe a linha preta mesmo"
    // Vamos retornar classe vazia ou padrão
    return ''
  }

  return {
    getAuditoriaLabel,
    getRowClassByStatus
  }
}
