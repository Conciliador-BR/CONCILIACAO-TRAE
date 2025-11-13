<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
  >
    <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
        <span class="text-sm text-gray-500">{{ percent }}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-3 mb-4">
        <div
          class="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
          :style="{ width: percent + '%' }"
        />
      </div>
      <div class="text-sm text-gray-600">
        <div>Enviados: <span class="font-semibold">{{ sent }}</span></div>
        <div>Ignorados: <span class="font-semibold">{{ skipped }}</span></div>
        <div>Erros: <span class="font-semibold">{{ errors }}</span></div>
      </div>
      <div v-if="message" class="mt-3 text-sm text-gray-700">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  visible: Boolean,
  title: { type: String, default: 'Processando...' },
  percent: { type: Number, default: 0 },
  sent: { type: Number, default: 0 },
  skipped: { type: Number, default: 0 },
  errors: { type: Number, default: 0 },
  message: { type: String, default: '' }
})
</script>