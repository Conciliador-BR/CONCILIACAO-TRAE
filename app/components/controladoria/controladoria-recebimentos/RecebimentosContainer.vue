<template>
  <div>
    <ControladoriaRecebimentosTableComplete 
      v-for="grupo in gruposPorAdquirente"
      :key="grupo.adquirente"
      :recebimentos-data="grupo.recebimentosData"
      :totais="grupo.totais"
      :adquirente="grupo.adquirente"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useResponsiveColumns } from '~/composables/useResponsiveColumns'
import { useRecebimentos } from '~/composables/PageControladoria/controladoria-recebimentos/useRecebimentos'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import ControladoriaRecebimentosTableComplete from './ControladoriaRecebimentosTableComplete.vue'
import { useControladoriaVendas } from '~/composables/PageControladoria/useControladoriaVendas'
import { useExtratoDetalhado } from '~/composables/PageBancos/useExtratoDetalhado'
import { useAdquirenteDetector } from '~/composables/useAdquirenteDetector'

const { screenSize, windowWidth, initializeResponsive, getResponsiveColumnWidths } = useResponsiveColumns()

const { recebimentos, fetchRecebimentos } = useRecebimentos()
const { filtrosGlobais, escutarEvento } = useGlobalFilters()
const { classificarBandeira, determinarModalidade } = useControladoriaVendas()
const { transacoes, buscarTransacoesBancarias } = useExtratoDetalhado()
const { detectingAdquirente, detectarAdquirente } = useAdquirenteDetector()

const depositosMap = computed(() => {
  const map = {}
  
  if (!transacoes.value) return map

  transacoes.value.forEach(t => {
    if (!t.valor || t.valor <= 0) return

    const res = detectarAdquirente(t.descricao, t.banco)
    if (!res) return

    let grupo = res.nome
    
    // Agrupamento manual para Tribanco -> UNICA
    if (t.banco && t.banco.toLowerCase().includes('tribanco')) {
        grupo = 'UNICA'
    }

    const bandeira = res.base

    if (!map[grupo]) map[grupo] = { total: 0, bandeiras: {} }
    
    map[grupo].total += t.valor
    
    if (!map[grupo].bandeiras[bandeira]) map[grupo].bandeiras[bandeira] = 0
    map[grupo].bandeiras[bandeira] += t.valor
  })
  
  return map
})

const ordemBandeiras = [
  'VISA',
  'VISA ELECTRON',
  'MASTERCARD',
  'MAESTRO',
  'ELO CRÉDITO',
  'ELO DÉBITO',
  'PIX',
  'CABAL',
  'AMEX',
  'HIPERCARD',
  'DINERS',
  'BRADESCO DÉBITO',
  'TRICARD',
  'SORO',
  'ALUGUEIS'
]

const gruposPorAdquirente = computed(() => {
  const grupos = {}
  ;(recebimentos.value || []).forEach(r => {
    const adquirenteKey = r.adquirente || 'ALUGUEIS'
    if (!grupos[adquirenteKey]) {
      grupos[adquirenteKey] = {
        adquirente: adquirenteKey,
        linhas: {},
        totais: {
          debito: 0,
          credito: 0,
          credito2x: 0,
          credito3x: 0,
          credito4x5x6x: 0,
          despesaMdr: 0,
          despesaAntecipacao: 0,
          vendaBruta: 0,
          vendaLiquida: 0,
          valorPago: 0,
          valorDepositado: 0
        }
      }
    }

    const grupo = grupos[adquirenteKey]
    const nomeClassificado = classificarBandeira(r.bandeira || r.adquirente || '', r.modalidade || '')
    const key = nomeClassificado === 'OUTROS' ? 'ALUGUEIS' : (nomeClassificado || 'ALUGUEIS')
    if (!grupo.linhas[key]) {
      grupo.linhas[key] = {
        adquirente: key,
        debito: 0,
        credito: 0,
        credito2x: 0,
        credito3x: 0,
        credito4x5x6x: 0,
        despesa_mdr_total: 0,
        despesa_antecipacao_total: 0,
        valor_bruto_total: 0,
        valor_liquido_total: 0,
        valor_pago_total: 0,
        valor_depositado: 0
      }
    }

    const modalidadePagamento = determinarModalidade(r.modalidade || '', r.numeroParcelas || 1)
    const liquido = parseFloat(r.valorLiquido || r.valorRecebido) || 0
    const bruto = parseFloat(r.valorBruto) || 0
    const despesa = parseFloat(r.despesaMdr) || 0
    const despesaAntRaw = parseFloat(r.despesaAntecipacao) || 0
    const despesaAnt = Math.abs(despesaAntRaw)
    const valorPago = liquido - despesaAnt

    const linha = grupo.linhas[key]
    if (modalidadePagamento === 'debito') { linha.debito += valorPago; grupo.totais.debito += valorPago }
    else if (modalidadePagamento === 'credito') { linha.credito += valorPago; grupo.totais.credito += valorPago }
    else if (modalidadePagamento === 'credito2x') { linha.credito2x += valorPago; grupo.totais.credito2x += valorPago }
    else if (modalidadePagamento === 'credito3x') { linha.credito3x += valorPago; grupo.totais.credito3x += valorPago }
    else if (modalidadePagamento === 'credito4x5x6x') { linha.credito4x5x6x += valorPago; grupo.totais.credito4x5x6x += valorPago }

    linha.valor_bruto_total += bruto
    linha.valor_liquido_total += liquido
    linha.despesa_mdr_total += despesa
    linha.despesa_antecipacao_total += despesaAnt
    linha.valor_pago_total += valorPago

    grupo.totais.vendaBruta += bruto
    grupo.totais.vendaLiquida += liquido
    grupo.totais.despesaMdr += despesa
    grupo.totais.despesaAntecipacao += despesaAnt
    grupo.totais.valorPago += valorPago
  })

  // Injetar valores depositados
  Object.values(grupos).forEach(grupo => {
    const depositosGrupo = depositosMap.value[grupo.adquirente]
    if (depositosGrupo) {
      grupo.totais.valorDepositado = depositosGrupo.total
      
      Object.values(grupo.linhas).forEach(linha => {
        // Tenta encontrar o depósito específico para esta bandeira
        // Normaliza o nome da linha para bater com a chave do depósito
        // Ex: "VISA ELECTRON" -> "VISA ELECTRON"
        // Ex: "ELO DÉBITO" -> "ELO DÉBITO"
        if (depositosGrupo.bandeiras[linha.adquirente]) {
          linha.valor_depositado = depositosGrupo.bandeiras[linha.adquirente]
        }
      })
    }
  })

  return Object.values(grupos).map(g => ({
    adquirente: g.adquirente,
    recebimentosData: Object.values(g.linhas).sort((a, b) => {
      const ia = ordemBandeiras.indexOf(a.adquirente)
      const ib = ordemBandeiras.indexOf(b.adquirente)
      if (ia !== -1 && ib !== -1) return ia - ib
      if (ia !== -1 && ib === -1) return -1
      if (ia === -1 && ib !== -1) return 1
      return a.adquirente.localeCompare(b.adquirente)
    }),
    totais: g.totais
  }))
})

const totaisGerais = computed(() => {
  return (gruposPorAdquirente.value || []).reduce((acc, grupo) => {
    acc.debito += grupo.totais.debito
    acc.credito += grupo.totais.credito
    acc.credito2x += grupo.totais.credito2x
    acc.credito3x += grupo.totais.credito3x
    acc.credito4x5x6x += grupo.totais.credito4x5x6x
    acc.despesaMdr += grupo.totais.despesaMdr
    acc.despesaAntecipacao += grupo.totais.despesaAntecipacao
    acc.vendaBruta += grupo.totais.vendaBruta
    acc.vendaLiquida += grupo.totais.vendaLiquida
    acc.valorPago += grupo.totais.valorPago
    acc.valorDepositado += (grupo.totais.valorDepositado || 0)
    return acc
  }, {
    debito: 0,
    credito: 0,
    credito2x: 0,
    credito3x: 0,
    credito4x5x6x: 0,
    despesaMdr: 0,
    despesaAntecipacao: 0,
    vendaBruta: 0,
    vendaLiquida: 0,
    valorPago: 0,
    valorDepositado: 0
  })
})

const atualizarDados = async () => {
  await buscarTransacoesBancarias(filtrosGlobais.value)
}

onMounted(async () => {
  initializeResponsive()
  await Promise.all([
    fetchRecebimentos(),
    atualizarDados()
  ])
  
  escutarEvento('filtrar-controladoria-recebimentos', atualizarDados)
})
</script>
