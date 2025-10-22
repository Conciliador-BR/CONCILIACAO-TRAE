<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div class="max-w-8xl mx-auto p-6 space-y-8">
      <!-- Header -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-200">
          <h1 class="text-3xl font-bold text-gray-900">Recebimentos</h1>
          <p class="text-sm text-gray-600 mt-1">Controle de recebimentos</p>
        </div>
      </div>

      <!-- Container de Recebimentos -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="p-8">
          <RecebimentosContainer :vendas="vendas" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useVendas } from '~/composables/useVendas'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import RecebimentosContainer from '~/components/pagamentos-operadoras/recebimentos/RecebimentosContainer.vue'

// Configurações da página
useHead({
  title: 'Recebimentos - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Controle de recebimentos' }
  ]
})

// Usar dados de vendas para recebimentos
const { vendas, loading, error, fetchVendas, aplicarFiltros } = useVendas()

// Usar filtros globais
const { escutarEvento, filtrosGlobais } = useGlobalFilters()

// Função para aplicar filtros de recebimentos
const aplicarFiltrosRecebimentos = (dadosFiltros) => {
  console.log('🔄 [RECEBIMENTOS] Filtros globais recebidos:', dadosFiltros)
  
  const filtrosFormatados = {
    empresa: dadosFiltros.empresaSelecionada || '',
    dataInicial: dadosFiltros.dataInicial || '',
    dataFinal: dadosFiltros.dataFinal || ''
  }
  
  aplicarFiltros(filtrosFormatados)
}

// Variável para armazenar a função de cleanup do listener
let removerListener

// Carregar dados ao montar
onMounted(async () => {
  await fetchVendas()
  
  // Aplicar filtros globais existentes (se houver)
  const filtrosAtuais = {
    empresaSelecionada: filtrosGlobais.empresaSelecionada,
    dataInicial: filtrosGlobais.dataInicial,
    dataFinal: filtrosGlobais.dataFinal
  }
  
  if (filtrosAtuais.empresaSelecionada || filtrosAtuais.dataInicial || filtrosAtuais.dataFinal) {
    aplicarFiltrosRecebimentos(filtrosAtuais)
  }
  
  // ✅ Escutar eventos de filtros globais para pagamentos
  removerListener = escutarEvento('filtrar-pagamentos', aplicarFiltrosRecebimentos)
  console.log('🎧 [RECEBIMENTOS] Listener configurado para filtros globais')
})

// Cleanup ao desmontar o componente
onUnmounted(() => {
  if (removerListener) {
    removerListener()
    console.log('🧹 [RECEBIMENTOS] Listener removido')
  }
})
</script>