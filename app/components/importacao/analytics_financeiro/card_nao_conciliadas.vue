<template>
  <div class="bg-gradient-to-r from-rose-500 to-rose-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer" @click="onClick">
    <div class="flex items-center justify-between h-full">
      <div class="flex-1">
        <p class="text-rose-100 text-xs sm:text-sm lg:text-sm">Vendas Não Conciliadas</p>
        <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ count }}</p>
      </div>
      <XCircleIcon class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-rose-200 ml-2" />
    </div>
  </div>
</template>

<script setup>
import { XCircleIcon } from '@heroicons/vue/24/outline'
const props = defineProps({ count: { type: Number, default: 0 } })
const emit = defineEmits(['filtrar-nao-conciliadas'])
const onClick = () => emit('filtrar-nao-conciliadas')
</script>

