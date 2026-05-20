<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
    <div class="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">Integracoes Cadastradas</h3>
          <p class="mt-1 text-xs text-gray-600">Lista operacional de credenciais por empresa e ambiente.</p>
        </div>
        <button
          type="button"
          class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          :disabled="loading"
          @click="$emit('recarregar')"
        >
          {{ loading ? 'Atualizando...' : 'Atualizar Lista' }}
        </button>
      </div>
    </div>

    <div class="p-6">
      <div v-if="integracoes.length" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Empresa</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Adquirente</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Ambiente</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">EC / PV</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Client ID</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Ativo</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Ultima validacao</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Acao</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white">
            <tr v-for="integracao in integracoes" :key="integracao.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm text-gray-700">
                {{ resolverNomeEmpresa(integracao.empresa_id) }}
              </td>
              <td class="px-4 py-3 text-sm font-medium text-gray-900 uppercase">{{ integracao.adquirente }}</td>
              <td class="px-4 py-3 text-sm text-gray-700 capitalize">{{ integracao.ambiente }}</td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ integracao.ec_adquirente || '-' }}</td>
              <td class="px-4 py-3 text-sm font-mono text-gray-700">{{ mascararClientId(integracao.client_id) }}</td>
              <td class="px-4 py-3">
                <ApiStatusBadge :status="integracao.status_integracao" />
              </td>
              <td class="px-4 py-3 text-sm">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="integracao.ativo ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'"
                >
                  {{ integracao.ativo ? 'Sim' : 'Nao' }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ formatarData(integracao.ultima_validacao_em) }}</td>
              <td class="px-4 py-3 text-right">
                <button
                  type="button"
                  class="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
                  @click="$emit('editar', integracao)"
                >
                  Editar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        Nenhuma integracao cadastrada ainda. Salve o primeiro registro no formulario ao lado.
      </div>
    </div>
  </div>
</template>

<script setup>
import ApiStatusBadge from './ApiStatusBadge.vue'

const props = defineProps({
  integracoes: { type: Array, default: () => [] },
  empresas: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

defineEmits(['editar', 'recarregar'])

const resolverNomeEmpresa = (empresaId) => {
  const empresa = props.empresas.find(item => item.id === empresaId || item.id == empresaId)
  return empresa?.displayName || empresa?.nome || 'Empresa nao encontrada'
}

const mascararClientId = (value) => {
  const texto = String(value || '')
  if (texto.length <= 8) return texto
  return `${texto.slice(0, 4)}...${texto.slice(-4)}`
}

const formatarData = (value) => {
  if (!value) return 'Nao validado'

  const data = new Date(value)
  if (Number.isNaN(data.getTime())) return 'Data invalida'

  return data.toLocaleString('pt-BR')
}
</script>
