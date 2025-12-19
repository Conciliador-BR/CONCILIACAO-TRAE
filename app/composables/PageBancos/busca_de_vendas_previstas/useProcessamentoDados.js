import { useFormatacaoDados } from './useFormatacaoDados'

export const useProcessamentoDados = () => {
  const { formatarData } = useFormatacaoDados()

  // Função para processar dados de vendas para movimentações bancárias
  const processarDadosVendas = (estados) => {
    // Usar dados de vendas já carregados
    const dadosVendas = estados.vendas.value || estados.vendasOriginais.value || []
    
    if (dadosVendas.length === 0) {
      estados.movimentacoes.value = []
      return []
    }
    
    // Filtrar apenas vendas que têm previsão de pagamento
    const vendasComPrevisao = dadosVendas.filter(venda => 
      venda.previsaoPgto || venda.previsao_pgto || venda.dataPrevisao
    )
    
    if (vendasComPrevisao.length === 0) {
      estados.movimentacoes.value = []
      return []
    }
    
    // Agrupar por data de previsão e adquirente
    const dadosAgrupados = {}
    
    vendasComPrevisao.forEach((venda, index) => {
      const dataPrevisao = venda.previsaoPgto || venda.previsao_pgto || venda.dataPrevisao
      const dataPrevisaoFormatada = formatarData(dataPrevisao)
      const adquirente = venda.adquirente || venda.bandeira || 'Não informado'
      const chave = `${dataPrevisaoFormatada}_${adquirente}`
      
      if (!dataPrevisaoFormatada) {
        return
      }
      
      if (!dadosAgrupados[chave]) {
        dadosAgrupados[chave] = {
          id: `banco_${index}`,
          empresa: venda.empresa || '',
          banco: 'BANCO PADRÃO', // Valor padrão
          agencia: '0001', // Valor padrão
          conta: '12345-6', // Valor padrão
          data: dataPrevisaoFormatada,
          adquirente: adquirente,
          previsto: 0, // Soma das vendas líquidas
          debitos: 0,
          deposito: 0,
          saldoConciliacao: 0,
          status: 'Pendente'
        }
      }
      
      // Somar valor líquido para o previsto
      const valorLiquido = parseFloat(venda.vendaLiquida || venda.valor_liquido || 0)
      dadosAgrupados[chave].previsto += valorLiquido
    })
    
    // Converter objeto agrupado em array
    const movimentacoesProcessadas = Object.values(dadosAgrupados)
    
    // Calcular saldo de conciliação e status conforme novas regras
    movimentacoesProcessadas.forEach(mov => {
      // Novo cálculo: saldo = previsto - debitosAntecipacao - debitos - deposito
      const debAnt = Number(mov.debitosAntecipacao || 0)
      const deb = Number(mov.debitos || 0)
      const dep = Number(mov.deposito || 0)
      const prev = Number(mov.previsto || 0)
      mov.saldoConciliacao = prev - debAnt - deb - dep
      
      // Regra 3: Se não tem depósito, status = Pendente (fundo amarelo)
      if (!mov.deposito || mov.deposito === 0) {
        mov.status = 'Pendente'
      } else {
        // Regra 2: Status baseado na diferença do saldo
        const diferenca = Math.abs(mov.saldoConciliacao)
        
        if (diferenca <= 0.50) {
          // Zerado ou até 0,50 centavos = Consistente (fundo verde claro)
          mov.status = 'Consistente'
        } else {
          // Acima de 0,50 = Inconsistente (fundo vermelho)
          mov.status = 'Inconsistente'
        }
      }
    })
    
    // Ordenar por data (mais recente primeiro)
    movimentacoesProcessadas.sort((a, b) => {
      const [diaA, mesA, anoA] = a.data.split('/')
      const [diaB, mesB, anoB] = b.data.split('/')
      const dataA = new Date(anoA, mesA - 1, diaA)
      const dataB = new Date(anoB, mesB - 1, diaB)
      return dataB - dataA
    })
    
    estados.movimentacoes.value = movimentacoesProcessadas
    return movimentacoesProcessadas
  }

  // Função para agrupar dados de vendas por data e adquirente (previsão de pagamento)
  const agruparDadosVendas = (dadosVendas) => {
    const dadosAgrupados = {}
    
    dadosVendas.forEach((venda, index) => {
      const previsaoPgto = venda.previsao_pgto || venda.previsaoPgto
      if (previsaoPgto) {
        const dataPrevisaoFormatada = formatarData(previsaoPgto)
        const adquirente = venda.adquirente || 'Não informado'
        const chave = `${dataPrevisaoFormatada}_${adquirente}`
        const valorLiquido = parseFloat(venda.valor_liquido || 0)
        
        if (!dadosAgrupados[chave]) {
          dadosAgrupados[chave] = {
            id: `mov_${index}`,
            empresa: venda.empresa || '',
            banco: 'BANCO PADRÃO',
            agencia: '0001',
            conta: '12345-6',
            data: dataPrevisaoFormatada,
            adquirente: adquirente,
            previsto: 0,
            debitos: 0,
            deposito: 0, // Será calculado posteriormente
            saldoConciliacao: 0, // Será calculado posteriormente
            status: 'Pendente',
            vendas: [],
            quantidadeVendas: 0 // Contador de vendas
          }
        }
        
        // Somar valor líquido
        dadosAgrupados[chave].previsto += valorLiquido
        dadosAgrupados[chave].vendas.push(venda)
        dadosAgrupados[chave].quantidadeVendas += 1
      }
    })

    return dadosAgrupados
  }

  // Função para agrupar dados de recebimentos por data de recebimento e adquirente
  const agruparDadosRecebimentos = (dadosRecebimentos) => {
    const dadosAgrupados = {}
    dadosRecebimentos.forEach((rec, index) => {
      const dataRec = rec.data_recebimento || rec.dataRecebimento || rec.data
      if (!dataRec) return
      const dataFormatada = formatarData(dataRec)
      
      let adquirente = rec.adquirente || 'Não informado'
      // Normalização forçada de SAFRA para SAFRAPAY
      if (adquirente && adquirente.toUpperCase() === 'SAFRA') {
        adquirente = 'SAFRAPAY'
      }

      const chave = `${dataFormatada}_${adquirente}`
      const valorLiquido = parseFloat(rec.valor_liquido ?? rec.valorLiquido ?? rec.valor_bruto ?? 0)
      const valorAntecipacao = parseFloat(rec.despesa_antecipacao ?? rec.despesasAntecipacao ?? 0)

      if (!dadosAgrupados[chave]) {
        dadosAgrupados[chave] = {
          id: `mov_${index}`,
          empresa: rec.empresa || '',
          banco: 'BANCO PADRÃO',
          agencia: '0001',
          conta: '12345-6',
          data: dataFormatada,
          adquirente,
          previsto: 0,
          debitos: 0,
          deposito: 0,
          saldoConciliacao: 0,
          status: 'Pendente',
          quantidadeRecebimentos: 0,
          debitosAntecipacao: 0
        }
      }

      dadosAgrupados[chave].previsto += valorLiquido
      dadosAgrupados[chave].debitosAntecipacao += (isNaN(valorAntecipacao) ? 0 : valorAntecipacao)
      dadosAgrupados[chave].quantidadeRecebimentos += 1
      dadosAgrupados[chave].quantidadeVendas = (dadosAgrupados[chave].quantidadeVendas || 0) + 1
    })
    return dadosAgrupados
  }

  // Função para ordenar movimentações por data
  const ordenarMovimentacoesPorData = (movimentacoes) => {
    return movimentacoes.sort((a, b) => {
      const [diaA, mesA, anoA] = a.data.split('/')
      const [diaB, mesB, anoB] = b.data.split('/')
      const dataA = new Date(anoA, mesA - 1, diaA)
      const dataB = new Date(anoB, mesB - 1, diaB)
      return dataB - dataA // Ordem decrescente (mais recente primeiro)
    })
  }

  return {
    processarDadosVendas,
    agruparDadosVendas,
    agruparDadosRecebimentos,
    ordenarMovimentacoesPorData
  }
}
