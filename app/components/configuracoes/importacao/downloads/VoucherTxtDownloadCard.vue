<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
    <div class="bg-gradient-to-r from-emerald-50 to-white px-8 py-6 border-b border-gray-200">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Arquivos {{ operadoraLabel }}</h2>
          <p class="text-sm text-gray-600 mt-1">
            Move os arquivos `.txt` de <span class="font-mono">{{ caminhoDownloads }}</span> para <span class="font-mono">{{ caminhoProcessados }}</span>.
          </p>
        </div>
        <div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div class="font-semibold">Regra atual</div>
          <div class="mt-1">
            Após o processamento com sucesso, o arquivo vai para <span class="font-mono">{{ caminhoProcessados }}</span>.
          </div>
        </div>
      </div>
    </div>

    <div class="p-8 space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <label class="block">
          <span class="block text-sm font-medium text-gray-800">Empresa do filtro global</span>
          <input
            :value="empresaExibicao"
            type="text"
            class="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:outline-none"
            readonly
          >
        </label>

        <label class="block">
          <span class="block text-sm font-medium text-gray-800">{{ credentialTitle }}</span>
          <input
            :value="remoteFileNameExibicao"
            type="text"
            class="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:outline-none"
            readonly
          >
        </label>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label class="block">
          <span class="block text-sm font-medium text-gray-800">CNPJ usado no filtro</span>
          <input
            :value="cnpjExibicao"
            type="text"
            class="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:outline-none"
            readonly
          >
        </label>

        <label class="block">
          <span class="block text-sm font-medium text-gray-800">Data inicial do filtro global</span>
          <input
            :value="dataInicial"
            type="text"
            class="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:outline-none"
            readonly
          >
        </label>

        <label class="block">
          <span class="block text-sm font-medium text-gray-800">Data final do filtro global</span>
          <input
            :value="dataFinal"
            type="text"
            class="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:outline-none"
            readonly
          >
        </label>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div class="text-xs uppercase tracking-wide text-gray-500">Adquirente</div>
          <div class="mt-1 text-sm font-medium text-gray-900">{{ operadoraLabel }}</div>
        </div>
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div class="text-xs uppercase tracking-wide text-gray-500">Empresa consultada</div>
          <div class="mt-1 text-sm font-medium text-gray-900">{{ statusData?.lookup?.empresaNome || '-' }}</div>
        </div>
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div class="text-xs uppercase tracking-wide text-gray-500">EC consultado</div>
          <div class="mt-1 text-sm font-medium text-gray-900">{{ statusData?.lookup?.ec || '-' }}</div>
        </div>
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div class="text-xs uppercase tracking-wide text-gray-500">Cadastro</div>
          <div class="mt-1 text-sm font-medium text-gray-900">{{ statusData?.lookup?.encontrouCredencial ? 'Encontrado' : 'Pendente' }}</div>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="carregandoStatus"
          @click="$emit('atualizar-status')"
        >
          {{ carregandoStatus ? 'Atualizando...' : 'Atualizar status' }}
        </button>

        <button
          type="button"
          class="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="baixando || !empresaSelecionada || !statusData?.lookup?.remoteFileName"
          @click="$emit('baixar')"
        >
          {{ baixando ? 'Enviando arquivos...' : `Enviar arquivos ${operadoraLabel} para processados` }}
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div class="text-xs uppercase tracking-wide text-gray-500">Servidor</div>
          <div class="mt-1 text-sm font-medium text-gray-900">{{ statusData?.config?.serverHost || '-' }}</div>
        </div>
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div class="text-xs uppercase tracking-wide text-gray-500">Base</div>
          <div class="mt-1 text-sm font-medium text-gray-900">{{ statusData?.config?.basePath || '-' }}</div>
        </div>
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div class="text-xs uppercase tracking-wide text-gray-500">Arquivos no servidor</div>
          <div class="mt-1 text-sm font-medium text-gray-900">{{ statusData?.resumo?.totalArquivosServidor || 0 }}</div>
        </div>
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div class="text-xs uppercase tracking-wide text-gray-500">Arquivos processados</div>
          <div class="mt-1 text-sm font-medium text-gray-900">{{ statusData?.resumo?.totalArquivosProcessados || 0 }}</div>
        </div>
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div class="text-xs uppercase tracking-wide text-gray-500">Logs</div>
          <div class="mt-1 text-sm font-medium text-gray-900">{{ statusData?.config?.logsPath || '-' }}</div>
        </div>
      </div>

      <div v-if="mensagemErro" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ mensagemErro }}
      </div>

      <div v-if="listaErros.length > 0" class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <div class="font-semibold">Alertas do ambiente</div>
        <ul class="mt-2 space-y-1">
          <li v-for="(item, index) in listaErros" :key="index">{{ item }}</li>
        </ul>
      </div>

      <div class="rounded-2xl border border-gray-200 overflow-hidden">
        <div class="bg-gray-50 px-5 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Arquivos .txt encontrados</h3>
              <p class="text-sm text-gray-600 mt-1">Arquivos presentes em <span class="font-mono">{{ caminhoDownloads }}</span>.</p>
            </div>
            <div class="text-sm text-gray-500">{{ arquivosTxt.length }} arquivo(s)</div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-white">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Arquivo</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ref.</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pasta CNPJ</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Atualizado</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Tamanho</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="arquivo in arquivosTxt" :key="arquivo.fileName" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm text-gray-900 font-mono">{{ arquivo.fileName }}</td>
                <td class="px-4 py-3 text-sm text-gray-700">{{ formatarReferencia(arquivo.referenceDate) }}</td>
                <td class="px-4 py-3 text-sm text-gray-700">{{ arquivo.cnpjFolder || '-' }}</td>
                <td class="px-4 py-3 text-sm text-gray-700">{{ formatarTimestamp(arquivo.downloadTimestamp || arquivo.modifiedAt) }}</td>
                <td class="px-4 py-3 text-sm text-gray-700 text-right">{{ formatarBytes(arquivo.size) }}</td>
              </tr>
              <tr v-if="arquivosTxt.length === 0">
                <td colspan="5" class="px-4 py-6 text-center text-sm text-gray-500">Nenhum arquivo .txt encontrado ainda.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="rounded-2xl border border-gray-200 overflow-hidden">
        <div class="bg-gray-50 px-5 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Arquivos processados</h3>
              <p class="text-sm text-gray-600 mt-1">Arquivos presentes em <span class="font-mono">{{ caminhoProcessados }}</span>.</p>
            </div>
            <div class="text-sm text-gray-500">{{ arquivosProcessados.length }} arquivo(s)</div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-white">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Arquivo</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ref.</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pasta CNPJ</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Atualizado</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Tamanho</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="arquivo in arquivosProcessados" :key="`processado-${arquivo.fileName}-${arquivo.modifiedAt}`" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm text-gray-900 font-mono">{{ arquivo.fileName }}</td>
                <td class="px-4 py-3 text-sm text-gray-700">{{ formatarReferencia(arquivo.referenceDate) }}</td>
                <td class="px-4 py-3 text-sm text-gray-700">{{ arquivo.cnpjFolder || '-' }}</td>
                <td class="px-4 py-3 text-sm text-gray-700">{{ formatarTimestamp(arquivo.downloadTimestamp || arquivo.modifiedAt) }}</td>
                <td class="px-4 py-3 text-sm text-gray-700 text-right">{{ formatarBytes(arquivo.size) }}</td>
              </tr>
              <tr v-if="arquivosProcessados.length === 0">
                <td colspan="5" class="px-4 py-6 text-center text-sm text-gray-500">Nenhum arquivo processado ainda.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="rounded-2xl border border-gray-200 overflow-hidden">
        <div class="bg-gray-50 px-5 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Log operacional</h3>
        </div>
        <pre class="max-h-[22rem] overflow-auto bg-slate-950 px-5 py-4 text-[11px] leading-5 text-slate-100">{{ statusData?.logTail || 'Sem log gerado ate o momento.' }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  operadoraLabel: {
    type: String,
    default: ''
  },
  empresas: {
    type: Array,
    default: () => []
  },
  empresaId: {
    type: [String, Number],
    default: ''
  },
  empresaSelecionada: {
    type: Object,
    default: null
  },
  dataInicial: {
    type: String,
    default: ''
  },
  dataFinal: {
    type: String,
    default: ''
  },
  statusData: {
    type: Object,
    default: () => ({})
  },
  carregandoStatus: {
    type: Boolean,
    default: false
  },
  baixando: {
    type: Boolean,
    default: false
  },
  mensagemErro: {
    type: String,
    default: ''
  }
})

defineEmits(['atualizar-status', 'baixar'])

const empresaExibicao = computed(() => props.empresaSelecionada?.displayName || 'Nenhuma empresa selecionada no filtro global')
const cnpjExibicao = computed(() => props.empresaSelecionada?.cnpj || '-')
const caminhoDownloads = computed(() => props.statusData?.config?.downloadsInboxPath || `${props.statusData?.config?.downloadsPath || '-'}/cnpj`)
const caminhoProcessados = computed(() => {
  const cnpj = String(props.empresaSelecionada?.cnpj || '').trim() || '<CNPJ real>'
  return `${props.statusData?.config?.processadosCnpjPath || `${props.statusData?.config?.processadosPath || '-'}/cnpj`}/${cnpj}`
})
const credentialTitle = computed(() => {
  const label = String(props.statusData?.lookup?.credentialFieldLabel || '').trim() || 'credencial'
  return label.charAt(0).toUpperCase() + label.slice(1)
})
const remoteFileNameExibicao = computed(() => String(props.statusData?.lookup?.remoteFileName || '').trim() || 'Nenhum valor cadastrado para a empresa/EC selecionados')
const arquivosTxt = computed(() => (props.statusData?.downloadedFiles || []).filter(item => String(item?.fileName || '').toLowerCase().endsWith('.txt')))
const arquivosProcessados = computed(() => (props.statusData?.processedFiles || []).filter(item => String(item?.fileName || '').toLowerCase().endsWith('.txt')))

const listaErros = computed(() => {
  const erros = props.statusData?.erros || {}
  return Object.values(erros).filter(Boolean)
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

const formatarBytes = (value) => {
  const bytes = Number(value || 0)
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
</script>
