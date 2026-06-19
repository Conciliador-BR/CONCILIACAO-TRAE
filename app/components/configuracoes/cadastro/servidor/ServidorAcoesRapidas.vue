<template>
  <div class="rounded-xl border border-[#DCE7F3] bg-white p-5 shadow-sm">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h3 class="text-lg font-semibold text-[#102A43]">Acoes Rapidas</h3>
        <p class="text-sm text-[#7B8794]">Renomeie ou remova a pasta selecionada na arvore.</p>
      </div>

      <button
        v-if="selectedNode"
        type="button"
        class="text-xs font-medium text-[#486581] transition hover:text-[#102A43]"
        @click="$emit('limpar-selecao')"
      >
        Limpar selecao
      </button>
    </div>

    <div v-if="!selectedNode" class="mt-5 rounded-xl border border-dashed border-[#D9E2EC] bg-[#F8FBFF] px-4 py-6 text-sm text-[#627D98]">
      Selecione uma pasta de adquirente ou empresa para liberar as acoes desta area.
    </div>

    <div v-else class="mt-5 space-y-4">
      <div class="rounded-xl border border-[#E3ECF5] bg-[#F8FBFF] p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#829AB1]">Selecionado</p>
        <p class="mt-2 text-sm font-semibold text-[#102A43]">{{ selectedNode.label }}</p>
        <p class="mt-1 text-xs text-[#627D98]">Tipo: {{ selectedNode.tipo }}</p>
        <p class="mt-1 break-all text-xs text-[#627D98]">{{ selectedNode.path }}</p>
      </div>

      <label class="space-y-2">
        <span class="text-sm font-medium text-[#243B53]">Novo nome</span>
        <input
          v-model="renameForm.novoNome"
          type="text"
          class="w-full rounded-lg border border-[#D9E2EC] px-3 py-2 text-sm text-[#102A43] outline-none transition focus:border-[#486581]"
          placeholder="Digite o novo nome da pasta"
        >
      </label>

      <div class="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-lg bg-[#102A43] px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-[#163a5a] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="processando || !renameForm.novoNome"
          @click="$emit('renomear')"
        >
          {{ processando ? 'Processando...' : 'Renomear pasta' }}
        </button>

        <button
          type="button"
          class="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="processando"
          @click="$emit('remover')"
        >
          Remover pasta
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['renomear', 'remover', 'limpar-selecao'])

defineProps({
  selectedNode: {
    type: Object,
    default: null
  },
  renameForm: {
    type: Object,
    required: true
  },
  processando: {
    type: Boolean,
    default: false
  }
})
</script>
