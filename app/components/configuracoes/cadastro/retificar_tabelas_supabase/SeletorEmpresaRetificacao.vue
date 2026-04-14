<template>
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
    <div class="lg:col-span-8">
      <label class="block text-xs font-medium text-gray-700">Empresa</label>
      <select
        :value="modelValue"
        class="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option value="">Selecione a empresa</option>
        <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.nome">
          {{ empresa.displayName || empresa.nome }}
        </option>
      </select>
    </div>
    <div class="lg:col-span-4">
      <button
        type="button"
        :disabled="!modelValue || loading"
        class="w-full rounded-xl border border-blue-200 bg-blue-50 text-blue-700 px-4 py-3 text-sm font-medium hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
        @click="$emit('buscar')"
      >
        {{ loading ? 'Buscando...' : 'Buscar Tabelas da Empresa' }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  empresas: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

defineEmits(['update:modelValue', 'buscar'])
</script>
