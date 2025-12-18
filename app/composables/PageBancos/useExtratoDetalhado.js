import { ref, computed } from 'vue'
import { useAPIsupabase } from '../useAPIsupabase'
import { useEmpresas } from '../useEmpresas'
import { useGlobalFilters } from '../useGlobalFilters'
import { useBancosEmpresa } from './useBancosEmpresa'
import { useAdquirenteDetector } from '~/composables/useAdquirenteDetector'

// Função para salvar estado no sessionStorage
const salvarEstadoLocal = (dados) => {
  if (process.client) {
    try {
      sessionStorage.setItem('extratoDetalhado_state', JSON.stringify(dados))
    } catch (error) {}
  }
}

// Função para restaurar estado do sessionStorage
const restaurarEstadoLocal = () => {
  if (process.client) {
    try {
      const estadoSalvo = sessionStorage.getItem('extratoDetalhado_state')
      return estadoSalvo ? JSON.parse(estadoSalvo) : null
    } catch (error) { return null }
  }
  return null
}

// Inicializar estados com dados persistidos se disponíveis
const estadoInicial = restaurarEstadoLocal()

// Estados globais compartilhados (singleton) - igual ao padrão de Vendas
const transacoes = ref(estadoInicial?.transacoes || [])
const transacoesOriginais = ref(estadoInicial?.transacoesOriginais || []) // Armazenar dados originais
const filtroAtivo = ref(estadoInicial?.filtroAtivo || {
  bancoSelecionado: '',
  adquirente: '',
  dataInicial: '',
  dataFinal: ''
})

export const useExtratoDetalhado = () => {
  const { supabase } = useAPIsupabase()
  const { empresas, fetchEmpresas } = useEmpresas()
  const { filtrosGlobais } = useGlobalFilters()
  const { bancosEmpresa, buscarBancosEmpresa, obterNomeEmpresa: obterNomeEmpresaBancos, construirNomeTabela: construirNomeTabelaBancos } = useBancosEmpresa()
  const { detectarAdquirente } = useAdquirenteDetector()
  
  // Usar empresa selecionada dos filtros globais
  const empresaSelecionada = computed(() => filtrosGlobais.empresaSelecionada)
  
  // Estados
  const loading = ref(false)
  const error = ref(null)
  
  // Bancos disponíveis - agora vem da empresa selecionada
  const bancosDisponiveis = computed(() => bancosEmpresa.value)
  
  // Lista padrão para fallback
  const LISTA_ADQUIRENTES_PADRAO = [
    'STONE', 'CIELO', 'REDE', 'PAGSEGURO', 'GETNET', 'SAFRAPAY', 'MERCADOPAGO', 'SIPAG', 'BIN',
    'UNICA', 'SICREDI', 'AZULZINHA', 'TICKET', 'PLUXEE', 'ALELO', 'VR BENEFICIOS', 'LE CARD',
    'UP BRASIL', 'COMPROCARD', 'ECX CARD', 'FN CARD', 'BEN VISA', 'CREDISHOP', 'RC CARD',
    'GOOD CARD', 'BIG CARD', 'BK CARD', 'BRASILCARD', 'BOLTCARD', 'CABAL', 'VEROCARD',
    'FACECARD', 'VALE CARD', 'NAIP'
  ]

  // Adquirentes disponíveis (Computado com base nas transações carregadas)
  const adquirentesDisponiveis = computed(() => {
    // Se não tiver transações carregadas, retorna a lista padrão
    if (!transacoesOriginais.value || transacoesOriginais.value.length === 0) {
      return LISTA_ADQUIRENTES_PADRAO.sort()
    }

    // Extrair adquirentes detectados únicos
    const adquirentesEncontrados = new Set()
    
    transacoesOriginais.value.forEach(t => {
      if (t.adquirente_detectado) {
        adquirentesEncontrados.add(t.adquirente_detectado)
      }
    })

    if (adquirentesEncontrados.size === 0) {
      return LISTA_ADQUIRENTES_PADRAO.sort()
    }

    return Array.from(adquirentesEncontrados).sort()
  })
  
  // Função para construir nome da tabela - usar a nova lógica
  const obterNomeTabela = async (nomeEmpresa, banco) => {
    return await construirNomeTabelaBancos(nomeEmpresa, banco)
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
    } catch (error) { return null }
  }
  
  // Função para obter nome da empresa pelo ID - usar a nova implementação
  const obterNomeEmpresa = async () => {
    return await obterNomeEmpresaBancos()
  }
  
  // Função para buscar transações bancárias com controle de estado
  const buscarTransacoesBancarias = async (filtros = {}, forceReload = false) => {
    
    
    // Se já temos dados carregados e não é um reload forçado, não recarregar
    if (transacoesOriginais.value.length > 0 && !forceReload) {
      aplicarFiltrosLocais(filtros)
      return
    }
    
    loading.value = true
    error.value = null
    
    try {
      const { bancoSelecionado, adquirente, dataInicial, dataFinal } = filtros
      
      if (!empresaSelecionada.value) { throw new Error('Nenhuma empresa selecionada') }
      
      // Buscar bancos da empresa primeiro
      await buscarBancosEmpresa()
    
      
      // Obter nome da empresa pelo ID
      const nomeEmpresa = await obterNomeEmpresa()
      
      if (!nomeEmpresa) { throw new Error('Nome da empresa não encontrado') }
      
      // Verificar se a empresa tem bancos configurados
      if (!bancosEmpresa.value || bancosEmpresa.value.length === 0) { throw new Error('Empresa não possui bancos configurados') }
      
      let todasTransacoes = []
      
      if (bancoSelecionado && bancoSelecionado !== 'TODOS') {
        // Buscar de um banco específico
    
        const nomeTabela = await obterNomeTabela(nomeEmpresa, bancoSelecionado)
        
        if (nomeTabela) {
          let query = supabase
            .from(nomeTabela)
            .select('*')
          
          // Aplicar filtros de data se fornecidos
          if (dataInicial) { query = query.gte('data', dataInicial) }
          if (dataFinal) { query = query.lte('data', dataFinal) }
          
          const { data, error: queryError } = await query
          
          if (queryError) {
            
          } else if (data) {
            todasTransacoes = data.map(transacao => {
              // Passar o bancoSelecionado para o detector
              const det = detectarAdquirente(transacao.descricao, bancoSelecionado)
              return {
                ...transacao,
                banco: bancoSelecionado,
                data_formatada: formatarData(transacao.data),
                adquirente_detectado: det ? det.base : null, // Salva o adquirente detectado
                categoria_detectada: det ? det.categoria : null
              }
            })
          } else {}
        } else {
          
        }
      } else {
        // Buscar de todos os bancos da empresa
  
        
        for (const banco of bancosEmpresa.value) {
          const nomeTabela = await obterNomeTabela(nomeEmpresa, banco)
          
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
                const transacoesBanco = data.map(transacao => {
                  // Passar o banco atual do loop para o detector
                  const det = detectarAdquirente(transacao.descricao, banco)
                  return {
                    ...transacao,
                    banco: banco,
                    data_formatada: formatarData(transacao.data),
                    adquirente_detectado: det ? det.base : null, // Salva o adquirente detectado
                    categoria_detectada: det ? det.categoria : null
                  }
                })
                todasTransacoes = [...todasTransacoes, ...transacoesBanco]
              } else if (queryError) {}
            } catch (err) {}
          }
        }
      }
      
      // Ordenar por data (mais recente primeiro)
      todasTransacoes.sort((a, b) => {
        const dataA = new Date(a.data || 0)
        const dataB = new Date(b.data || 0)
        return dataB - dataA
      })
      
      // Armazenar dados originais
      transacoesOriginais.value = todasTransacoes
      
      // Atualizar filtros ativos
      filtroAtivo.value = { ...filtros }
      
      // Aplicar filtros nos dados carregados
      aplicarFiltrosLocais(filtros)
      
      // Salvar estado no sessionStorage
      salvarEstadoLocal({
        transacoes: transacoes.value,
        transacoesOriginais: transacoesOriginais.value,
        filtroAtivo: filtroAtivo.value
      })
      
      
      
    } catch (err) {
      error.value = err.message || 'Erro ao carregar transações'
    } finally {
      loading.value = false
    }
  }

  // Função para aplicar filtros localmente nos dados já carregados
  const aplicarFiltrosLocais = (filtros = {}) => {
    
    let transacoesFiltradas = [...transacoesOriginais.value]
    
    // Filtrar por banco se especificado
    if (filtros.bancoSelecionado && filtros.bancoSelecionado !== 'TODOS') {
      transacoesFiltradas = transacoesFiltradas.filter(transacao => 
        transacao.banco === filtros.bancoSelecionado
      )
    }
    
    // Filtrar por adquirente se especificado
    if (filtros.adquirente && filtros.adquirente !== 'TODOS') {
      transacoesFiltradas = transacoesFiltradas.filter(transacao => {
        // Usa a detecção robusta primeiro
        if (transacao.adquirente_detectado) {
           return transacao.adquirente_detectado.toUpperCase().includes(filtros.adquirente.toUpperCase())
        }
        // Fallback para includes simples
        return transacao.descricao && transacao.descricao.toUpperCase().includes(filtros.adquirente.toUpperCase())
      })
    }
    
    // Filtrar por data se especificado
    if (filtros.dataInicial || filtros.dataFinal) {
      transacoesFiltradas = transacoesFiltradas.filter(transacao => {
        if (!transacao.data) return false
        
        const dataTransacao = new Date(transacao.data)
        
        if (filtros.dataInicial) {
          const dataInicial = new Date(filtros.dataInicial)
          if (dataTransacao < dataInicial) return false
        }
        
        if (filtros.dataFinal) {
          const dataFinal = new Date(filtros.dataFinal)
          if (dataTransacao > dataFinal) return false
        }
        
        return true
      })
    }
    
    transacoes.value = transacoesFiltradas
    
    // Salvar estado no sessionStorage
    salvarEstadoLocal({
      transacoes: transacoes.value,
      transacoesOriginais: transacoesOriginais.value,
      filtroAtivo: filtroAtivo.value
    })
    
    
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
  
  // Função para limpar estado persistido
  const limparEstadoPersistido = () => {
    if (process.client) {
      try {
        sessionStorage.removeItem('extratoDetalhado_state')
        transacoes.value = []
        transacoesOriginais.value = []
        filtroAtivo.value = {
          bancoSelecionado: '',
          adquirente: '',
          dataInicial: '',
          dataFinal: ''
        }
      } catch (error) {}
    }
  }

  return {
    // Estados
    loading,
    error,
    transacoes,
    transacoesOriginais,
    filtroAtivo,
    
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
    aplicarFiltrosLocais,
    buscarBancosEmpresa,
    formatarData,
    obterNomeTabela,
    obterNomeEmpresa,
    limparEstadoPersistido
  }
}
