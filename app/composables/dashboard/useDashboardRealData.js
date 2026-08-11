import { computed, watch, onUnmounted } from 'vue'
import { useAllCompaniesDataFetcher } from '../PageVendas/filtrar_tabelas/useAllCompaniesDataFetcher'
import { useSpecificCompanyDataFetcher } from '../PageVendas/filtrar_tabelas/useSpecificCompanyDataFetcher'
import { useGlobalFilters } from '../useGlobalFilters'
import { useVendas } from '../useVendas'

export const useDashboardRealData = () => {
  const { buscarTodasEmpresas } = useAllCompaniesDataFetcher()
  const { buscarEmpresaEspecifica } = useSpecificCompanyDataFetcher()
  const { filtrosGlobais, escutarEvento } = useGlobalFilters()
  const { vendas: vendasCompartilhadas, vendasOriginais } = useVendas()
  
  // Estado persistente usando useState (preserva dados na navegação client-side)
  const vendas = useState('dashboard_vendas', () => [])
  const loading = useState('dashboard_loading', () => false)
  const erro = useState('dashboard_erro', () => null)

  const obterValorBruto = (venda = {}) => Number(venda?.valor_bruto ?? venda?.vendaBruta ?? 0) || 0
  const obterValorLiquido = (venda = {}) => Number(venda?.valor_liquido ?? venda?.vendaLiquida ?? 0) || 0
  const obterAdquirente = (venda = {}) => venda?.adquirente || 'Outros'
  const obterBandeira = (venda = {}) => venda?.bandeira || 'Outros'
  const obterEmpresa = (venda = {}) => venda?.empresa || 'Desconhecida'
  const obterDataVenda = (venda = {}) => {
    const valor = String(venda?.data_venda || venda?.dataVenda || '').trim()
    if (!valor) return null

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
      const [dia, mes, ano] = valor.split('/')
      return new Date(`${ano}-${mes}-${dia}T00:00:00`)
    }

    const data = new Date(valor)
    return Number.isNaN(data.getTime()) ? null : data
  }

  // KPIs
  const kpis = computed(() => {
    if (!vendas.value.length) return {
      receitaMensal: 0,
      crescimentoReceita: 0,
      lucroLiquido: 0,
      crescimentoLucro: 0,
      taxaMediaMdr: 0,
      reducaoTaxa: 0,
      fluxoCaixa: 0,
      statusFluxo: 'Neutro'
    }

    const receitaTotal = vendas.value.reduce((acc, v) => acc + obterValorBruto(v), 0)
    const lucroTotal = vendas.value.reduce((acc, v) => acc + obterValorLiquido(v), 0)
    const taxasTotal = vendas.value.reduce((acc, v) => acc + (obterValorBruto(v) - obterValorLiquido(v)), 0)
    
    // Taxa média ponderada
    const taxaMedia = receitaTotal > 0 ? (taxasTotal / receitaTotal) * 100 : 0

    return {
      receitaMensal: receitaTotal,
      crescimentoReceita: 0,
      lucroLiquido: lucroTotal,
      crescimentoLucro: 0,
      taxaMediaMdr: Number(taxaMedia.toFixed(2)),
      reducaoTaxa: 0,
      fluxoCaixa: lucroTotal,
      statusFluxo: 'Positivo'
    }
  })

  // Performance por Empresa
  const performanceEmpresas = computed(() => {
    const empresasMap = {}
    vendas.value.forEach(v => {
      const nome = obterEmpresa(v)
      if (!empresasMap[nome]) {
        empresasMap[nome] = { nome, receita: 0, taxasTotal: 0, count: 0 }
      }
      const valor = obterValorBruto(v)
      const liquido = obterValorLiquido(v)
      empresasMap[nome].receita += valor
      empresasMap[nome].taxasTotal += (valor - liquido)
      empresasMap[nome].count++
    })

    return Object.values(empresasMap).map(e => ({
      nome: e.nome,
      receita: e.receita,
      taxaMedia: e.receita > 0 ? Number(((e.taxasTotal / e.receita) * 100).toFixed(2)) : 0,
      crescimento: 0,
      status: 'Bom'
    })).sort((a, b) => b.receita - a.receita)
  })

  // Economias (Mock por enquanto, mas estrutura mantida)
  const economias = useState('dashboard_economias', () => ({
    negociacaoTaxas: 0,
    otimizacaoBandeiras: 0,
    consolidacaoAdquirentes: 0,
    total: 0
  }))

  // Dados para Gráficos
  const dadosGraficos = computed(() => {
    // Agrupamentos
    const porAdquirente = {}
    const porBandeira = {}
    const porMes = {}

    vendas.value.forEach(v => {
      // Adquirente
      const adq = obterAdquirente(v)
      porAdquirente[adq] = (porAdquirente[adq] || 0) + obterValorBruto(v)

      // Bandeira
      const band = obterBandeira(v)
      porBandeira[band] = (porBandeira[band] || 0) + obterValorBruto(v)

      // Mês (Data Venda)
      const data = obterDataVenda(v)
      if (data) {
        const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`
        if (!porMes[mesAno]) {
          porMes[mesAno] = { receita: 0, lucro: 0, volume: 0 }
        }
        porMes[mesAno].receita += obterValorBruto(v)
        porMes[mesAno].lucro += obterValorLiquido(v)
        porMes[mesAno].volume += 1
      }
    })

    return {
      adquirente: porAdquirente,
      bandeira: porBandeira,
      historico: porMes
    }
  })

  // Comparativo Anual
  const dadosComparativo = computed(() => {
    const anos = {}
    vendas.value.forEach(v => {
      const data = obterDataVenda(v)
      if (data) {
        const ano = data.getFullYear()
        if (!anos[ano]) anos[ano] = { receita: 0, custos: 0 }
        const valor = obterValorBruto(v)
        const liquido = obterValorLiquido(v)
        anos[ano].receita += valor
        anos[ano].custos += (valor - liquido)
      }
    })

    const labels = Object.keys(anos).sort()
    const receitaData = labels.map(a => anos[a].receita)
    const custosData = labels.map(a => anos[a].custos)

    return {
      labels: labels.length ? labels : ['2024'],
      datasets: [{
        label: 'Receita',
        data: labels.length ? receitaData : [0],
        backgroundColor: 'rgba(16, 42, 67, 0.85)',
        borderColor: '#102A43',
        borderWidth: 1
      }, {
        label: 'Custos (Taxas)',
        data: labels.length ? custosData : [0],
        backgroundColor: 'rgba(181, 106, 0, 0.85)',
        borderColor: '#B56A00',
        borderWidth: 1
      }]
    }
  })

  const carregarDados = async () => {
    loading.value = true
    erro.value = null
    try {
      // Se não houver filtro de data, definir padrão (mês atual ou últimos 30 dias)
      const filtros = {
        dataInicial: filtrosGlobais.dataInicial || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        dataFinal: filtrosGlobais.dataFinal || new Date().toISOString().split('T')[0],
        empresaSelecionada: filtrosGlobais.empresaSelecionada // Garante que usa o valor atual
      }
      
      let dados = []
      
      // Verificar se há uma empresa específica selecionada
      if (filtros.empresaSelecionada) {
        dados = await buscarEmpresaEspecifica(filtros)
      } else {
        dados = await buscarTodasEmpresas(filtros)
      }
      
      vendas.value = dados
    } catch (e) {
      console.error('Erro ao carregar dashboard:', e)
      erro.value = e.message
    } finally {
      loading.value = false
    }
  }

  const sincronizarComVendasCompartilhadas = () => {
    const origem = (vendasCompartilhadas.value?.length ? vendasCompartilhadas.value : vendasOriginais.value) || []
    vendas.value = Array.isArray(origem) ? [...origem] : []
  }

  // Listener para o evento de aplicar filtro
  let removeListener = null
  
  // Inicializar
  const init = () => {
    // Configurar listener se ainda não existir
    if (!removeListener) {
      // Escutar evento específico do dashboard (emitido pelo useGlobalFilters ao clicar em aplicar)
      removeListener = escutarEvento('filtrar-dashboard', async (contexto = {}) => {
        if (contexto?.__fromGlobalFilter && contexto?.__preloaded?.vendas) {
          sincronizarComVendasCompartilhadas()
          return
        }

        await carregarDados()
      })
    }
  }

  // Cleanup ao desmontar componente que usa este composable
  // OBS: Como queremos persistência, talvez não devamos remover o listener se o composable for recriado.
  // Mas em Nuxt 3, composables são executados no setup.
  // O melhor é registrar o listener no onMounted do componente ou garantir que ele seja limpo.
  // Como este composable retorna 'carregarDados', quem o consome pode chamar no onMounted.
  // Vamos expor o init para ser chamado no componente.

  onUnmounted(() => {
    if (removeListener) {
      removeListener()
      removeListener = null
    }
  })

  // Chamar init automaticamente (padrão Vue 3 composables stateful)
  // Porém, cuidado com múltiplas instâncias. O useState protege o estado, mas o listener pode duplicar.
  // O ideal é chamar init() no setup.
  init()

  return {
    kpis,
    economias,
    performanceEmpresas,
    dadosComparativo,
    dadosGraficos,
    loading,
    carregarDados
  }
}
