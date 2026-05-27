<template>
  <Teleport to="body">
    <div v-if="open" class="fixed right-6 top-24 z-[1200] w-full max-w-md">
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-semibold text-slate-900">Exportar PDF</p>
            <p class="mt-1 text-xs text-slate-500">Selecione as pages que deseja gerar. O processamento pode continuar minimizado.</p>
          </div>

          <div class="flex items-center gap-1">
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              @click="$emit('minimize')"
            >
              <MinusIcon class="h-5 w-5" />
            </button>

            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              :disabled="loading"
              @click="$emit('close')"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
        </div>

        <div class="mt-5 space-y-3">
          <label
            v-for="option in options"
            :key="option.id"
            class="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 px-4 py-3 transition hover:border-blue-300 hover:bg-blue-50/60"
          >
            <input
              type="checkbox"
              class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              :checked="selectedIds.includes(option.id)"
              :disabled="loading"
              @change="$emit('toggle-option', option.id)"
            >

            <span class="min-w-0 flex-1">
              <span class="block text-sm font-medium text-slate-900">{{ option.label }}</span>
              <span class="mt-1 block text-xs text-slate-500">{{ option.descricao }}</span>
            </span>
          </label>
        </div>

        <div class="mt-4 flex items-center justify-between">
          <button
            type="button"
            class="text-xs font-medium text-slate-500 hover:text-slate-700"
            :disabled="loading"
            @click="$emit('toggle-all')"
          >
            {{ allSelected ? 'Limpar selecao' : 'Selecionar todas' }}
          </button>

          <span class="text-xs text-slate-500">{{ selectedIds.length }} page(s) selecionada(s)</span>
        </div>

        <div v-if="status" class="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
          <p>{{ status }}</p>
          <p v-if="progressLabel" class="mt-1 text-[11px] text-blue-600">{{ progressLabel }}</p>
        </div>

        <div v-if="downloadFileName" class="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <p class="text-xs font-medium text-emerald-800">Arquivo pronto</p>
          <p class="mt-1 text-xs text-emerald-700">{{ downloadFileName }}</p>

          <button
            type="button"
            class="mt-3 inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
            @click="$emit('download')"
          >
            <ArrowDownTrayIcon class="mr-2 h-4 w-4" />
            Download do arquivo
          </button>
        </div>

        <div class="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            @click="$emit('minimize')"
          >
            Minimizar
          </button>

          <button
            type="button"
            class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            :disabled="loading || selectedIds.length === 0"
            @click="$emit('confirm')"
          >
            <ArrowPathIcon v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            {{ loading ? 'Gerando arquivos...' : 'Gerar arquivo(s)' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ArrowDownTrayIcon, ArrowPathIcon, MinusIcon, XMarkIcon } from '@heroicons/vue/24/outline'

defineProps({
  open: {
    type: Boolean,
    default: false
  },
  options: {
    type: Array,
    default: () => []
  },
  selectedIds: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    default: ''
  },
  progressLabel: {
    type: String,
    default: ''
  },
  allSelected: {
    type: Boolean,
    default: false
  },
  downloadFileName: {
    type: String,
    default: ''
  }
})

defineEmits(['close', 'confirm', 'toggle-option', 'toggle-all', 'minimize', 'download'])
</script>
