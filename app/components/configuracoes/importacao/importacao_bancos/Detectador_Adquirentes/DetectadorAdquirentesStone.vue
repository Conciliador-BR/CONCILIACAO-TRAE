<template>
  <div>
    <div v-if="resumoStone.total > 0" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 transition-all hover:shadow-md">
      <div class="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm text-white font-bold text-lg shrink-0 bg-emerald-600">
            S
          </div>
          <div>
            <h3 class="text-lg font-bold text-gray-800 leading-tight">STONE</h3>
            <p class="text-sm text-gray-500 font-medium flex items-center gap-1 mt-0.5">
              <BuildingLibraryIcon class="w-4 h-4" />
              Stone
            </p>
          </div>
        </div>

        <div class="flex items-center gap-8 w-full md:w-auto justify-end">
          <div class="text-right">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">TransaÃ§Ãµes</p>
            <p class="text-lg font-bold text-gray-700 leading-none">{{ resumoStone.quantidade }}</p>
          </div>
          <div class="text-right">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total</p>
            <p class="text-lg font-bold text-emerald-600 leading-none">{{ formatarValor(resumoStone.total) }}</p>
          </div>
        </div>
      </div>

      <div class="divide-y divide-gray-100">
        <div v-for="(subgrupo, nome) in resumoStone.subgrupos" :key="nome" class="bg-white">
          <div
            @click="toggleExpandir(nome)"
            class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors group select-none"
          >
            <div class="flex items-center gap-3">
              <div class="w-2 h-8 rounded-full" :style="{ backgroundColor: obterCor(nome) }"></div>
              <span class="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{{ nome }}</span>
            </div>

            <div class="flex items-center gap-6">
              <div class="text-right">
                <span class="text-xs text-gray-400 uppercase font-bold mr-2">Qtd</span>
                <span class="text-sm font-bold text-gray-700">{{ subgrupo.quantidade }}</span>
              </div>
              <div class="text-right w-24">
                <span class="text-xs text-gray-400 uppercase font-bold mr-2">Total</span>
                <span class="text-sm font-bold text-emerald-600">{{ formatarValor(subgrupo.total) }}</span>
              </div>
              <div class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <ChevronDownIcon v-if="!expandidos[nome]" class="w-4 h-4" />
                <ChevronUpIcon v-else class="w-4 h-4" />
              </div>
            </div>
          </div>

          <div v-show="expandidos[nome]" class="px-4 pb-4 bg-gray-50 border-t border-gray-100/50 shadow-inner">
            <div class="pt-4">
              <TransacoesResumidasAjustavel
                :transacoes="subgrupo.transacoes"
                :resolver-voucher="obterVoucherDescricao"
                :titulo="''"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import TransacoesResumidasAjustavel from '../TransacoesResumidasAjustavel.vue'
import { BuildingLibraryIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/vue/24/outline'

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
  if (!texto) return ''
  if (texto.includes('MANCACARU') || texto.includes('MANACARU') || texto.includes('LIBERCAD') || texto.includes('LIBER CARD') || texto.includes('LIBERCARD')) return 'LIBERCARD'
  return String(texto)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const coresCartoes = {
  'ELO DEBITO': '#FBBF24',
  'VISA ELECTRON': '#1E40AF',
  'MAESTRO': '#3B82F6',
  'VISA': '#1E3A8A',
  'STONE': '#16A34A'
}

const detectarSubgrupoStone = (descricao) => {
  const upper = normalizar(descricao)
  if (!upper) return 'STONE'

  // 1) Regra solicitada: toda antecipaÃ§Ã£o de crÃ©dito vai para VISA.
  if (/ANTECIPACAO/.test(upper) && /CREDITO/.test(upper)) return 'VISA'

  // 2) Regras solicitadas para dÃ©bito.
  if (/RECEBIMENTO VENDAS.*ELO.*DEBITO/.test(upper)) return 'ELO DEBITO'
  if (/RECEBIMENTO VENDAS.*VISA.*ELECTRON/.test(upper)) return 'VISA ELECTRON'
  if (/RECEBIMENTO VENDAS.*MAESTRO.*DEBITO/.test(upper) || /RECEBIMENTO VENDAS.*MASTER.*DEBITO/.test(upper)) return 'MAESTRO'

  // 3) CrÃ©dito explÃ­cito de VISA tambÃ©m entra em VISA.
  if (/RECEBIMENTO VENDAS.*VISA.*CREDITO/.test(upper)) return 'VISA'

  return 'STONE'
}

const resumoStone = computed(() => {
  const dados = { quantidade: 0, total: 0, subgrupos: {} }

  ;(props.transacoes || []).forEach((t) => {
    const nomeBase = detectarSubgrupoStone(t?.descricao || '')
    const nome = `${nomeBase} (CartÃ£o)`
    if (!dados.subgrupos[nome]) {
      dados.subgrupos[nome] = { transacoes: [], quantidade: 0, total: 0 }
    }

    const valor = Number(t?.valorNumerico ?? t?.valor ?? 0) || 0
    dados.subgrupos[nome].transacoes.push(t)
    dados.subgrupos[nome].quantidade += 1
    dados.subgrupos[nome].total += valor
    dados.quantidade += 1
    dados.total += valor
  })

  return dados
})

const obterCor = (nomeComCategoria) => {
  const base = String(nomeComCategoria).replace(/ \((CartÃ£o|Voucher)\)/, '')
  return coresCartoes[base] || '#6B7280'
}

const obterVoucherDescricao = () => ''
</script>

