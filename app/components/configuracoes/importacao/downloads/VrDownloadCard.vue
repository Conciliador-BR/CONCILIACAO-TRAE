<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
    <div class="bg-gradient-to-r from-emerald-50 to-white px-8 py-6 border-b border-gray-200">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Downloads VR</h2>
          <p class="text-sm text-gray-600 mt-1">
            Baixa os arquivos de conciliacao da VR no Oracle e salva em <span class="font-mono">/opt/conciliadora/vr/downloads/cnpj/&lt;cnpj&gt;</span>.
          </p>
        </div>
        <div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div class="font-semibold">Convencao atual</div>
          <div class="mt-1 font-mono text-[11px] break-all">
            &lt;arquivo_original&gt;__ref_YYYYMMDD__download_YYYYMMDD_HHMMSS.txt
          </div>
        </div>
      </div>
    </div>

    <div class="p-8 space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <label class="block">
          <span class="block text-sm font-medium text-gray-800">Empresa</span>
          <select
            :value="empresaId"
            class="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            :disabled="carregandoEmpresas"
            @change="$emit('update:empresa-id', $event.target.value)"
          >
            <option value="">Selecione a empresa</option>
            <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
              {{ empresa.displayName }}
            </option>
          </select>
        </label>

        <label class="block">
          <span class="block text-sm font-medium text-gray-800">Nome remoto fixo</span>
          <input
            :value="fixedRemoteName"
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
          <span class="block text-sm font-medium text-gray-800">Data inicial</span>
          <input
            :value="dataInicial"
            type="date"
            class="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            @input="$emit('update:data-inicial', $event.target.value)"
          >
        </label>

        <label class="block">
          <span class="block text-sm font-medium text-gray-800">Data final</span>
          <input
            :value="dataFinal"
            type="date"
            class="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            @input="$emit('update:data-final', $event.target.value)"
          >
        </label>
      </div>

      <label class="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        <input
          :checked="overwrite"
          type="checkbox"
          class="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          @change="$emit('update:overwrite', $event.target.checked)"
        >
        <span>
          <span class="block text-sm font-medium text-gray-800">Sobrescrever politica de pulo</span>
          <span class="block text-sm text-gray-600">
            Quando marcado, baixa novamente mesmo que ja exista um arquivo local com o mesmo original/ref.
          </span>
        </span>
      </label>

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
          :disabled="baixando || !empresaSelecionada"
          @click="$emit('baixar')"
        >
          {{ baixando ? 'Baixando arquivos...' : 'Baixar arquivos da VR' }}
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div class="text-xs uppercase tracking-wide text-gray-500">Oracle</div>
          <div class="mt-1 text-sm font-medium text-gray-900">{{ statusData?.config?.oracleHost || '-' }}</div>
        </div>
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div class="text-xs uppercase tracking-wide text-gray-500">SFTP VR</div>
          <div class="mt-1 text-sm font-medium text-gray-900">{{ statusData?.config?.sftpHost || '-' }}</div>
        </div>
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div class="text-xs uppercase tracking-wide text-gray-500">Arquivos remotos</div>
          <div class="mt-1 text-sm font-medium text-gray-900">{{ statusData?.resumo?.totalArquivosRemotos || 0 }}</div>
        </div>
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div class="text-xs uppercase tracking-wide text-gray-500">Arquivos baixados</div>
          <div class="mt-1 text-sm font-medium text-gray-900">{{ statusData?.resumo?.totalArquivosBaixados || 0 }}</div>
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
              <h3 class="text-lg font-semibold text-gray-900">Arquivos ja baixados</h3>
              <p class="text-sm text-gray-600 mt-1">Pasta unica no Oracle, organizada pelo nome seguro.</p>
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
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Download</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Tamanho</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="arquivo in arquivosTxt" :key="arquivo.fileName" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm text-gray-900 font-mono">{{ arquivo.fileName }}</td>
                <td class="px-4 py-3 text-sm text-gray-700">{{ formatarReferencia(arquivo.referenceDate) }}</td>
                <td class="px-4 py-3 text-sm text-gray-700">{{ formatarTimestamp(arquivo.downloadTimestamp || arquivo.modifiedAt) }}</td>
                <td class="px-4 py-3 text-sm text-gray-700 text-right">{{ formatarBytes(arquivo.size) }}</td>
              </tr>
              <tr v-if="arquivosTxt.length === 0">
                <td colspan="4" class="px-4 py-6 text-center text-sm text-gray-500">Nenhum arquivo VR baixado ainda.</td>
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
  overwrite: {
    type: Boolean,
    default: false
  },
  fixedRemoteName: {
    type: String,
    default: ''
  },
  carregandoEmpresas: {
    type: Boolean,
    default: false
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

defineEmits(['update:empresa-id', 'update:data-inicial', 'update:data-final', 'update:overwrite', 'atualizar-status', 'baixar'])

const cnpjExibicao = computed(() => props.empresaSelecionada?.cnpj || '-')
const arquivosTxt = computed(() => (props.statusData?.downloadedFiles || []).filter(item => String(item?.fileName || '').toLowerCase().endsWith('.txt')))

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
