<template>
  <div class="space-y-8">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">Carregando dados...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Erro ao carregar dados</h3>
          <p class="mt-1 text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Header Component -->
      <ControladoriaVendasHeader 
        :adquirentes-count="vendasAgrupadas.length"
        :venda-liquida="totaisGerais.vendaLiquida"
        :loading="loading"
      />

      <!-- Stats Component -->
      <ControladoriaVendasStats 
        :totais="totaisGerais"
        :loading="loading"
      />

      <!-- Detalhamento por Adquirente -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-md">
        <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 class="text-xl font-semibold text-gray-800">Detalhamento por Adquirente</h3>
          <p class="text-sm text-gray-600 mt-1">Análise completa das transações por modalidade</p>
        </div>
      </div>

      <!-- Table Component -->
      <ControladoriaVendasTableComplete 
        :vendas-data="vendasAgrupadas"
        :totais="totaisGerais"
        :loading="loading"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

// Importações explícitas dos componentes
import ControladoriaVendasHeader from '~/components/controladoria/controladoria-vendas/ControladoriaVendasHeader.vue'
import ControladoriaVendasStats from '~/components/controladoria/controladoria-vendas/ControladoriaVendasStats.vue'
import ControladoriaVendasTableComplete from '~/components/controladoria/controladoria-vendas/ControladoriaVendasTableComplete.vue'

// Importações dos composables
import { useControladoriaVendas, useControladoriaFiltros, useControladoriaCalculos } from '~/composables/PageControladoria'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useVendas } from '~/composables/useVendas'

// Registrar visita à aba de vendas
const registrarVisitaVendas = () => {
  if (process.client) {
    localStorage.setItem('controladoria_ultima_aba', 'vendas')
  }
}

// Configuração da página
useHead({
  title: 'Controladoria - Vendas | MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Análise detalhada das vendas por adquirente e modalidade de pagamento' }
  ]
})

// Composables
const { 
  vendasData, 
  loading, 
  error, 
  vendasAgrupadas, 
  totaisGerais, 
  buscarVendasUnica,
  processarDadosVendas
} = useControladoriaVendas()

const { 
  filtrosAtivos, 
  limparFiltros, 
  validarFiltros 
} = useControladoriaFiltros()

const { 
  estatisticasPorBandeira, 
  rankingBandeiras, 
  distribuicaoModalidade, 
  metricsPerformance, 
  formatarMoeda 
} = useControladoriaCalculos(vendasAgrupadas, totaisGerais)

// Integração com filtros globais e dados de vendas
const { escutarEvento, filtrosGlobais } = useGlobalFilters()
const { fetchVendas, aplicarFiltros: aplicarFiltrosVendas } = useVendas()

// Computed para totais (mantendo compatibilidade com componentes existentes)
const totais = computed(() => {
  return totaisGerais.value || {
    debito: 0,
    credito: 0,
    credito2x: 0,
    credito3x: 0,
    credito4x5x6x: 0,
    voucher: 0,
    coluna1: 0,
    despesasTaxa: 0,
    despesasCartao: 0,
    vendaLiquida: 0
  }
})

// Função para sincronizar com dados de vendas
const sincronizarComVendas = async () => {
  try {
    await fetchVendas()
    processarDadosVendas()
  } catch (err) {}
}

// Handler para filtros globais
const aplicarFiltrosControladoria = async (dadosFiltros) => {
  // Aplicar filtros na página vendas primeiro
  const filtrosFormatados = {
    empresa: dadosFiltros.empresaSelecionada || '',
    dataInicial: dadosFiltros.dataInicial || '',
    dataFinal: dadosFiltros.dataFinal || ''
  }
  
  // Aplicar filtros nas vendas (isso automaticamente atualizará a controladoria via watchers)
  await aplicarFiltrosVendas(filtrosFormatados)
}

// Variável para armazenar a função de cleanup do listener
let removerListener

// Lifecycle hooks
onMounted(async () => {
  await sincronizarComVendas()
  if (filtrosGlobais.empresaSelecionada || filtrosGlobais.dataInicial || filtrosGlobais.dataFinal) {
    await aplicarFiltrosControladoria({
      empresaSelecionada: filtrosGlobais.empresaSelecionada,
      dataInicial: filtrosGlobais.dataInicial,
      dataFinal: filtrosGlobais.dataFinal
    })
  }
  removerListener = escutarEvento('filtrar-controladoria-vendas', aplicarFiltrosControladoria)
  registrarVisitaVendas()
})

onUnmounted(() => {
  // Cleanup do listener
  if (removerListener) {
    removerListener()
  }
})
</script>