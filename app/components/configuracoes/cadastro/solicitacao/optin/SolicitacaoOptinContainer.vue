<template>
  <div class="space-y-6">
    <SolicitacaoOptinSeletorAdquirente v-model="adquirenteSelecionada" />

    <RedeSolicitacaoOptinContainer v-if="adquirenteSelecionada === 'rede'" />

    <div
      v-else
      class="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500"
    >
      Clique em um card para abrir a configuracao da solicitacao de opt-in da adquirente.
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SolicitacaoOptinSeletorAdquirente from './SolicitacaoOptinSeletorAdquirente.vue'
import RedeSolicitacaoOptinContainer from './rede/RedeSolicitacaoOptinContainer.vue'

const adquirenteSelecionada = ref('')
</script>
