<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Conciliações de Vendas</h1>
        <p class="text-gray-600">Análise detalhada por adquirente e modalidade de pagamento</p>
      </div>
      <div class="flex items-center space-x-4">
        <div class="bg-blue-50 px-4 py-2 rounded-lg">
          <span class="text-sm font-medium text-blue-700">{{ adquirentesCount }} Adquirentes</span>
        </div>
        <div class="bg-green-50 px-4 py-2 rounded-lg">
          <span class="text-sm font-medium text-green-700">{{ formatCurrency(vendaLiquida) }}</span>
        </div>
        <ControladoriaVendasExportPdf />
        <ControladoriaVendasExportExcel :grupos-por-adquirente="gruposPorAdquirente" :totais-gerais="totaisGerais" />
      </div>
    </div>
  </div>
</template>

<script setup>
import ControladoriaVendasExportPdf from '~/components/controladoria/controladoria-vendas/ControladoriaVendasExportPdf.vue'
import ControladoriaVendasExportExcel from '~/components/controladoria/controladoria-vendas/ControladoriaVendasExportExcel.vue'
// Props
const props = defineProps({
  adquirentesCount: {
    type: Number,
    required: true
  },
  vendaLiquida: {
    type: Number,
    required: true
  },
  gruposPorAdquirente: {
    type: Array,
    required: true
  },
  totaisGerais: {
    type: Object,
    required: true
  }
})

// Métodos
const formatCurrency = (value) => {
  if (value === 0) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}
</script>