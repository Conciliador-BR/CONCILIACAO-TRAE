<template>
  <div class="flex-1 flex flex-col bg-white p-6">
    <!-- Container que delega para o detector apropriado -->
    <DetectadorAdquirentesSicoob v-if="bancoDetectado === 'sicoob'" :transacoes="transacoes" />
    <DetectadorAdquirentesBradesco v-else-if="bancoDetectado === 'bradesco'" :transacoes="transacoes" />
    <DetectadorAdquirentesTribanco v-else-if="bancoDetectado === 'tribanco'" :transacoes="transacoes" />
    <DetectadorAdquirentesBancoDoBrasil v-else-if="bancoDetectado === 'bb'" :transacoes="transacoes" />
    <DetectadorAdquirentesItau v-else-if="bancoDetectado === 'itau'" :transacoes="transacoes" />
    <DetectadorAdquirentesSafra v-else-if="bancoDetectado === 'safra'" :transacoes="transacoes" />
    
    <!-- Fallback para quando o banco não tem detector específico ou múltiplos bancos -->
    <div v-else>
      <!-- Se houver múltiplos bancos ou banco desconhecido, usamos o Sicoob como genérico pois é bem completo, 
           ou implementamos um genérico. O Sicoob usa a estratégia padrão + tripag. 
           Vamos usar um aviso se não detectar, mas como o usuário pediu "da mesma forma", 
           se não detectar, a importação mostra "Visualização resumida não disponível".
           Porém, no Extrato Detalhado, o usuário pode ter selecionado "TODOS".
      -->
      <div v-if="transacoes.length > 0" class="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
        <p class="text-lg font-medium">Visualização resumida otimizada não disponível para múltiplos bancos ou banco não suportado.</p>
        <p class="text-sm mt-1">Selecione um banco específico para ver a detecção detalhada.</p>
        <p class="text-xs mt-2 text-gray-400">Banco detectado: {{ bancoOriginal || 'Vários/Desconhecido' }}</p>
      </div>
      <div v-else class="text-center py-8 text-gray-500">
        <p>Nenhuma transação para exibir.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Importar detectores diretamente da pasta de importação
import DetectadorAdquirentesSicoob from '~/components/importacao/importacao_bancos/Detectador_Adquirentes/DetectadorAdquirentesSicoob.vue'
import DetectadorAdquirentesBradesco from '~/components/importacao/importacao_bancos/Detectador_Adquirentes/DetectadorAdquirentesBradesco.vue'
import DetectadorAdquirentesTribanco from '~/components/importacao/importacao_bancos/Detectador_Adquirentes/DetectadorAdquirentesTribanco.vue'
import DetectadorAdquirentesBancoDoBrasil from '~/components/importacao/importacao_bancos/Detectador_Adquirentes/DetectadorAdquirentesBancoDoBrasil.vue'
import DetectadorAdquirentesItau from '~/components/importacao/importacao_bancos/Detectador_Adquirentes/DetectadorAdquirentesItau.vue'
import DetectadorAdquirentesSafra from '~/components/importacao/importacao_bancos/Detectador_Adquirentes/DetectadorAdquirentesSafra.vue'

// Props
const props = defineProps({
  transacoes: {
    type: Array,
    default: () => []
  }
})

const bancoOriginal = computed(() => {
  if (!props.transacoes.length) return ''
  // Tenta pegar do primeiro item. Se houver filtro de banco, todos serão iguais.
  // Se for TODOS, pode ser misturado, então essa lógica serve para habilitar o detector correto se for homogêneo.
  return props.transacoes[0].banco || ''
})

const bancoDetectado = computed(() => {
  const banco = (bancoOriginal.value || '').toLowerCase()
  
  // Lógica de detecção igual ao TabelaTransacoesBanco.vue
  if (banco.includes('sicoob')) return 'sicoob'
  if (banco.includes('bradesco')) return 'bradesco'
  if (banco.includes('tribanco')) return 'tribanco'
  if (banco.includes('banco do brasil') || banco.includes('brasil') || banco === 'bb') return 'bb'
  if (banco.includes('itaú') || banco.includes('itau')) return 'itau'
  if (banco.includes('safra')) return 'safra'
  
  return null
})
</script>
