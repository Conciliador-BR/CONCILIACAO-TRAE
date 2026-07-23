<template>
  <ManualAutorizadaSection
    title="Autorizada Manual"
    subtitle="Lancamentos manuais por bandeira para adquirentes de cartao"
    :nome-adquirente="nomeAdquirente"
    :empresa-selecionada="empresaSelecionada"
    :loading="loading"
    :error="error"
    :success-message="successMessage"
    :linhas="linhas"
    :totais="totais"
    :atualizar-input="atualizarInput"
    :focar-input="focarInput"
    :blur-input="blurInput"
    :tem-alteracao="temAlteracao"
    @update:nome-adquirente="atualizarNomeAdquirente($event)"
    @reload="carregarDados"
    @send-row="enviarLinha"
  />
</template>

<script setup>
import { useVendas } from '~/composables/useVendas'
import ManualAutorizadaSection from '~/components/controladoria/controladoria-vendas/adquirente_manual_vendas/ManualAutorizadaSection.vue'
import { useManualAutorizadaVendas } from '~/composables/PageControladoria/controladoria-vendas/adquirente_manual_vendas/useManualAutorizadaVendas'

const { filtroAtivo } = useVendas()

const {
  nomeAdquirente,
  empresaSelecionada,
  linhas,
  loading,
  error,
  successMessage,
  totais,
  carregarDados,
  enviarLinha,
  atualizarNomeAdquirente,
  temAlteracao,
  atualizarInput,
  focarInput,
  blurInput
} = useManualAutorizadaVendas(filtroAtivo)
</script>
