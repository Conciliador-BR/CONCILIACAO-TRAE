import { ref, computed } from 'vue'
import { useAPIsupabase } from '../useAPIsupabase'
import { useEmpresas } from '../useEmpresas'
import { useGlobalFilters } from '../useGlobalFilters'

export const useBancosEmpresa = () => {
  const { supabase } = useAPIsupabase()
  const { empresas, fetchEmpresas } = useEmpresas()
  const { filtrosGlobais } = useGlobalFilters()
  
  // Estados
  const loading = ref(false)
  const error = ref(null)
  const bancosEmpresa = ref([])
  
  // Usar empresa selecionada dos filtros globais
  const empresaSelecionada = computed(() => filtrosGlobais.empresaSelecionada)
  
  // Função para buscar bancos da empresa selecionada
  const buscarBancosEmpresa = async () => {
    if (!empresaSelecionada.value) {
      bancosEmpresa.value = []
      return
    }
    
    loading.value = true
    error.value = null
    
    try {
      console.log('🏦 [DEBUG] Buscando bancos para empresa:', empresaSelecionada.value)
      
      // Garantir que as empresas estão carregadas
      if (!empresas.value || empresas.value.length === 0) {
        await fetchEmpresas()
      }
      
      // Buscar dados completos da empresa incluindo a coluna bancos
      const { data, error: supabaseError } = await supabase
        .from('empresas')
        .select('id, nome_empresa, bancos')
        .eq('id', empresaSelecionada.value)
        .single()
      
      if (supabaseError) {
        throw new Error(`Erro ao buscar empresa: ${supabaseError.message}`)
      }
      
      if (!data) {
        throw new Error('Empresa não encontrada')
      }
      
      console.log('🏢 [DEBUG] Dados da empresa encontrados:', data)
      
      // Verificar se a empresa tem bancos configurados
      if (!data.bancos) {
        console.log('⚠️ [DEBUG] Empresa não possui bancos configurados')
        bancosEmpresa.value = []
        return
      }
      
      // Processar a coluna bancos (assumindo que é um array JSON ou string separada por vírgula)
      let bancos = []
      
      if (typeof data.bancos === 'string') {
        // Se for string, tentar fazer parse como JSON ou separar por vírgula
        try {
          bancos = JSON.parse(data.bancos)
        } catch {
          // Se não for JSON válido, separar por vírgula
          bancos = data.bancos.split(',').map(banco => banco.trim()).filter(banco => banco)
        }
      } else if (Array.isArray(data.bancos)) {
        bancos = data.bancos
      }
      
      console.log('🏦 [DEBUG] Bancos processados:', bancos)
      
      // Normalizar nomes dos bancos para maiúsculo
      bancosEmpresa.value = bancos.map(banco => banco.toUpperCase())
      
    } catch (err) {
      console.error('❌ [DEBUG] Erro ao buscar bancos da empresa:', err)
      error.value = err.message || 'Erro ao carregar bancos da empresa'
      bancosEmpresa.value = []
    } finally {
      loading.value = false
    }
  }
  
  // Função para obter nome da empresa pelo ID
  const obterNomeEmpresa = async () => {
    if (!empresaSelecionada.value) return null
    
    // Garantir que as empresas estão carregadas
    if (!empresas.value || empresas.value.length === 0) {
      await fetchEmpresas()
    }
    
    const empresa = empresas.value.find(emp => {
      const match = emp.id == empresaSelecionada.value
      if (match) {
        console.log('🏢 [DEBUG] ✅ Empresa encontrada:', emp.id, '==', empresaSelecionada.value)
      }
      return match
    })
    
    if (empresa) {
      console.log('🏢 [DEBUG] Nome da empresa obtido:', empresa.nome)
      return empresa.nome
    } else {
      console.error('🏢 [DEBUG] Empresa não encontrada para ID:', empresaSelecionada.value)
      return null
    }
  }
  
  // Função para construir nome da tabela baseado na empresa e banco
  const construirNomeTabela = (nomeEmpresa, banco) => {
    if (!nomeEmpresa || !banco) return null
    
    // Normalizar nome da empresa
    const empresaNormalizada = nomeEmpresa
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/-/g, '_')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    
    // Normalizar nome do banco
    const bancoNormalizado = banco.toLowerCase()
    
    // Construir nome da tabela: banco_nomedobanco_nomeempresa
    const nomeTabela = `banco_${bancoNormalizado}_${empresaNormalizada}`
    
    console.log('📋 [DEBUG] Nome da tabela construído:', nomeTabela)
    return nomeTabela
  }
  
  // Função para verificar se uma tabela existe
  const verificarTabelaExiste = async (nomeTabela) => {
    try {
      const { data, error } = await supabase
        .from(nomeTabela)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`⚠️ [DEBUG] Tabela ${nomeTabela} não existe:`, error.message)
        return false
      }
      
      console.log(`✅ [DEBUG] Tabela ${nomeTabela} existe`)
      return true
    } catch (err) {
      console.log(`❌ [DEBUG] Erro ao verificar tabela ${nomeTabela}:`, err.message)
      return false
    }
  }
  
  return {
    // Estados
    loading,
    error,
    bancosEmpresa,
    
    // Computed
    empresaSelecionada,
    
    // Métodos
    buscarBancosEmpresa,
    obterNomeEmpresa,
    construirNomeTabela,
    verificarTabelaExiste
  }
}