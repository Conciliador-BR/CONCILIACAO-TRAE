import { ref } from 'vue'
import { useAPIsupabase } from '~/composables/useAPIsupabase'

export const useTaxasSupabase = () => {
  const { supabase, loading, error } = useAPIsupabase()
  const salvandoTaxas = ref(false)
  const mensagemSucesso = ref('')

  // Função para mapear os dados das taxas para o formato do Supabase
  const mapearTaxaParaSupabase = (taxa) => {
    console.log('🔍 Mapeando taxa:', taxa)
    
    // Verificar campos obrigatórios
    const camposObrigatorios = ['modalidade', 'empresa', 'adquirente', 'bandeira']
    const camposFaltando = camposObrigatorios.filter(campo => !taxa[campo] || taxa[campo].trim() === '')
    
    if (camposFaltando.length > 0) {
      console.error('❌ Campos obrigatórios faltando:', camposFaltando)
      console.error('📋 Dados da taxa:', taxa)
    }
    
    const taxaMapeada = {
      modalidade: taxa.modalidade || '',
      empresa: taxa.empresa || '',
      adquirente: taxa.adquirente || '',
      bandeira: taxa.bandeira || '',
      parcelas: parseInt(taxa.parcelas) || 1,
      taxa: parseFloat(taxa.percentualTaxa) || 0,
      data_corte: parseInt(taxa.dataCorte) || 1
    }
    
    console.log('✅ Taxa mapeada:', taxaMapeada)
    return taxaMapeada
  }

  // Função para salvar taxas com UPSERT (inserir ou atualizar)
  const salvarTaxasNoSupabase = async (taxas) => {
    try {
      console.log('🔄 Iniciando salvamento de taxas no Supabase...')
      console.log('📊 Total de taxas recebidas:', taxas.length)
      
      if (!supabase) {
        throw new Error('Supabase não está configurado')
      }
  
      // Mapear as taxas para o formato do Supabase (sem campo id)
      const taxasMapeadas = taxas.map(taxa => {
        const taxaMapeada = {
          modalidade: taxa.modalidade || '',
          empresa: taxa.empresa || '',
          adquirente: taxa.adquirente || '',
          bandeira: taxa.bandeira || '',
          parcelas: parseInt(taxa.parcelas) || 0,
          taxa: parseFloat(taxa.taxa) || 0,
          data_corte: parseInt(taxa.data_corte) || 0
        }
        
        console.log('📝 Taxa mapeada:', taxaMapeada)
        return taxaMapeada
      })
  
      console.log('📋 Todas as taxas mapeadas:', taxasMapeadas)
  
      // Salvar usando upsert com chave composta (sem id)
      const { data, error } = await supabase
        .from('cadastro_taxas')
        .upsert(taxasMapeadas, {
          onConflict: 'modalidade,empresa,adquirente,bandeira,parcelas,data_corte'
        })
        .select()
  
      if (error) {
        console.error('❌ Erro no UPSERT:', error)
        throw error
      }
  
      console.log('✅ Taxas salvas com sucesso:', data)
      return { success: true, data }
  
    } catch (error) {
      console.error('❌ Erro ao salvar taxas:', error)
      return { 
        success: false, 
        error: error.message,
        details: error
      }
    }
  }
// ... existing code ...

  const buscarTaxasDoSupabase = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('cadastro_taxas')
        .select('*')
      
      if (fetchError) {
        throw fetchError
      }
      
      return data || []
    } catch (err) {
      console.error('Erro ao buscar taxas do Supabase:', err)
      error.value = `Erro ao buscar taxas: ${err.message}`
      return []
    }
  }

  const deletarTaxaDoSupabase = async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('cadastro_taxas')
        .delete()
        .eq('id', id)
      
      if (deleteError) {
        throw deleteError
      }
      
      mensagemSucesso.value = 'Taxa deletada com sucesso do Supabase!'
      error.value = '' // limpar erro ao concluir com sucesso
      return true
    } catch (err) {
      console.error('Erro ao deletar taxa do Supabase:', err)
      error.value = `Erro ao deletar taxa: ${err.message}`
      return false
    }
  }

  return {
    salvandoTaxas,
    mensagemSucesso,
    loading,
    error,
    salvarTaxasNoSupabase,
    buscarTaxasDoSupabase,
    deletarTaxaDoSupabase
  }
}