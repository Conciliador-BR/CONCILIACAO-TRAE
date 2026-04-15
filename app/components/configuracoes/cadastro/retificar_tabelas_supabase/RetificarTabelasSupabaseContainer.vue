<template>
  <div class="space-y-6">
    <div class="rounded-2xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 lg:px-8 xl:px-12 py-5 sm:py-6">
      <h2 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Retificar Tabelas no Supabase</h2>
      <p class="mt-1 text-xs sm:text-sm text-gray-600">Exclua tabelas da empresa em lote e retifique vendas/recebimentos por mês.</p>
    </div>

    <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <div class="px-4 sm:px-6 lg:px-8 xl:px-10 py-5 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
        <h3 class="text-base sm:text-lg font-semibold text-gray-900">1) Excluir Tabelas da Empresa</h3>
      </div>
      <div class="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-5">
        <SeletorEmpresaRetificacao
          v-model="empresaSelecionada"
          :empresas="empresas"
          :loading="loading"
          @buscar="buscarTabelas"
        />

        <ListaTabelasEmpresa
          v-if="tabelasEmpresa.length > 0"
          :tabelas="tabelasEmpresa"
          :selecionadas="tabelasSelecionadas"
          :todos-selecionados="todosSelecionados"
          @toggle-item="toggleTabela"
          @toggle-all="toggleTodas"
        />

        <div class="flex justify-end">
          <BotaoExcluirTabelas
            :loading="loading"
            :disabled="tabelasSelecionadas.length === 0"
            @click="confirmarEExcluirTabelas"
          />
        </div>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <div class="px-4 sm:px-6 lg:px-8 xl:px-10 py-5 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
        <h3 class="text-base sm:text-lg font-semibold text-gray-900">2) Excluir Vendas/Recebimentos por Adquirente e Mês</h3>
      </div>
      <div class="p-4 sm:p-6 lg:p-8 xl:p-10">
        <ExclusaoMovimentosForm
          :mes-referencia-atual="mesReferenciaAtual"
          :meses-selecionados="mesesSelecionados"
          :tipos="tiposSelecionados"
          :opcoes-adquirentes="opcoesAdquirentes"
          :adquirentes-selecionados="adquirentesSelecionados"
          :disabled="!podeExcluirMovimentos"
          :loading="loading"
          @update:mesReferenciaAtual="mesReferenciaAtual = $event"
          @adicionar-mes="adicionarMes"
          @remover-mes="removerMes"
          @toggle-tipo="toggleTipo"
          @toggle-adquirente="toggleAdquirente"
          @excluir="confirmarEExcluirMovimentos"
        />
      </div>
    </div>

    <div v-if="erro" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
      {{ erro }}
    </div>
    <div v-if="resultado" class="rounded-lg border border-green-200 bg-green-50 text-green-700 px-4 py-3 text-sm">
      Operação concluída com sucesso.
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useEmpresas } from '~/composables/useEmpresas'
import { useRetificarTabelasSupabase } from '~/composables/configuracoes/cadastro/retificar_tabelas_supabase/useRetificarTabelasSupabase'
import SeletorEmpresaRetificacao from './SeletorEmpresaRetificacao.vue'
import ListaTabelasEmpresa from './ListaTabelasEmpresa.vue'
import BotaoExcluirTabelas from './BotaoExcluirTabelas.vue'
import ExclusaoMovimentosForm from './ExclusaoMovimentosForm.vue'

const { empresas, fetchEmpresas } = useEmpresas()
const {
  loading,
  erro,
  resultado,
  listarTabelasEmpresa,
  excluirTabelas,
  excluirMovimentosPorMes
} = useRetificarTabelasSupabase()

const empresaSelecionada = ref('')
const tabelasEmpresa = ref([])
const tabelasSelecionadas = ref([])
const mesReferenciaAtual = ref('')
const mesesSelecionados = ref([])
const tiposSelecionados = ref(['vendas', 'recebimento'])
const adquirentesSelecionados = ref([])

const opcoesAdquirentes = computed(() => {
  const empNorm = String(empresaSelecionada.value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')

  const out = new Set()
  for (const item of tabelasEmpresa.value || []) {
    const tableName = String(item?.table_name || '')
    if (tableName.startsWith(`vendas_${empNorm}_`)) {
      out.add(tableName.replace(`vendas_${empNorm}_`, ''))
    }
    if (tableName.startsWith(`recebimento_${empNorm}_`)) {
      out.add(tableName.replace(`recebimento_${empNorm}_`, ''))
    }
  }
  return Array.from(out).sort()
})

const todosSelecionados = computed(() => {
  return tabelasEmpresa.value.length > 0 && tabelasSelecionadas.value.length === tabelasEmpresa.value.length
})

const podeExcluirMovimentos = computed(() => {
  return !!empresaSelecionada.value && mesesSelecionados.value.length > 0 && tiposSelecionados.value.length > 0 && adquirentesSelecionados.value.length > 0
})

const buscarTabelas = async () => {
  tabelasSelecionadas.value = []
  tabelasEmpresa.value = await listarTabelasEmpresa(empresaSelecionada.value)
}

const toggleTabela = (tableName, checked) => {
  if (checked) {
    if (!tabelasSelecionadas.value.includes(tableName)) {
      tabelasSelecionadas.value.push(tableName)
    }
  } else {
    tabelasSelecionadas.value = tabelasSelecionadas.value.filter(t => t !== tableName)
  }
}

const toggleTodas = (checked) => {
  tabelasSelecionadas.value = checked ? tabelasEmpresa.value.map(t => t.table_name) : []
}

const confirmarEExcluirTabelas = async () => {
  const ok = confirm(`Tem certeza que deseja excluir ${tabelasSelecionadas.value.length} tabela(s) no Supabase?`)
  if (!ok) return
  await excluirTabelas(tabelasSelecionadas.value)
  await buscarTabelas()
}

const toggleTipo = (tipo, checked) => {
  if (checked) {
    if (!tiposSelecionados.value.includes(tipo)) tiposSelecionados.value.push(tipo)
  } else {
    tiposSelecionados.value = tiposSelecionados.value.filter(t => t !== tipo)
  }
}

const toggleAdquirente = (adquirente, checked) => {
  if (checked) {
    if (!adquirentesSelecionados.value.includes(adquirente)) adquirentesSelecionados.value.push(adquirente)
  } else {
    adquirentesSelecionados.value = adquirentesSelecionados.value.filter(a => a !== adquirente)
  }
}

const confirmarEExcluirMovimentos = async () => {
  const ok = confirm(`Tem certeza que deseja excluir os movimentos dos ${mesesSelecionados.value.length} mês(es) selecionados?`)
  if (!ok) return
  await excluirMovimentosPorMes({
    empresa: empresaSelecionada.value,
    adquirentes: adquirentesSelecionados.value,
    mesesReferencia: mesesSelecionados.value,
    tipos: tiposSelecionados.value
  })
}

const adicionarMes = () => {
  const mes = String(mesReferenciaAtual.value || '').trim()
  if (!mes) return
  if (!mesesSelecionados.value.includes(mes)) {
    mesesSelecionados.value.push(mes)
    mesesSelecionados.value.sort()
  }
  mesReferenciaAtual.value = ''
}

const removerMes = (mes) => {
  mesesSelecionados.value = mesesSelecionados.value.filter(m => m !== mes)
}

onMounted(async () => {
  await fetchEmpresas()
})
</script>
