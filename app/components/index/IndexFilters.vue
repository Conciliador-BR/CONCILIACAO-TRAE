<template>
  <div class="w-full max-w-full overflow-x-hidden border-b border-gray-200 bg-white px-3 py-4 shadow-sm sm:px-6">
    <div class="mx-auto w-full max-w-full min-w-0">
      <div class="grid w-full min-w-0 grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        <!-- Seletor de Empresas Global -->
        <SeletorEmpresa 
          :model-value="empresaSelecionada"
          @update:model-value="$emit('update:empresa-selecionada', $event)"
          :empresas="empresas"
          @empresa-changed="$emit('empresa-changed', $event)"
        />
        
        <!-- Filtro de Data Global -->
        <FiltroData 
          :model-value="filtroData"
          @update:model-value="$emit('update:filtro-data', $event)"
          @data-changed="$emit('data-changed', $event)"
          @aplicar-filtro="$emit('aplicar-filtro', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import SeletorEmpresa from '~/components/SeletorEmpresa.vue'
import FiltroData from '~/components/FiltroData.vue'

defineProps({
  empresaSelecionada: String,
  filtroData: Object,
  empresas: Array
})

defineEmits(['update:empresa-selecionada', 'update:filtro-data', 'empresa-changed', 'data-changed', 'aplicar-filtro'])
</script>
