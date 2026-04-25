<template>
  <div class="flex flex-col items-center">
    <button 
      @click="aplicarFiltro"
      :disabled="false"
      class="group relative px-8 py-4 bg-white hover:bg-gradient-to-r hover:from-[#102a43] hover:to-[#1f4f77] text-[#163a5a] hover:text-white font-semibold rounded-xl shadow-lg hover:shadow-xl border border-white ring-2 ring-[#244b77] hover:ring-[#8bb5de] transform hover:scale-105 transition-all duration-300 flex items-center space-x-2 min-w-[180px] justify-center"
    >
      <!-- Ícone -->
      <svg class="w-5 h-5 text-[#7ece89] group-hover:text-[#7ece89] group-hover:rotate-12 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd"/>
      </svg>
      
      <!-- Texto -->
      <span>Aplicar Filtro</span>
      
      <!-- Efeito de brilho -->
      <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-[#9ec2e6]/30 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 group-hover:animate-pulse"></div>
    </button>
    
    <!-- Indicador visual -->
    <div class="mt-2 flex space-x-1">
      <div class="w-1 h-1 bg-slate-300 rounded-full animate-pulse"></div>
      <div class="w-1 h-1 bg-[#163a5a] rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
      <div class="w-1 h-1 bg-[#1f4f77] rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  empresaSelecionada: {
    type: [String, Number],
    default: ''
  },
  filtroData: {
    type: Object,
    default: () => ({ dataInicial: '', dataFinal: '' })
  }
})

const emit = defineEmits(['aplicar-filtro'])

const aplicarFiltro = () => {
  console.log('Botão aplicar filtro clicado com:', {
    empresa: props.empresaSelecionada,
    dataInicial: props.filtroData.dataInicial,
    dataFinal: props.filtroData.dataFinal
  })
  
  // ✅ CORREÇÃO: Permitir aplicar filtro mesmo quando empresa está vazia (Todas as Empresas)
  emit('aplicar-filtro', {
    empresa: props.empresaSelecionada || '', // Valor vazio significa "Todas as Empresas"
    dataInicial: props.filtroData.dataInicial,
    dataFinal: props.filtroData.dataFinal
  })
}
</script>
