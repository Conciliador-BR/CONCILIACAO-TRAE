import { ref } from 'vue'
import { useAPIsupabase } from '../../useAPIsupabase'
import { useValidacaoTabelas } from './useValidacaoTabelas.js'
import { useMapeamentoDados } from './useMapeamentoDados.js'
import { useGerenciamentoTabelas } from './useGerenciamentoTabelas.js'

export const useEnvioExtratos = () => {
  const { insertData, loading, error } = useAPIsupabase()
  const { testarTabela } = useValidacaoTabelas()
  const { mapearDadosBancarios, validarDadosMapeados } = useMapeamentoDados()
  const { obterNomeTabela } = useGerenciamentoTabelas()
  
  const enviando = ref(false)
  const mensagemStatus = ref('')
  const tipoStatus = ref('')

  // Função para enviar dados em lotes
  const enviarEmLotes = async (nomeTabela, dadosMapeados, tamanheLote = 100) => {
    const resultado = []
    
    for (let i = 0; i < dadosMapeados.length; i += tamanheLote) {
      const lote = dadosMapeados.slice(i, i + tamanheLote)
      console.log(`📤 Enviando lote ${Math.floor(i/tamanheLote) + 1}...`)
      
      const resultadoLote = await insertData(nomeTabela, lote)
      if (resultadoLote) {
        resultado.push(...resultadoLote)
      }
    }
    
    return resultado
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
      
      // Validar dados mapeados
      const validacao = validarDadosMapeados(dadosMapeados)
      if (!validacao.valido) {
        throw new Error(`Erro na validação dos dados: ${validacao.erros.join(', ')}`)
      }

      console.log('✅ Dados mapeados com sucesso:', {
        total: validacao.totalValidos,
        amostra: validacao.dadosValidos.slice(0, 2)
      })

      // Inserir dados no Supabase em lotes se necessário
      let resultado
      if (validacao.dadosValidos.length > 100) {
        console.log('📦 Enviando em lotes devido ao tamanho...')
        resultado = await enviarEmLotes(nomeTabela, validacao.dadosValidos)
      } else {
        console.log('📤 Enviando dados para o Supabase...')
        resultado = await insertData(nomeTabela, validacao.dadosValidos)
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
    enviarEmLotes
  }
}