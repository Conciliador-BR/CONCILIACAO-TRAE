import { ref, computed } from 'vue'
import { useAPIsupabase } from '../useAPIsupabase'
import { useEmpresas } from '../useEmpresas'
import { useGlobalFilters } from '../useGlobalFilters'
import { useBancosEmpresa } from './useBancosEmpresa'
import { useAdquirenteDetector } from '~/composables/useAdquirenteDetector'
import { useScopedTableRead } from '~/composables/useScopedTableRead'

const EXTRATO_BASE_COLUMNS = 'data, descricao, valor, matriz'

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
  const { shouldUseScopedRead, readTablePage } = useScopedTableRead()
  const logExtrato = () => {}

  const limparTransacoesCarregadas = (novoFiltro = null) => {
    transacoes.value = []
    transacoesOriginais.value = []
    if (novoFiltro) {
      filtroAtivo.value = { ...novoFiltro }
    }
    salvarEstadoLocal({
      transacoes: [],
      transacoesOriginais: [],
      filtroAtivo: filtroAtivo.value
    })
  }
  
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
    'UNICA', 'SICREDI', 'AZULZINHA', 'TICKET', 'PLUXEE', 'ALELO', 'VR BENEFICIOS',
    'LE CARD',
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

  const aplicarFiltroMatrizNaQuery = (query, matrizEc) => {
    const matrizTexto = String(matrizEc || '').trim()
    if (!matrizTexto) return query

    const matrizNumero = Number(matrizTexto)
    if (!Number.isNaN(matrizNumero)) {
      // Algumas tabelas gravam matriz como texto e outras como número.
      return query.or(`matriz.eq.${matrizTexto},matriz.eq.${matrizNumero}`)
    }

    return query.eq('matriz', matrizTexto)
  }

  const buscarTodasTransacoesTabela = async (nomeTabela, dataInicial, dataFinal, matrizEc) => {
    const pageSize = 1000
    let offset = 0
    const todas = []

    while (true) {
      let data = []

      if (shouldUseScopedRead.value) {
        data = await readTablePage({
          table: nomeTabela,
          columns: EXTRATO_BASE_COLUMNS,
          from: offset,
          to: offset + pageSize - 1,
          filters: {
            matriz: matrizEc,
            dateColumn: 'data',
            dataInicial,
            dataFinal
          }
        })
      } else {
        let query = supabase
          .from(nomeTabela)
          .select(EXTRATO_BASE_COLUMNS)
          .range(offset, offset + pageSize - 1)

        if (dataInicial) { query = query.gte('data', dataInicial) }
        if (dataFinal) { query = query.lte('data', dataFinal) }
        query = aplicarFiltroMatrizNaQuery(query, matrizEc)

        const { data: queryData, error: queryError } = await query
        if (queryError) throw queryError
        data = queryData || []
      }

      if (!data || data.length === 0) break

      todas.push(...data)
      if (data.length < pageSize) break
      offset += pageSize
    }

    return todas
  }

  const mapearTransacaoExtrato = (transacao, banco) => {
    const det = detectarAdquirente(transacao.descricao, banco)

    return {
      ...transacao,
      banco,
      data_formatada: formatarData(transacao.data),
      adquirente_detectado: det ? det.base : null,
      categoria_detectada: det ? det.categoria : null
    }
  }

  const carregarTransacoesBanco = async (nomeEmpresa, banco, dataInicial, dataFinal, matrizEcEmpresa) => {
    const nomeTabela = await obterNomeTabela(nomeEmpresa, banco)
    if (!nomeTabela) {
      return []
    }

    const data = await buscarTodasTransacoesTabela(nomeTabela, dataInicial, dataFinal, matrizEcEmpresa)
    logExtrato('Resultado por tabela', {
      banco,
      nomeTabela,
      totalRegistros: data?.length || 0
    })

    return (data || []).map((transacao) => mapearTransacaoExtrato(transacao, banco))
  }

  const obterEcEmpresaSelecionada = async () => {
    if (!empresaSelecionada.value) return ''
    if (!empresas.value || empresas.value.length === 0) {
      await fetchEmpresas()
    }

    const empresaAtual = empresas.value.find(emp => emp.id == empresaSelecionada.value)
    return String(empresaAtual?.matriz || '').trim()
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
    if (forceReload) {
      limparTransacoesCarregadas(filtros)
    }
    
    try {
      const { bancoSelecionado, adquirente, dataInicial, dataFinal, strictErrors } = filtros
      logExtrato('Iniciando busca', {
        forceReload,
        empresaSelecionada: empresaSelecionada.value,
        bancoSelecionado,
        adquirente,
        dataInicial,
        dataFinal
      })
      
      if (!empresaSelecionada.value) { throw new Error('Nenhuma empresa selecionada') }
      
      // Buscar bancos da empresa primeiro
      await buscarBancosEmpresa()
    
      
      // Obter nome da empresa pelo ID
      const nomeEmpresa = await obterNomeEmpresa()
      const matrizEcEmpresa = await obterEcEmpresaSelecionada()
      logExtrato('Contexto da empresa', {
        nomeEmpresa,
        matrizEcEmpresa,
        bancosEmpresa: bancosEmpresa.value
      })
      
      if (!nomeEmpresa) { throw new Error('Nome da empresa não encontrado') }
      if (!matrizEcEmpresa) { throw new Error('EC (matriz) da empresa não encontrada') }
      
      // Verificar se a empresa tem bancos configurados
      if (!bancosEmpresa.value || bancosEmpresa.value.length === 0) { throw new Error('Empresa não possui bancos configurados') }
      
      let todasTransacoes = []
      const falhasLeitura = []
      
      if (bancoSelecionado && bancoSelecionado !== 'TODOS') {
        // Buscar de um banco específico
        try {
          todasTransacoes = await carregarTransacoesBanco(
            nomeEmpresa,
            bancoSelecionado,
            dataInicial,
            dataFinal,
            matrizEcEmpresa
          )
        } catch (queryError) {
          logExtrato('Erro ao buscar tabela', { banco: bancoSelecionado, erro: queryError?.message || queryError })
          falhasLeitura.push(`Extrato ${bancoSelecionado}: ${queryError?.message || queryError}`)
        }
      } else {
        // Buscar de todos os bancos da empresa em paralelo
        const resultadosPorBanco = await Promise.allSettled(
          bancosEmpresa.value.map(async (banco) => ({
            banco,
            transacoes: await carregarTransacoesBanco(nomeEmpresa, banco, dataInicial, dataFinal, matrizEcEmpresa)
          }))
        )

        resultadosPorBanco.forEach((resultado, index) => {
          if (resultado.status === 'fulfilled') {
            if (resultado.value.transacoes.length > 0) {
              todasTransacoes.push(...resultado.value.transacoes)
            }
            return
          }

          const banco = bancosEmpresa.value[index] || 'desconhecido'
          logExtrato('Erro ao buscar tabela', { banco, erro: resultado.reason?.message || resultado.reason })
          falhasLeitura.push(`Extrato ${banco}: ${resultado.reason?.message || resultado.reason}`)
        })
      }

      if (strictErrors && falhasLeitura.length > 0) {
        throw new Error(falhasLeitura.join(' | '))
      }
      
      // Ordenar por data (mais recente primeiro)
      todasTransacoes.sort((a, b) => {
        const dataA = new Date(a.data || 0)
        const dataB = new Date(b.data || 0)
        return dataB - dataA
      })
      
      // Armazenar dados originais
      transacoesOriginais.value = todasTransacoes
      logExtrato('Busca finalizada', {
        totalTransacoesOriginais: transacoesOriginais.value.length
      })
      
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
      limparTransacoesCarregadas(filtros)
      logExtrato('Falha na busca', { erro: error.value })
      throw err
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
        // Regra estrita: só considera adquirente detectado explicitamente.
        // Evita falso positivo por substring em nomes de pessoas (ex: JAMI[LE CARD]OSO).
        if (!transacao.adquirente_detectado) return false
        return String(transacao.adquirente_detectado).toUpperCase() === String(filtros.adquirente).toUpperCase()
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
    logExtrato('Filtros aplicados', {
      filtros,
      totalOriginais: transacoesOriginais.value.length,
      totalFiltradas: transacoes.value.length
    })
    
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
