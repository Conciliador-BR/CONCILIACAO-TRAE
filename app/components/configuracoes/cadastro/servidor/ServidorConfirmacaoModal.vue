<template>
  <Teleport to="body">
    <div v-if="aberto" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
      <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">Confirmacao</p>
            <h3 class="mt-2 text-xl font-semibold text-[#102A43]">{{ titulo }}</h3>
          </div>

          <button type="button" class="text-sm font-medium text-[#627D98] transition hover:text-[#102A43]" @click="$emit('cancelar')">
            Fechar
          </button>
        </div>

        <p class="mt-4 text-sm leading-6 text-[#486581]">{{ descricao }}</p>

        <div v-if="keyword" class="mt-5 space-y-2">
          <label class="text-sm font-medium text-[#243B53]">
            Digite <span class="font-semibold">{{ keyword }}</span> para confirmar
          </label>
          <input
            v-model="confirmacaoDigitada"
            type="text"
            class="w-full rounded-lg border border-[#D9E2EC] px-3 py-2 text-sm text-[#102A43] outline-none transition focus:border-[#486581]"
          >
        </div>

        <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="rounded-lg border border-[#BCCCDC] px-4 py-2 text-sm font-medium text-[#334E68] transition hover:bg-[#F8FBFF]"
            @click="$emit('cancelar')"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="loading"
            @click="confirmar"
          >
            {{ loading ? 'Processando...' : 'Confirmar exclusao' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  aberto: {
    type: Boolean,
    default: false
  },
  titulo: {
    type: String,
    default: 'Confirmar acao'
  },
  descricao: {
    type: String,
    default: ''
  },
  keyword: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['cancelar', 'confirmar'])
const confirmacaoDigitada = ref('')

watch(
  () => props.aberto,
  (value) => {
    if (value) {
      confirmacaoDigitada.value = ''
    }
  }
)

const confirmar = () => {
  emit('confirmar', confirmacaoDigitada.value)
}
</script>
