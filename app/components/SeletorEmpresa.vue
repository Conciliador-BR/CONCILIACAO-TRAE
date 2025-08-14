<template>
  <div class="bg-white rounded-lg shadow-md p-4 border border-gray-200">
    <label class="block text-sm font-medium text-blue-700 mb-2">
      Empresa
    </label>
    <!-- Debug: mostrar quantas empresas foram carregadas -->
    <p v-if="empresas.length === 0" class="text-red-500 text-sm mb-2">
      ⚠️ Nenhuma empresa carregada ({{ empresas.length }} empresas)
    </p>
    <p v-else class="text-green-500 text-sm mb-2">
      ✅ {{ empresas.length }} empresas carregadas
    </p>
    
    <select 
      v-model="empresaSelecionada"
      @change="emitirMudanca"
      class="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
    >
      <option value="" class="bg-white">Todas as Empresas</option>
      <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id" class="bg-white">
        {{ empresa.nome }}
      </option>
    </select>
  </div>
</template>

<script setup>
const props = defineProps({
  empresas: {
    type: Array,
    default: () => []
  },
  modelValue: {
    type: [String, Number],
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'empresa-changed'])

const empresaSelecionada = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const emitirMudanca = () => {
  emit('empresa-changed', empresaSelecionada.value)
}
</script>