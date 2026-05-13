<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
    <div class="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">Ultimos Logs</h3>
          <p class="mt-1 text-xs text-gray-600">{{ subtitulo }}</p>
        </div>
        <button
          type="button"
          class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          :disabled="loading"
          @click="$emit('recarregar')"
        >
          {{ loading ? 'Atualizando...' : 'Atualizar Logs' }}
        </button>
      </div>
    </div>

    <div class="p-6">
      <div v-if="logs.length" class="space-y-3">
        <div
          v-for="log in logs"
          :key="log.id"
          class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4"
        >
          <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div class="space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-semibold text-gray-900 uppercase">{{ log.adquirente }}</span>
                <ApiStatusBadge :status="log.status_execucao" type="log" />
                <span class="text-xs text-gray-500">{{ formatarData(log.created_at) }}</span>
              </div>
              <p class="text-sm text-gray-700">
                <span class="font-medium text-gray-900">Operacao:</span> {{ log.tipo_operacao }}
              </p>
              <p class="text-sm text-gray-700">
                <span class="font-medium text-gray-900">Mensagem:</span> {{ log.mensagem || 'Sem mensagem adicional.' }}
              </p>
              <p v-if="log.http_status" class="text-sm text-gray-700">
                <span class="font-medium text-gray-900">HTTP:</span> {{ log.http_status }}
              </p>
              <p v-if="log.periodo_inicial || log.periodo_final" class="text-sm text-gray-700">
                <span class="font-medium text-gray-900">Periodo:</span>
                {{ log.periodo_inicial || '--' }} ate {{ log.periodo_final || '--' }}
              </p>
            </div>

            <div class="text-xs text-gray-500 space-y-1 min-w-[160px]">
              <p><span class="font-medium text-gray-700">Registros:</span> {{ log.quantidade_registros ?? 0 }}</p>
              <p v-if="log.request_id"><span class="font-medium text-gray-700">Request:</span> {{ log.request_id }}</p>
              <p v-if="log.integracao_id"><span class="font-medium text-gray-700">Integracao:</span> #{{ log.integracao_id }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        Nenhum log encontrado para o contexto atual.
      </div>
    </div>
  </div>
</template>

<script setup>
import ApiStatusBadge from './ApiStatusBadge.vue'

defineProps({
  logs: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  subtitulo: { type: String, default: 'Historico tecnico mais recente da integracao.' }
})

defineEmits(['recarregar'])

const formatarData = (value) => {
  if (!value) return 'Data nao informada'

  const data = new Date(value)
  if (Number.isNaN(data.getTime())) return 'Data invalida'

  return data.toLocaleString('pt-BR')
}
</script>
