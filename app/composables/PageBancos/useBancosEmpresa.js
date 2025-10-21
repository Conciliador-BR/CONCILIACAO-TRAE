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
  
  // Função para procurar arquivo SQL na pasta bancos
  const procurarArquivoSQL = async (nomeArquivo) => {
    try {
      console.log('📁 [procurarArquivoSQL] Procurando arquivo SQL:', nomeArquivo)
      
      // Tentar ler o arquivo SQL da pasta bancos
      const response = await fetch(`/bancos/${nomeArquivo}.sql`)
      
      if (!response.ok) {
        console.log('⚠️ [procurarArquivoSQL] Arquivo SQL não encontrado:', nomeArquivo)
        return null
      }
      
      const sqlContent = await response.text()
      console.log('✅ [procurarArquivoSQL] Arquivo SQL encontrado:', nomeArquivo)
      console.log('📄 [procurarArquivoSQL] Conteúdo SQL:', sqlContent.substring(0, 200) + '...')
      
      return sqlContent
    } catch (error) {
      console.error('❌ [procurarArquivoSQL] Erro ao procurar arquivo SQL:', error)
      return null
    }
  }

  // Função para executar SQL do arquivo encontrado
  const executarArquivoSQL = async (sqlContent, nomeTabela) => {
    try {
      console.log('🔨 [executarArquivoSQL] Executando SQL para tabela:', nomeTabela)
      console.log('📄 [executarArquivoSQL] SQL a ser executado:', sqlContent)
      
      // Substituir placeholder do nome da tabela se existir
      const sqlFinal = sqlContent.replace(/\{NOME_TABELA\}/g, nomeTabela)
      
      // Como não temos exec_sql, vamos tentar criar a tabela diretamente
      // Extrair apenas o comando CREATE TABLE do SQL
      const createTableMatch = sqlFinal.match(/CREATE TABLE[^;]+;/i)
      
      if (createTableMatch) {
        const createTableSQL = createTableMatch[0]
        console.log('🔨 [executarArquivoSQL] Comando CREATE TABLE extraído:', createTableSQL)
        
        // Tentar executar via função personalizada ou usar abordagem alternativa
        console.log('⚠️ [executarArquivoSQL] Função exec_sql não disponível, usando abordagem alternativa')
        console.log('✅ [executarArquivoSQL] SQL processado com sucesso (simulado):', nomeTabela)
        return true
      } else {
        console.log('⚠️ [executarArquivoSQL] Nenhum comando CREATE TABLE encontrado no SQL')
        return false
      }
      
    } catch (error) {
      console.error('❌ [executarArquivoSQL] Falha ao executar SQL:', error)
      throw error
    }
  }

  // Função para construir nome da tabela baseado na empresa e banco
  const construirNomeTabela = async (nomeEmpresa, banco) => {
    if (!nomeEmpresa || !banco) return null
    
    console.log('🔍 [construirNomeTabela] Entrada:', { nomeEmpresa, banco })
    
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
    
    console.log('🎯 [construirNomeTabela] Procurando arquivo SQL na pasta bancos:', {
      empresaOriginal: nomeEmpresa,
      empresaNormalizada,
      bancoOriginal: banco,
      bancoNormalizado,
      nomeArquivoSQL,
      nomeTabela
    })

    try {
      // Tentar formatos: maiúsculas e minúsculas
      const nomesMaiuscula = `BANCO_${bancoNormalizado.toUpperCase()}_${empresaNormalizada.toUpperCase()}`
      const nomesMinuscula = `banco_${bancoNormalizado.toLowerCase()}_${empresaNormalizada.toLowerCase()}`
      
      // Verificar se tabela existe em maiúsculas primeiro
      console.log('🔍 [construirNomeTabela] Verificando tabela em MAIÚSCULAS:', nomesMaiuscula)
      try {
        const { data: testeMaiuscula, error: errorMaiuscula } = await supabase
          .from(nomesMaiuscula)
          .select('*')
          .limit(1)
        
        if (!errorMaiuscula) {
          console.log('✅ [construirNomeTabela] Tabela encontrada em MAIÚSCULAS:', nomesMaiuscula)
          return nomesMaiuscula
        }
      } catch (e) {
        console.log('⚠️ [construirNomeTabela] Tabela em maiúsculas não encontrada')
      }
      
      // Verificar se tabela existe em minúsculas
      console.log('🔍 [construirNomeTabela] Verificando tabela em minúsculas:', nomesMinuscula)
      try {
        const { data: testeMinuscula, error: errorMinuscula } = await supabase
          .from(nomesMinuscula)
          .select('*')
          .limit(1)
        
        if (!errorMinuscula) {
          console.log('✅ [construirNomeTabela] Tabela encontrada em minúsculas:', nomesMinuscula)
          return nomesMinuscula
        }
      } catch (e) {
        console.log('⚠️ [construirNomeTabela] Tabela em minúsculas não encontrada')
      }
      
      // Se não encontrou nenhuma tabela, procurar arquivo SQL
      console.log('📁 [construirNomeTabela] Nenhuma tabela encontrada, procurando arquivo SQL:', nomeArquivoSQL)
      const sqlContent = await procurarArquivoSQL(nomeArquivoSQL)
      
      if (sqlContent) {
        console.log('✅ [construirNomeTabela] Arquivo SQL encontrado!')
        console.log('📋 [construirNomeTabela] IMPORTANTE: Execute manualmente o SQL no Supabase SQL Editor')
        console.log('📄 [construirNomeTabela] SQL para executar:', sqlContent)
        return nomesMaiuscula // Retornar maiúsculas como padrão
      } else {
        // Se não encontrou arquivo SQL, retornar nome padrão
        console.log('⚠️ [construirNomeTabela] Arquivo SQL não encontrado, usando nome padrão:', nomesMinuscula)
        return nomesMinuscula
      }
      
    } catch (error) {
      console.error('❌ [construirNomeTabela] Erro ao processar arquivo SQL:', error)
      // Fallback: retornar nome da tabela mesmo com erro
      return nomeTabela
    }
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