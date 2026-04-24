<template>
  <div>
    <template v-if="gruposBanco.length > 0">
      <template v-for="grupo in gruposBanco" :key="grupo.id">
        <component
          v-if="grupo.component"
          :is="grupo.component"
          :transacoes="grupo.transacoes"
        />
        <div v-else class="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200 mb-4">
          <p class="text-lg font-medium">Visualização resumida não disponível para este banco.</p>
          <p class="text-sm mt-1">Banco detectado: {{ grupo.bancoOriginal || 'Desconhecido' }}</p>
        </div>
      </template>
    </template>

    <div v-else class="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
      <p class="text-lg font-medium">Sem transações para resumir.</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import DetectadorAdquirentesSicoob from './Detectador_Adquirentes/DetectadorAdquirentesSicoob.vue'
import DetectadorAdquirentesBradesco from './Detectador_Adquirentes/DetectadorAdquirentesBradesco.vue'
import DetectadorAdquirentesTribanco from './Detectador_Adquirentes/DetectadorAdquirentesTribanco.vue'
import DetectadorAdquirentesBancoDoBrasil from './Detectador_Adquirentes/DetectadorAdquirentesBancoDoBrasil.vue'
import DetectadorAdquirentesItau from './Detectador_Adquirentes/DetectadorAdquirentesItau.vue'
import DetectadorAdquirentesSafra from './Detectador_Adquirentes/DetectadorAdquirentesSafra.vue'
import DetectadorAdquirentesBancoCaixa from './Detectador_Adquirentes/DetectadorAdquirentesBancoCaixa.vue'
import DetectadorAdquirentesBancoDoNordeste from './Detectador_Adquirentes/DetectadorAdquirentesBancoDoNordeste.vue'
import DetectadorAdquirentesSicredi from './Detectador_Adquirentes/DetectadorAdquirentesSicredi.vue'
import DetectadorAdquirentesBanestes from './Detectador_Adquirentes/DetectadorAdquirentesBanestes.vue'
import DetectadorAdquirentesSantander from './Detectador_Adquirentes/DetectadorAdquirentesSantander.vue'
import DetectadorAdquirentesStone from './Detectador_Adquirentes/DetectadorAdquirentesStone.vue'
import { detectarBancoResumo } from '~/composables/configuracoes/importacao/importacao_bancos/useResumoBancoDetectado'

const props = defineProps({
  transacoes: {
    type: Array,
    default: () => []
  }
})

const mapaComponentes = {
  sicoob: DetectadorAdquirentesSicoob,
  bradesco: DetectadorAdquirentesBradesco,
  tribanco: DetectadorAdquirentesTribanco,
  bb: DetectadorAdquirentesBancoDoBrasil,
  itau: DetectadorAdquirentesItau,
  safra: DetectadorAdquirentesSafra,
  caixa: DetectadorAdquirentesBancoCaixa,
  bnb: DetectadorAdquirentesBancoDoNordeste,
  sicredi: DetectadorAdquirentesSicredi,
  banestes: DetectadorAdquirentesBanestes,
  santander: DetectadorAdquirentesSantander,
  stone: DetectadorAdquirentesStone
}

const gruposBanco = computed(() => {
  const mapa = new Map()
  for (const t of props.transacoes || []) {
    const bancoOriginal = String(t?.banco || '')
    const chave = detectarBancoResumo(bancoOriginal) || '__desconhecido__'
    if (!mapa.has(chave)) {
      mapa.set(chave, { chave, bancoOriginal, transacoes: [] })
    }
    mapa.get(chave).transacoes.push(t)
  }
  return Array.from(mapa.values()).map((g, i) => ({
    id: `${g.chave}-${i}`,
    bancoOriginal: g.bancoOriginal,
    transacoes: g.transacoes,
    component: mapaComponentes[g.chave] || null
  }))
})
</script>
