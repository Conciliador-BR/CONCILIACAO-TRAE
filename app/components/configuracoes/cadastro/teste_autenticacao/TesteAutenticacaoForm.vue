<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
    <div class="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-200">
      <h3 class="text-2xl font-bold text-gray-900">Configurar Teste</h3>
      <p class="text-sm text-gray-600 mt-1">Selecione a operadora, a integracao e deixe a tela montar automaticamente a configuracao do teste.</p>
    </div>

    <form class="p-8 space-y-6" @submit.prevent="$emit('executar')">
      <div class="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-900">
        Esta tela usa a integracao cadastrada para preencher automaticamente URL, rota, EC e periodo.
        Para a REDE, a EC salva em `ec_adquirente` alimenta `parentCompanyNumber` e `subsidiaries`.
        O fluxo segue o mesmo padrao do seu Python: `POST /oauth2/token` e depois `GET /merchant-statement/v1/sales`.
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <CadastroApiSeletorOperadora
            :model-value="form.operadoraSelecionada"
            :adquirentes="adquirentes"
            :vouchers="vouchers"
            @update:model-value="$emit('selecionar-operadora', $event)"
          />
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Integracao cadastrada *</label>
          <select
            :value="form.integrationId"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
            @change="$emit('selecionar-integracao', $event.target.value)"
          >
            <option value="">Selecione uma integracao</option>
            <option v-for="integracao in integracoes" :key="integracao.id" :value="integracao.id">
              {{ formatarIntegracao(integracao) }}
            </option>
          </select>
        </div>

        <div v-if="presetHint" class="md:col-span-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
          <p class="text-sm font-semibold text-gray-900">Configuracao automatica</p>
          <p class="mt-1 text-xs text-gray-600">{{ presetHint }}</p>
        </div>

        <div class="md:col-span-2 grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">URL de autenticacao OAuth2</label>
            <input
              :value="authUrlPreview"
              type="text"
              readonly
              class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 font-mono text-sm"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">PV / EC usado</label>
            <input
              :value="pvEcPreview"
              type="text"
              readonly
              class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 font-mono text-sm"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Data inicial</label>
          <input
            v-model="form.dataInicial"
            type="date"
            class="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Data final</label>
          <input
            v-model="form.dataFinal"
            type="date"
            class="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Metodo HTTP *</label>
          <select v-model="form.method" class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white">
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Timeout (ms)</label>
          <input v-model="form.timeoutMs" type="number" min="3000" max="60000" step="1000" class="w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Base URL de dados</label>
          <input
            v-model="form.baseUrlOverride"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="https://rl7-sandbox-api.useredecloud.com.br"
          />
          <label class="mt-2 inline-flex items-center gap-2 text-xs text-gray-600">
            <input v-model="form.preferNovoSandbox" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-200" />
            Preferir URL sandbox nova quando aplicavel
          </label>
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Rota / endpoint *</label>
          <input
            v-model="form.endpointPath"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono"
            placeholder="/merchant-statement/v1/sales"
          />
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Query params em JSON</label>
          <textarea
            v-model="form.queryParamsText"
            rows="9"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
            placeholder="{&quot;parentCompanyNumber&quot;:&quot;13381369&quot;}"
          />
          <p class="mt-2 text-xs text-gray-500">
            Se a collection do Postman usa apenas `parentCompanyNumber` e `size`, mantenha os mesmos campos aqui para comparar o resultado entre sistema e Postman.
          </p>
          <p class="mt-2 text-xs text-gray-500 break-all">
            URL final de vendas: <span class="font-mono">{{ requestUrlPreview || '--' }}</span>
          </p>
        </div>

        <div class="md:col-span-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
          <p class="text-sm font-semibold text-gray-900">Consulta de pagamentos / recebimentos</p>
          <p class="mt-1 text-xs text-gray-600">A tabela de recebimentos usa uma segunda consulta automatica com os dados abaixo.</p>

          <div class="mt-4 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Endpoint de pagamentos</label>
              <input
                v-model="form.paymentsEndpointPath"
                type="text"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono"
                placeholder="/merchant-statement/v1/payments"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Query params de pagamentos em JSON</label>
              <textarea
                v-model="form.paymentsQueryParamsText"
                rows="7"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
                placeholder="{&quot;parentCompanyNumber&quot;:&quot;13381369&quot;}"
              />
              <p class="mt-2 text-xs text-gray-500 break-all">
                URL final de pagamentos: <span class="font-mono">{{ paymentsUrlPreview || '--' }}</span>
              </p>
            </div>
          </div>
        </div>

        <div v-if="form.method !== 'GET'" class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Body em JSON</label>
          <textarea
            v-model="form.requestBodyText"
            rows="8"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
            placeholder="{ }"
          />
        </div>
      </div>

      <div v-if="erros.length" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-sm font-semibold text-red-700 mb-2">Corrija os pontos abaixo:</p>
        <ul class="text-sm text-red-700 list-disc pl-5">
          <li v-for="erro in erros" :key="erro">{{ erro }}</li>
        </ul>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50"
          @click="$emit('limpar')"
        >
          Limpar
        </button>
        <button
          type="submit"
          :disabled="executando"
          class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ executando ? 'Executando teste...' : 'Testar Autenticacao e Dados' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import CadastroApiSeletorOperadora from '~/components/configuracoes/cadastro/cadastro_api/CadastroApiSeletorOperadora.vue'

defineProps({
  form: { type: Object, required: true },
  erros: { type: Array, default: () => [] },
  integracoes: { type: Array, default: () => [] },
  executando: { type: Boolean, default: false },
  adquirentes: { type: Array, default: () => [] },
  vouchers: { type: Array, default: () => [] },
  presetHint: { type: String, default: '' },
  authUrlPreview: { type: String, default: '' },
  pvEcPreview: { type: String, default: '' },
  requestUrlPreview: { type: String, default: '' },
  paymentsUrlPreview: { type: String, default: '' }
})

defineEmits(['executar', 'limpar', 'selecionar-integracao', 'selecionar-operadora'])

const formatarIntegracao = (integracao) => {
  const nomeEmpresa = String(integracao?.nome_empresa || '').trim()
  const adquirente = String(integracao?.adquirente || '').trim().toUpperCase()

  if (nomeEmpresa && adquirente) return `${nomeEmpresa} - ${adquirente}`
  if (nomeEmpresa) return nomeEmpresa
  if (adquirente) return adquirente
  return 'Integracao sem identificacao'
}
</script>
