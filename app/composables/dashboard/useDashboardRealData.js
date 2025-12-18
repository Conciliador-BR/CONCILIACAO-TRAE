import { ref, computed, watch } from 'vue'
import { useAllCompaniesDataFetcher } from '../PageVendas/filtrar_tabelas/useAllCompaniesDataFetcher'
import { useGlobalFilters } from '../useGlobalFilters'

export const useDashboardRealData = () => {
  const { buscarTodasEmpresas } = useAllCompaniesDataFetcher()
  const { filtrosGlobais } = useGlobalFilters()
  
  const loading = ref(false)
  const vendas = ref([])
  const erro = ref(null)

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

    const receitaTotal = vendas.value.reduce((acc, v) => acc + (Number(v.valor_bruto) || 0), 0)
    const lucroTotal = vendas.value.reduce((acc, v) => acc + (Number(v.valor_liquido) || 0), 0)
    const taxasTotal = vendas.value.reduce((acc, v) => acc + (Number(v.valor_bruto || 0) - Number(v.valor_liquido || 0)), 0)
    
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
      const nome = v.empresa || 'Desconhecida'
      if (!empresasMap[nome]) {
        empresasMap[nome] = { nome, receita: 0, taxasTotal: 0, count: 0 }
      }
      const valor = Number(v.valor_bruto) || 0
      const liquido = Number(v.valor_liquido) || 0
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
  const economias = ref({
    negociacaoTaxas: 0,
    otimizacaoBandeiras: 0,
    consolidacaoAdquirentes: 0,
    total: 0
  })

  // Dados para Gráficos
  const dadosGraficos = computed(() => {
    // Agrupamentos
    const porAdquirente = {}
    const porBandeira = {}
    const porMes = {}

    vendas.value.forEach(v => {
      // Adquirente
      const adq = v.adquirente || 'Outros'
      porAdquirente[adq] = (porAdquirente[adq] || 0) + (Number(v.valor_bruto) || 0)

      // Bandeira
      const band = v.bandeira || 'Outros'
      porBandeira[band] = (porBandeira[band] || 0) + (Number(v.valor_bruto) || 0)

      // Mês (Data Venda)
      if (v.data_venda) {
        const data = new Date(v.data_venda)
        const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`
        if (!porMes[mesAno]) {
          porMes[mesAno] = { receita: 0, lucro: 0, volume: 0 }
        }
        porMes[mesAno].receita += (Number(v.valor_bruto) || 0)
        porMes[mesAno].lucro += (Number(v.valor_liquido) || 0)
        porMes[mesAno].volume += 1
      }
    })

    return {
      adquirente: porAdquirente,
      bandeira: porBandeira,
      historico: porMes
    }
  })

  // Comparativo Anual (Mockado ou calculado básico)
  const dadosComparativo = computed(() => {
    // Tentar extrair anos dos dados
    const anos = {}
    vendas.value.forEach(v => {
      if (v.data_venda) {
        const ano = new Date(v.data_venda).getFullYear()
        if (!anos[ano]) anos[ano] = { receita: 0, custos: 0 }
        const valor = Number(v.valor_bruto) || 0
        const liquido = Number(v.valor_liquido) || 0
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
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }, {
        label: 'Custos (Taxas)',
        data: labels.length ? custosData : [0],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgb(239, 68, 68)',
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
        dataFinal: filtrosGlobais.dataFinal || new Date().toISOString().split('T')[0]
      }
      
      const dados = await buscarTodasEmpresas(filtros)
      vendas.value = dados
    } catch (e) {
      console.error('Erro ao carregar dashboard:', e)
      erro.value = e.message
    } finally {
      loading.value = false
    }
  }

  // Watch filtros globais to reload
  watch(() => [filtrosGlobais.dataInicial, filtrosGlobais.dataFinal, filtrosGlobais.empresaSelecionada], () => {
    carregarDados()
  }, { deep: true })

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
