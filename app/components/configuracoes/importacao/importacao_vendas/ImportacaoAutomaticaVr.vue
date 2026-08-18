<template>
  <div
    v-if="visivel"
    class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-6"
  >
    <div class="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-200">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">4. Importacao Automatica da VR</h2>
          <p class="text-sm text-gray-600 mt-1">
            Esta etapa usa os arquivos ja baixados em <span class="font-mono">/opt/conciliadora/vr/downloads/cnpj/&lt;cnpj&gt;</span>.
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            class="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="disabled || carregandoArquivos"
            @click="$emit('atualizar-arquivos')"
          >
            {{ carregandoArquivos ? 'Atualizando...' : 'Atualizar arquivos' }}
          </button>
          <button
            type="button"
            class="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="disabled || carregando"
            @click="$emit('executar')"
          >
            {{ carregando ? 'Processando vendas...' : 'Processar vendas da VR' }}
          </button>
        </div>
      </div>
    </div>

    <div class="p-8 space-y-5">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div class="text-xs uppercase tracking-wide text-gray-500">Empresa</div>
          <div class="mt-1 text-sm font-medium text-gray-900">{{ nomeEmpresa || '-' }}</div>
        </div>
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div class="text-xs uppercase tracking-wide text-gray-500">CNPJ</div>
          <div class="mt-1 text-sm font-medium text-gray-900">{{ cnpj || '-' }}</div>
        </div>
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div class="text-xs uppercase tracking-wide text-gray-500">Periodo</div>
          <div class="mt-1 text-sm font-medium text-gray-900">{{ periodoTexto }}</div>
        </div>
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div class="text-xs uppercase tracking-wide text-gray-500">Arquivos candidatos</div>
          <div class="mt-1 text-sm font-medium text-gray-900">{{ arquivosDisponiveis.length }}</div>
        </div>
      </div>

      <div v-if="mensagemErro" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ mensagemErro }}
      </div>

      <div class="rounded-2xl border border-gray-200 overflow-hidden">
        <div class="bg-gray-50 px-5 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Arquivos que serao analisados</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-white">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Arquivo</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ref.</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Download</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="arquivo in arquivosDisponiveis" :key="arquivo.fileName" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm text-gray-900 font-mono">{{ arquivo.fileName }}</td>
                <td class="px-4 py-3 text-sm text-gray-700">{{ formatarReferencia(arquivo.referenceDate) }}</td>
                <td class="px-4 py-3 text-sm text-gray-700">{{ formatarTimestamp(arquivo.downloadTimestamp || arquivo.modifiedAt) }}</td>
              </tr>
              <tr v-if="arquivosDisponiveis.length === 0">
                <td colspan="3" class="px-4 py-6 text-center text-sm text-gray-500">
                  Nenhum arquivo VR baixado encontrado. Use primeiro a tela Importacao de Downloads.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
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
  carregandoArquivos: {
    type: Boolean,
    default: false
  },
  carregando: {
    type: Boolean,
    default: false
  },
  nomeEmpresa: {
    type: String,
    default: ''
  },
  cnpj: {
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
  },
  arquivosDisponiveis: {
    type: Array,
    default: () => []
  },
  mensagemErro: {
    type: String,
    default: ''
  }
})

defineEmits(['atualizar-arquivos', 'executar'])

const periodoTexto = computed(() => {
  if (props.dataInicial && props.dataFinal) return `${props.dataInicial} ate ${props.dataFinal}`
  return 'Periodo nao informado'
})

const formatarReferencia = (value) => {
  const text = String(value || '').trim()
  if (!/^\d{8}$/.test(text)) return '-'
  return `${text.slice(6, 8)}/${text.slice(4, 6)}/${text.slice(0, 4)}`
}

const formatarTimestamp = (value) => {
  const text = String(value || '').trim()
  if (!text) return '-'
  const match = text.match(/^(\d{8})_(\d{6})$/)
  if (match) {
    const date = match[1]
    const time = match[2]
    return `${date.slice(6, 8)}/${date.slice(4, 6)}/${date.slice(0, 4)} ${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}`
  }
  return text.replace('T', ' ').slice(0, 19)
}
</script>
