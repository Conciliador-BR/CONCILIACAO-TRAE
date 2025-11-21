<template>
  <button
    type="button"
    class="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
    @click="handleExport"
  >
    <ArrowDownTrayIcon class="w-5 h-5 mr-2" />
    <span>Exportar Excel</span>
  </button>
</template>

<script setup>
import { ArrowDownTrayIcon } from '@heroicons/vue/24/solid'
import * as XLSX from 'xlsx'

const props = defineProps({
  gruposPorAdquirente: { type: Array, required: true },
  totaisGerais: { type: Object, required: true }
})

const currencyFormat = 'R$ #,##0.00'

const makeSheetForGrupo = (grupo) => {
  const header = [
    'Adquirente',
    'Débito',
    'Crédito',
    'Crédito 2x',
    'Crédito 3x',
    'Crédito 4x-6x',
    'Voucher',
    'Despesas MDR',
    'Valor Bruto',
    'Valor Líquido'
  ]
  const rows = grupo.vendasData.map((item) => [
    item.adquirente,
    item.debito || 0,
    item.credito || 0,
    item.credito2x || 0,
    item.credito3x || 0,
    item.credito4x5x6x || 0,
    item.voucher || 0,
    item.despesa_mdr_total || 0,
    item.valor_bruto_total || 0,
    item.valor_liquido_total || 0
  ])

  const totalRow = [
    `TOTAL ${grupo.adquirente}`,
    grupo.totais.debito || 0,
    grupo.totais.credito || 0,
    grupo.totais.credito2x || 0,
    grupo.totais.credito3x || 0,
    grupo.totais.credito4x5x6x || 0,
    grupo.totais.voucher || 0,
    grupo.totais.despesaMdr || 0,
    grupo.totais.vendaBruta || 0,
    grupo.totais.vendaLiquida || 0
  ]

  const data = [header, ...rows, totalRow]
  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = [
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 13 },
    { wch: 13 }
  ]
  ws['!autofilter'] = { ref: 'A1:J1' }

  const range = XLSX.utils.decode_range(ws['!ref'])
  for (let R = 1; R <= range.e.r; ++R) {
    for (let C = 1; C <= 9; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
      const cell = ws[cellAddress]
      if (cell) cell.z = currencyFormat
    }
  }

  return ws
}

const makeResumoSheet = () => {
  const header = ['Métrica', 'Valor']
  const rows = [
    ['Adquirentes', props.gruposPorAdquirente.length],
    ['Venda Líquida', props.totaisGerais.vendaLiquida || 0],
    ['Débito', props.totaisGerais.debito || 0],
    ['Crédito', props.totaisGerais.credito || 0],
    ['Vouchers', props.totaisGerais.voucher || 0]
  ]
  const data = [header, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = [{ wch: 18 }, { wch: 16 }]
  const range = XLSX.utils.decode_range(ws['!ref'])
  for (let R = 1; R <= range.e.r; ++R) {
    const addr = XLSX.utils.encode_cell({ r: R, c: 1 })
    const cell = ws[addr]
    if (cell) cell.z = currencyFormat
  }
  return ws
}

const handleExport = () => {
  const wb = XLSX.utils.book_new()
  const resumo = makeResumoSheet()
  XLSX.utils.book_append_sheet(wb, resumo, 'Resumo')
  for (const grupo of props.gruposPorAdquirente) {
    const ws = makeSheetForGrupo(grupo)
    const name = String(grupo.adquirente || 'Sheet').slice(0, 31)
    XLSX.utils.book_append_sheet(wb, ws, name)
  }
  XLSX.writeFile(wb, 'controladoria-vendas.xlsx')
}
</script>