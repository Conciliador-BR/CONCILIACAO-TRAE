<template>
  <div class="bg-gradient-to-r from-slate-50 to-gray-100 border-t border-gray-200 px-6 py-4 shadow-inner">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-2 gap-4">
      
      <!-- Card Total de Senhas -->
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <div>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Senhas</p>
            <p class="text-lg font-bold text-blue-600">{{ totalSenhas.toLocaleString('pt-BR') }}</p>
          </div>
        </div>
      </div>
      
      <!-- Card Segurança -->
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </div>
          <div>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</p>
            <p class="text-lg font-bold text-green-600">Protegido</p>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
defineProps({
  totalSenhas: {
    type: Number,
    required: true
  }
})
</script>
