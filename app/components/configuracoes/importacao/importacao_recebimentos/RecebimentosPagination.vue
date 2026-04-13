<template>
  <div class="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
    <div class="flex items-center space-x-2">
      <span class="text-sm text-gray-700">Mostrar</span>
      <select
        :value="itemsPerPage"
        @change="$emit('update:itemsPerPage', parseInt($event.target.value))"
        class="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="10">10</option>
        <option value="20">20</option>
        <option value="30">30</option>
        <option value="50">50</option>
      </select>
      <span class="text-sm text-gray-700">por página</span>
    </div>

    <div class="flex items-center space-x-4">
      <span class="text-sm text-gray-700">
        Mostrando {{ startItem }} a {{ endItem }} de {{ totalItems }} recebimentos
      </span>
      <div class="flex items-center space-x-1">
        <button @click="$emit('update:currentPage', 1)" :disabled="currentPage === 1" class="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">««</button>
        <button @click="$emit('update:currentPage', currentPage - 1)" :disabled="currentPage === 1" class="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">‹</button>

        <template v-for="page in visiblePages" :key="page">
          <button
            v-if="page !== '...'"
            @click="$emit('update:currentPage', page)"
            :class="[
              'px-3 py-1 text-sm border rounded',
              page === currentPage
                ? 'bg-blue-500 text-white border-blue-500'
                : 'border-gray-300 hover:bg-gray-50'
            ]"
          >
            {{ page }}
          </button>
          <span v-else class="px-2 py-1 text-sm text-gray-500">...</span>
        </template>

        <button @click="$emit('update:currentPage', currentPage + 1)" :disabled="currentPage === totalPages" class="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">›</button>
        <button @click="$emit('update:currentPage', totalPages)" :disabled="currentPage === totalPages" class="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">»»</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  itemsPerPage: { type: Number, required: true },
  totalItems: { type: Number, required: true }
})

defineEmits(['update:currentPage', 'update:itemsPerPage'])

const startItem = computed(() => (props.currentPage - 1) * props.itemsPerPage + 1)
const endItem = computed(() => {
  const end = props.currentPage * props.itemsPerPage
  return end > props.totalItems ? props.totalItems : end
})

const visiblePages = computed(() => {
  const pages = []
  const total = props.totalPages
  const current = props.currentPage
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    }
  }
  return pages
})
</script>