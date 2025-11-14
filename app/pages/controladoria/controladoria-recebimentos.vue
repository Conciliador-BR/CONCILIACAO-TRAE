<template>
  <div class="space-y-6">
    <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <div class="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Conciliações de Recebimentos</h1>
          <p class="text-gray-600">Análise detalhada por adquirente e modalidade de pagamento</p>
        </div>
      </div>
    </div>
    <ResumoRecebimentos :resumo="resumoCalculado" />
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-md">
      <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h3 class="text-xl font-semibold text-gray-800">Detalhamento por Adquirente</h3>
        <p class="text-sm text-gray-600 mt-1">Análise completa das transações por modalidade</p>
      </div>
    </div>
    <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <RecebimentosContainer />
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useRecebimentos } from '~/composables/PageControladoria/controladoria-recebimentos/useRecebimentos'
import { useResumoRecebimentos } from '~/composables/PageControladoria/controladoria-recebimentos/useResumoRecebimentos'
import ResumoRecebimentos from '~/components/controladoria/controladoria-recebimentos/ResumoRecebimentos.vue'
import RecebimentosContainer from '~/components/controladoria/controladoria-recebimentos/RecebimentosContainer.vue'

useHead({
  title: 'Controladoria - Recebimentos - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Gestão de recebimentos' }
  ]
})

const registrarVisitaRecebimentos = () => {
  if (process.client) {
    localStorage.setItem('controladoria_ultima_aba', 'recebimentos')
  }
}

const { escutarEvento } = useGlobalFilters()
const { recebimentos, fetchRecebimentos } = useRecebimentos()
const { resumoCalculado } = useResumoRecebimentos(recebimentos)

const filtrarRecebimentos = async (filtros) => {
  await fetchRecebimentos()
}

let removerListener

onMounted(async () => {
  registrarVisitaRecebimentos()
  await fetchRecebimentos()
  removerListener = escutarEvento('filtrar-controladoria-recebimentos', filtrarRecebimentos)
})

onUnmounted(() => {
  if (removerListener) removerListener()
})
</script>
