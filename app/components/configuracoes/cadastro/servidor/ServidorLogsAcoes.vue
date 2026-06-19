<template>
  <div class="rounded-xl border border-[#DCE7F3] bg-white p-5 shadow-sm">
    <h3 class="text-lg font-semibold text-[#102A43]">Retorno e Historico</h3>
    <p class="mt-1 text-sm text-[#7B8794]">Acompanhe o resultado das ultimas acoes executadas nesta tela.</p>

    <div
      v-if="mensagem"
      class="mt-4 rounded-xl border px-4 py-3 text-sm"
      :class="sucesso ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'"
    >
      {{ mensagem }}
    </div>

    <div v-if="!logs.length" class="mt-4 rounded-xl border border-dashed border-[#D9E2EC] bg-[#F8FBFF] px-4 py-6 text-sm text-[#627D98]">
      Nenhuma acao registrada nesta sessao ainda.
    </div>

    <div v-else class="mt-4 space-y-3">
      <div
        v-for="log in logs"
        :key="log.id"
        class="rounded-xl border border-[#E3ECF5] bg-[#FBFDFF] px-4 py-3"
      >
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span
                class="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold"
                :class="log.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
              >
                {{ log.ok ? 'OK' : 'ERRO' }}
              </span>
              <p class="text-sm font-semibold text-[#102A43]">{{ log.acao }}</p>
            </div>
            <p class="mt-1 break-all text-xs text-[#627D98]">{{ log.alvo }}</p>
            <p v-if="log.detalhe" class="mt-2 text-sm text-[#486581]">{{ log.detalhe }}</p>
          </div>

          <p class="text-xs text-[#829AB1]">{{ formatarData(log.criadoEm) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  logs: {
    type: Array,
    default: () => []
  },
  mensagem: {
    type: String,
    default: ''
  },
  sucesso: {
    type: Boolean,
    default: true
  }
})

const formatarData = (value) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('pt-BR')
}
</script>
