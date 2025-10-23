<template>
  <div class="space-y-8">
    <!-- Header Component -->
    <ControladoriaVendasHeader 
      :adquirentes-count="vendasData.length"
      :venda-liquida="totais.vendaLiquida"
    />

    <!-- Stats Component -->
    <ControladoriaVendasStats 
      :totais="totais"
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
      :vendas-data="vendasData"
      :totais="totais"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGlobalFilters } from '~/composables/useGlobalFilters'

// Importações explícitas dos componentes
import ControladoriaVendasHeader from '~/components/controladoria/controladoria-vendas/ControladoriaVendasHeader.vue'
import ControladoriaVendasStats from '~/components/controladoria/controladoria-vendas/ControladoriaVendasStats.vue'
import ControladoriaVendasTableComplete from '~/components/controladoria/controladoria-vendas/ControladoriaVendasTableComplete.vue'

// Configurações da página
useHead({
  title: 'Controladoria - Vendas - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Gestão de vendas da controladoria' }
  ]
})

// Event Bus Global para filtros
const { escutarEvento } = useGlobalFilters()

// Dados de exemplo baseados no print
const vendasData = ref([
  {
    adquirente: 'VISA',
    debito: 0,
    credito: 36635.04,
    credito2x: 25921.29,
    credito3x: 20509.22,
    credito4x5x6x: 0,
    voucher: 0,
    coluna1: 1639.15,
    despesasTaxa: 0,
    despesasCartao: 0,
    vendaLiquida: 81426.40
  },
  {
    adquirente: 'MASTERCARD',
    debito: 154751.54,
    credito: 0,
    credito2x: 0,
    credito3x: 0,
    credito4x5x6x: 0,
    voucher: 0,
    coluna1: 1330.86,
    despesasTaxa: 0,
    despesasCartao: 0,
    vendaLiquida: 153420.68
  },
  {
    adquirente: 'ELO',
    debito: 0,
    credito: 80420.38,
    credito2x: 34352.22,
    credito3x: 0,
    credito4x5x6x: 0,
    voucher: 0,
    coluna1: 2684.99,
    despesasTaxa: 0,
    despesasCartao: 0,
    vendaLiquida: 113427.6
  },
  {
    adquirente: 'AMEX',
    debito: 82045.96,
    credito: 0,
    credito2x: 0,
    credito3x: 0,
    credito4x5x6x: 0,
    voucher: 0,
    coluna1: 705.60,
    despesasTaxa: 0,
    despesasCartao: 0,
    vendaLiquida: 81340.36
  },
  {
    adquirente: 'HIPERCARD',
    debito: 45000.00,
    credito: 25000.00,
    credito2x: 15000.00,
    credito3x: 10000.00,
    credito4x5x6x: 5000.00,
    voucher: 0,
    coluna1: 800.00,
    despesasTaxa: 0,
    despesasCartao: 0,
    vendaLiquida: 99200.00
  },
  {
    adquirente: 'BANESCARD',
    debito: 30000.00,
    credito: 20000.00,
    credito2x: 10000.00,
    credito3x: 5000.00,
    credito4x5x6x: 0,
    voucher: 0,
    coluna1: 500.00,
    despesasTaxa: 0,
    despesasCartao: 0,
    vendaLiquida: 64500.00
  },
  {
    adquirente: 'TRICARD',
    debito: 15000.00,
    credito: 12000.00,
    credito2x: 8000.00,
    credito3x: 3000.00,
    credito4x5x6x: 2000.00,
    voucher: 0,
    coluna1: 300.00,
    despesasTaxa: 0,
    despesasCartao: 0,
    vendaLiquida: 39700.00
  }
])

// Computed para totais
const totais = computed(() => {
  return vendasData.value.reduce((acc, item) => {
    acc.debito += item.debito
    acc.credito += item.credito
    acc.credito2x += item.credito2x
    acc.credito3x += item.credito3x
    acc.credito4x5x6x += item.credito4x5x6x
    acc.voucher += item.voucher
    acc.coluna1 += item.coluna1
    acc.despesasTaxa += item.despesasTaxa
    acc.despesasCartao += item.despesasCartao
    acc.vendaLiquida += item.vendaLiquida
    return acc
  }, {
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
  })
})

// Handler para filtros globais
const filtrarVendasControladoria = async (filtros) => {
  console.log('Filtrando vendas da controladoria com:', filtros)
  // TODO: Implementar lógica de filtro específica para controladoria de vendas
}

let removerListener

onMounted(() => {
  // Escuta eventos de filtro específicos para controladoria de vendas
  removerListener = escutarEvento('filtrar-controladoria-vendas', filtrarVendasControladoria)
})

onUnmounted(() => {
  // Remove o listener ao desmontar a página
  if (removerListener) removerListener()
})
</script>