<template>
  <div class="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
    <div class="max-w-7xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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