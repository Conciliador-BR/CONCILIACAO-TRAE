import { ref } from 'vue'
import { useAPIsupabase } from '~/composables/useAPIsupabase'
import { usePrevisaoPagamento } from './usePrevisaoPagamento'

export const useEnvioVendas = () => {
  const { supabase, insertData, error: supabaseError } = useAPIsupabase()
  const { criarPrevisoesPagamento, calcularPrevisaoVenda, carregarTaxas } = usePrevisaoPagamento()
  
  // Estados reativos
  const enviando = ref(false)

  // Função para enviar vendas para o Supabase
  const enviarVendasParaSupabase = async (vendas) => {
    if (!vendas || vendas.length === 0) {
      throw new Error('Nenhuma venda para enviar')
    }

    enviando.value = true
    
    try {
      // ✅ Carregar taxas ANTES de processar vendas
      console.log('🔄 Carregando taxas antes de processar vendas...')
      await carregarTaxas()
      
      console.log('Enviando vendas para Supabase:', vendas.length)

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
      
      // Log para debug
      const comPrevisao = payload.filter(p => p.previsao_pgto).length
      const semPrevisao = payload.length - comPrevisao
      console.log(`📊 Resumo previsões: ${comPrevisao} com previsão, ${semPrevisao} sem previsão`)
      
      // Inserir dados no Supabase (tabela vendas_operadora_unica)
      const resultado = await insertData('vendas_operadora_unica', payload)
      
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