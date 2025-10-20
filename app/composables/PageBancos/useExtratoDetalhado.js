import { ref, computed } from 'vue'
import { useAPIsupabase } from '../useAPIsupabase'
import { useEmpresas } from '../useEmpresas'
import { useGlobalFilters } from '../useGlobalFilters'

export const useExtratoDetalhado = () => {
  const { supabase } = useAPIsupabase()
  const { empresas, fetchEmpresas } = useEmpresas()
  const { filtrosGlobais } = useGlobalFilters()
  
  // Usar empresa selecionada dos filtros globais
  const empresaSelecionada = computed(() => filtrosGlobais.empresaSelecionada)
  
  // Estados
  const loading = ref(false)
  const error = ref(null)
  const transacoes = ref([])
  
  // Bancos disponíveis
  const bancosDisponiveis = ref([
    'ITAU',
    'BRADESCO', 
    'SANTANDER',
    'BANCOBRASIL',
    'CAIXA',
    'TRIBANCO',
    'SAFRA',
    'SICOOB',
    'NORDESTE',
    'SICREDI'
  ])
  
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
  
  // Função para obter nome da tabela baseado na empresa e banco
  const obterNomeTabela = (empresa, banco) => {
    if (!empresa || !banco) return null
    
    // Normalizar nomes: lowercase, remover acentos, substituir espaços e caracteres especiais por _
    const normalizarNome = (nome) => {
      return nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9]/g, '_') // Substitui caracteres especiais por _
        .replace(/_+/g, '_') // Remove múltiplos _ consecutivos
        .replace(/^_|_$/g, '') // Remove _ do início e fim
    }
    
    const empresaNormalizada = normalizarNome(empresa)
    const bancoNormalizado = normalizarNome(banco)
    
    const nomeTabela = `banco_${bancoNormalizado}_${empresaNormalizada}`
    
    // Tabela construída
    
    return nomeTabela
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
  
  // Função para obter nome da empresa pelo ID
  const obterNomeEmpresa = async () => {
    if (!empresaSelecionada.value) {
      console.log('🏢 [DEBUG] Nenhuma empresa selecionada')
      return null
    }
    
    // Garantir que as empresas estejam carregadas
    if (!empresas.value || empresas.value.length === 0) {
      console.log('🏢 [DEBUG] Empresas não carregadas, buscando...')
      await fetchEmpresas()
    }
    
    console.log('🏢 [DEBUG] Empresas disponíveis:', empresas.value.length)
    console.log('🏢 [DEBUG] Lista de empresas:', empresas.value.map(emp => ({ id: emp.id, nome: emp.nome })))
    console.log('🏢 [DEBUG] empresaSelecionada.value completo:', empresaSelecionada.value)
    
    // Determinar o ID da empresa (pode ser um objeto ou apenas o ID)
    let empresaId
    if (typeof empresaSelecionada.value === 'object' && empresaSelecionada.value !== null) {
      empresaId = empresaSelecionada.value.id || empresaSelecionada.value
      console.log('🏢 [DEBUG] Empresa selecionada é objeto, ID extraído:', empresaId)
    } else {
      empresaId = empresaSelecionada.value
      console.log('🏢 [DEBUG] Empresa selecionada é ID direto:', empresaId)
    }
    
    console.log('🏢 [DEBUG] Procurando empresa com ID:', empresaId, '(tipo:', typeof empresaId, ')')
    
    // Usar comparação mais robusta (== em vez de ===) para lidar com tipos diferentes
    const empresa = empresas.value.find(emp => {
      const match = emp.id == empresaId
      if (match) {
        console.log('🏢 [DEBUG] ✅ Empresa encontrada:', emp.id, '==', empresaId)
      }
      return match
    })
    
    if (empresa) {
      console.log('🏢 [DEBUG] Empresa encontrada:', empresa.nome)
      return empresa.nome
    } else {
      console.error('🏢 [DEBUG] Empresa não encontrada para ID:', empresaId)
      console.error('🏢 [DEBUG] IDs disponíveis:', empresas.value.map(emp => emp.id))
      return null
    }
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
      
      // Obter nome da empresa pelo ID
      const nomeEmpresa = await obterNomeEmpresa()
      console.log('🏢 [DEBUG] Nome da empresa obtido:', nomeEmpresa)
      
      if (!nomeEmpresa) {
        console.error('❌ [DEBUG] Nome da empresa não encontrado')
        throw new Error('Nome da empresa não encontrado')
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
        // Buscar de todos os bancos
        for (const banco of bancosDisponiveis.value) {
          const nomeTabela = obterNomeTabela(nomeEmpresa, banco)
          
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
              }
            } catch (err) {
              // Tabela não encontrada ou erro de acesso
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
    formatarData,
    obterNomeTabela,
    obterNomeEmpresa
  }
}