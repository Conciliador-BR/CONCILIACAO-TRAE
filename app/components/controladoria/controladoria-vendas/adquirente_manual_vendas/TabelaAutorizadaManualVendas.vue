<template>
  <TabelaAutorizadaManualBase
    :controller="controller"
    @deleted="emit('deleted')"
  />
</template>

<script setup>
import { useVendas } from '~/composables/useVendas'
import TabelaAutorizadaManualBase from '~/components/controladoria/manual_autorizada_shared/TabelaAutorizadaManualBase.vue'
import { useManualAutorizadaVendas } from '~/composables/PageControladoria/controladoria-vendas/adquirente_manual_vendas/useManualAutorizadaVendas'

const { filtroAtivo } = useVendas()
const emit = defineEmits(['deleted'])

const controller = useManualAutorizadaVendas(filtroAtivo)
</script>
