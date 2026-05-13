<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
    <div class="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
      <h3 class="text-lg font-semibold text-gray-900">Resumo da Integracao</h3>
      <p class="mt-1 text-xs text-gray-600">Valide rapidamente o cadastro antes de salvar.</p>
    </div>

    <div class="p-6 space-y-4">
      <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        <p class="text-xs font-medium text-gray-700">Empresa selecionada</p>
        <p class="mt-1 text-sm font-semibold text-gray-900">{{ empresaSelecionada?.displayName || 'Nenhuma empresa selecionada' }}</p>
      </div>

      <div class="grid grid-cols-1 gap-3">
        <div class="rounded-xl border border-gray-200 px-4 py-3">
          <p class="text-xs font-medium text-gray-700">Adquirente</p>
          <p class="mt-1 text-sm font-semibold text-gray-900">{{ adquirentePreview || 'Nao informado' }}</p>
        </div>

        <div class="rounded-xl border border-gray-200 px-4 py-3">
          <p class="text-xs font-medium text-gray-700">Ambiente</p>
          <p class="mt-1 text-sm font-semibold text-gray-900 capitalize">{{ form.ambiente || 'sandbox' }}</p>
        </div>

        <div class="rounded-xl border border-gray-200 px-4 py-3">
          <p class="text-xs font-medium text-gray-700">Status atual</p>
          <div class="mt-2">
            <ApiStatusBadge :status="form.status_integracao" />
          </div>
        </div>

        <div class="rounded-xl border border-gray-200 px-4 py-3">
          <p class="text-xs font-medium text-gray-700">Client ID</p>
          <p class="mt-1 text-sm font-mono font-semibold text-gray-900 break-all">{{ form.client_id || 'Nao informado' }}</p>
        </div>
      </div>

      <div class="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4">
        <p class="text-sm font-semibold text-blue-900">Boas praticas desta tela</p>
        <ul class="mt-2 space-y-2 text-xs text-blue-900">
          <li>- Use uma integracao por empresa + adquirente + ambiente.</li>
          <li>- Mantenha `sandbox` e `producao` separados.</li>
          <li>- Ao editar, informe novo secret apenas quando realmente trocar a credencial.</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ApiStatusBadge from './ApiStatusBadge.vue'

const props = defineProps({
  form: { type: Object, required: true },
  empresaSelecionada: { type: Object, default: null },
  adquirentePersonalizado: { type: String, required: true }
})

const adquirentePreview = computed(() => {
  if (props.form.adquirente === props.adquirentePersonalizado) {
    return props.form.adquirente_personalizado || ''
  }
  return props.form.adquirente || ''
})
</script>
