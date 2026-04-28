<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 transition-all hover:shadow-md">
    <div class="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm text-white font-bold text-lg shrink-0" :style="{ backgroundColor: cor }">
          {{ adquirente.charAt(0) }}
        </div>
        <div>
          <h3 class="text-lg font-bold text-gray-800 leading-tight">{{ adquirente }}</h3>
          <p class="text-sm text-gray-500 font-medium flex items-center gap-1 mt-0.5">
            <BuildingLibraryIcon class="w-4 h-4" />
            {{ banco }}
          </p>
        </div>
      </div>
      
      <div class="flex items-center gap-8 w-full md:w-auto justify-end">
        <div class="text-right">
          <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Transações</p>
          <p class="text-lg font-bold text-gray-700 leading-none">{{ quantidade }}</p>
        </div>
        <div class="text-right">
          <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total</p>
          <p class="text-lg font-bold text-emerald-600 leading-none">{{ formatarValor(total) }}</p>
        </div>
      </div>
    </div>

    <div class="p-4">
      <TransacoesResumidasAjustavel 
        :transacoes="transacoes" 
        :resolver-voucher="resolverVoucher"
        :titulo="''" 
      />
    </div>

    <div v-if="loadingConciliacao || resumosConciliacao.length > 0" class="px-4 pb-4">
      <div class="rounded-lg border border-blue-100 bg-blue-50/40 p-4">
        <h4 class="text-sm font-bold text-blue-800 uppercase tracking-wide mb-3">
          Conciliacao por Bandeira
        </h4>

        <div v-if="loadingConciliacao" class="text-sm text-gray-600">
          Carregando previsoes de recebimentos...
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="grupo in resumosPorTipo"
            :key="grupo.tipo"
            class="rounded-md border border-gray-200 bg-white overflow-hidden"
          >
            <button
              type="button"
              class="w-full px-3 py-3 flex items-center justify-between gap-3 text-left hover:bg-gray-50"
              @click="toggleTipo(grupo.tipo)"
            >
              <div>
                <p class="text-sm font-bold text-gray-800">
                  {{ labelTipo(grupo.tipo) }}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  Encontrado: {{ formatarValor(grupo.totalEncontrado) }} | Previsto: {{ formatarValor(grupo.totalPrevisto) }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <p class="text-xs font-bold px-2 py-1 rounded-full" :class="statusClasses(grupo.status)">
                  {{ grupo.status }}
                </p>
                <div class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                  <ChevronDownIcon v-if="!tipoExpandido(grupo.tipo)" class="w-4 h-4" />
                  <ChevronUpIcon v-else class="w-4 h-4" />
                </div>
              </div>
            </button>

            <div v-show="tipoExpandido(grupo.tipo)" class="px-3 pb-3 border-t border-gray-100 space-y-3">
              <div
                v-for="(item, idx) in grupo.itens"
                :key="`${item.data}-${item.tipo}-${idx}`"
                class="rounded-md border border-gray-100 bg-gray-50 p-3 mt-3"
              >
                <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <p class="text-sm font-semibold text-gray-800">
                    Valor encontrado: {{ item.rotuloEncontrado }} - {{ formatarValor(item.valorEncontrado) }}
                  </p>
                  <p class="text-xs font-bold px-2 py-1 rounded-full" :class="statusClasses(item.status)">
                    {{ item.status }}
                  </p>
                </div>

                <p class="text-xs text-gray-500 mb-2">Data: {{ item.data }}</p>

                <div v-if="item.previstos && item.previstos.length > 0" class="space-y-1">
                  <p
                    v-for="prev in item.previstos"
                    :key="`${item.data}-${prev.bandeira}-${prev.valor}`"
                    class="text-sm text-gray-700"
                  >
                    <template v-if="ehLinhaAluguel(prev)">
                      aluguel: {{ formatarNumero(prev.valor) }}
                    </template>
                    <template v-else>
                      Valor previsto: {{ prev.bandeira }} - {{ formatarValor(prev.valor) }}
                    </template>
                  </p>
                </div>
                <p v-else class="text-sm text-amber-700">
                  Valor previsto: nenhum recebimento por bandeira encontrado para esta data.
                </p>

                <div class="mt-2 pt-2 border-t border-gray-100 text-sm text-gray-700 flex flex-wrap gap-4">
                  <span>Total previsto: <strong>{{ formatarValor(item.totalPrevisto) }}</strong></span>
                  <span>Diferenca: <strong>{{ formatarValor(item.diferenca) }}</strong></span>
                </div>
              </div>
            </div>
          </div>

          <p v-if="resumosPorTipo.length === 0" class="text-sm text-amber-700">
            Nenhum recebimento previsto encontrado para os lancamentos exibidos.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { BuildingLibraryIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/vue/24/outline'
import TransacoesResumidasAjustavel from './TransacoesResumidasAjustavel.vue'

const props = defineProps({
  adquirente: { type: String, required: true },
  banco: { type: String, default: 'Banco' },
  quantidade: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  cor: { type: String, default: '#6B7280' },
  transacoes: { type: Array, default: () => [] },
  resolverVoucher: { type: Function, default: () => '' },
  resumosConciliacao: { type: Array, default: () => [] },
  loadingConciliacao: { type: Boolean, default: false }
})

const formatarValor = (valor) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0)
}

const formatarNumero = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(valor) || 0)
}

const ehLinhaAluguel = (prev) => {
  const bandeira = String(prev?.bandeira || '').toUpperCase()
  return bandeira === 'DESPESA COM ALUGUEL'
}

const statusClasses = (status) => {
  const chave = String(status || '').toLowerCase()
  if (chave === 'conciliado') return 'bg-emerald-100 text-emerald-700'
  if (chave === 'divergente') return 'bg-rose-100 text-rose-700'
  if (chave === 'sem previsto') return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-700'
}

const expandidosPorTipo = ref({})

const labelTipo = (tipo) => {
  const t = String(tipo || '').toUpperCase()
  if (t === 'DEBITO') return 'Debito'
  if (t === 'CREDITO') return 'Credito'
  return 'Nao identificado'
}

const tipoExpandido = (tipo) => {
  return !!expandidosPorTipo.value[tipo]
}

const toggleTipo = (tipo) => {
  expandidosPorTipo.value[tipo] = !expandidosPorTipo.value[tipo]
}

const prioridadeTipo = (tipo) => {
  const t = String(tipo || '').toUpperCase()
  if (t === 'DEBITO') return 1
  if (t === 'CREDITO') return 2
  return 3
}

const calcularStatusGrupo = (itens) => {
  if (!itens || itens.length === 0) return 'Sem previsto'
  const temDivergente = itens.some(i => String(i?.status || '').toLowerCase() === 'divergente')
  if (temDivergente) return 'Divergente'
  const temSemPrevisto = itens.some(i => String(i?.status || '').toLowerCase() === 'sem previsto')
  if (temSemPrevisto) return 'Sem previsto'
  return 'Conciliado'
}

const resumosPorTipo = computed(() => {
  const grupos = {}
  for (const item of props.resumosConciliacao || []) {
    const tipo = String(item?.tipo || 'NAO_IDENTIFICADO').toUpperCase()
    if (!grupos[tipo]) {
      grupos[tipo] = {
        tipo,
        totalEncontrado: 0,
        totalPrevisto: 0,
        diferenca: 0,
        status: 'Sem previsto',
        itens: []
      }
    }
    grupos[tipo].totalEncontrado += Number(item?.valorEncontrado || 0)
    grupos[tipo].totalPrevisto += Number(item?.totalPrevisto || 0)
    grupos[tipo].diferenca += Number(item?.diferenca || 0)
    grupos[tipo].itens.push(item)
  }

  return Object.values(grupos)
    .map(grupo => ({
      ...grupo,
      status: calcularStatusGrupo(grupo.itens),
      itens: [...grupo.itens].sort((a, b) => {
        const [da, ma, aa] = String(a?.data || '').split('/')
        const [db, mb, ab] = String(b?.data || '').split('/')
        const dataA = new Date(`${aa}-${ma}-${da}`)
        const dataB = new Date(`${ab}-${mb}-${db}`)
        return dataB - dataA
      })
    }))
    .sort((a, b) => prioridadeTipo(a.tipo) - prioridadeTipo(b.tipo))
})
</script>
