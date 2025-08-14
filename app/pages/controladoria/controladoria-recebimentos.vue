<template>
  <div class="space-y-6">
    <!-- Filtros (IndexFilters) -->
    <IndexFilters 
      :empresa-selecionada="empresaSelecionada"
      :filtro-data="filtroData"
      :empresas="empresas"
      @update:empresa-selecionada="empresaSelecionada = $event"
      @update:filtro-data="filtroData = $event"
      @empresa-changed="onEmpresaChanged"
      @data-changed="onDataChanged"
      @aplicar-filtro="aplicarFiltro"
    />

    <!-- Conteúdo da página -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Módulo de Recebimentos</h2>
        <p class="text-gray-600">Em desenvolvimento...</p>
        <div class="mt-6">
          <div class="inline-flex items-center px-4 py-2 bg-blue-100 border border-blue-200 rounded-lg">
            <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="text-blue-800 font-medium">Funcionalidade será implementada em breve</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useEmpresas } from '~/composables/useEmpresas'
import IndexFilters from '~/components/index/IndexFilters.vue'

// Configurações da página
useHead({
  title: 'Controladoria - Recebimentos - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Gestão de recebimentos' }
  ]
})

// Estados reativos
const empresaSelecionada = ref('')
const filtroData = reactive({
  dataInicial: '',
  dataFinal: ''
})

// Composables
// ❌ REMOVER ESTAS LINHAS:
// const { getEmpresas } = useEmpresas()
// const empresas = getEmpresas()

// ✅ SUBSTITUIR POR:
const { empresas, fetchEmpresas } = useEmpresas()

// ✅ ADICIONAR onMounted:
onMounted(async () => {
  await fetchEmpresas()
})

// Métodos
const onEmpresaChanged = (novaEmpresa) => {
  console.log('Empresa alterada para:', novaEmpresa)
}

const onDataChanged = (novaData) => {
  console.log('Data alterada para:', novaData)
}

const aplicarFiltro = (filtro) => {
  console.log('Aplicando filtro:', filtro)
}
</script>