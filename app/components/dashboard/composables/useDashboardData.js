export const useDashboardData = (vendas = [], taxas = []) => {
  const kpis = ref({
    receitaMensal: 145000,
    crescimentoReceita: 12.5,
    lucroLiquido: 87300,
    crescimentoLucro: 8.2,
    taxaMediaMdr: 2.84,
    reducaoTaxa: 0.3,
    fluxoCaixa: 234500,
    statusFluxo: 'Positivo'
  })

  const economias = ref({
    negociacaoTaxas: 15000,
    otimizacaoBandeiras: 8500,
    consolidacaoAdquirentes: 12000,
    total: 35500
  })

  const performanceEmpresas = ref([
    { nome: 'UNIMED SUPERMERCADOS LTDA', receita: 89000, taxaMedia: 2.65, crescimento: 15.2, status: 'Excelente' },
    { nome: 'EMPRESA TESTE A', receita: 34000, taxaMedia: 2.90, crescimento: -2.1, status: 'Atenção' },
    { nome: 'EMPRESA TESTE B', receita: 22000, taxaMedia: 3.10, crescimento: 8.7, status: 'Bom' }
  ])

  const dadosComparativo = {
    labels: ['2022', '2023', '2024 (proj.)'],
    datasets: [{
      label: 'Receita',
      data: [1200000, 1450000, 1680000],
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1
    }, {
      label: 'Custos',
      data: [850000, 980000, 1120000],
      backgroundColor: 'rgba(239, 68, 68, 0.8)',
      borderColor: 'rgb(239, 68, 68)',
      borderWidth: 1
    }]
  }

  // Função para calcular KPIs baseado nos dados reais
  const calcularKPIs = () => {
    if (vendas.length > 0) {
      // Calcular receita mensal baseada nas vendas
      const receitaTotal = vendas.reduce((total, venda) => total + (venda.valor || 0), 0)
      kpis.value.receitaMensal = receitaTotal
    }

    if (taxas.length > 0) {
      // Calcular taxa média baseada nas taxas cadastradas
      const taxaMedia = taxas.reduce((total, taxa) => total + (taxa.percentualTaxa || 0), 0) / taxas.length
      kpis.value.taxaMediaMdr = taxaMedia
    }
  }

  // Observar mudanças nos dados
  watch([vendas, taxas], () => {
    calcularKPIs()
  }, { immediate: true })

  return {
    kpis,
    economias,
    performanceEmpresas,
    dadosComparativo,
    calcularKPIs
  }
}