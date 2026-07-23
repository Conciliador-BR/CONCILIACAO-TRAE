<template>
  <div class="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h3 class="text-sm font-semibold text-amber-900">{{ title }}</h3>
        <p class="mt-1 text-sm text-amber-800">{{ message }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
          @click="$emit('cancel')"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
          @click="$emit('confirm')"
        >
          Confirmar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: 'Ocultar tabela autorizada manual?'
  },
  message: {
    type: String,
    default: 'Ela so sera ocultada depois da confirmacao.'
  }
})

defineEmits(['cancel', 'confirm'])
</script>
