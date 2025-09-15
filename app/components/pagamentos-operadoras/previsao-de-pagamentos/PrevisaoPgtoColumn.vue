<template>
  <span :class="{
    'text-green-600 font-medium': previsaoCalculada && previsaoCalculada !== '-' && previsaoCalculada !== 'Taxa não cadastrada',
    'text-gray-400': !previsaoCalculada || previsaoCalculada === '-',
    'text-red-500': erro || previsaoCalculada === 'Taxa não cadastrada',
    'text-orange-500': previsaoCalculada === 'Taxa não cadastrada'
  }">
    {{ previsaoCalculada || '-' }}
    <span v-if="debug" class="text-xs text-gray-500 ml-1">
      ({{ debugInfo }})
    </span>
  </span>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { usePrevisaoColuna } from '~/composables/PagePagamentos/usePrevisaoColuna'

const props = defineProps({
  venda: {
    type: Object,
    required: true
  },
  debug: {
    type: Boolean,
    default: false
  }
})

const { calcularPrevisaoVenda, inicializar, taxas } = usePrevisaoColuna()
const erro = ref(false)
const debugInfo = ref('')
const taxasCarregadas = ref(false)

// Inicializar taxas quando o componente for montado
onMounted(async () => {
  if (!taxasCarregadas.value && (!taxas.value || taxas.value.length === 0)) {
    console.log('🔄 Inicializando taxas do Supabase no PrevisaoPgtoColumn...')
    await inicializar()
    taxasCarregadas.value = true
    console.log('✅ Taxas carregadas:', taxas.value.length, 'registros')
  }
})

const previsaoCalculada = computed(() => {
  try {
    erro.value = false
    
    // Aguardar as taxas serem carregadas
    if (!taxasCarregadas.value || !taxas.value || taxas.value.length === 0) {
      return 'Carregando...'
    }
    
    const resultado = calcularPrevisaoVenda(props.venda)
    
    if (props.debug) {
      debugInfo.value = `${props.venda.modalidade}-${props.venda.adquirente} (${taxas.value.length} taxas)`
    }
    
    return resultado
  } catch (error) {
    console.error('Erro ao calcular previsão:', error)
    erro.value = true
    debugInfo.value = 'ERRO'
    return 'Erro'
  }
})
</script>