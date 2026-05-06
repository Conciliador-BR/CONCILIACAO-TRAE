<template>
  <ControladoriaRecebimentosTableComplete
    :recebimentos-data="grupo.recebimentosData"
    :totais="grupo.totais"
    :adquirente="grupo.adquirente"
  />
</template>

<script setup>
import ControladoriaRecebimentosTableComplete from '../ControladoriaRecebimentosTableComplete.vue'

defineProps({
  grupo: {
    type: Object,
    required: true
  }
})
</script>
