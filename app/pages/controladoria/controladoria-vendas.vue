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
    adquirente: 'VISA ÚNICA',
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
    adquirente: 'VISA ELECTRON ÚNICA',
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
    adquirente: 'VISA SUPERMERCADO CRÉDITO ÚNICA',
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
    adquirente: 'MAESTRO DÉBITO ÚNICA',
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