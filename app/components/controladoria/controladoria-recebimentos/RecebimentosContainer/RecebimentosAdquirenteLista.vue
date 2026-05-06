<template>
  <div>
    <RecebimentosAdquirenteCard
      v-for="grupo in gruposPorAdquirente"
      :key="grupo.adquirente"
      :grupo="grupo"
    />
  </div>
</template>

<script setup>
import RecebimentosAdquirenteCard from './RecebimentosAdquirenteCard.vue'

defineProps({
  gruposPorAdquirente: {
    type: Array,
    default: () => []
  }
})
</script>
