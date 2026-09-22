<template>
  <TabelaAutorizadaManualBase
    :controller="controller"
    @deleted="emit('deleted')"
  />
</template>

<script setup>
import { ref } from 'vue'
import TabelaAutorizadaManualBase from '~/components/controladoria/manual_autorizada_shared/TabelaAutorizadaManualBase.vue'
import { useManualAutorizadaRecebimentos } from '~/composables/PageControladoria/controladoria-recebimentos/adquirente_manual_recebimentos/useManualAutorizadaRecebimentos'

const filtroAtivo = ref(null)
const emit = defineEmits(['deleted'])

const controller = useManualAutorizadaRecebimentos(filtroAtivo)
</script>
