<template>
  <div>
    <div v-if="resumoGetnet.total > 0" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 transition-all hover:shadow-md">
      <div class="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm text-white font-bold text-lg shrink-0 bg-red-600">
            S
          </div>
          <div>
            <h3 class="text-lg font-bold text-gray-800 leading-tight">GETNET</h3>
            <p class="text-sm text-gray-500 font-medium flex items-center gap-1 mt-0.5">
              <BuildingLibraryIcon class="w-4 h-4" />
              Santander
            </p>
          </div>
        </div>

        <div class="flex items-center gap-8 w-full md:w-auto justify-end">
          <div class="text-right">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Transacoes</p>
            <p class="text-lg font-bold text-gray-700 leading-none">{{ resumoGetnet.quantidade }}</p>
          </div>
          <div class="text-right">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total</p>
            <p class="text-lg font-bold text-emerald-600 leading-none">{{ formatarValor(resumoGetnet.total) }}</p>
          </div>
        </div>
      </div>

      <div class="divide-y divide-gray-100">
        <div v-for="(subgrupo, nome) in resumoGetnet.subgrupos" :key="nome" class="bg-white">
          <div
            @click="toggleExpandir(nome)"
            class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors group select-none"
          >
            <div class="flex items-center gap-3">
              <div class="w-2 h-8 rounded-full" :style="{ backgroundColor: obterCor(nome) }"></div>
              <span class="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{{ nome }}</span>
            </div>

            <div class="flex items-center gap-8 pr-2">
              <div class="text-right">
                <span class="text-xs text-gray-400 uppercase font-bold mr-2">Qtd</span>
                <span class="text-sm font-bold text-gray-700">{{ subgrupo.quantidade }}</span>
              </div>
              <div class="text-left min-w-[140px]">
                <span class="text-xs text-gray-400 uppercase font-bold mr-2">Total</span>
                <span class="text-sm font-bold text-emerald-600">{{ formatarValor(subgrupo.total) }}</span>
              </div>
            </div>
          </div>

          <div v-show="expandidos[nome]" class="px-4 pb-4 bg-gray-50 border-t border-gray-100/50 shadow-inner">
            <div class="pt-4">
              <TransacoesResumidasAjustavel
                :transacoes="subgrupo.transacoes"
                :resolver-voucher="() => ''"
                :titulo="''"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="resumoGetnet.total === 0" class="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
      <p class="text-lg font-medium">Nenhuma transacao Getnet detectada.</p>
      <p class="text-sm mt-1">Regras: GETNET-VISA ELECTRON, GETNET-MAESTRO, GETNET-ELO DEBITO, GETNET-ELO, GETNET-MASTERCARD, GETNET-VISA, GETNET-AMEX, GETNET-HIPERCARD e GETNET-*-BENEF.</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { BuildingLibraryIcon } from '@heroicons/vue/24/outline'
import TransacoesResumidasAjustavel from '../TransacoesResumidasAjustavel.vue'

const props = defineProps({
  transacoes: { type: Array, default: () => [] }
})

const expandidos = ref({})

const toggleExpandir = (nome) => {
  expandidos.value[nome] = !expandidos.value[nome]
}

const formatarValor = (valor) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0)
}

const normalizar = (texto) => {
  return String(texto || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const regrasGetnet = [
  { nome: 'VISA VOUCHER (Getnet)', aliases: ['GETNET-VISA BENEF', 'GETNET VISA BENEF'] },
  { nome: 'ELO VOUCHER (Getnet)', aliases: ['GETNET-ELO BENEF', 'GETNET ELO BENEF'] },
  { nome: 'MASTERCARD VOUCHER (Getnet)', aliases: ['GETNET-MASTER BENEF', 'GETNET MASTER BENEF', 'GETNET-MASTERCARD BENEF', 'GETNET MASTERCARD BENEF'] },

  { nome: 'VISA ELECTRON (Getnet)', aliases: ['GETNET-VISA ELECTRON', 'GETNET VISA ELECTRON', 'GETNET-VISA ELECTR', 'GETNET VISA ELECTR'] },
  { nome: 'MAESTRO (Getnet)', aliases: ['GETNET-MAESTRO', 'GETNET MAESTRO'] },
  { nome: 'ELO DEBITO (Getnet)', aliases: ['GETNET-ELO DEBITO', 'GETNET ELO DEBITO'] },

  { nome: 'ELO CREDITO (Getnet)', aliases: ['GETNET-ELO', 'GETNET ELO'] },
  { nome: 'MASTERCARD (Getnet)', aliases: ['GETNET-MASTERCARD', 'GETNET MASTERCARD', 'GETNET-MASTER', 'GETNET MASTER'] },
  { nome: 'VISA (Getnet)', aliases: ['GETNET-VISA', 'GETNET VISA'] },
  { nome: 'AMEX (Getnet)', aliases: ['GETNET-AMEX', 'GETNET AMEX'] },
  { nome: 'HIPERCARD (Getnet)', aliases: ['GETNET-HIPERCARD', 'GETNET HIPERCARD'] }
]

const detectar = (descricao) => {
  const texto = normalizar(descricao)
  for (const regra of regrasGetnet) {
    if (regra.aliases.some(a => texto.includes(normalizar(a)))) {
      return regra.nome
    }
  }
  return null
}

const resumoPorAdquirente = computed(() => {
  const grupos = {}
  for (const t of props.transacoes || []) {
    const nome = detectar(t.descricao)
    if (!nome) continue
    if (!grupos[nome]) {
      grupos[nome] = { transacoes: [], quantidade: 0, total: 0 }
    }
    grupos[nome].transacoes.push(t)
    grupos[nome].quantidade += 1
    grupos[nome].total += Number(t.valorNumerico ?? t.valor ?? 0) || 0
  }
  return grupos
})

const resumoGetnet = computed(() => {
  const dados = {
    quantidade: 0,
    total: 0,
    subgrupos: {}
  }

  for (const [nome, grupo] of Object.entries(resumoPorAdquirente.value)) {
    dados.quantidade += grupo.quantidade
    dados.total += grupo.total
    dados.subgrupos[nome] = grupo
  }

  return dados
})

const obterCor = (nome) => {
  if (nome.includes('VOUCHER')) return '#7C3AED'
  if (nome.includes('DEBITO')) return '#2563EB'
  if (nome.includes('CREDITO')) return '#16A34A'
  return '#6B7280'
}
</script>


