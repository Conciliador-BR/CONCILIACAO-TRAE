<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
    <div class="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
      <h3 class="text-lg font-semibold text-gray-900">Resumo do Teste</h3>
      <p class="mt-1 text-xs text-gray-600">Status rapido da autenticacao, consulta e quantidade de registros retornados.</p>
    </div>

    <div class="p-6 space-y-4">
      <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        <p class="text-xs font-medium text-gray-700">Integracao selecionada</p>
        <p class="mt-1 text-sm font-semibold text-gray-900">{{ integracaoResumo || 'Nenhuma integracao selecionada' }}</p>
      </div>

      <div class="grid grid-cols-1 gap-3">
        <div class="rounded-xl border border-gray-200 px-4 py-3">
          <p class="text-xs font-medium text-gray-700">Auth OAuth2</p>
          <div class="mt-2">
            <ApiStatusBadge :status="statusResumo.auth" />
          </div>
        </div>

        <div class="rounded-xl border border-gray-200 px-4 py-3">
          <p class="text-xs font-medium text-gray-700">Consulta de dados</p>
          <div class="mt-2">
            <ApiStatusBadge :status="statusResumo.request" />
          </div>
        </div>

        <div class="rounded-xl border border-gray-200 px-4 py-3">
          <p class="text-xs font-medium text-gray-700">Consulta de pagamentos</p>
          <div class="mt-2">
            <ApiStatusBadge :status="statusResumo.payments" />
          </div>
        </div>

        <div class="rounded-xl border border-gray-200 px-4 py-3">
          <p class="text-xs font-medium text-gray-700">HTTP status</p>
          <p class="mt-1 text-sm font-semibold text-gray-900">{{ httpStatusExibido }}</p>
        </div>

        <div class="rounded-xl border border-gray-200 px-4 py-3">
          <p class="text-xs font-medium text-gray-700">Registros retornados</p>
          <p class="mt-1 text-sm font-semibold text-gray-900">{{ quantidadeRegistros }}</p>
        </div>

        <div class="rounded-xl border border-gray-200 px-4 py-3">
          <p class="text-xs font-medium text-gray-700">Pagamentos retornados</p>
          <p class="mt-1 text-sm font-semibold text-gray-900">{{ quantidadePagamentos }}</p>
        </div>

        <div class="rounded-xl border border-gray-200 px-4 py-3">
          <p class="text-xs font-medium text-gray-700">EC / PV usado</p>
          <p class="mt-1 text-sm font-semibold text-gray-900">{{ integracaoSelecionada?.ec_adquirente || '--' }}</p>
        </div>

        <div class="rounded-xl border border-gray-200 px-4 py-3">
          <p class="text-xs font-medium text-gray-700">Colecao principal</p>
          <p class="mt-1 text-sm font-semibold text-gray-900 break-all">{{ resultado?.request?.collectionPath || '--' }}</p>
        </div>

        <div class="rounded-xl border border-gray-200 px-4 py-3">
          <p class="text-xs font-medium text-gray-700">Token mascarado</p>
          <p class="mt-1 text-sm font-mono font-semibold text-gray-900 break-all">{{ resultado?.auth?.accessTokenMasked || '--' }}</p>
        </div>

        <div class="rounded-xl border border-gray-200 px-4 py-3">
          <p class="text-xs font-medium text-gray-700">Origem da credencial</p>
          <p class="mt-1 text-sm font-semibold text-gray-900">{{ resultado?.auth?.credentialSource || 'credenciais_adquirente' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ApiStatusBadge from '~/components/configuracoes/cadastro/cadastro_api/ApiStatusBadge.vue'

const props = defineProps({
  integracaoSelecionada: { type: Object, default: null },
  resultado: { type: Object, default: null },
  quantidadeRegistros: { type: Number, default: 0 },
  quantidadePagamentos: { type: Number, default: 0 },
  statusResumo: {
    type: Object,
    default: () => ({
      auth: 'pendente',
      request: 'pendente',
      payments: 'pendente'
    })
  }
})

const integracaoResumo = computed(() => {
  if (!props.integracaoSelecionada) return ''
  return `${String(props.integracaoSelecionada.adquirente || '').toUpperCase()} - ${props.integracaoSelecionada.ambiente || ''}`
})

const httpStatusExibido = computed(() => {
  return props.resultado?.request?.httpStatus || props.resultado?.payments?.httpStatus || props.resultado?.auth?.httpStatus || '--'
})
</script>
