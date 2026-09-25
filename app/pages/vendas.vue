<template>
  <div class="page-fluid min-h-screen bg-[#F4F8FC] px-4 py-3">
    <div class="w-full space-y-4">
      
      <!-- Header da página -->
      <div class="bg-white rounded-2xl shadow-xl border border-[#DCE7F3] overflow-hidden">
        <div class="border-b border-[#244b77] bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] px-4 py-3 sm:px-5">
          <h1 class="text-xl font-bold text-white sm:text-2xl">Vendas</h1>
          <p class="mt-1 text-xs text-white/80">Gestão completa de vendas e transações</p>
        </div>
      </div>


      <!-- Container de Vendas -->
      <VendasContainer :vendas="vendas" />
      
    </div>
  </div>
</template>

<script setup>
// Imports necessários
import { onMounted, onUnmounted } from 'vue'
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
  fetchVendas,
  aplicarFiltros
} = useVendas()

// Usar filtros globais
const { filtrosGlobais, escutarEvento } = useGlobalFilters()

 

// Função para aplicar filtros de vendas
const aplicarFiltrosVendas = async (dadosFiltros) => {
  const filtrosFormatados = {
    empresa: dadosFiltros.empresaSelecionada || '',
    dataInicial: dadosFiltros.dataInicial || '',
    dataFinal: dadosFiltros.dataFinal || ''
  }
  await aplicarFiltros(filtrosFormatados)
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
