<template>
  <div
    v-if="visivel"
    class="bg-white rounded-lg shadow-md p-6 mb-6"
  >
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="text-xl font-semibold">4. Importacao Automatica da Rede</h2>
        <p class="text-sm text-gray-600 mt-1">
          O sistema usa a empresa selecionada, a EC da matriz e o periodo do filtro global para localizar a integracao correta e puxar as vendas.
        </p>
      </div>

      <button
        type="button"
        class="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="disabled || carregando"
        @click="$emit('executar')"
      >
        {{ carregando ? rotuloCarregando : rotuloBotao }}
      </button>
    </div>

    <div class="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div class="text-xs uppercase tracking-wide text-gray-500">Tipo da Consulta</div>
      <div class="mt-3 flex flex-col gap-3 md:flex-row">
        <button
          type="button"
          class="rounded-lg border px-4 py-3 text-left transition"
          :class="tipoConsulta === 'debito_credito'
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'"
          :disabled="disabled || carregando"
          @click="$emit('update:tipo-consulta', 'debito_credito')"
        >
          <div class="font-semibold">Debito e Credito</div>
          <div class="text-sm mt-1">Processa as vendas tratadas e agrupadas por bandeira e modalidade.</div>
        </button>
        <button
          type="button"
          class="rounded-lg border px-4 py-3 text-left transition"
          :class="tipoConsulta === 'vouchers'
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'"
          :disabled="disabled || carregando"
          @click="$emit('update:tipo-consulta', 'vouchers')"
        >
          <div class="font-semibold">Vouchers</div>
          <div class="text-sm mt-1">Busca somente as bandeiras 1, 2, 3 e 14 na modalidade VAN, exibindo o retorno bruto da API da REDE.</div>
        </button>
        <button
          type="button"
          class="rounded-lg border px-4 py-3 text-left transition"
          :class="tipoConsulta === 'pix'
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'"
          :disabled="disabled || carregando"
          @click="$emit('update:tipo-consulta', 'pix')"
        >
          <div class="font-semibold">PIX</div>
          <div class="text-sm mt-1">Exibe somente os registros classificados como PIX no retorno da importacao automatica da Rede.</div>
        </button>
      </div>

      <div
        v-if="tipoConsulta !== 'pix'"
        class="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-3"
      >
        <label class="block">
          <span class="block text-sm font-medium text-gray-800">Consulta da Gestao de Vendas</span>
          <span class="block text-sm text-gray-600 mt-1">
            Escolha qual endpoint da Rede sera usado para montar a tabela e testar os casos de voucher.
          </span>
          <select
            :value="endpointConsulta"
            class="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            :disabled="disabled || carregando"
            @change="$emit('update:endpoint-consulta', $event.target.value)"
          >
            <option
              v-for="opcao in opcoesEndpoint"
              :key="opcao.key"
              :value="opcao.key"
            >
              {{ opcao.label }} - {{ opcao.endpointPath }}
            </option>
          </select>
        </label>
        <div v-if="endpointDescricaoAtual" class="mt-2 text-xs text-gray-500">
          {{ endpointDescricaoAtual }}
        </div>
      </div>

      <div
        v-if="tipoConsulta === 'debito_credito'"
        class="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-3"
      >
        <label class="flex items-start gap-3 cursor-pointer">
          <input
            :checked="incluirVouchers"
            type="checkbox"
            class="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            :disabled="disabled || carregando"
            @change="$emit('update:incluir-vouchers', $event.target.checked)"
          >
          <span>
            <span class="block text-sm font-medium text-gray-800">Procurar vouchers tambem</span>
            <span class="block text-sm text-gray-600">
              Adiciona a consulta de vouchers VAN ao fluxo de debito e credito, mantendo as vendas agrupadas na tabela processada.
            </span>
          </span>
        </label>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
      <div class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div class="text-xs uppercase tracking-wide text-gray-500">Periodo</div>
        <div class="text-sm font-medium text-gray-800 mt-1">
          {{ dataInicial || '-' }} ate {{ dataFinal || '-' }}
        </div>
      </div>

      <div class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div class="text-xs uppercase tracking-wide text-gray-500">Empresa</div>
        <div class="text-sm font-medium text-gray-800 mt-1">
          {{ nomeEmpresa || '-' }}
        </div>
      </div>

      <div class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div class="text-xs uppercase tracking-wide text-gray-500">EC Matriz</div>
        <div class="text-sm font-medium text-gray-800 mt-1">
          {{ ecEmpresa || '-' }}
        </div>
      </div>
    </div>

    <div
      v-if="integracao"
      class="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
    >
      <div class="font-semibold">Integracao localizada</div>
      <div class="mt-1">
        {{ integracao.nome_empresa || '-' }} | Matriz: {{ integracao.matriz || '-' }} | EC API: {{ integracao.ec_adquirente || integracao.matriz || '-' }}
      </div>
      <div class="mt-1">
        Ambiente: {{ integracao.ambiente || '-' }} | Status: {{ integracao.status_integracao || '-' }}
      </div>
    </div>

    <div
      v-if="mensagemErro"
      class="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ mensagemErro }}
    </div>

    <div
      v-if="logOperacional?.texto"
      class="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4"
    >
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div class="text-sm font-semibold text-slate-900">Log operacional para enviar a REDE</div>
          <div class="mt-1 text-sm text-slate-600">
            Copie o texto abaixo e envie para a REDE junto com o CNPJ e a EC analisada.
          </div>
        </div>

        <button
          type="button"
          class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="copiandoLog"
          @click="copiarLogOperacional"
        >
          {{ copiadoLog ? 'Log copiado' : copiandoLog ? 'Copiando...' : 'Copiar log' }}
        </button>
      </div>

      <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div class="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <div class="text-[11px] uppercase tracking-wide text-slate-500">Ambiente</div>
          <div class="mt-1 text-sm font-medium text-slate-900">{{ logOperacional.ambiente || '-' }}</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <div class="text-[11px] uppercase tracking-wide text-slate-500">Endpoint</div>
          <div class="mt-1 text-sm font-medium text-slate-900 break-all">{{ logOperacional.endpointPath || '-' }}</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <div class="text-[11px] uppercase tracking-wide text-slate-500">Consultas</div>
          <div class="mt-1 text-sm font-medium text-slate-900">
            {{ logOperacional.totalConsultas || 0 }} | Processados: {{ logOperacional.totalRegistrosProcessados || 0 }}
          </div>
        </div>
      </div>

      <pre class="mt-4 max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-4 text-[11px] leading-5 text-slate-800">{{ logOperacional.texto }}</pre>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  visivel: {
    type: Boolean,
    default: false
  },
  carregando: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  dataInicial: {
    type: String,
    default: ''
  },
  dataFinal: {
    type: String,
    default: ''
  },
  nomeEmpresa: {
    type: String,
    default: ''
  },
  ecEmpresa: {
    type: String,
    default: ''
  },
  integracao: {
    type: Object,
    default: null
  },
  mensagemErro: {
    type: String,
    default: ''
  },
  tipoConsulta: {
    type: String,
    default: 'debito_credito'
  },
  incluirVouchers: {
    type: Boolean,
    default: false
  },
  endpointConsulta: {
    type: String,
    default: 'v2_sales'
  },
  opcoesEndpoint: {
    type: Array,
    default: () => []
  },
  logOperacional: {
    type: Object,
    default: null
  }
})

defineEmits(['executar', 'update:tipo-consulta', 'update:incluir-vouchers', 'update:endpoint-consulta'])

const endpointDescricaoAtual = computed(() => {
  const opcao = props.opcoesEndpoint.find(item => item?.key === props.endpointConsulta)
  return opcao?.descricao || ''
})

const copiandoLog = ref(false)
const copiadoLog = ref(false)

const copiarLogOperacional = async () => {
  const texto = String(props.logOperacional?.texto || '').trim()
  if (!texto) return

  copiandoLog.value = true
  copiadoLog.value = false

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = texto
      textarea.setAttribute('readonly', 'readonly')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }

    copiadoLog.value = true
    setTimeout(() => {
      copiadoLog.value = false
    }, 2000)
  } finally {
    copiandoLog.value = false
  }
}

const rotuloBotao = computed(() => {
  if (props.tipoConsulta === 'pix') {
    return 'Puxar PIX da Rede'
  }

  if (props.tipoConsulta === 'debito_credito' && props.incluirVouchers) {
    return 'Puxar vendas e vouchers da Rede'
  }

  return props.tipoConsulta === 'vouchers'
    ? 'Puxar vouchers e PAT/FULL da Rede'
    : 'Puxar vendas da Rede'
})

const rotuloCarregando = computed(() => {
  if (props.tipoConsulta === 'pix') {
    return 'Puxando PIX...'
  }

  if (props.tipoConsulta === 'debito_credito' && props.incluirVouchers) {
    return 'Puxando vendas e vouchers...'
  }

  return props.tipoConsulta === 'vouchers'
    ? 'Puxando vouchers e PAT/FULL...'
    : 'Puxando vendas...'
})
</script>
