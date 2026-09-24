<template>
  <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
    <div class="border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-white px-4 py-6 sm:px-8">
      <h2 class="text-2xl font-bold text-gray-900">Downloads Alelo e NAIP</h2>
      <p class="mt-1 text-sm text-gray-600">
        Transfere os arquivos do SFTP Alelo diretamente para
        <span class="font-mono">{{ caminhoProcessados }}</span>.
      </p>
    </div>

    <div class="space-y-6 p-4 sm:p-8">
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <label class="block">
          <span class="block text-sm font-medium text-gray-800">Empresa do filtro global</span>
          <input
            :value="empresaExibicao"
            type="text"
            class="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-700"
            readonly
          >
        </label>

        <label class="block">
          <span class="block text-sm font-medium text-gray-800">CNPJ consultado</span>
          <input
            :value="cnpjExibicao"
            type="text"
            class="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-700"
            readonly
          >
        </label>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div class="text-xs uppercase tracking-wide text-gray-500">Nosso servidor</div>
          <div class="mt-1 break-all text-sm font-medium text-gray-900">{{ statusData?.config?.serverHost || '-' }}</div>
        </div>
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div class="text-xs uppercase tracking-wide text-gray-500">SFTP Alelo</div>
          <div class="mt-1 break-all text-sm font-medium text-gray-900">{{ statusData?.config?.sftpHost || '-' }}</div>
        </div>
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div class="text-xs uppercase tracking-wide text-gray-500">Arquivos disponíveis</div>
          <div class="mt-1 text-sm font-medium text-gray-900">{{ statusData?.resumo?.totalArquivosRemotos || 0 }}</div>
        </div>
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div class="text-xs uppercase tracking-wide text-gray-500">Arquivos processados</div>
          <div class="mt-1 text-sm font-medium text-gray-900">{{ statusData?.resumo?.totalArquivosProcessados || 0 }}</div>
        </div>
      </div>

      <div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Arquivos já existentes nunca são baixados ou sobrescritos.
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="carregandoStatus"
          @click="$emit('atualizar-status')"
        >
          {{ carregandoStatus ? 'Atualizando...' : 'Atualizar status' }}
        </button>
        <button
          type="button"
          class="rounded-xl bg-yellow-500 px-5 py-3 text-sm font-semibold text-gray-950 transition hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="baixando || !empresaSelecionada"
          @click="$emit('baixar')"
        >
          {{ baixando ? 'Transferindo arquivos...' : 'Transferir Alelo e NAIP' }}
        </button>
      </div>

      <div v-if="mensagemErro" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ mensagemErro }}
      </div>

      <div v-if="listaErros.length" class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <div class="font-semibold">Alertas do ambiente</div>
        <ul class="mt-2 space-y-1">
          <li v-for="(item, index) in listaErros" :key="index">{{ item }}</li>
        </ul>
      </div>

      <div class="overflow-hidden rounded-2xl border border-gray-200">
        <div class="border-b border-gray-200 bg-gray-50 px-5 py-4">
          <h3 class="text-lg font-semibold text-gray-900">Arquivos disponíveis no SFTP</h3>
          <p class="mt-1 text-sm text-gray-600">Somente ALELO e NAIP do CNPJ selecionado.</p>
        </div>
        <div class="overflow-x-auto scroll-smooth">
          <table class="w-full min-w-[760px] divide-y divide-gray-200">
            <thead class="bg-white">
              <tr>
                <th class="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Arquivo</th>
                <th class="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Tipo</th>
                <th class="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">CNPJ</th>
                <th class="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Referência</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="arquivo in arquivosRemotos" :key="arquivo.fileName">
                <td class="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-900">{{ arquivo.fileName }}</td>
                <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ arquivo.brand }}</td>
                <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ arquivo.cnpj }}</td>
                <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ formatarReferencia(arquivo.referenceDate) }}</td>
              </tr>
              <tr v-if="!arquivosRemotos.length">
                <td colspan="4" class="px-4 py-6 text-center text-sm text-gray-500">Nenhum arquivo disponível para este CNPJ.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="overflow-hidden rounded-2xl border border-gray-200">
        <div class="border-b border-gray-200 bg-gray-50 px-5 py-4">
          <h3 class="text-lg font-semibold text-gray-900">Arquivos no nosso servidor</h3>
          <p class="mt-1 text-sm text-gray-600"><span class="font-mono">{{ caminhoProcessados }}</span></p>
        </div>
        <div class="overflow-x-auto scroll-smooth">
          <table class="w-full min-w-[900px] divide-y divide-gray-200">
            <thead class="bg-white">
              <tr>
                <th class="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Arquivo</th>
                <th class="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Tipo</th>
                <th class="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">CNPJ</th>
                <th class="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Atualizado</th>
                <th class="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase text-gray-600">Tamanho</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="arquivo in arquivosProcessados" :key="`${arquivo.fileName}-${arquivo.modifiedAt}`">
                <td class="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-900">{{ arquivo.fileName }}</td>
                <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ arquivo.brand }}</td>
                <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ arquivo.cnpjFolder }}</td>
                <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{{ formatarTimestamp(arquivo.modifiedAt) }}</td>
                <td class="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">{{ formatarBytes(arquivo.size) }}</td>
              </tr>
              <tr v-if="!arquivosProcessados.length">
                <td colspan="5" class="px-4 py-6 text-center text-sm text-gray-500">Nenhum arquivo processado para este CNPJ.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="overflow-hidden rounded-2xl border border-gray-200">
        <div class="border-b border-gray-200 bg-gray-50 px-5 py-4">
          <h3 class="text-lg font-semibold text-gray-900">Log operacional</h3>
        </div>
        <pre class="max-h-[22rem] overflow-auto bg-slate-950 px-5 py-4 text-[11px] leading-5 text-slate-100">{{ statusData?.logTail || 'Sem log gerado.' }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  empresaSelecionada: {
    type: Object,
    default: null
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

const empresaExibicao = computed(() => props.empresaSelecionada?.displayName || 'Nenhuma empresa selecionada')
const cnpjExibicao = computed(() => props.statusData?.lookup?.cnpj || props.empresaSelecionada?.cnpj || '-')
const caminhoProcessados = computed(() => {
  const base = props.statusData?.config?.processadosCnpjPath || '/opt/conciliadora/Alelo/processados/cnpj'
  const cnpj = props.statusData?.lookup?.cnpj || '<CNPJ>'
  return `${base}/${cnpj}`
})
const arquivosRemotos = computed(() => Array.isArray(props.statusData?.remoteFiles) ? props.statusData.remoteFiles : [])
const arquivosProcessados = computed(() => Array.isArray(props.statusData?.processedFiles) ? props.statusData.processedFiles : [])
const listaErros = computed(() => Object.values(props.statusData?.erros || {}).filter(Boolean))

const formatarReferencia = (value) => {
  const text = String(value || '')
  return /^\d{8}$/.test(text)
    ? `${text.slice(6, 8)}/${text.slice(4, 6)}/${text.slice(0, 4)}`
    : '-'
}

const formatarTimestamp = (value) => {
  const text = String(value || '').trim()
  return text ? text.replace('T', ' ').slice(0, 19) : '-'
}

const formatarBytes = (value) => {
  const bytes = Number(value || 0)
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
</script>
