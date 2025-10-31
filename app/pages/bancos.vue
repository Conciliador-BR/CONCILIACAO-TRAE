<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div class="w-full mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
      <!-- Header -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border-b border-gray-200">
          <h1 class="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold text-gray-900">Bancos</h1>
          <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-gray-600 mt-1">Integração bancária e conciliação</p>
        </div>
      </div>

      <!-- Container da tabela -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="p-4 sm:p-6 lg:p-8 xl:p-12">
          <BancosContainer />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import BancosContainer from '~/components/bancos/BancosContainer.vue'

// Configurações da página
useHead({
  title: 'Bancos - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Integração bancária' }
  ]
})

// Função para registrar visita à página de bancos
const registrarVisitaBancos = () => {
  if (process.client) {
    // Registrar para Cadastro (se houver aba de bancos)
    localStorage.setItem('cadastro_ultima_aba', 'bancos')
    // Registrar visita geral à página de bancos
    localStorage.setItem('bancos_ultima_visita', new Date().toISOString())
    console.log('📝 [BANCOS] Visita registrada à página de bancos')
  }
}

// Registrar visita ao montar o componente
onMounted(() => {
  registrarVisitaBancos()
})
</script>