import { reactive } from 'vue'

export const useTableAdvancedFilters = (rowsRef, visibleColumnsRef) => {
  const dateColumns = new Set(['dataVenda', 'data_venda', 'previsaoPgto', 'previsao_pgto', 'dataPagamento', 'data_pagamento'])
  const numericColumns = new Set(['vendaBruta', 'valor_bruto', 'vendaLiquida', 'valor_liquido', 'taxaMdr', 'taxa_mdr', 'despesaMdr', 'despesa_mdr', 'numeroParcelas', 'numero_parcelas', 'valorAntecipado', 'despesasAntecipacao', 'valorLiquidoAntec'])
  const currencyColumns = new Set(['vendaBruta', 'valor_bruto', 'vendaLiquida', 'valor_liquido', 'despesaMdr', 'despesa_mdr', 'valorAntecipado', 'despesasAntecipacao', 'valorLiquidoAntec'])

  const columnFilters = reactive({})

  const isDateColumn = (column) => dateColumns.has(column)
  const isNumericColumn = (column) => numericColumns.has(column)

  const createDefaultFilter = (column) => ({
    mode: 'values',
    optionsSearch: '',
    selectedValues: [],
    operator: isDateColumn(column) ? 'eq' : isNumericColumn(column) ? 'gte' : 'contains',
    conditionValue: '',
    conditionValueTo: ''
  })

  const syncFilters = () => {
    const nextColumns = new Set(visibleColumnsRef.value || [])
    Object.keys(columnFilters).forEach((column) => {
      if (!nextColumns.has(column)) {
        delete columnFilters[column]
      }
    })
    ;(visibleColumnsRef.value || []).forEach((col) => {
      const existing = columnFilters[col]
      if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
        columnFilters[col] = createDefaultFilter(col)
        return
      }
      columnFilters[col] = {
        ...createDefaultFilter(col),
        ...existing,
        selectedValues: Array.isArray(existing.selectedValues) ? [...existing.selectedValues] : []
      }
    })
  }

  const normalizeText = (value) => String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

  const parseNumeric = (value) => {
    if (value === null || value === undefined || value === '') return NaN
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN
    const normalized = String(value).replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
    const n = Number(normalized)
    return Number.isFinite(n) ? n : NaN
  }

  const toIsoDate = (value) => {
    if (value === null || value === undefined || value === '') return ''
    const str = String(value).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      const [d, m, y] = str.split('/')
      return `${y}-${m}-${d}`
    }
    const dateObj = new Date(str)
    if (isNaN(dateObj.getTime())) return ''
    const y = dateObj.getFullYear()
    const m = String(dateObj.getMonth() + 1).padStart(2, '0')
    const d = String(dateObj.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const getRawValue = (row, column) => {
    const map = {
      empresa: ['empresa'],
      matriz: ['matriz'],
      adquirente: ['adquirente'],
      dataVenda: ['dataVenda', 'data_venda'],
      dataPagamento: ['dataPagamento', 'data_pagamento'],
      modalidade: ['modalidade'],
      nsu: ['nsu'],
      vendaBruta: ['vendaBruta', 'valor_bruto'],
      vendaLiquida: ['vendaLiquida', 'valor_liquido'],
      taxaMdr: ['taxaMdr', 'taxa_mdr'],
      despesaMdr: ['despesaMdr', 'despesa_mdr'],
      numeroParcelas: ['numeroParcelas', 'numero_parcelas', 'numero_parceladas'],
      bandeira: ['bandeira'],
      valorAntecipado: ['valorAntecipado', 'valor_antecipacao'],
      despesasAntecipacao: ['despesasAntecipacao', 'despesa_antecipacao'],
      valorLiquidoAntec: ['valorLiquidoAntec', 'valor_liquido_antecipacao'],
      previsaoPgto: ['previsaoPgto', 'previsao_pgto'],
      auditoria: ['auditoria']
    }
    const keys = map[column] || [column]
    for (const key of keys) {
      const value = row?.[key]
      if (value !== undefined && value !== null && value !== '') return value
    }
    return ''
  }

  const formatDateLabel = (value) => {
    const isoDate = toIsoDate(value)
    if (!isoDate) return '(Vazio)'
    const [year, month, day] = isoDate.split('-')
    return `${day}/${month}/${year}`
  }

  const formatOptionLabel = (column, value) => {
    if (value === null || value === undefined || value === '') {
      return '(Vazio)'
    }
    if (dateColumns.has(column)) {
      return formatDateLabel(value)
    }
    if (currencyColumns.has(column)) {
      const numericValue = parseNumeric(value)
      if (!Number.isFinite(numericValue)) return '(Vazio)'
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericValue)
    }
    if (column === 'taxaMdr') {
      const numericValue = parseNumeric(value)
      return Number.isFinite(numericValue) ? `${numericValue}%` : '(Vazio)'
    }
    if (column === 'numeroParcelas') {
      const numericValue = parseNumeric(value)
      return Number.isFinite(numericValue) ? String(numericValue) : '(Vazio)'
    }
    return String(value).trim() || '(Vazio)'
  }

  const buildOptionToken = (column, value) => {
    if (dateColumns.has(column)) {
      return toIsoDate(value) || ''
    }
    if (numericColumns.has(column)) {
      const numericValue = parseNumeric(value)
      return Number.isFinite(numericValue) ? String(numericValue) : ''
    }
    return String(value || '').trim().toLowerCase()
  }

  const matchesColumnFilter = (row, column) => {
    const filter = columnFilters[column]
    if (!filter) return true

    const rawValue = getRawValue(row, column)

    if (filter.mode === 'values') {
      const selectedValues = filter.selectedValues || []
      if (selectedValues.length === 0) return true
      const token = buildOptionToken(column, rawValue)
      return selectedValues.includes(token)
    }

    const normalizedRowValue = normalizeText(rawValue)
    const normalizedFilterValue = normalizeText(filter.conditionValue)

    if (!normalizedFilterValue) return true
    if (filter.operator === 'eq') return normalizedRowValue === normalizedFilterValue
    if (filter.operator === 'startsWith') return normalizedRowValue.startsWith(normalizedFilterValue)
    if (filter.operator === 'endsWith') return normalizedRowValue.endsWith(normalizedFilterValue)
    return normalizedRowValue.includes(normalizedFilterValue)
  }

  const matchesAllColumnFilters = (row, excludedColumn = '') => {
    return (visibleColumnsRef.value || []).every((column) => {
      if (column === excludedColumn) return true
      return matchesColumnFilter(row, column)
    })
  }

  const filterOptionsByColumn = (matchesCustomFilter = () => true) => {
    const rows = rowsRef.value || []
    const optionsByColumn = {}

    ;(visibleColumnsRef.value || []).forEach((column) => {
      const optionsMap = new Map()

      rows
        .filter((row) => matchesCustomFilter(row) && matchesAllColumnFilters(row, column))
        .forEach((row) => {
          const rawValue = getRawValue(row, column)
          const token = buildOptionToken(column, rawValue)
          const label = formatOptionLabel(column, rawValue)

          const existing = optionsMap.get(token)

          if (existing) {
            existing.count += 1
            return
          }

          optionsMap.set(token, {
            value: token,
            label,
            count: 1,
            _raw: rawValue
          })
        })

      let options = Array.from(optionsMap.values())

      options.sort((a, b) => {
        if (!a.value && b.value) return 1
        if (a.value && !b.value) return -1
        if (!a.value && !b.value) return 0

        if (dateColumns.has(column)) {
          return a.value.localeCompare(b.value)
        }
        if (numericColumns.has(column)) {
          return Number(a.value) - Number(b.value)
        }
        return a.label.localeCompare(b.label)
      })

      optionsByColumn[column] = options
    })

    return optionsByColumn
  }

  const clearAllFilters = () => {
    ;(visibleColumnsRef.value || []).forEach((col) => {
      columnFilters[col] = createDefaultFilter(col)
    })
  }

  return {
    columnFilters,
    syncFilters,
    filterOptionsByColumn,
    matchesAllColumnFilters,
    clearAllFilters,
    getRawValue,
    parseNumeric,
    dateColumns,
    numericColumns,
    currencyColumns
  }
}
