<template>
  <button
    class="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-60"
    :disabled="refazendo"
    @click="handleRefazer"
  >
    <span v-if="!refazendo">Refazer Auditoria</span>
    <span v-else>Refazendo...</span>
  </button>
</template>

<script setup>
import { ref } from 'vue'
import { useConciliacaoVendasRecebimentos } from '~/composables/configuracoes/auditoria/analytics-financeiro/useConciliacaoVendasRecebimentos'

const refazendo = ref(false)
const { recarregar } = useConciliacaoVendasRecebimentos()

const handleRefazer = async () => {
  if (refazendo.value) return
  refazendo.value = true
  try {
    await recarregar(true)
    alert('Conciliação refeita com sucesso.')
  } catch (e) {
    alert('Erro ao refazer conciliação.')
  } finally {
    refazendo.value = false
  }
}
</script>
