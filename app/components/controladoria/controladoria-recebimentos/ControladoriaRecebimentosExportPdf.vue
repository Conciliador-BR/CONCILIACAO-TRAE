<template>
  <ControladoriaVendasExportPdf
    target-id="controladoria-recebimentos-root"
    report-prefix="Controladoria_de_Recebimentos"
    layout="recebimentos"
  />
</template>

<script setup>
import ControladoriaVendasExportPdf from '~/components/controladoria/controladoria-vendas/ControladoriaVendasExportPdf.vue'
</script>
