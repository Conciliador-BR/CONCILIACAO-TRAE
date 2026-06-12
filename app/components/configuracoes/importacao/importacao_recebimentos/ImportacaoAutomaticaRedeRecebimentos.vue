<template>
  <div
    v-if="visivel"
    class="bg-white rounded-lg shadow-md p-6 mb-6 border border-blue-100"
  >
    <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div class="space-y-2">
        <h2 class="text-xl font-semibold">3. Importacao Automatica da Rede</h2>
        <p class="text-sm text-gray-600">
          Usa a empresa selecionada e o EC/matriz para localizar a integracao da Rede e buscar os recebimentos do periodo filtrado.
        </p>
        <p class="text-xs text-gray-500">
          Periodo atual: <span class="font-medium">{{ periodoTexto }}</span>
        </p>
        <div v-if="integracaoEncontrada" class="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
          Integracao localizada: {{ integracaoLabel }}
          <span v-if="criterioBusca"> | criterio: {{ criterioBusca }}</span>
        </div>
        <div v-if="erro" class="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {{ erro }}
        </div>
      </div>

      <button
        type="button"
        class="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
        :disabled="disabled || carregando"
        @click="$emit('importar')"
      >
        {{ carregando ? 'Puxando recebimentos...' : 'Puxar recebimentos da Rede' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visivel: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  carregando: {
    type: Boolean,
    default: false
  },
  erro: {
    type: String,
    default: ''
  },
  integracaoEncontrada: {
    type: Object,
    default: null
  },
  criterioBusca: {
    type: String,
    default: ''
  },
  dataInicial: {
    type: String,
    default: ''
  },
  dataFinal: {
    type: String,
    default: ''
  }
})

defineEmits(['importar'])

const periodoTexto = computed(() => {
  const inicio = String(props.dataInicial || '').trim()
  const fim = String(props.dataFinal || '').trim()
  if (inicio && fim) return `${inicio} ate ${fim}`
  return 'Periodo nao informado'
})

const integracaoLabel = computed(() => {
  const integracao = props.integracaoEncontrada || {}
  const nomeEmpresa = String(integracao?.nome_empresa || 'Sem nome').trim()
  const ec = String(integracao?.ec_adquirente || integracao?.matriz || '-').trim() || '-'
  return `${nomeEmpresa} | EC ${ec}`
})
</script>
