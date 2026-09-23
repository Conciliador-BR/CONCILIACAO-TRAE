<template>
  <div class="page-fluid min-h-screen bg-[#F4F8FC]">
    <div class="w-full mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-6 space-y-6">
      <!-- Header -->
      <div class="overflow-hidden rounded-[32px] border border-[#DCE7F3] bg-white shadow-[0_20px_48px_rgba(16,42,67,0.08)]">
        <div class="border-b border-[#E5EEF8] bg-gradient-to-r from-[#F8FBFF] via-white to-[#F3F8FE] px-6 py-5">
          <h1 class="text-2xl sm:text-3xl font-bold text-[#102A43]">Bancos</h1>
          <p class="mt-1 text-sm text-slate-500">Integração bancária e conciliação</p>
        </div>
      </div>

      <!-- Container da tabela -->
      <div class="overflow-hidden rounded-[32px] border border-[#DCE7F3] bg-white shadow-[0_20px_48px_rgba(16,42,67,0.08)]">
        <div class="p-0">
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
