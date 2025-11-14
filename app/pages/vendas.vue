<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
    <div class="w-full mx-auto space-y-6 sm:space-y-8">
      
      <!-- Header da página -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h1 class="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold text-gray-900">Vendas</h1>
          <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-gray-600 mt-1">Gestão completa de vendas e transações</p>
        </div>
      </div>


      <!-- Container de Vendas -->
      <VendasContainer :vendas="vendas" />
      
    </div>
  </div>
</template>

<script setup>
// Imports necessários
import { computed, onMounted, onUnmounted } from 'vue'
import { useVendas } from '~/composables/useVendas'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import VendasContainer from '~/components/vendas-operadoras/VendasContainer.vue'
 

// Configurações da página
useHead({
  title: 'Vendas - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Gerenciamento de vendas' }
  ]
})

// Usar o composable useVendas
const {
  vendas,
  loading,
  error,
  fetchVendas,
  aplicarFiltros
} = useVendas()

// Usar filtros globais
const { filtrosGlobais, escutarEvento } = useGlobalFilters()

 

// Função para aplicar filtros de vendas
const aplicarFiltrosVendas = (dadosFiltros) => {
  const filtrosFormatados = {
    empresa: dadosFiltros.empresaSelecionada || '',
    dataInicial: dadosFiltros.dataInicial || '',
    dataFinal: dadosFiltros.dataFinal || ''
  }
  aplicarFiltros(filtrosFormatados)
}

// Variável para armazenar a função de cleanup do listener
let removerListener

// Registrar visita à página de vendas
const registrarVisitaVendas = () => {
  if (process.client) {
    // Registrar para Controladoria (funcionalidade existente)
    localStorage.setItem('controladoria_ultima_aba', 'vendas')
    // Registrar para Cadastro (vendas podem estar relacionadas a taxas)
    localStorage.setItem('cadastro_ultima_aba', 'taxas')
    console.log('📝 [VENDAS] Visita registrada para Controladoria e Cadastro')
  }
}

// Inicialização
onMounted(async () => {
  // Registrar que visitou a página de vendas
  registrarVisitaVendas()
  
  // Carregar vendas apenas se necessário
  await fetchVendas()
  
  // Aplicar filtros globais existentes (se houver)
  const filtrosAtuais = {
    empresaSelecionada: filtrosGlobais.empresaSelecionada,
    dataInicial: filtrosGlobais.dataInicial,
    dataFinal: filtrosGlobais.dataFinal
  }
  
  if (filtrosAtuais.empresaSelecionada || filtrosAtuais.dataInicial || filtrosAtuais.dataFinal) {
    aplicarFiltrosVendas(filtrosAtuais)
  }
  
  // Escutar eventos de filtros globais
  removerListener = escutarEvento('filtrar-vendas', aplicarFiltrosVendas)
})

// Cleanup ao desmontar o componente
onUnmounted(() => {
  if (removerListener) {
    removerListener()
  }
})
</script>