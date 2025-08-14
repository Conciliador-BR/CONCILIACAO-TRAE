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

      <!-- VendasContainer -->
      <VendasContainer 
        v-model="vendas"
        :empresa-selecionada="empresaSelecionadaNome"
        @update:model-value="atualizarVendas"
      />
    </div>
  </div>
</template>

<script setup>
// Imports necessários
import { ref, computed, watch, onMounted } from 'vue'
import { useEmpresas } from '~/composables/useEmpresas'
import { useResumoFinanceiro } from '~/composables/useResumoFinanceiro'
import VendasContainer from '~/components/vendas-operadoras/VendasContainer.vue'

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

// Dados das empresas
const empresas = ref([])

// Usar o composable de resumo financeiro
const { resumoCalculado } = useResumoFinanceiro(vendas)

// Computed para nome da empresa selecionada
const empresaSelecionadaNome = computed(() => {
  if (!empresaSelecionada.value) return ''
  const empresa = empresas.value.find(e => e.id == empresaSelecionada.value)
  return empresa?.nome || ''
})

// Métodos
const filtrarDados = () => {
  console.log('Filtrando dados...')
  // Lógica de filtro será implementada aqui
}

const atualizarVendas = (novasVendas) => {
  vendas.value = novasVendas
}

// Inicialização
onMounted(async () => {
  const { empresas: empresasData, fetchEmpresas } = useEmpresas()
  await fetchEmpresas()
  empresas.value = empresasData.value
})
</script>