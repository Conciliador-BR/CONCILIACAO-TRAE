<template>
  <div
    v-if="visivel"
    class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-6"
  >
    <div class="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-200">
      <h2 class="text-2xl font-bold text-gray-900">3. Escolha o Tipo do Arquivo Safra</h2>
      <p class="text-sm text-gray-600 mt-1">
        No modelo novo da Safra, voce pode importar o arquivo de recebimentos ou o arquivo separado de ajustes.
      </p>
    </div>

    <div class="p-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          :disabled="disabled"
          :class="getCardClass('recebimento')"
          @click="$emit('tipo-selecionado', 'recebimento')"
        >
          <div class="text-left">
            <div class="text-lg font-semibold text-gray-900">Recebimento</div>
            <p class="mt-2 text-sm text-gray-600">
              Importa o arquivo novo com <span class="font-mono">DT EFETIVA</span>, <span class="font-mono">DESC MDR</span> e <span class="font-mono">TXADM</span>.
            </p>
          </div>
        </button>

        <button
          type="button"
          :disabled="disabled"
          :class="getCardClass('ajustes')"
          @click="$emit('tipo-selecionado', 'ajustes')"
        >
          <div class="text-left">
            <div class="text-lg font-semibold text-gray-900">Ajustes</div>
            <p class="mt-2 text-sm text-gray-600">
              Importa o arquivo separado de ajustes e aluguel de maquinas, respeitando o sinal da coluna <span class="font-mono">D/C</span>.
            </p>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  visivel: {
    type: Boolean,
    default: false
  },
  tipoSelecionado: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

defineEmits(['tipo-selecionado'])

const getCardClass = (tipo) => {
  const selecionado = props.tipoSelecionado === tipo

  return [
    'w-full rounded-xl border-2 p-5 text-left transition-all duration-200',
    props.disabled
      ? 'cursor-not-allowed border-gray-200 bg-gray-100 opacity-60'
      : selecionado
        ? 'border-indigo-500 bg-indigo-50 shadow-sm'
        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
  ]
}
</script>
