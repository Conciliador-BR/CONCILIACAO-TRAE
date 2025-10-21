import { ref, computed } from 'vue'
import { useAPIsupabase } from '../useAPIsupabase'
import { useEmpresas } from '../useEmpresas'
import { useGlobalFilters } from '../useGlobalFilters'
import { useBancosEmpresa } from './useBancosEmpresa'

export const useExtratoDetalhado = () => {
  const { supabase } = useAPIsupabase()
  const { empresas, fetchEmpresas } = useEmpresas()
  const { filtrosGlobais } = useGlobalFilters()
  const { bancosEmpresa, buscarBancosEmpresa, obterNomeEmpresa: obterNomeEmpresaBancos, construirNomeTabela: construirNomeTabelaBancos } = useBancosEmpresa()
  
  // Usar empresa selecionada dos filtros globais
  const empresaSelecionada = computed(() => filtrosGlobais.empresaSelecionada)
  
  // Estados
  const loading = ref(false)
  const error = ref(null)
  const transacoes = ref([])
  
  // Bancos disponíveis - agora vem da empresa selecionada
  const bancosDisponiveis = computed(() => bancosEmpresa.value)
  
  // Adquirentes disponíveis
  const adquirentesDisponiveis = ref([
    'STONE',
    'CIELO',
    'REDE',
    'PAGSEGURO',
    'GETNET',
    'SAFRAPAY',
    'MERCADOPAGO',
    'SIPAG',
    'BIN',
    'UNICA'
  ])
  
  // Função para construir nome da tabela - usar a nova lógica
  const obterNomeTabela = (nomeEmpresa, banco) => {
    return construirNomeTabelaBancos(nomeEmpresa, banco)
  }
  
  // Função para formatar data
  const formatarData = (data) => {
    if (!data) return null
    
    try {
      if (typeof data === 'string' && data.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return data
      }
      
      if (typeof data === 'string' && data.match(/^\d{4}-\d{2}-\d{2}/)) {
        const [ano, mes, dia] = data.split('-')
        return `${dia}/${mes}/${ano}`
      }
      
      const dateObj = new Date(data)
      if (!isNaN(dateObj.getTime())) {
        const dia = String(dateObj.getDate()).padStart(2, '0')
        const mes = String(dateObj.getMonth() + 1).padStart(2, '0')
        const ano = dateObj.getFullYear()
        return `${dia}/${mes}/${ano}`
      }
      
      return null
    } catch (error) {
      console.error('Erro ao formatar data:', error, data)
      return null
    }
  }
  
  // Função para obter nome da empresa pelo ID - usar a nova implementação
  const obterNomeEmpresa = async () => {
    return await obterNomeEmpresaBancos()
  }
  
  // Função para buscar transações bancárias
  const buscarTransacoesBancarias = async (filtros = {}) => {
    console.log('🔍 [DEBUG] Iniciando busca de transações bancárias...')
    console.log('🔍 [DEBUG] Filtros recebidos:', filtros)
    console.log('🔍 [DEBUG] Empresa selecionada:', empresaSelecionada.value)
    
    loading.value = true
    error.value = null
    transacoes.value = []
    
    try {
      const { bancoSelecionado, adquirente, dataInicial, dataFinal } = filtros
      
      if (!empresaSelecionada.value) {
        console.error('❌ [DEBUG] Nenhuma empresa selecionada')
        throw new Error('Nenhuma empresa selecionada')
      }
      
      // Buscar bancos da empresa primeiro
      await buscarBancosEmpresa()
      console.log('🏦 [DEBUG] Bancos da empresa carregados:', bancosEmpresa.value)
      
      // Obter nome da empresa pelo ID
      const nomeEmpresa = await obterNomeEmpresa()
      console.log('🏢 [DEBUG] Nome da empresa obtido:', nomeEmpresa)
      
      if (!nomeEmpresa) {
        console.error('❌ [DEBUG] Nome da empresa não encontrado')
        throw new Error('Nome da empresa não encontrado')
      }
      
      // Verificar se a empresa tem bancos configurados
      if (!bancosEmpresa.value || bancosEmpresa.value.length === 0) {
        console.warn('⚠️ [DEBUG] Empresa não possui bancos configurados')
        throw new Error('Empresa não possui bancos configurados')
      }
      
      let todasTransacoes = []
      
      if (bancoSelecionado && bancoSelecionado !== 'TODOS') {
        // Buscar de um banco específico
        console.log('🏦 [DEBUG] Buscando banco específico:', bancoSelecionado)
        const nomeTabela = obterNomeTabela(nomeEmpresa, bancoSelecionado)
        console.log('📋 [DEBUG] Nome da tabela construído:', nomeTabela)
        
        if (nomeTabela) {
          let query = supabase
            .from(nomeTabela)
            .select('*')
          
          // Aplicar filtros de data se fornecidos
          if (dataInicial) {
            console.log('📅 [DEBUG] Aplicando filtro data inicial:', dataInicial)
            query = query.gte('data', dataInicial)
          }
          if (dataFinal) {
            console.log('📅 [DEBUG] Aplicando filtro data final:', dataFinal)
            query = query.lte('data', dataFinal)
          }
          
          console.log('🔍 [DEBUG] Executando consulta na tabela:', nomeTabela)
          const { data, error: queryError } = await query
          
          if (queryError) {
            console.error(`❌ [DEBUG] Erro ao buscar dados da tabela ${nomeTabela}:`, queryError)
          } else if (data) {
            console.log(`✅ [DEBUG] ${data.length} registros encontrados na tabela ${nomeTabela}`)
            todasTransacoes = data.map(transacao => ({
              ...transacao,
              banco: bancoSelecionado,
              data_formatada: formatarData(transacao.data)
            }))
          } else {
            console.warn(`⚠️ [DEBUG] Nenhum dado retornado da tabela ${nomeTabela}`)
          }
        } else {
          console.error('❌ [DEBUG] Nome da tabela não pôde ser construído')
        }
      } else {
        // Buscar de todos os bancos da empresa
        console.log('🏦 [DEBUG] Buscando de todos os bancos da empresa...')
        
        for (const banco of bancosEmpresa.value) {
          const nomeTabela = obterNomeTabela(nomeEmpresa, banco)
          console.log('📋 [DEBUG] Tentando tabela:', nomeTabela)
          
          if (nomeTabela) {
            try {
              let query = supabase
                .from(nomeTabela)
                .select('*')
              
              // Aplicar filtros de data se fornecidos
              if (dataInicial) {
                query = query.gte('data', dataInicial)
              }
              if (dataFinal) {
                query = query.lte('data', dataFinal)
              }
              
              const { data, error: queryError } = await query
              
              if (!queryError && data) {
                const transacoesBanco = data.map(transacao => ({
                  ...transacao,
                  banco: banco,
                  data_formatada: formatarData(transacao.data)
                }))
                todasTransacoes = [...todasTransacoes, ...transacoesBanco]
                console.log(`✅ [DEBUG] Encontradas ${data.length} transações na tabela ${nomeTabela}`)
              } else if (queryError) {
                console.log(`⚠️ [DEBUG] Erro na tabela ${nomeTabela}:`, queryError.message)
              }
            } catch (err) {
              console.log(`❌ [DEBUG] Erro ao acessar tabela ${nomeTabela}:`, err.message)
            }
          }
        }
      }
      
      // Filtrar por adquirente se especificado
      if (adquirente && adquirente !== 'TODOS') {
        todasTransacoes = todasTransacoes.filter(transacao => 
          transacao.descricao && 
          transacao.descricao.toUpperCase().includes(adquirente.toUpperCase())
        )
      }
      
      // Ordenar por data (mais recente primeiro)
      todasTransacoes.sort((a, b) => {
        const dataA = new Date(a.data || 0)
        const dataB = new Date(b.data || 0)
        return dataB - dataA
      })
      
      transacoes.value = todasTransacoes
      console.log(`🎯 [DEBUG] Busca finalizada. Total de transações encontradas: ${todasTransacoes.length}`)
      
    } catch (err) {
      console.error('❌ [DEBUG] Erro ao buscar transações bancárias:', err)
      error.value = err.message || 'Erro ao carregar transações'
    } finally {
      loading.value = false
      console.log('🏁 [DEBUG] Loading finalizado')
    }
  }
  
  // Computed para estatísticas
  const totalTransacoes = computed(() => transacoes.value.length)
  
  const totalCreditos = computed(() => {
    return transacoes.value
      .filter(t => t.valor > 0)
      .reduce((sum, t) => sum + (t.valor || 0), 0)
  })
  
  const totalDebitos = computed(() => {
    return transacoes.value
      .filter(t => t.valor < 0)
      .reduce((sum, t) => sum + Math.abs(t.valor || 0), 0)
  })
  
  const saldoTotal = computed(() => {
    return transacoes.value.reduce((sum, t) => sum + (t.valor || 0), 0)
  })
  
  return {
    // Estados
    loading,
    error,
    transacoes,
    
    // Dados
    bancosDisponiveis,
    adquirentesDisponiveis,
    
    // Computed
    totalTransacoes,
    totalCreditos,
    totalDebitos,
    saldoTotal,
    
    // Métodos
    buscarTransacoesBancarias,
    buscarBancosEmpresa,
    formatarData,
    obterNomeTabela,
    obterNomeEmpresa
  }
}