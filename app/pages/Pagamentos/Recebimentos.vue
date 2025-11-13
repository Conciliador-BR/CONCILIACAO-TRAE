<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
    <div class="w-full mx-auto space-y-6 sm:space-y-8">
      <!-- Header -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border-b border-gray-200">
          <h1 class="text-3xl font-bold text-gray-900">Recebimentos</h1>
          <p class="text-sm text-gray-600 mt-1">Controle de recebimentos</p>
        </div>
      </div>

      <!-- Container de Recebimentos -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6">
          <RecebimentosContainer :vendas="vendas" @tentar-refetch="carregarRecebimentos" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRecebimentosCRUD } from '~/composables/PagePagamentos/filtrar_tabelas_recebimento/useRecebimentosCRUD'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import RecebimentosContainer from '~/components/pagamentos-operadoras/recebimentos/RecebimentosContainer.vue'

// Configurações da página
useHead({
  title: 'Recebimentos - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Controle de recebimentos' }
  ]
})

// Usar dados de recebimentos
const vendas = ref([])
const { fetchRecebimentos } = useRecebimentosCRUD()

// Usar filtros globais
const { escutarEvento, filtrosGlobais } = useGlobalFilters()

const carregarRecebimentos = async () => {
  vendas.value = await fetchRecebimentos()
}

// Função para aplicar filtros de recebimentos
const aplicarFiltrosRecebimentos = async (dadosFiltros) => {
  const filtrosFormatados = {
    empresaSelecionada: dadosFiltros.empresaSelecionada || '',
    dataInicial: dadosFiltros.dataInicial || '',
    dataFinal: dadosFiltros.dataFinal || ''
  }
  await carregarRecebimentos()
}

// Variável para armazenar a função de cleanup do listener
let removerListener
let debounceTimer

// Registrar visita à página de recebimentos
const registrarVisitaRecebimentos = () => {
  if (process.client) {
    localStorage.setItem('controladoria_ultima_aba', 'recebimentos')
    localStorage.setItem('pagamentos_ultima_aba', 'recebimentos')
  }
}

// Carregar dados ao montar
onMounted(async () => {
  registrarVisitaRecebimentos()
  await carregarRecebimentos()

  const filtrosAtuais = {
    empresaSelecionada: filtrosGlobais.empresaSelecionada,
    dataInicial: filtrosGlobais.dataInicial,
    dataFinal: filtrosGlobais.dataFinal
  }

  if (filtrosAtuais.empresaSelecionada || filtrosAtuais.dataInicial || filtrosAtuais.dataFinal) {
    await aplicarFiltrosRecebimentos(filtrosAtuais)
  }

  // Escutar eventos de filtros globais para pagamentos
  const handler = (dados) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => aplicarFiltrosRecebimentos(dados), 400)
  }
  removerListener = escutarEvento('filtrar-pagamentos', handler)
})

// Cleanup ao desmontar o componente
onUnmounted(() => {
  if (removerListener) {
    removerListener()
  }
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>
