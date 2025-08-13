<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <TaxasContainer 
        v-model="taxas" 
        :empresa-selecionada="empresaSelecionada" 
      />
    </div>
  </div>
</template>

<script setup>
import TaxasContainer from '~/components/taxas/TaxasContainer.vue'

const taxas = ref([])
const empresaSelecionada = ref('')

// Carregar dados salvos
onMounted(() => {
  const taxasSalvas = localStorage.getItem('taxas-conciliacao')
  if (taxasSalvas) {
    taxas.value = JSON.parse(taxasSalvas)
  }
  
  const empresaSalva = localStorage.getItem('empresa-selecionada')
  if (empresaSalva) {
    empresaSelecionada.value = empresaSalva
  }
})

// Salvar dados no localStorage
const salvarTaxas = (novasTaxas) => {
  taxas.value = novasTaxas
  localStorage.setItem('taxas-conciliacao', JSON.stringify(novasTaxas))
}
</script>