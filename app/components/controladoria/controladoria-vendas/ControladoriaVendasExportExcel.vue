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
import ExcelJS from 'exceljs'

const props = defineProps({
  gruposPorAdquirente: { type: Array, required: true },
  totaisGerais: { type: Object, required: true }
})

const currencyFmt = 'R$ #,##0.00'
const colors = {
  headerFill: 'FFEFF4F9',
  zebraFill: 'FFF9FAFB',
  totalFill: 'FF1D4ED8',
  textWhite: 'FFFFFFFF',
  debit: 'FF2563EB',
  credit: 'FF16A34A',
  voucher: 'FF9333EA',
  mdr: 'FFDC2626',
  grayText: 'FF374151'
}

const applyHeader = (ws, headers) => {
  ws.addRow(headers)
  ws.columns = [
    { key: 'adq', width: 22 },
    { key: 'deb', width: 14 },
    { key: 'cre', width: 14 },
    { key: 'cre2', width: 14 },
    { key: 'cre3', width: 14 },
    { key: 'cre46', width: 14 },
    { key: 'vch', width: 14 },
    { key: 'mdr', width: 14 },
    { key: 'bruto', width: 15 },
    { key: 'liquido', width: 15 }
  ]
  ws.views = [{ state: 'frozen', ySplit: 1 }]
  ws.autoFilter = { from: 'A1', to: 'J1' }
  const row = ws.getRow(1)
  row.font = { bold: true, color: { argb: colors.grayText } }
  row.alignment = { vertical: 'middle', horizontal: 'center' }
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.headerFill } }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }
    }
  })
}

const styleNumericCell = (cell, color) => {
  cell.numFmt = currencyFmt
  cell.font = { color: { argb: color }, bold: false }
  cell.alignment = { horizontal: 'right' }
}

const makeSheetForGrupo = (wb, grupo) => {
  const ws = wb.addWorksheet(String(grupo.adquirente || 'Planilha').slice(0, 31))
  applyHeader(ws, [
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
  ])
  let r = 2
  for (const item of grupo.vendasData) {
    const row = ws.addRow([
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
    row.getCell(1).alignment = { horizontal: 'left' }
    styleNumericCell(row.getCell(2), colors.debit)
    styleNumericCell(row.getCell(3), colors.credit)
    styleNumericCell(row.getCell(4), colors.credit)
    styleNumericCell(row.getCell(5), colors.credit)
    styleNumericCell(row.getCell(6), colors.credit)
    styleNumericCell(row.getCell(7), colors.voucher)
    styleNumericCell(row.getCell(8), colors.mdr)
    styleNumericCell(row.getCell(9), colors.grayText)
    styleNumericCell(row.getCell(10), colors.grayText)
    if (r % 2 === 0) row.eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.zebraFill } } })
    r++
  }
  const total = ws.addRow([
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
  ])
  total.font = { bold: true, color: { argb: colors.textWhite } }
  total.eachCell((cell, idx) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.totalFill } }
    cell.border = { top: { style: 'thin', color: { argb: 'FF1E40AF' } } }
    if (idx > 1) cell.numFmt = currencyFmt
    cell.alignment = { horizontal: idx === 1 ? 'left' : 'right' }
  })
}

const makeResumoSheet = (wb) => {
  const ws = wb.addWorksheet('Resumo')
  applyHeader(ws, ['Métrica', 'Valor'])
  const rows = [
    ['Adquirentes', props.gruposPorAdquirente.length],
    ['Venda Líquida', props.totaisGerais.vendaLiquida || 0],
    ['Débito', props.totaisGerais.debito || 0],
    ['Crédito', props.totaisGerais.credito || 0],
    ['Vouchers', props.totaisGerais.voucher || 0]
  ]
  for (const [label, val] of rows) {
    const row = ws.addRow([label, val])
    row.getCell(1).alignment = { horizontal: 'left' }
    styleNumericCell(row.getCell(2), colors.grayText)
  }
}

const handleExport = async () => {
  const wb = new ExcelJS.Workbook()
  makeResumoSheet(wb)
  for (const grupo of props.gruposPorAdquirente) makeSheetForGrupo(wb, grupo)
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'controladoria-vendas.xlsx'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>