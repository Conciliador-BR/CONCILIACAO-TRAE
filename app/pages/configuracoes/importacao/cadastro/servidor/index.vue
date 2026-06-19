<template>
  <ServidorContainer />
</template>

<script setup>
import ServidorContainer from '~/components/configuracoes/cadastro/servidor/ServidorContainer.vue'

useHead({
  title: 'Servidor - MRF CONCILIACAO',
  meta: [
    { name: 'description', content: 'Gestao da estrutura de pastas do servidor de conciliacao.' }
  ]
})
</script>
