import { ref } from 'vue'
import { useAPIsupabase } from '../useAPIsupabase'

export const useTaxasSupabase = () => {
  const loading = ref(false)
  const error = ref(null)
  const success = ref(false)
  const mensagemSucesso = ref('')
  const salvandoTaxas = ref(false)
  
  const { insertData } = useAPIsupabase()

  // Função para mapear dados da tabela local para o formato do Supabase
  const mapearTaxaParaSupabase = (taxa) => {
    return {
      id_linhas: taxa.id || taxa.id_linhas, // NOVO CAMPO ADICIONADO
      empresa: taxa.empresa,
      adquirente: taxa.adquirente,
      bandeira: taxa.bandeira,
      modalidade: taxa.modalidade,
      parcelas: taxa.parcelas || null,
      taxa: taxa.percentualTaxa || taxa.taxa, // CORRIGIDO: era 'percentual_taxa'
      data_corte: taxa.dataCorte || null
    }
  }

  // Função para enviar uma taxa individual para o Supabase
  const enviarTaxa = async (taxa) => {
    loading.value = true
    salvandoTaxas.value = true
    error.value = null
    success.value = false
    mensagemSucesso.value = ''
    
    try {
      const taxaMapeada = mapearTaxaParaSupabase(taxa)
      
      console.log('📤 Enviando taxa para Supabase:', taxaMapeada)
      
      const resultado = await insertData('cadastro_taxas', taxaMapeada)
      
      if (resultado) {
        success.value = true
        mensagemSucesso.value = 'Taxa enviada com sucesso!'
        console.log('✅ Taxa enviada com sucesso:', resultado)
        return resultado
      } else {
        throw new Error('Falha ao inserir taxa no Supabase')
      }
    } catch (err) {
      error.value = `Erro ao enviar taxa: ${err.message}`
      console.error('❌ Erro ao enviar taxa:', err)
      // Exibir erro na tela
      alert(`❌ ERRO: ${err.message}`)
      return null
    } finally {
      loading.value = false
      salvandoTaxas.value = false
    }
  }

  // Função para enviar múltiplas taxas em lote (NOVA FUNÇÃO SOLICITADA)
  const salvarTaxasNoSupabase = async (taxas) => {
    loading.value = true
    salvandoTaxas.value = true
    error.value = null
    success.value = false
    mensagemSucesso.value = ''
    
    try {
      if (!taxas || taxas.length === 0) {
        throw new Error('Nenhuma taxa para salvar')
      }

      const taxasMapeadas = taxas.map(mapearTaxaParaSupabase)
      
      console.log(`📤 Salvando ${taxasMapeadas.length} taxas no Supabase...`)
      
      const resultado = await insertData('cadastro_taxas', taxasMapeadas)
      
      if (resultado) {
        success.value = true
        mensagemSucesso.value = `✅ ${resultado.length} taxas salvas com sucesso!`
        console.log(`✅ ${resultado.length} taxas salvas com sucesso`)
        // Exibir sucesso na tela
        alert(`✅ SUCESSO: ${resultado.length} taxas salvas no Supabase!`)
        return true
      } else {
        throw new Error('Falha ao inserir taxas no Supabase')
      }
    } catch (err) {
      error.value = `Erro ao salvar taxas: ${err.message}`
      console.error('❌ Erro ao salvar taxas:', err)
      // Exibir erro na tela
      alert(`❌ ERRO AO SALVAR: ${err.message}`)
      return false
    } finally {
      loading.value = false
      salvandoTaxas.value = false
    }
  }

  // Função para enviar múltiplas taxas em lote
  const enviarTaxasLote = async (taxas) => {
    return await salvarTaxasNoSupabase(taxas)
  }

  // Função para limpar estados
  const limparEstados = () => {
    error.value = null
    success.value = false
    loading.value = false
    mensagemSucesso.value = ''
    salvandoTaxas.value = false
  }

  return {
    // Estados
    loading,
    error,
    success,
    mensagemSucesso,
    salvandoTaxas,
    
    // Métodos
    enviarTaxa,
    enviarTaxasLote,
    salvarTaxasNoSupabase, // NOVA FUNÇÃO ADICIONADA
    limparEstados
  }
}