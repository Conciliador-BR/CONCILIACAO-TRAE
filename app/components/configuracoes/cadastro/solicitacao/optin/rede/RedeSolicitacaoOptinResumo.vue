<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
    <div class="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
      <h3 class="text-lg font-semibold text-gray-900">Resumo do Opt-In REDE</h3>
      <p class="mt-1 text-xs text-gray-600">Confira rapidamente os dados usados antes de enviar a solicitacao.</p>
    </div>

    <div class="p-6 space-y-4">
      <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        <p class="text-xs font-medium text-gray-700">Integracao selecionada</p>
        <p class="mt-1 text-sm font-semibold text-gray-900">{{ integracaoResumo || 'Nenhuma integracao selecionada' }}</p>
      </div>

      <div class="grid grid-cols-1 gap-3">
        <div class="rounded-xl border border-gray-200 px-4 py-3">
          <p class="text-xs font-medium text-gray-700">PV / EC solicitante</p>
          <p class="mt-1 text-sm font-semibold text-gray-900">{{ form.requestCompanyNumber || '--' }}</p>
        </div>

        <div class="rounded-xl border border-gray-200 px-4 py-3">
          <p class="text-xs font-medium text-gray-700">EC principal cadastrada</p>
          <p class="mt-1 text-sm font-semibold text-gray-900">{{ integracaoSelecionada?.ec_adquirente || '--' }}</p>
        </div>

        <div class="rounded-xl border border-gray-200 px-4 py-3">
          <p class="text-xs font-medium text-gray-700">Ultimo status de opt-in</p>
          <div class="mt-2">
            <ApiStatusBadge :status="integracaoSelecionada?.ultimo_optin_status || 'pendente'" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ApiStatusBadge from '~/components/configuracoes/cadastro/cadastro_api/ApiStatusBadge.vue'

const props = defineProps({
  form: { type: Object, required: true },
  integracaoSelecionada: { type: Object, default: null }
})

const integracaoResumo = computed(() => {
  if (!props.integracaoSelecionada) return ''
  return `${String(props.integracaoSelecionada.adquirente || '').toUpperCase()} - ${props.integracaoSelecionada.ambiente || ''}`
})
</script>
