<template>
  <div
    v-if="visivel"
    class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-6"
  >
    <div class="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-200">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">2. Escolha o Tipo de Importacao</h2>
          <p class="text-sm text-gray-600 mt-1">
            Para a Rede, voce pode importar os recebimentos por arquivo manual ou consultar diretamente pela API.
          </p>
        </div>
      </div>
    </div>

    <div class="p-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          :disabled="disabled"
          :class="getCardClass('manual')"
          @click="$emit('modo-selecionado', 'manual')"
        >
          <div class="text-left">
            <div class="text-lg font-semibold text-gray-900">Importacao Manual</div>
            <p class="mt-2 text-sm text-gray-600">
              Mantem o fluxo atual com upload e processamento do arquivo de recebimentos.
            </p>
          </div>
        </button>

        <button
          type="button"
          :disabled="disabled"
          :class="getCardClass('api')"
          @click="$emit('modo-selecionado', 'api')"
        >
          <div class="text-left">
            <div class="text-lg font-semibold text-gray-900">Importacao via API</div>
            <p class="mt-2 text-sm text-gray-600">
              Busca a integracao da empresa, consulta a Rede e processa os recebimentos do periodo filtrado.
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
  modoSelecionado: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

defineEmits(['modo-selecionado'])

const getCardClass = (modo) => {
  const selecionado = props.modoSelecionado === modo

  return [
    'w-full rounded-xl border-2 p-5 text-left transition-all duration-200',
    props.disabled
      ? 'cursor-not-allowed border-gray-200 bg-gray-100 opacity-60'
      : selecionado
        ? 'border-blue-500 bg-blue-50 shadow-sm'
        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
  ]
}
</script>
