import { ref } from 'vue'
import { useAPIsupabase } from '~/composables/useAPIsupabase'
import { usePrevisaoPagamento } from './usePrevisaoPagamento'

export const useEnvioVendas = () => {
  const { supabase, insertData, error: supabaseError } = useAPIsupabase()
  const { criarPrevisoesPagamento, calcularPrevisaoVenda, carregarTaxas } = usePrevisaoPagamento()
  
  // Estados reativos
  const enviando = ref(false)

  // Função para construir nome da tabela dinamicamente
  const construirNomeTabela = (empresa, operadora) => {
    console.log('🔧 CONSTRUINDO NOME DA TABELA:')
    console.log('📥 Entrada - Empresa:', empresa, '(tipo:', typeof empresa, ')')
    console.log('📥 Entrada - Operadora:', operadora, '(tipo:', typeof operadora, ')')
    
    if (!empresa || !operadora) {
      throw new Error('Empresa e operadora são obrigatórias para determinar a tabela')
    }
    
    // Converter para string se for objeto
    const empresaStr = typeof empresa === 'string' ? empresa : String(empresa)
    const operadoraStr = typeof operadora === 'string' ? operadora : String(operadora)
    
    console.log('🔄 Conversão para string:')
    console.log('📝 Empresa string:', empresaStr)
    console.log('📝 Operadora string:', operadoraStr)
    
    // Normalizar nomes para formato de tabela
    const empresaNormalizada = empresaStr.toLowerCase()
      .replace(/\s+/g, '_')           // espaços por underscore
      .replace(/[^a-z0-9_]/g, '')     // remover caracteres especiais
      .replace(/_+/g, '_')            // múltiplos underscores por um só
      .replace(/^_|_$/g, '')          // remover underscores do início/fim
    
    const operadoraNormalizada = operadoraStr.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
    
    console.log('🔧 Normalização:')
    console.log('📝 Empresa normalizada:', empresaNormalizada)
    console.log('📝 Operadora normalizada:', operadoraNormalizada)
    
    const nomeTabela = `vendas_${empresaNormalizada}_${operadoraNormalizada}`
    
    console.log('✅ TABELA FINAL CONSTRUÍDA:', nomeTabela)
    console.log('🎯 ESTA TABELA SERÁ USADA NO SUPABASE!')
    
    return nomeTabela
  }

  // Função para enviar vendas para o Supabase
  const enviarVendasParaSupabase = async (vendas, empresa = null, operadora = null) => {
    console.log('🔍 DEBUG INÍCIO - Parâmetros recebidos:')
    console.log('📊 Vendas:', vendas?.length || 0, 'registros')
    console.log('🏢 Empresa recebida:', empresa, '(tipo:', typeof empresa, ')')
    console.log('🏪 Operadora recebida:', operadora, '(tipo:', typeof operadora, ')')
    
    if (!vendas || vendas.length === 0) {
      throw new Error('Nenhuma venda para enviar')
    }

    // Se empresa/operadora não foram passados, tentar extrair do primeiro registro
    if (!empresa && vendas[0]?.empresa) {
      empresa = vendas[0].empresa
      console.log('🔄 Empresa extraída do primeiro registro:', empresa)
    }
    if (!operadora && vendas[0]?.adquirente) {
      operadora = vendas[0].adquirente
      console.log('🔄 Operadora extraída do primeiro registro:', operadora)
    }

    console.log('🔍 DEBUG ANTES DA CONSTRUÇÃO:')
    console.log('🏢 Empresa final:', empresa, '(tipo:', typeof empresa, ')')
    console.log('🏪 Operadora final:', operadora, '(tipo:', typeof operadora, ')')

    // Construir nome da tabela dinamicamente
    const nomeTabela = construirNomeTabela(empresa, operadora)
    
    console.log('🎯 TABELA FINAL CONSTRUÍDA:', nomeTabela)
    console.log('🎯 ESTA É A TABELA QUE SERÁ USADA NO SUPABASE!')

    enviando.value = true
    
    try {
      // ✅ Carregar taxas ANTES de processar vendas
      console.log('🔄 Carregando taxas antes de processar vendas...')
      await carregarTaxas()
      
      console.log('Enviando vendas para Supabase:', vendas.length)
      console.log('🏢 Empresa:', empresa)
      console.log('🏪 Operadora:', operadora)
      console.log('📋 Tabela de destino:', nomeTabela)

      // Enviar apenas colunas existentes na tabela vendas_operadora_unica
      const allowedFields = [
        'data_venda',
        'modalidade',
        'nsu',
        'valor_bruto',
        'valor_liquido',
        'taxa_mdr',
        'despesa_mdr',
        'numero_parcelas',
        'bandeira',
        'valor_antecipacao',
        'despesa_antecipacao',
        'valor_liquido_antecipacao',
        'empresa',
        'matriz',
        'adquirente',
        'previsao_pgto'
      ]
      
      const payload = vendas.map(v => {
        const out = {}
        for (const k of allowedFields) {
          if (v[k] !== undefined) out[k] = v[k]
        }
        
        // ✅ SEMPRE calcular previsao_pgto se não existir
        if (!out.previsao_pgto && out.data_venda && out.modalidade) {
          const previsaoCalculada = calcularPrevisaoVenda(out)
          if (previsaoCalculada) {
            out.previsao_pgto = previsaoCalculada
            console.log('✅ Previsão calculada:', {
              modalidade: out.modalidade,
              data_venda: out.data_venda,
              previsao_pgto: out.previsao_pgto
            })
          } else {
            console.warn('⚠️ Não foi possível calcular previsão para:', {
              modalidade: out.modalidade,
              data_venda: out.data_venda,
              motivo: 'Taxa não encontrada ou dados insuficientes'
            })
          }
        } else if (out.previsao_pgto) {
          console.log('✅ Previsão já existe:', {
            modalidade: out.modalidade,
            data_venda: out.data_venda,
            previsao_pgto: out.previsao_pgto
          })
        } else {
          console.warn('⚠️ Dados insuficientes para calcular previsão:', {
            data_venda: out.data_venda,
            modalidade: out.modalidade
          })
        }
        
        return out
      })
      
      // Log detalhado para debug
      console.log('🔍 DEBUG - Informações detalhadas do envio:')
      console.log('📊 Tabela de destino:', nomeTabela)
      console.log('📊 Número de registros:', payload.length)
      console.log('📊 Primeiro registro completo:', JSON.stringify(payload[0], null, 2))
      console.log('📊 Campos do primeiro registro:', Object.keys(payload[0]))
      console.log('📊 Tipos dos campos:', Object.entries(payload[0]).map(([key, value]) => ({
        campo: key,
        tipo: typeof value,
        valor: value
      })))
      
      // Verificar campos obrigatórios
      const camposObrigatorios = ['data_venda', 'valor_bruto', 'valor_liquido']
      payload.forEach((registro, index) => {
        camposObrigatorios.forEach(campo => {
          if (!registro[campo]) {
            console.error(`❌ Registro ${index}: Campo obrigatório '${campo}' está vazio ou undefined`)
          }
        })
      })
      
      // Inserir dados no Supabase (tabela dinâmica)
      console.log('🎯🎯🎯 ATENÇÃO: TABELA QUE SERÁ USADA 🎯🎯🎯')
      console.log('📋 NOME DA TABELA:', nomeTabela)
      console.log('🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯')
      
      // Alert para garantir que você veja
      alert(`TABELA QUE SERÁ USADA: ${nomeTabela}`)
      
      console.log(`🚀 Iniciando inserção na tabela ${nomeTabela}...`)
      const resultado = await insertData(nomeTabela, payload)
      
      if (!resultado) {
        throw new Error(supabaseError?.value || 'Falha ao inserir vendas no Supabase')
      }
      
      // ✅ Criar registros de previsão de pagamento usando a MESMA lógica
      await criarPrevisoesPagamento(resultado)
      
      console.log('Vendas enviadas com sucesso:', Array.isArray(resultado) ? resultado.length : payload.length)
      return { data: resultado }
      
    } catch (error) {
      console.error('Erro ao enviar vendas:', error)
      throw error
    } finally {
      enviando.value = false
    }
  }

  return {
    // Estados
    enviando,
    
    // Métodos
    enviarVendasParaSupabase
  }
}