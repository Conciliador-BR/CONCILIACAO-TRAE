<template>
  <div v-if="sidebarAberta" @click="$emit('fechar-sidebar')" class="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"></div>
</template>

<script setup>
defineProps({
  sidebarAberta: Boolean
})

defineEmits(['fechar-sidebar'])
</script>