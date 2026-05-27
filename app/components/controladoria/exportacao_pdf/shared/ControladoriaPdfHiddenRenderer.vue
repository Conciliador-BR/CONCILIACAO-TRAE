<template>
  <div v-if="pageIds.length > 0" class="pdf-export-preload-host" aria-hidden="true">
    <component
      :is="resolvedComponents[pageId]"
      v-for="pageId in pageIds"
      :key="`${pageId}-${renderKey}`"
    />
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { CONTROLADORIA_PDF_OPTIONS } from '~/components/controladoria/exportacao_pdf/shared/exportRegistry'

const props = defineProps({
  pageIds: {
    type: Array,
    default: () => []
  },
  renderKey: {
    type: Number,
    default: 0
  }
})

const resolvedComponents = computed(() => {
  return props.pageIds.reduce((acc, pageId) => {
    const option = CONTROLADORIA_PDF_OPTIONS.find(item => item.id === pageId)
    if (option?.loader) {
      acc[pageId] = defineAsyncComponent(option.loader)
    }
    return acc
  }, {})
})
</script>

<style scoped>
.pdf-export-preload-host {
  position: fixed;
  top: 0;
  left: -200vw;
  width: 1600px;
  max-width: 1600px;
  opacity: 1;
  background: #fff;
  overflow: visible;
  pointer-events: none;
  z-index: -1;
}
</style>
