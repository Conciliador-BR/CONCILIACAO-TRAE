<template>
  <div class="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-5">
    <div class="space-y-5">
      <div>
        <h4 class="text-base font-semibold text-gray-900">Adquirentes</h4>
        <p class="mt-1 text-xs text-gray-600">Selecione a adquirente para montar o cadastro da API.</p>
        <div class="mt-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          <button
            v-for="item in adquirentes"
            :key="item.id"
            type="button"
            :class="cardClass(modelValue === item.id)"
            @click="$emit('update:modelValue', item.id)"
          >
            <div :class="['w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mb-2', item.cor]">
              {{ item.sigla }}
            </div>
            <div class="text-sm font-medium text-gray-800">{{ item.label }}</div>
          </button>
        </div>
      </div>

      <div>
        <h4 class="text-base font-semibold text-gray-900">Vouchers</h4>
        <p class="mt-1 text-xs text-gray-600">Selecione o voucher quando a integracao for desse grupo.</p>
        <div class="mt-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          <button
            v-for="item in vouchers"
            :key="item.id"
            type="button"
            :class="cardClass(modelValue === item.id)"
            @click="$emit('update:modelValue', item.id)"
          >
            <div :class="['w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mb-2', item.cor]">
              {{ item.sigla }}
            </div>
            <div class="text-sm font-medium text-gray-800">{{ item.label }}</div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  adquirentes: { type: Array, default: () => [] },
  vouchers: { type: Array, default: () => [] }
})

defineEmits(['update:modelValue'])

const cardClass = (ativo) => [
  'border-2 rounded-lg px-4 py-4 transition-all duration-200 text-center flex flex-col items-center',
  ativo
    ? 'border-blue-500 bg-blue-50'
    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
]
</script>
