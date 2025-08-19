<template>
  <div class="bg-white rounded-lg shadow-md p-4 border border-gray-200">
    <label class="block text-sm font-medium text-blue-700 mb-2">
      Empresa
    </label>
    
    <select 
      v-model="empresaSelecionada"
      @change="emitirMudanca"
      class="w-full px-6 py-4 bg-white border border-gray-300 rounded-md text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-w-[250px]"
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