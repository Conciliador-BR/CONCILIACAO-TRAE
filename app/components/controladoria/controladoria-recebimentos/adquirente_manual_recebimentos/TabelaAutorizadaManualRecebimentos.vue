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
import { ref } from 'vue'
import ManualAutorizadaSection from '~/components/controladoria/controladoria-recebimentos/adquirente_manual_recebimentos/ManualAutorizadaSection.vue'
import { useManualAutorizadaRecebimentos } from '~/composables/PageControladoria/controladoria-recebimentos/adquirente_manual_recebimentos/useManualAutorizadaRecebimentos'

const filtroAtivo = ref(null)

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
} = useManualAutorizadaRecebimentos(filtroAtivo)
</script>
