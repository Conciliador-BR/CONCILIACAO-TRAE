<template>
  <div class="flex-1 flex flex-col bg-white p-6">
    <div v-if="!transacoes.length" class="text-center py-8 text-gray-500">
      <p>Nenhuma transação para exibir.</p>
    </div>

    <div v-else>
      <DetectadorAdquirentesSicoob v-if="bancoDetectado === 'sicoob'" :transacoes="transacoes" />
      <DetectadorAdquirentesBradesco v-else-if="bancoDetectado === 'bradesco'" :transacoes="transacoes" />
      <DetectadorAdquirentesTribanco v-else-if="bancoDetectado === 'tribanco'" :transacoes="transacoes" />
      <DetectadorAdquirentesBancoDoBrasil v-else-if="bancoDetectado === 'bb'" :transacoes="transacoes" />
      <DetectadorAdquirentesItau v-else-if="bancoDetectado === 'itau'" :transacoes="transacoes" />
      <DetectadorAdquirentesSafra v-else-if="bancoDetectado === 'safra'" :transacoes="transacoes" />
      <DetectadorAdquirentesBancoCaixa v-else-if="bancoDetectado === 'caixa'" :transacoes="transacoes" />
      <DetectadorAdquirentesBancoDoNordeste v-else-if="bancoDetectado === 'bnb'" :transacoes="transacoes" />

      <div v-else class="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
        <p class="text-lg font-medium">Visualização resumida não disponível para este banco.</p>
        <p class="text-sm mt-1">Banco detectado: {{ bancoOriginal || 'Desconhecido' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import DetectadorAdquirentesSicoob from '~/components/configuracoes/importacao/importacao_bancos/Detectador_Adquirentes/DetectadorAdquirentesSicoob.vue'
import DetectadorAdquirentesBradesco from '~/components/configuracoes/importacao/importacao_bancos/Detectador_Adquirentes/DetectadorAdquirentesBradesco.vue'
import DetectadorAdquirentesTribanco from '~/components/configuracoes/importacao/importacao_bancos/Detectador_Adquirentes/DetectadorAdquirentesTribanco.vue'
import DetectadorAdquirentesBancoDoBrasil from '~/components/configuracoes/importacao/importacao_bancos/Detectador_Adquirentes/DetectadorAdquirentesBancoDoBrasil.vue'
import DetectadorAdquirentesItau from '~/components/configuracoes/importacao/importacao_bancos/Detectador_Adquirentes/DetectadorAdquirentesItau.vue'
import DetectadorAdquirentesSafra from '~/components/configuracoes/importacao/importacao_bancos/Detectador_Adquirentes/DetectadorAdquirentesSafra.vue'
import DetectadorAdquirentesBancoCaixa from '~/components/configuracoes/importacao/importacao_bancos/Detectador_Adquirentes/DetectadorAdquirentesBancoCaixa.vue'
import DetectadorAdquirentesBancoDoNordeste from '~/components/configuracoes/importacao/importacao_bancos/Detectador_Adquirentes/DetectadorAdquirentesBancoDoNordeste.vue'

const props = defineProps({
  transacoes: {
    type: Array,
    default: () => []
  }
})

const bancoOriginal = computed(() => {
  if (!props.transacoes.length) return ''
  return props.transacoes[0].banco || ''
})

const bancoDetectado = computed(() => {
  const banco = (bancoOriginal.value || '').toLowerCase()
  if (banco.includes('sicoob')) return 'sicoob'
  if (banco.includes('bradesco')) return 'bradesco'
  if (banco.includes('tribanco')) return 'tribanco'
  if (banco.includes('banco do brasil') || banco.includes('brasil')) return 'bb'
  if (banco.includes('itaú') || banco.includes('itau')) return 'itau'
  if (banco.includes('safra')) return 'safra'
  if (banco.includes('caixa')) return 'caixa'
  if (banco.includes('nordeste') || banco.includes('banco do nordeste') || banco.includes('bnb')) return 'bnb'
  return null
})
</script>
