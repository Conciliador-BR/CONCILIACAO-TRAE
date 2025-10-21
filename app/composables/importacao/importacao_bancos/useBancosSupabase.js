import { ref } from 'vue'
import { useAPIsupabase } from '../../useAPIsupabase'

export const useBancosSupabase = () => {
  const { insertData, loading, error, supabase } = useAPIsupabase()
  
  const enviando = ref(false)
  const mensagemStatus = ref('')
  const tipoStatus = ref('')

  // Função para testar se a tabela existe
  const testarTabela = async (nomeTabela) => {
    try {
      console.log(`🔍 Testando existência da tabela: ${nomeTabela}`)
      
      // Tentar fazer uma consulta simples para verificar se a tabela existe
      const { data, error: testError } = await supabase
        .from(nomeTabela)
        .select('*')
        .limit(1)
      
      if (testError) {
        console.error(`❌ Tabela ${nomeTabela} não existe ou não é acessível:`, testError)
        return { existe: false, erro: testError.message }
      }
      
      console.log(`✅ Tabela ${nomeTabela} existe e é acessível`)
      return { existe: true, erro: null }
    } catch (err) {
      console.error(`❌ Erro ao testar tabela ${nomeTabela}:`, err)
      return { existe: false, erro: err.message }
    }
  }

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

  // Função para mapear dados bancários para o formato da tabela
  const mapearDadosBancarios = (transacoes, nomeEmpresa, banco) => {
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

        // Processar valor com mais cuidado
        let valorProcessado = 0
        if (transacao.valor !== undefined && transacao.valor !== null && transacao.valor !== '') {
          let valorString = String(transacao.valor).trim()
          
          // Se o valor contém vírgula, assumir que é separador decimal brasileiro
          if (valorString.includes(',')) {
            // Remover pontos (separadores de milhares) e substituir vírgula por ponto
            valorString = valorString.replace(/\./g, '').replace(',', '.')
          }
          
          // Remover qualquer caractere que não seja dígito, ponto ou sinal negativo
          valorString = valorString.replace(/[^\d.-]/g, '')
          
          valorProcessado = parseFloat(valorString) || 0
          
          console.log(`🔍 Processamento valor ${i + 1}:`, {
            original: transacao.valor,
            limpo: valorString,
            final: valorProcessado
          })
        }

        const dadoMapeado = {
          data: dataFormatada,
          descricao: String(transacao.descricao || transacao.historico || '').substring(0, 500),
          documento: String(transacao.documento || transacao.numero_documento || '').substring(0, 100),
          valor: valorProcessado,
          empresa: String(nomeEmpresa).substring(0, 100)
        }

        // Validar se o valor é um número válido
        if (isNaN(dadoMapeado.valor)) {
          console.warn(`⚠️ Transação ${i + 1} - valor inválido após processamento:`, {
            original: transacao.valor,
            processado: valorProcessado
          })
          dadoMapeado.valor = 0
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

  // Função para determinar a tabela baseada no banco e empresa
  const obterNomeTabela = async (banco, nomeEmpresa) => {
    console.log('🔍 [obterNomeTabela] Entrada:', { banco, nomeEmpresa })
    
    // Caso especial para tribanco
    if (banco.codigo.toLowerCase() === 'tribanco') {
      console.log('✅ [obterNomeTabela] Usando caso especial: tribanco_norte_atacado_matriz')
      return 'tribanco_norte_atacado_matriz'
    }

    // Para outros casos, normalizar e testar ambos os formatos
    const bancoNormalizado = banco.codigo
      .replace(/\s+/g, '_')
      .replace(/-/g, '_')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_]/g, '') // Remove caracteres especiais
      .replace(/_+/g, '_') // Remove underscores duplicados
      .replace(/^_|_$/g, '') // Remove underscores no início e fim

    const empresaNormalizada = nomeEmpresa
      .replace(/\s+/g, '_')
      .replace(/-/g, '_')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_]/g, '') // Remove caracteres especiais
      .replace(/_+/g, '_') // Remove underscores duplicados
      .replace(/^_|_$/g, '') // Remove underscores no início e fim

    // Tentar primeiro em maiúsculas, depois em minúsculas
    const nomesMaiuscula = `BANCO_${bancoNormalizado.toUpperCase()}_${empresaNormalizada.toUpperCase()}`
    const nomesMinuscula = `banco_${bancoNormalizado.toLowerCase()}_${empresaNormalizada.toLowerCase()}`
    
    console.log('🎯 [obterNomeTabela] Testando formatos:', {
      bancoOriginal: banco.codigo,
      bancoNormalizado,
      empresaOriginal: nomeEmpresa,
      empresaNormalizada,
      nomesMaiuscula,
      nomesMinuscula
    })

    // Verificar qual tabela existe
    try {
      console.log('🔍 [obterNomeTabela] Testando tabela em MAIÚSCULAS:', nomesMaiuscula)
      const { data: testeMaiuscula, error: errorMaiuscula } = await supabase
        .from(nomesMaiuscula)
        .select('*')
        .limit(1)
      
      if (errorMaiuscula) {
        console.log('⚠️ [obterNomeTabela] Erro em maiúsculas:', errorMaiuscula.message)
        throw errorMaiuscula
      }
      
      console.log('✅ [obterNomeTabela] Tabela encontrada em MAIÚSCULAS:', nomesMaiuscula)
      return nomesMaiuscula
    } catch (error) {
      console.log('⚠️ [obterNomeTabela] Tabela em maiúsculas não encontrada, tentando minúsculas...')
      console.log('🔍 [obterNomeTabela] Testando tabela em minúsculas:', nomesMinuscula)
      
      try {
        const { data: testeMinuscula, error: errorMinuscula } = await supabase
          .from(nomesMinuscula)
          .select('*')
          .limit(1)
        
        if (errorMinuscula) {
          console.log('⚠️ [obterNomeTabela] Erro em minúsculas:', errorMinuscula.message)
          throw errorMinuscula
        }
        
        console.log('✅ [obterNomeTabela] Tabela encontrada em minúsculas:', nomesMinuscula)
        return nomesMinuscula
      } catch (error2) {
        console.error('❌ [obterNomeTabela] Nenhuma tabela encontrada:', { 
          nomesMaiuscula, 
          nomesMinuscula, 
          errorMaiuscula: error.message,
          errorMinuscula: error2.message 
        })
        // Retornar o formato em maiúsculas como padrão
        return nomesMaiuscula
      }
    }
  }

  // Função principal para enviar extrato bancário
  const enviarExtratoBancario = async (dadosExtrato) => {
    enviando.value = true
    mensagemStatus.value = ''
    tipoStatus.value = ''

    try {
      const { transacoes, nomeEmpresa, banco } = dadosExtrato

      console.log('🏦 Iniciando envio do extrato bancário...')
      console.log('📊 Dados recebidos:', {
        empresa: nomeEmpresa,
        banco: banco.nome,
        bancoCode: banco.codigo,
        totalTransacoes: transacoes.length
      })

      // Validar dados de entrada
      if (!transacoes || transacoes.length === 0) {
        throw new Error('Nenhuma transação encontrada para enviar')
      }

      if (!nomeEmpresa) {
        throw new Error('Nome da empresa não informado')
      }

      if (!banco || !banco.codigo) {
        throw new Error('Banco não informado ou código do banco ausente')
      }

      // Determinar nome da tabela
      const nomeTabela = await obterNomeTabela(banco, nomeEmpresa)
      console.log('📋 Tabela de destino:', nomeTabela)

      // Testar se a tabela existe
      const { existe, erro: erroTabela } = await testarTabela(nomeTabela)
      if (!existe) {
        throw new Error(`A tabela '${nomeTabela}' não existe no Supabase: ${erroTabela}`)
      }

      // Mapear dados para o formato da tabela
      console.log('🔄 Iniciando mapeamento dos dados...')
      const dadosMapeados = mapearDadosBancarios(transacoes, nomeEmpresa, banco)
      
      if (dadosMapeados.length === 0) {
        throw new Error('Nenhuma transação válida foi mapeada. Verifique os dados do arquivo.')
      }

      console.log('✅ Dados mapeados com sucesso:', {
        total: dadosMapeados.length,
        amostra: dadosMapeados.slice(0, 2)
      })

      // Inserir dados no Supabase em lotes menores se necessário
      let resultado
      if (dadosMapeados.length > 100) {
        console.log('📦 Enviando em lotes devido ao tamanho...')
        resultado = []
        for (let i = 0; i < dadosMapeados.length; i += 100) {
          const lote = dadosMapeados.slice(i, i + 100)
          console.log(`📤 Enviando lote ${Math.floor(i/100) + 1}...`)
          const resultadoLote = await insertData(nomeTabela, lote)
          if (resultadoLote) {
            resultado.push(...resultadoLote)
          }
        }
      } else {
        console.log('📤 Enviando dados para o Supabase...')
        resultado = await insertData(nomeTabela, dadosMapeados)
      }

      if (resultado && Array.isArray(resultado) && resultado.length > 0) {
        mensagemStatus.value = `Extrato enviado com sucesso! ${resultado.length} transações inseridas na tabela ${nomeTabela}.`
        tipoStatus.value = 'sucesso'
        
        console.log('✅ Extrato enviado com sucesso:', {
          tabela: nomeTabela,
          registros: resultado.length
        })

        return {
          sucesso: true,
          tabela: nomeTabela,
          registrosInseridos: resultado.length,
          dados: resultado
        }
      } else {
        const errorMsg = error.value || 'Falha ao inserir dados no Supabase - resultado inválido'
        console.error('❌ Falha na inserção:', { resultado, error: error.value })
        throw new Error(errorMsg)
      }

    } catch (err) {
      console.error('❌ Erro detalhado ao enviar extrato:', {
        message: err.message,
        stack: err.stack,
        dadosExtrato: {
          empresa: dadosExtrato?.nomeEmpresa,
          banco: dadosExtrato?.banco?.codigo,
          totalTransacoes: dadosExtrato?.transacoes?.length
        }
      })
      
      mensagemStatus.value = `Erro ao enviar extrato: ${err.message}`
      tipoStatus.value = 'erro'
      
      return {
        sucesso: false,
        erro: err.message
      }
    } finally {
      enviando.value = false
    }
  }

  return {
    // Estados
    enviando,
    mensagemStatus,
    tipoStatus,
    loading,
    error,
    
    // Métodos
    enviarExtratoBancario,
    mapearDadosBancarios,
    obterNomeTabela,
    testarTabela,
    formatarData
  }
}