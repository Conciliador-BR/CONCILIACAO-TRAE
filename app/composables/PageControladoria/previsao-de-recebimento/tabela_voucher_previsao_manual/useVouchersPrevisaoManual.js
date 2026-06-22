import { computed, ref } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import { useEmpresaHelpers } from '~/composables/PagePagamentos/filtrar_tabelas_recebimento/useEmpresaHelpers'
import { useBatchDataFetcher } from '~/composables/PagePagamentos/filtrar_tabelas_previsao/useBatchDataFetcher'
import { criarVerificarTabelaExiste, isMissingColumnError, normalizarEcNumerico } from '~/composables/PageControladoria/controladoria-recebimentos/tabela_recebimentos_voucher_manual/supabaseUtils'
import { formatBRLNumber, round2 } from '~/composables/PageControladoria/controladoria-recebimentos/tabela_recebimentos_voucher_manual/formatters'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { parsePrevisaoDate } from '../usePrevisaoDeRecebimentoMeses'

const normalizeText = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/\s+/g, '_')
  .replace(/-/g, '_')
  .replace(/[^a-z0-9_]/g, '')
  .replace(/_+/g, '_')
  .replace(/^_|_$/g, '')

const normalizeMonthDate = (mes) => `${mes.sortKey}-01`
const normalizeMonthEndDate = (mes) => {
  const lastDay = new Date(mes.year, mes.month + 1, 0)
  return `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`
}

const parseBRL = (value) => {
  if (value == null) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const raw = String(value).trim()
  if (!raw) return 0
  const normalized = raw.replace(/\s/g, '').replace(/[^0-9,.-]/g, '')
  const hasComma = normalized.includes(',')
  const dotCount = (normalized.match(/\./g) || []).length
  const cleaned = hasComma
    ? normalized.replace(/\./g, '').replace(',', '.')
    : (dotCount > 1 ? normalized.replace(/\./g, '') : normalized)
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? round2(parsed) : 0
}

const createMonthState = () => ({
  value: 0,
  input: '0,00',
  dbValue: 0,
  editing: false,
  rows: []
})

const createVoucherRow = (nome, meses) => ({
  nome,
  observacoes: '',
  _observacoes_db: '',
  _table_exists: false,
  _table_name: '',
  _meses: meses.reduce((acc, mes) => {
    acc[mes.key] = createMonthState()
    return acc
  }, {}),
  status: 'pending'
})

const monthValueFromRow = (row) => {
  return round2(
    row?.valor_liquido ??
    row?.valor_previsto ??
    row?.valor_bruto ??
    0
  )
}

const isLinhaTabelaPrevisao = (row) => normalizeText(row?.bandeira) === 'tabela_previsao'

const sameMonth = (row, mes) => {
  const date = parsePrevisaoDate(row?.previsao_pgto || row?.data_pgto || row?.data_recebimento || row?.data_venda)
  return Boolean(date) && date.getMonth() === mes.month && date.getFullYear() === mes.year
}

export const useVouchersPrevisaoManual = (mesesRef) => {
  const vouchersData = ref([])
  const loading = ref(false)
  const error = ref('')
  const successMessage = ref('')

  const { filtrosGlobais } = useGlobalFilters()
  const { obterEmpresaSelecionadaCompleta } = useEmpresaHelpers()
  const { buscarDadosTabela, buscarDadosTabelaAlternativo } = useBatchDataFetcher()
  const { listarOperadorasComTabela, resolverNomeTabelaOperadora } = criarVerificarTabelaExiste({ supabase })

  const empresaSelecionada = computed(() => Boolean(filtrosGlobais.empresaSelecionada))

  const carregar = async () => {
    const meses = Array.isArray(mesesRef?.value) ? mesesRef.value : []
    const empresa = await obterEmpresaSelecionadaCompleta()

    if (!empresa?.nome) {
      vouchersData.value = []
      return
    }

    loading.value = true
    error.value = ''
    successMessage.value = ''

    try {
      const vouchers = await listarOperadorasComTabela(empresa.nome, 'recebimento')
      const nomes = [...new Set((vouchers || []).map((item) => String(item || '').trim().toUpperCase()).filter(Boolean))]
      vouchersData.value = nomes.map((nome) => createVoucherRow(nome, meses))

      if (meses.length === 0 || vouchersData.value.length === 0) {
        return
      }

      const dataInicial = normalizeMonthDate(meses[0])
      const dataFinal = normalizeMonthEndDate(meses[meses.length - 1])
      const ecAtual = normalizarEcNumerico(empresa.matriz)

      await Promise.all(vouchersData.value.map(async (voucher) => {
        const tableName = await resolverNomeTabelaOperadora(empresa.nome, voucher.nome, 'recebimento')
        voucher._table_name = tableName
        voucher._table_exists = Boolean(tableName)

        if (!tableName) return

        const filtrosBusca = {
          dataInicial,
          dataFinal,
          empresa: empresa.nome,
          matriz: empresa.matriz
        }

        const dadosTabela = await buscarDadosTabela(tableName, filtrosBusca)
        const dadosAlternativos = Array.isArray(dadosTabela) && dadosTabela.length === 0
          ? await buscarDadosTabelaAlternativo(tableName, filtrosBusca)
          : []
        const data = Array.isArray(dadosTabela) && dadosTabela.length > 0 ? dadosTabela : dadosAlternativos

        if (!Array.isArray(data) || data.length === 0) return

        const registros = data.filter((row) => {
          if (!isLinhaTabelaPrevisao(row)) return false
          if (ecAtual == null) return true
          const ecRegistro = normalizarEcNumerico(row?.matriz ?? row?.ec ?? null)
          return ecRegistro == null || String(ecRegistro) === String(ecAtual)
        })

        meses.forEach((mes) => {
          const rowsMes = registros.filter((row) => sameMonth(row, mes))
          const valorMes = rowsMes.reduce((acc, row) => acc + monthValueFromRow(row), 0)
          voucher._meses[mes.key].value = round2(valorMes)
          voucher._meses[mes.key].dbValue = round2(valorMes)
          voucher._meses[mes.key].input = formatBRLNumber(valorMes)
          voucher._meses[mes.key].rows = rowsMes
        })

        const primeiraObservacao = registros.find((row) => String(row?.observacoes || '').trim())
        voucher.observacoes = String(primeiraObservacao?.observacoes || '')
        voucher._observacoes_db = voucher.observacoes
      }))
    } catch (err) {
      error.value = err?.message || 'Erro ao carregar vouchers da previsao manual.'
    } finally {
      loading.value = false
    }
  }

  const atualizarInputMes = (voucher, mesKey, rawValue) => {
    const state = voucher?._meses?.[mesKey]
    if (!state) return
    state.input = String(rawValue ?? '')
    state.value = parseBRL(rawValue)
    voucher.status = 'pending'
  }

  const finalizarInputMes = (voucher, mesKey) => {
    const state = voucher?._meses?.[mesKey]
    if (!state) return
    state.editing = false
    state.input = formatBRLNumber(state.value)
  }

  const iniciarInputMes = (voucher, mesKey, event) => {
    const state = voucher?._meses?.[mesKey]
    if (!state) return
    state.editing = true
    event?.target?.select?.()
  }

  const temAlteracao = (voucher) => {
    const mudouMes = Object.values(voucher?._meses || {}).some((state) => round2(state.value) !== round2(state.dbValue))
    const observacaoAtual = String(voucher?.observacoes || '').trim()
    const observacaoOriginal = String(voucher?._observacoes_db || '').trim()
    return mudouMes || observacaoAtual !== observacaoOriginal
  }

  const enviarVoucher = async (voucher) => {
    const empresa = await obterEmpresaSelecionadaCompleta()
    const meses = Array.isArray(mesesRef?.value) ? mesesRef.value : []

    if (!empresa?.nome) {
      error.value = 'Selecione uma empresa primeiro.'
      return
    }

    if (!voucher?._table_name) {
      error.value = `Tabela de recebimento nao encontrada para ${voucher?.nome || 'voucher'}.`
      return
    }

    const ecAtual = normalizarEcNumerico(empresa.matriz)
    if (ecAtual == null) {
      error.value = 'EC invalido para envio da previsao manual de vouchers.'
      return
    }

    loading.value = true
    error.value = ''
    successMessage.value = ''
    voucher.status = 'sending'

    let ecColumn = 'matriz'
    let mdrColumn = 'despesa_mdr'
    let incluirObservacoes = true

    const persistirMes = async (mes) => {
      const monthState = voucher._meses[mes.key]
      const valor = round2(monthState?.value || 0)
      const rows = Array.isArray(monthState?.rows) ? monthState.rows : []
      const dataReferencia = normalizeMonthDate(mes)
      const createdAtIso = new Date(`${dataReferencia}T12:00:00`).toISOString()

      if (valor === 0) {
        const ids = rows.map((row) => row?.id).filter(Boolean)
        if (ids.length > 0) {
          const { error: deleteError } = await supabase
            .from(voucher._table_name)
            .delete()
            .in('id', ids)
          if (deleteError) throw deleteError
        }
        return []
      }

      const payloadBase = {
        adquirente: voucher.nome,
        bandeira: 'tabela_previsao',
        modalidade: 'Voucher',
        empresa: String(empresa.nome || '').trim().toLowerCase(),
        valor_bruto: valor,
        valor_liquido: valor,
        valor_previsto: valor,
        despesa_antecipacao: 0,
        previsao_pgto: dataReferencia,
        data_venda: dataReferencia,
        created_at: createdAtIso
      }
      payloadBase[mdrColumn] = 0
      payloadBase[ecColumn] = ecAtual
      if (incluirObservacoes) payloadBase.observacoes = String(voucher.observacoes || '').trim()

      if (rows.length > 0) {
        const [target, ...duplicates] = rows
        const { error: updateError } = await supabase
          .from(voucher._table_name)
          .update(payloadBase)
          .eq('id', target.id)
        if (updateError) throw updateError

        const duplicateIds = duplicates.map((row) => row?.id).filter(Boolean)
        if (duplicateIds.length > 0) {
          const { error: deleteDuplicateError } = await supabase
            .from(voucher._table_name)
            .delete()
            .in('id', duplicateIds)
          if (deleteDuplicateError) throw deleteDuplicateError
        }

        return [{ ...target, ...payloadBase }]
      }

      const { data: insertedData, error: insertError } = await supabase
        .from(voucher._table_name)
        .insert([payloadBase])
        .select('id, previsao_pgto, data_venda, bandeira, valor_liquido, valor_previsto, valor_bruto, observacoes, matriz, ec')

      if (insertError) throw insertError
      return Array.isArray(insertedData) ? insertedData : []
    }

    try {
      for (const mes of meses) {
        try {
          const savedRows = await persistirMes(mes)
          voucher._meses[mes.key].rows = savedRows
        } catch (err) {
          if (isMissingColumnError(err, ecColumn)) {
            ecColumn = ecColumn === 'matriz' ? 'ec' : 'matriz'
            voucher._meses[mes.key].rows = await persistirMes(mes)
          } else if (isMissingColumnError(err, mdrColumn)) {
            mdrColumn = mdrColumn === 'despesa_mdr' ? 'despesa' : 'despesa_mdr'
            voucher._meses[mes.key].rows = await persistirMes(mes)
          } else if (isMissingColumnError(err, 'observacoes')) {
            incluirObservacoes = false
            voucher._meses[mes.key].rows = await persistirMes(mes)
          } else {
            throw err
          }
        }
      }

      meses.forEach((mes) => {
        const state = voucher._meses[mes.key]
        state.dbValue = round2(state.value)
        state.input = formatBRLNumber(state.value)
      })
      voucher._observacoes_db = String(voucher.observacoes || '').trim()
      voucher.status = 'success'
      successMessage.value = `Previsao manual de ${voucher.nome} salva com sucesso.`
    } catch (err) {
      voucher.status = 'error'
      error.value = err?.message || `Erro ao salvar previsao manual de ${voucher.nome}.`
    } finally {
      loading.value = false
    }
  }

  const totais = computed(() => {
    const meses = Array.isArray(mesesRef?.value) ? mesesRef.value : []
    const acumulado = { total: 0 }
    meses.forEach((mes) => {
      acumulado[mes.key] = 0
    })

    vouchersData.value.forEach((voucher) => {
      meses.forEach((mes) => {
        const valor = round2(voucher?._meses?.[mes.key]?.value || 0)
        acumulado[mes.key] += valor
        acumulado.total += valor
      })
    })

    return acumulado
  })

  return {
    vouchersData,
    loading,
    error,
    successMessage,
    empresaSelecionada,
    carregar,
    atualizarInputMes,
    iniciarInputMes,
    finalizarInputMes,
    enviarVoucher,
    temAlteracao,
    totais
  }
}
