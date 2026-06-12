<template>
  <div class="analise-recebimentos-print-tabela w-full overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 shadow-xl backdrop-blur">
    <div class="overflow-x-auto">
      <table class="pdf-analise-recebimentos-table w-full min-w-full divide-y divide-gray-200">
        <thead class="sticky top-0 z-10 bg-gray-50">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          <tr v-if="rows.length === 0">
            <td :colspan="columns.length" class="px-6 py-6 text-sm text-gray-500">
              {{ emptyMessage }}
            </td>
          </tr>
          <tr
            v-for="(row, index) in rows"
            :key="getRowKey(row)"
            :class="[index % 2 === 0 ? 'bg-white' : 'bg-gray-50', 'hover:bg-blue-50 transition']"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              class="whitespace-nowrap px-6 py-4 text-sm text-gray-700"
            >
              <template v-if="column.emphasis">
                <div class="flex items-center">
                  <div class="mr-3 h-3 w-3 rounded-full" :style="{ backgroundColor: getAccentColor(row[column.key], index) }"></div>
                  <span :class="getValueClass(column, row[column.key])">
                    {{ formatValue(row[column.key], column.type) }}
                  </span>
                </div>
              </template>
              <template v-else>
                <span :class="getValueClass(column, row[column.key])">
                  {{ formatValue(row[column.key], column.type) }}
                </span>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  rows: {
    type: Array,
    default: () => []
  },
  columns: {
    type: Array,
    default: () => []
  },
  emptyMessage: {
    type: String,
    default: 'Sem dados para exibir'
  },
  rowKey: {
    type: String,
    default: 'nome'
  }
})

const formatValue = (value, type) => {
  if (type === 'currency' || type === 'currency_delta') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value || 0))
  }

  if (type === 'percent') {
    return `${Number(value || 0).toFixed(2)}%`
  }

  if (type === 'number') {
    return new Intl.NumberFormat('pt-BR').format(Number(value || 0))
  }

  return value ?? '-'
}

const getValueClass = (column, value) => {
  const classes = []
  const numericValue = Number(value || 0)
  const columnKey = String(column?.key || '').toLowerCase()

  if (columnKey.includes('pgtobanco')) {
    return 'font-medium text-emerald-700'
  }

  if (column.emphasis) classes.push('text-sm font-medium text-gray-900')
  if (column.type === 'currency_delta') {
    classes.push(numericValue >= 0 ? 'font-semibold text-emerald-700' : 'font-semibold text-red-600')
  }
  if (column.type === 'currency' && numericValue > 0) {
    classes.push('font-medium text-gray-900')
  }
  if (column.type === 'currency' && numericValue < 0) {
    classes.push('font-medium text-red-600')
  }
  if (column.type === 'percent') {
    classes.push('font-medium text-[#244b77]')
  }
  if (columnKey.includes('despesa')) {
    classes.push(numericValue >= 0 ? 'font-medium text-red-600' : 'font-medium text-emerald-700')
  }
  if (columnKey.includes('previsto')) {
    classes.push('font-medium text-gray-900')
  }
  if (columnKey.includes('liquido')) {
    classes.push(numericValue >= 0 ? 'font-medium text-green-700' : 'font-medium text-red-600')
  }

  return classes.join(' ')
}

const getAccentColor = (value, index) => {
  const paletteByName = {
    pix: '#00d4aa',
    visa: '#1a1f71',
    'visa electron': '#1a1f71',
    mastercard: '#eb001b',
    master: '#eb001b',
    maestro: '#eb001b',
    elo: '#00a8e1',
    amex: '#006fcf',
    hipercard: '#e21836',
    diners: '#0079be',
    cabal: '#0033a0',
    ticket: '#0f9d58',
    vr: '#16a34a',
    alelo: '#2563eb',
    sodexo: '#dc2626',
    pluxe: '#7c3aed',
    pluxee: '#7c3aed',
    comprocard: '#ea580c',
    'le card': '#0891b2',
    'up brasil': '#2563eb'
  }

  const normalized = String(value || '').toLowerCase().trim()
  const byName = Object.entries(paletteByName).find(([key]) => normalized.includes(key))
  if (byName) return byName[1]

  const fallback = ['#244b77', '#1E7E34', '#B56A00', '#7c3aed', '#dc2626', '#0891b2', '#db2777', '#4f46e5']
  return fallback[index % fallback.length]
}

const getRowKey = (row) => {
  return row?.[props.rowKey] ?? JSON.stringify(row)
}
</script>
