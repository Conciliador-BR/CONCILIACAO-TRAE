<template>
  <div class="space-y-6">
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
import { onMounted, onUnmounted } from 'vue'
import { useGlobalFilters } from '~/composables/useGlobalFilters'

// Configurações da página
useHead({
  title: 'Controladoria - Recebimentos - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Gestão de recebimentos' }
  ]
})

// Event Bus Global para filtros
const { escutarEvento } = useGlobalFilters()

// Handler para filtros globais
const filtrarRecebimentos = async (filtros) => {
  console.log('Filtrando recebimentos com:', filtros)
  // TODO: Implementar lógica de filtro específica para recebimentos
}

let removerListener

onMounted(() => {
  // Escuta eventos de filtro específicos para recebimentos
  removerListener = escutarEvento('filtrar-controladoria-recebimentos', filtrarRecebimentos)
})

onUnmounted(() => {
  // Remove o listener ao desmontar a página
  if (removerListener) removerListener()
})
</script>