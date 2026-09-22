import { ref, computed } from 'vue'
import { useAPIsupabase } from './useAPIsupabase'

export const useTaxasLogic = () => {
  // Estado reativo das taxas
  const taxas = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  const { fetchData } = useAPIsupabase()

  const createLegacyTaxaId = () => {
    return globalThis.crypto?.randomUUID?.()
      || `taxa-${Date.now()}-${String(typeof performance !== 'undefined' ? performance.now() : 0).replace('.', '')}`
  }

  // Função para carregar taxas do Supabase
  const fetchTaxas = async () => {
    loading.value = true
    error.value = null
    
    try {
      // TEMPORÁRIO: Buscar do localStorage primeiro
      const taxasLocalStorage = localStorage.getItem('taxas-conciliacao')
      
      if (taxasLocalStorage) {
        const taxasLocal = JSON.parse(taxasLocalStorage)
        taxas.value = taxasLocal.map(taxa => ({
          id: taxa.id || createLegacyTaxaId(),
          empresa: taxa.empresa,
          adquirente: taxa.adquirente,
          bandeira: taxa.bandeira,
          modalidade: taxa.modalidade,
          percentualTaxa: taxa.taxa || taxa.percentualTaxa,
          dataCorte: taxa.dataCorte
        }))
        
        console.log('✅ Taxas carregadas do localStorage:', taxas.value.length)
        console.log('📋 Estrutura das taxas:', taxas.value)
        return
      }
      
      // Se não tem no localStorage, tentar Supabase
      console.log('🔄 Buscando taxas do Supabase...')
      const taxasDoSupabase = await fetchData('taxas', 'id, empresa, adquirente, bandeira, modalidade, percentual_taxa, data_corte')
      
      if (taxasDoSupabase && taxasDoSupabase.length > 0) {
        // Mapear os dados do Supabase para o formato esperado
        taxas.value = taxasDoSupabase.map(taxa => ({
          id: taxa.id,
          empresa: taxa.empresa,
          adquirente: taxa.adquirente,
          bandeira: taxa.bandeira,
          modalidade: taxa.modalidade,
          percentualTaxa: taxa.percentual_taxa,
          dataCorte: taxa.data_corte
        }))
        
        console.log('✅ Taxas carregadas do Supabase:', taxas.value.length)
        console.log('📋 Exemplo de taxa:', taxas.value[0])
      } else {
        console.warn('⚠️ Nenhuma taxa encontrada no Supabase')
        taxas.value = []
      }
    } catch (err) {
      error.value = 'Erro ao carregar taxas: ' + err.message
      console.error('❌ Erro ao carregar taxas do Supabase:', err)
    } finally {
      loading.value = false
    }
  }

  // Função para salvar taxas (mantida para compatibilidade, mas agora usa Supabase)
  const saveTaxas = (novasTaxas) => {
    console.warn('⚠️ saveTaxas() não é mais suportado. Use as operações CRUD do Supabase diretamente.')
    taxas.value = novasTaxas
  }

  // Função para adicionar nova taxa (mantida para compatibilidade)
  const addTaxa = (novaTaxa) => {
    console.warn('⚠️ addTaxa() não é mais suportado. Use insertData() do useAPIsupabase.')
    const taxaComId = {
      id: Date.now(),
      empresa: '',
      adquirente: '',
      bandeira: '',
      modalidade: '',
      parcelas: 1,
      percentualTaxa: 0,
      dataCorte: 1,
      ...novaTaxa
    }
    
    taxas.value.push(taxaComId)
  }

  // Função para atualizar taxa (mantida para compatibilidade)
  const updateTaxa = (index, dadosAtualizados) => {
    console.warn('⚠️ updateTaxa() não é mais suportado. Use updateData() do useAPIsupabase.')
    if (index >= 0 && index < taxas.value.length) {
      taxas.value[index] = { ...taxas.value[index], ...dadosAtualizados }
    }
  }

  // Função para remover taxa (mantida para compatibilidade)
  const removeTaxa = (index) => {
    console.warn('⚠️ removeTaxa() não é mais suportado. Use deleteData() do useAPIsupabase.')
    if (index >= 0 && index < taxas.value.length) {
      taxas.value.splice(index, 1)
    }
  }

  // Computed para taxa média
  const taxaMedia = computed(() => {
    if (taxas.value.length === 0) return 0
    const soma = taxas.value.reduce((total, taxa) => total + (taxa.percentualTaxa || 0), 0)
    return soma / taxas.value.length
  })

  return {
    // Estados
    taxas,
    loading,
    error,
    
    // Computed
    taxaMedia,
    
    // Métodos
    fetchTaxas,
    saveTaxas,
    addTaxa,
    updateTaxa,
    removeTaxa
  }
}
