<template>
  <!-- Empresa -->
  <select v-if="columnType === 'empresa'"
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    @change="$emit('change')"
    class="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
  >
    <option value="">Selecione uma empresa</option>
    <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.nome">
      {{ empresa.nome }}
    </option>
  </select>
  
  <!-- Adquirente -->
  <select v-else-if="columnType === 'adquirente'"
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    @change="$emit('change')"
    class="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
  >
    <option value="" class="bg-white">Selecione</option>
    <option v-for="adquirente in adquirentes" :key="adquirente" :value="adquirente" class="bg-white">
      {{ adquirente }}
    </option>
  </select>
  
  <!-- Bandeira -->
  <select v-else-if="columnType === 'bandeira'"
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    @change="$emit('change')"
    class="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
  >
    <option value="">Selecione</option>
    <option v-for="bandeira in bandeiras" :key="bandeira" :value="bandeira">
      {{ bandeira }}
    </option>
  </select>
  
  <!-- Modalidade -->
  <select v-else-if="columnType === 'modalidade'"
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    @change="$emit('change')"
    class="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
  >
    <option value="">Selecione</option>
    <option v-for="modalidade in modalidades" :key="modalidade" :value="modalidade">
      {{ modalidade }}
    </option>
  </select>
  
  <!-- Parcelas -->
  <input v-else-if="columnType === 'parcelas'"
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    @blur="$emit('blur')"
    type="number"
    min="1"
    max="24"
    class="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
    placeholder="1"
  >
  
  <!-- Data -->
  <input v-else-if="columnType === 'date'"
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    @blur="$emit('blur')"
    type="date"
    class="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
  >
  
  <!-- Número -->
  <input v-else-if="columnType === 'number'"
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    @blur="$emit('blur')"
    type="number"
    step="0.01"
    :readonly="readonly"
    :class="readonly ? 
      'w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-md text-base text-gray-900 focus:outline-none' :
      'w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200'"
    placeholder="0,00"
  >
  
  <!-- Texto -->
  <input v-else
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    @blur="$emit('blur')"
    class="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
    :placeholder="placeholder"
  >
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  columnType: {
    type: String,
    required: true
  },
  empresas: {
    type: Array,
    default: () => []
  },
  adquirentes: {
    type: Array,
    default: () => []
  },
  bandeiras: {
    type: Array,
    default: () => []
  },
  modalidades: {
    type: Array,
    default: () => []
  },
  readonly: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'blur'])
</script>