<template>
  <Teleport to="body">
    <button
      v-if="visible"
      type="button"
      class="fixed bottom-5 right-5 z-[1200] w-72 rounded-2xl border border-slate-200 bg-white/95 p-4 text-left shadow-2xl backdrop-blur"
      @click="$emit('open')"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm font-semibold text-slate-900">Exportacao PDF</p>
          <p class="mt-1 text-xs text-slate-500">{{ title }}</p>
        </div>

        <button
          type="button"
          class="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          :disabled="loading"
          @click.stop="$emit('close')"
        >
          <XMarkIcon class="h-4 w-4" />
        </button>
      </div>

      <div class="mt-3 overflow-hidden rounded-full bg-slate-100">
        <div
          class="h-2 rounded-full bg-blue-600 transition-all duration-300"
          :style="{ width: `${progressPercent}%` }"
        ></div>
      </div>

      <div class="mt-3 flex items-center justify-between text-xs">
        <span class="font-medium text-slate-700">{{ status }}</span>
        <span class="text-slate-500">{{ progressLabel }}</span>
      </div>

      <div v-if="downloadReady" class="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
        Arquivo pronto para download. Clique para abrir o painel.
      </div>
    </button>
  </Teleport>
</template>

<script setup>
import { XMarkIcon } from '@heroicons/vue/24/outline'

defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Acompanhe o processamento em segundo plano'
  },
  status: {
    type: String,
    default: ''
  },
  progressLabel: {
    type: String,
    default: ''
  },
  progressPercent: {
    type: Number,
    default: 0
  },
  downloadReady: {
    type: Boolean,
    default: false
  }
})

defineEmits(['open', 'close'])
</script>
