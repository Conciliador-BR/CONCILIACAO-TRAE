import { useFormatacaoDados } from './useFormatacaoDados.js'

export const useMapeamentoDados = () => {
  const { formatarData, formatarValor, truncarTexto } = useFormatacaoDados()

  // Função para mapear dados bancários para o formato da tabela
  const mapearDadosBancarios = (transacoes, nomeEmpresa, banco, ecEmpresa = '') => {
    const dadosMapeados = []
    
    console.log('🔍 Debug - Primeiras 3 transações recebidas:', transacoes.slice(0, 3))
    
    for (let i = 0; i < transacoes.length; i++) {
      const transacao = transacoes[i]
      
      try {
        // Debug do valor original
        console.log(`🔍 Transação ${i + 1} - Valor original:`, {
          valor: transacao.valor,
          tipo: typeof transacao.valor,
          valorString: String(transacao.valor),
          valorNumber: Number(transacao.valor)
        })
        
        // Formatar data
        const dataFormatada = formatarData(transacao.data)
        
        // Validar campos obrigatórios
        if (!dataFormatada) {
          console.warn(`⚠️ Transação ${i + 1} ignorada - data inválida:`, transacao.data)
          continue
        }

        // Processar valor
        const valorProcessado = formatarValor(transacao.valor)

        const dadoMapeado = {
          data: dataFormatada,
          descricao: truncarTexto(transacao.descricao || transacao.historico || '', 500),
          documento: truncarTexto(transacao.documento || transacao.numero_documento || '', 100),
          valor: valorProcessado,
          empresa: truncarTexto(nomeEmpresa, 100),
          matriz: truncarTexto(ecEmpresa, 100)
        }

        dadosMapeados.push(dadoMapeado)
        
        if (i < 5) { // Log das primeiras 5 para debug
          console.log(`📝 Transação ${i + 1} mapeada:`, {
            valorOriginal: transacao.valor,
            valorFinal: dadoMapeado.valor,
            dadoCompleto: dadoMapeado
          })
        }
      } catch (err) {
        console.error(`❌ Erro ao mapear transação ${i + 1}:`, err, transacao)
        // Continuar com as outras transações em vez de parar
      }
    }
    
    console.log('📊 Resumo do mapeamento:', {
      totalTransacoes: dadosMapeados.length,
      valoresNaoZero: dadosMapeados.filter(d => d.valor !== 0).length,
      somaTotal: dadosMapeados.reduce((sum, d) => sum + d.valor, 0)
    })
    
    return dadosMapeados
  }

  // Função para validar dados mapeados
  const validarDadosMapeados = (dadosMapeados) => {
    const erros = []
    
    if (!dadosMapeados || dadosMapeados.length === 0) {
      erros.push('Nenhum dado foi mapeado')
      return { valido: false, erros }
    }

    // Verificar se há pelo menos alguns dados válidos
    const dadosValidos = dadosMapeados.filter(d => 
      d.data && 
      d.empresa && 
      !isNaN(d.valor)
    )

    if (dadosValidos.length === 0) {
      erros.push('Nenhum dado válido encontrado após mapeamento')
      return { valido: false, erros }
    }

    if (dadosValidos.length < dadosMapeados.length) {
      erros.push(`${dadosMapeados.length - dadosValidos.length} registros inválidos foram ignorados`)
    }

    return { 
      valido: true, 
      erros, 
      dadosValidos,
      totalOriginal: dadosMapeados.length,
      totalValidos: dadosValidos.length
    }
  }

  return {
    mapearDadosBancarios,
    validarDadosMapeados
  }
}
