<template>
  <div id="analise-de-recebimentos-root" class="space-y-8">
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-600"></div>
      <span class="ml-3 text-gray-600">Carregando analise de recebimentos...</span>
    </div>

    <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-4">
      <h3 class="text-sm font-medium text-red-800">Erro ao carregar recebimentos</h3>
      <p class="mt-1 text-sm text-red-700">{{ error }}</p>
      <button
        class="mt-4 rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
        @click="recarregarDados"
      >
        Tentar novamente
      </button>
    </div>

    <template v-else>
      <AnaliseDeRecebimentosHeader
        :periodo="periodoAnalisado"
        :melhor-adquirente="melhorAdquirente"
        :maior-divergencia="maiorDivergencia"
        :resumo="resumoExecutivo"
      />

      <AnaliseDeRecebimentosStats :cards="cardsResumoEstilo" />

      <AnaliseDeRecebimentosSection
        titulo="Leituras Rapidas"
        subtitulo="Resumo automatico para apoiar a conciliacao do periodo"
      >
        <AnaliseDeRecebimentosInsights :items="insights" />
      </AnaliseDeRecebimentosSection>

      <div class="grid grid-cols-1 gap-8">
        <AnaliseDeRecebimentosGraficos
          :dados="dadosGraficoAdquirentes"
          titulo="Liquido por Adquirente"
          subtitulo="Top adquirentes com maior volume liquido"
          label-key="nome"
          value-key="valorLiquido"
          value-type="currency"
          default-type="bar"
        />
      </div>

      <div class="grid grid-cols-1 gap-8">
        <AnaliseDeRecebimentosSection
          titulo="Ranking por Adquirente"
          subtitulo="Participacao, liquido, previsto e divergencia acumulada"
        >
          <AnaliseDeRecebimentosTabela
            :rows="rankingAdquirentes"
            :columns="columnsAdquirentes"
            empty-message="Nenhum adquirente encontrado no periodo"
          />
        </AnaliseDeRecebimentosSection>

        <AnaliseDeRecebimentosSection
          titulo="Ranking por Bandeira"
          subtitulo="Visao consolidada das bandeiras processadas"
        >
          <AnaliseDeRecebimentosTabela
            :rows="rankingBandeiras"
            :columns="columnsBandeiras"
            empty-message="Nenhuma bandeira encontrada no periodo"
          />
        </AnaliseDeRecebimentosSection>
      </div>

      <AnaliseDeRecebimentosSection
        titulo="Resumo de Vouchers"
        subtitulo="Consolidado dos vouchers encontrados na analise de recebimentos"
      >
        <AnaliseDeRecebimentosTabela
          :rows="analiseVouchers"
          :columns="columnsVouchers"
          empty-message="Nenhum voucher encontrado no periodo"
        />
      </AnaliseDeRecebimentosSection>

      <div class="grid grid-cols-1 gap-8">
        <AnaliseDeRecebimentosSection
          titulo="Modalidades Consolidadas"
          subtitulo="Leitura por categoria financeira de recebimento"
        >
          <AnaliseDeRecebimentosTabela
            :rows="rankingModalidades"
            :columns="columnsModalidades"
            empty-message="Nenhuma modalidade encontrada no periodo"
          />
        </AnaliseDeRecebimentosSection>
      </div>

      <AnaliseDeRecebimentosSection
        titulo="Nomenclaturas de Depositos"
        subtitulo="Resumo das descricoes encontradas no extrato bancario por adquirente ou voucher"
      >
        <AnaliseDeRecebimentosDepositosResumo :items="resumoNomenclaturasDepositos" />
      </AnaliseDeRecebimentosSection>
    </template>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { computed } from 'vue'
import AnaliseDeRecebimentosDepositosResumo from '~/components/controladoria/analise-de-recebimentos/AnaliseDeRecebimentosDepositosResumo.vue'
import AnaliseDeRecebimentosGraficos from '~/components/controladoria/analise-de-recebimentos/AnaliseDeRecebimentosGraficos.vue'
import AnaliseDeRecebimentosHeader from '~/components/controladoria/analise-de-recebimentos/AnaliseDeRecebimentosHeader.vue'
import AnaliseDeRecebimentosInsights from '~/components/controladoria/analise-de-recebimentos/AnaliseDeRecebimentosInsights.vue'
import AnaliseDeRecebimentosSection from '~/components/controladoria/analise-de-recebimentos/AnaliseDeRecebimentosSection.vue'
import AnaliseDeRecebimentosStats from '~/components/controladoria/analise-de-recebimentos/AnaliseDeRecebimentosStats.vue'
import AnaliseDeRecebimentosTabela from '~/components/controladoria/analise-de-recebimentos/AnaliseDeRecebimentosTabela.vue'
import { useAnaliseDeRecebimentos } from '~/composables/PageControladoria/analise-de-recebimentos/useAnaliseDeRecebimentos'
import { useGlobalFilters } from '~/composables/useGlobalFilters'

useHead({
  title: 'Controladoria - Analise de Recebimentos | MRF CONCILIACAO',
  meta: [
    { name: 'description', content: 'Analise gerencial dos recebimentos por adquirente, bandeira e periodo' }
  ]
})

const registrarVisitaAnaliseRecebimentos = () => {
  if (process.client) {
    localStorage.setItem('controladoria_ultima_aba', 'analise-recebimentos')
  }
}

const {
  loading,
  error,
  resumoExecutivo,
  rankingAdquirentes,
  rankingBandeiras,
  rankingModalidades,
  analiseVouchers,
  resumoNomenclaturasDepositos,
  melhorAdquirente,
  maiorDivergencia,
  periodoAnalisado,
  insights,
  buscarDadosAnalise
} = useAnaliseDeRecebimentos()

const { escutarEvento } = useGlobalFilters()

const taxaMedia = computed(() => {
  const bruto = Number(resumoExecutivo.value?.valorBruto || 0)
  const despesa = Number(resumoExecutivo.value?.despesaTotal || 0)
  return bruto > 0 ? (despesa / bruto) * 100 : 0
})

const ticketMedio = computed(() => {
  const quantidade = Number(resumoExecutivo.value?.quantidade || 0)
  return quantidade > 0 ? Number(resumoExecutivo.value?.valorLiquido || 0) / quantidade : 0
})

const cardsResumoEstilo = computed(() => ([
  {
    id: 'liquido',
    titulo: 'Liquido Recebido',
    valor: resumoExecutivo.value?.valorLiquido || 0,
    tipo: 'currency',
    legenda: 'Resultado apos despesas',
    tag: 'Principal',
    destaque: 'border-[#5e92cb] bg-[#244b77]'
  },
  {
    id: 'previsto',
    titulo: 'Valor Previsto',
    valor: resumoExecutivo.value?.valorPrevisto || 0,
    tipo: 'currency',
    legenda: 'Total esperado no periodo',
    tag: 'Meta',
    destaque: 'border-[#244b77] bg-[#102a43]'
  },
  {
    id: 'depositado',
    titulo: 'Valor Depositado',
    valor: resumoExecutivo.value?.valorDepositado || 0,
    tipo: 'currency',
    legenda: 'Total conciliado em banco',
    tag: 'Banco',
    destaque: 'border-[#2F9E44] bg-[#1E7E34]'
  },
  {
    id: 'divergencia',
    titulo: 'Divergencia',
    valor: resumoExecutivo.value?.divergenciaDeposito || 0,
    tipo: 'currency',
    legenda: 'Previsto versus depositado',
    tag: 'Atencao',
    destaque: 'border-[#D17A00] bg-[#B56A00]'
  },
  {
    id: 'despesas',
    titulo: 'Despesas Totais',
    valor: resumoExecutivo.value?.despesaTotal || 0,
    tipo: 'currency',
    legenda: 'MDR, extra e antecipacao',
    tag: 'Custo',
    destaque: 'border-[#c65b4b] bg-[#a63f35]'
  },
  {
    id: 'taxa-media',
    titulo: 'Taxa Media',
    valor: taxaMedia.value,
    tipo: 'percent',
    legenda: 'Custo medio sobre bruto',
    secondary: true
  },
  {
    id: 'ticket-medio',
    titulo: 'Ticket Medio',
    valor: ticketMedio.value,
    tipo: 'currency',
    legenda: 'Liquido por transacao',
    secondary: true
  },
  {
    id: 'universo',
    titulo: 'Universo Analisado',
    valor: rankingAdquirentes.value.length,
    tipo: 'number',
    legenda: `${rankingBandeiras.value.length} bandeiras e ${rankingModalidades.value.length} categorias`,
    secondary: true
  }
]))

const dadosGraficoAdquirentes = computed(() => rankingAdquirentes.value.slice(0, 8))
const columnsAdquirentes = [
  { key: 'nome', label: 'Adquirente', emphasis: true },
  { key: 'quantidade', label: 'Transacoes', type: 'number' },
  { key: 'valorLiquido', label: 'Liquido', type: 'currency' },
  { key: 'valorPrevisto', label: 'Previsto', type: 'currency' },
  { key: 'valorDepositado', label: 'Depositado', type: 'currency' },
  { key: 'divergenciaDeposito', label: 'Divergencia', type: 'currency_delta' },
  { key: 'participacao', label: 'Share', type: 'percent' }
]

const columnsBandeiras = [
  { key: 'nome', label: 'Bandeira', emphasis: true },
  { key: 'quantidade', label: 'Transacoes', type: 'number' },
  { key: 'valorLiquido', label: 'Liquido', type: 'currency' },
  { key: 'valorPrevisto', label: 'Previsto', type: 'currency' },
  { key: 'valorDepositado', label: 'Depositado', type: 'currency' },
  { key: 'divergenciaDeposito', label: 'Divergencia', type: 'currency_delta' }
]

const columnsModalidades = [
  { key: 'nome', label: 'Modalidade', emphasis: true },
  { key: 'quantidade', label: 'Transacoes', type: 'number' },
  { key: 'valorLiquido', label: 'Liquido', type: 'currency' },
  { key: 'despesaTotal', label: 'Despesas', type: 'currency' },
  { key: 'taxaEfetiva', label: 'Taxa Efetiva', type: 'percent' }
]

const columnsVouchers = [
  { key: 'nome', label: 'Voucher', emphasis: true },
  { key: 'quantidade', label: 'Linhas', type: 'number' },
  { key: 'valorLiquido', label: 'Liquido', type: 'currency' },
  { key: 'valorPrevisto', label: 'Previsto', type: 'currency' },
  { key: 'valorDepositado', label: 'Depositado', type: 'currency' },
  { key: 'divergenciaDeposito', label: 'Divergencia', type: 'currency_delta' }
]

const recarregarDados = async () => {
  await buscarDadosAnalise()
}

let removerListener

onMounted(async () => {
  registrarVisitaAnaliseRecebimentos()
  await buscarDadosAnalise()
  removerListener = escutarEvento('filtrar-controladoria-recebimentos', recarregarDados)
})

onUnmounted(() => {
  if (removerListener) removerListener()
})
</script>
