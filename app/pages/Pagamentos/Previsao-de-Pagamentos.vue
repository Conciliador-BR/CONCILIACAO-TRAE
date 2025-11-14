<template>
  <PrevisaoPagamentosContainer />
</template>

<script setup>
import PrevisaoPagamentosContainer from '~/components/pagamentos-operadoras/previsao-de-pagamentos/PrevisaoPagamentosContainer.vue'

// Configurações da página
useHead({ title: 'Previsão de Pagamentos - MRF CONCILIAÇÃO' })
definePageMeta({ keepalive: true })

// Função para registrar visita à aba de previsão
const registrarVisitaPrevisao = () => {
  if (process.client) {
    localStorage.setItem('pagamentos_ultima_aba', 'previsao')
  }
}

// Registrar visita ao montar o componente
onMounted(() => {
  registrarVisitaPrevisao()
})
</script>