<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
    <div class="col-span-1">
      <div class="bg-green-100 border border-green-300 rounded-lg p-4 cursor-pointer select-none" @click="emit('filter', 'predicted')">
        <div class="text-sm text-green-700">Com previsão</div>
        <div class="text-2xl font-semibold text-green-800">{{ predictedCount }}</div>
      </div>
    </div>
    <div class="col-span-1">
      <div class="bg-red-100 border border-red-300 rounded-lg p-4 cursor-pointer select-none" @click="emit('filter', 'unpredicted')">
        <div class="text-sm text-red-700">Sem previsão</div>
        <div class="text-2xl font-semibold text-red-800">{{ unpredictedCount }}</div>
      </div>
    </div>
    <div class="col-span-1 flex items-center">
      <button class="w-full bg-gray-100 border border-gray-300 rounded-lg p-4 text-gray-700 hover:bg-gray-200" @click="emit('filter', 'clear')">Limpar filtro</button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  predictedCount: { type: Number, default: 0 },
  unpredictedCount: { type: Number, default: 0 }
})
const emit = defineEmits(['filter'])
</script>