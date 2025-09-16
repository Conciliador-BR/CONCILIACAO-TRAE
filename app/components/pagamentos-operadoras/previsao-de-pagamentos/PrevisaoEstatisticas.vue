<template>
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
    <h3 class="text-lg font-semibold text-blue-800 mb-3">📊 Estatísticas da Tabela</h3>
    
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <!-- Contadores básicos -->
      <div class="bg-white p-3 rounded shadow-sm">
        <div class="text-gray-600">Total de Registros</div>
        <div class="text-2xl font-bold text-blue-600">{{ totalRegistros }}</div>
      </div>
      
      <div class="bg-white p-3 rounded shadow-sm">
        <div class="text-gray-600">Com Previsão Calculada</div>
        <div class="text-2xl font-bold text-green-600">{{ registrosComPrevisao }}</div>
      </div>
      
      <div class="bg-white p-3 rounded shadow-sm">
        <div class="text-gray-600">Taxa Não Cadastrada</div>
        <div class="text-2xl font-bold text-orange-600">{{ registrosSemTaxa }}</div>
      </div>
      
      <div class="bg-white p-3 rounded shadow-sm">
        <div class="text-gray-600">Com Erro</div>
        <div class="text-2xl font-bold text-red-600">{{ registrosComErro }}</div>
      </div>
    </div>
    
    <!-- Estatísticas por modalidade -->
    <div class="mt-4">
      <h4 class="font-medium text-gray-700 mb-2">Por Modalidade:</h4>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
        <div v-for="(count, modalidade) in estatisticasPorModalidade" :key="modalidade" 
             class="bg-white p-2 rounded border">
          <div class="font-medium">{{ modalidade }}</div>
          <div class="text-blue-600">{{ count }} registros</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  vendas: Array
})

const totalRegistros = computed(() => props.vendas?.length || 0)

const registrosComPrevisao = computed(() => {
  return props.vendas?.filter(v => 
    v.previsaoPgto && 
    v.previsaoPgto !== 'Taxa não cadastrada' && 
    v.previsaoPgto !== 'Erro' &&
    v.previsaoPgto !== 'Carregando...'
  ).length || 0
})

const registrosSemTaxa = computed(() => {
  return props.vendas?.filter(v => v.previsaoPgto === 'Taxa não cadastrada').length || 0
})

const registrosComErro = computed(() => {
  return props.vendas?.filter(v => v.previsaoPgto === 'Erro').length || 0
})

const estatisticasPorModalidade = computed(() => {
  const stats = {}
  props.vendas?.forEach(venda => {
    const modalidade = venda.modalidade || 'Não informado'
    stats[modalidade] = (stats[modalidade] || 0) + 1
  })
  return stats
})
</script>