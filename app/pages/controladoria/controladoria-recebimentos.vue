<template>
  <div class="space-y-6">
    <ResumoRecebimentos :resumo="resumoCalculado" />
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
