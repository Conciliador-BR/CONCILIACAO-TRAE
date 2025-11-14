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
      
      
      
      // Verificar se a empresa tem bancos configurados
      if (!data.bancos) {
  
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
      
  
      
      // Normalizar nomes dos bancos para maiúsculo
      bancosEmpresa.value = bancos.map(banco => banco.toUpperCase())
      
    } catch (err) {
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
    
    const empresa = empresas.value.find(emp => emp.id == empresaSelecionada.value)
    
    if (empresa) { return empresa.nome } else { return null }
  }
  
  // Função para procurar arquivo SQL na pasta bancos
  const procurarArquivoSQL = async (nomeArquivo) => {
    try {
      
      
      // Tentar ler o arquivo SQL da pasta bancos
      const response = await fetch(`/bancos/${nomeArquivo}.sql`)
      
      if (!response.ok) { return null }
      
      const sqlContent = await response.text()
      
      return sqlContent
    } catch (error) {
      return null
    }
  }

  // Função para executar SQL do arquivo encontrado
  const executarArquivoSQL = async (sqlContent, nomeTabela) => {
    try {
      
      // Substituir placeholder do nome da tabela se existir
      const sqlFinal = sqlContent.replace(/\{NOME_TABELA\}/g, nomeTabela)
      
      // Como não temos exec_sql, vamos tentar criar a tabela diretamente
      // Extrair apenas o comando CREATE TABLE do SQL
      const createTableMatch = sqlFinal.match(/CREATE TABLE[^;]+;/i)
      
      if (createTableMatch) {
        return true
      } else {
        return false
      }
      
    } catch (error) { throw error }
  }

  // Função para construir nome da tabela baseado na empresa e banco
  const construirNomeTabela = async (nomeEmpresa, banco) => {
    if (!nomeEmpresa || !banco) return null
    
    
    
    // Normalizar nome da empresa e banco
    const empresaNormalizada = nomeEmpresa
      .replace(/\s+/g, '_')
      .replace(/-/g, '_')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_]/g, '') // Remove caracteres especiais
      .replace(/_+/g, '_') // Remove underscores duplicados
      .replace(/^_|_$/g, '') // Remove underscores no início e fim
    
    const bancoNormalizado = banco
      .replace(/\s+/g, '_')
      .replace(/-/g, '_')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_]/g, '') // Remove caracteres especiais
      .replace(/_+/g, '_') // Remove underscores duplicados
      .replace(/^_|_$/g, '') // Remove underscores no início e fim
    
    // Construir nome do arquivo SQL: banco_nome_do_banco_empresa_selecionada
    const nomeArquivoSQL = `banco_${bancoNormalizado.toLowerCase()}_${empresaNormalizada.toLowerCase()}`
    const nomeTabela = nomeArquivoSQL
    
    

    try {
      // Tentar formatos: maiúsculas e minúsculas
      const nomesMaiuscula = `BANCO_${bancoNormalizado.toUpperCase()}_${empresaNormalizada.toUpperCase()}`
      const nomesMinuscula = `banco_${bancoNormalizado.toLowerCase()}_${empresaNormalizada.toLowerCase()}`
      
      // Verificar se tabela existe em maiúsculas primeiro
      
      try {
        const { data: testeMaiuscula, error: errorMaiuscula } = await supabase
          .from(nomesMaiuscula)
          .select('*')
          .limit(1)
        
        if (!errorMaiuscula) { return nomesMaiuscula }
      } catch (e) {}
      
      // Verificar se tabela existe em minúsculas
      
      try {
        const { data: testeMinuscula, error: errorMinuscula } = await supabase
          .from(nomesMinuscula)
          .select('*')
          .limit(1)
        
        if (!errorMinuscula) { return nomesMinuscula }
      } catch (e) {}
      
      // Se não encontrou nenhuma tabela, procurar arquivo SQL
      
      const sqlContent = await procurarArquivoSQL(nomeArquivoSQL)
      
      if (sqlContent) {
        return nomesMaiuscula // Retornar maiúsculas como padrão
      } else {
        return nomesMinuscula
      }
      
    } catch (error) { return nomeTabela }
  }
  
  // Função para verificar se uma tabela existe
  const verificarTabelaExiste = async (nomeTabela) => {
    try {
      const { data, error } = await supabase
        .from(nomeTabela)
        .select('*')
        .limit(1)
      
      if (error) { return false }
      return true
    } catch (err) { return false }
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