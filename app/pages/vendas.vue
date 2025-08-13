<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Cabeçalho -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">Vendas</h1>
        <p class="text-gray-600">Gerenciamento de vendas e operações</p>
      </div>
    </div>

    <div class="max-w-7xl mx-auto p-6 space-y-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Vendas</h1>
        <p class="text-gray-600">Gerenciamento de vendas e operações</p>
      </div>
      
      <!-- Resumo Financeiro -->
      <ResumoFinanceiro :resumo="resumoCalculado" />
      
      <!-- Filtros -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SeletorEmpresa 
          v-model="empresaSelecionada"
          :empresas="empresas"
          @empresa-changed="filtrarDados"
        />
        <FiltroData 
          v-model="filtroData"
          @data-changed="filtrarDados"
        />
      </div>

      <!-- Grade de Vendas -->
      <GradeVendas 
        v-model="vendas"
        @vendas-changed="atualizarResumo"
      />
    </div>
  </div>
</template>

<script setup>
// Configurações da página
useHead({
  title: 'Vendas - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Gerenciamento de vendas' }
  ]
})

// Estados reativos
const empresaSelecionada = ref('')
const filtroData = ref({
  dataInicial: '',
  dataFinal: ''
})
const vendas = ref([])
const resumoCalculado = ref({})

// Dados das empresas (será substituído pelo componente Empresas)
const empresas = ref([])

// Função para calcular resumo
const calcularResumo = (vendasFiltradas) => {
  const resumo = {
    vendasBrutas: 0,
    qtdVendasBrutas: 0,
    taxa: 0,
    taxaMedia: 0,
    vendasLiquidas: 0,
    qtdVendasLiquidas: 0,
    debitos: 0,
    qtdDebitos: 0,
    rejeitados: 0,
    qtdRejeitados: 0,
    totalLiquido: 0
  }
  
  vendasFiltradas.forEach(venda => {
    if (venda.vendaBruto > 0) {
      resumo.vendasBrutas += venda.vendaBruto
      resumo.qtdVendasBrutas++
    }
    
    if (venda.valorTaxa > 0) {
      resumo.taxa += venda.valorTaxa
    }
    
    if (venda.vendaLiquido > 0) {
      resumo.vendasLiquidas += venda.vendaLiquido
      resumo.qtdVendasLiquidas++
    }
  })
  
  resumo.totalLiquido = resumo.vendasBrutas - resumo.taxa
  resumo.taxaMedia = resumo.vendasBrutas > 0 ? (resumo.taxa / resumo.vendasBrutas) * 100 : 0
  
  return resumo
}

// Função para filtrar dados
const filtrarDados = () => {
  let vendasFiltradas = [...vendas.value]
  
  // Filtro por empresa
  if (empresaSelecionada.value) {
    const empresaNome = empresas.value.find(e => e.id == empresaSelecionada.value)?.nome
    vendasFiltradas = vendasFiltradas.filter(v => v.empresa === empresaNome)
  }
  
  // Filtro por data
  if (filtroData.value.dataInicial && filtroData.value.dataFinal) {
    vendasFiltradas = vendasFiltradas.filter(v => {
      const dataVenda = v.previsaoPagamento
      return dataVenda >= filtroData.value.dataInicial && dataVenda <= filtroData.value.dataFinal
    })
  }
  
  atualizarResumo(vendasFiltradas)
}

// Função para atualizar resumo
const atualizarResumo = (vendasParaCalculo = vendas.value) => {
  resumoCalculado.value = calcularResumo(vendasParaCalculo)
}

// Watchers
watch(vendas, () => {
  filtrarDados()
}, { deep: true })

// Inicialização
onMounted(() => {
  // Carregar empresas do componente
  const { getEmpresas } = useEmpresas()
  empresas.value = getEmpresas()
  
  atualizarResumo()
})

// Importações necessárias
import GradeVendas from '~/components/vendas-operadoras/GradeVendas.vue'
</script>