import { ref } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import { useEmpresaHelpers } from '~/composables/PageVendas/filtrar_tabelas/useEmpresaHelpers'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useScopedTableRead } from '~/composables/useScopedTableRead'
import { formatBRLNumber, round2 } from '../tabela_voucher_manual/formatters'
import { criarResolvers } from '../tabela_voucher_manual/resolvers'
import { isMissingColumnError, normalizarEcNumerico } from '../tabela_voucher_manual/supabaseUtils'
import { notifyPixVendasStatsChanged } from './statsSync'

let nextRowId = 0

const criarRowKey = () => `pix-vendas-${Date.now()}-${nextRowId++}`

const normalizarSegmentoTabela = (value) => {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

const criarLinhaPix = (data = {}) => ({
  _row_key: criarRowKey(),
  nome: data.nome || '',
  debito: round2(data.debito || 0),
  credito: round2(data.credito || 0),
  credito3x: round2(data.credito3x || 0),
  credito4x6x: round2(data.credito4x6x || 0),
  pix: round2(data.pix || 0),
  despesa_mdr: round2(data.despesa_mdr || 0),
  valor_bruto: round2(data.valor_bruto || data.pix || 0),
  valor_liquido: round2(data.valor_liquido || 0),
  _pix_input: data._pix_input || formatBRLNumber(data.pix || 0),
  _mdr_input: data._mdr_input || formatBRLNumber(data.despesa_mdr || 0),
  _editing_pix: false,
  _editing_mdr: false,
  _db_ids: Array.isArray(data._db_ids) ? data._db_ids.filter(Boolean) : [],
  _db_created_at: data._db_created_at || null,
  _schema_mode: data._schema_mode || 'separado',
  _nome_db: data._nome_db || data.nome || '',
  _bruto_db: round2(data._bruto_db || data.valor_bruto || data.pix || 0),
  _mdr_db: round2(data._mdr_db || data.despesa_mdr || 0),
  _liquido_db: round2(data._liquido_db || data.valor_liquido || 0),
  _delta_bruto: 0,
  _delta_mdr: 0,
  observacoes: data.observacoes || '',
  _observacoes_db: data._observacoes_db || data.observacoes || '',
  status: data.status || 'pending'
})

const criarTabelaPix = (empresa) => `vendas_pix_${normalizarSegmentoTabela(empresa)}`

const lerLinhasSeparadas = async ({ tableName, empresaAtual, matrizAtual, startCreatedAtIso, endCreatedAtIso }) => {
  return await supabase
    .from(tableName)
    .select('id, adquirente, valor_bruto, despesa_mdr, observacoes, created_at')
    .match({ empresa: empresaAtual, matriz: matrizAtual, modalidade: 'Pix' })
    .gte('created_at', startCreatedAtIso)
    .lte('created_at', endCreatedAtIso)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
}

const lerLinhasCombinadas = async ({ tableName, empresaAtual, matrizAtual, startCreatedAtIso, endCreatedAtIso }) => {
  return await supabase
    .from(tableName)
    .select('id, adquirente, valor_bruto_despesa_mdr, observacoes, created_at')
    .match({ empresa: empresaAtual, matriz: matrizAtual, modalidade: 'Pix' })
    .gte('created_at', startCreatedAtIso)
    .lte('created_at', endCreatedAtIso)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
}

const parseBRL = (value) => {
  if (value == null) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const raw = String(value).trim()
  if (!raw) return 0
  const normalized = raw
    .replace(/\s/g, '')
    .replace(/[^0-9,.-]/g, '')

  const hasComma = normalized.includes(',')
  const dotCount = (normalized.match(/\./g) || []).length

  const cleaned = hasComma
    ? normalized.replace(/\./g, '').replace(',', '.')
    : (dotCount > 1 ? normalized.replace(/\./g, '') : normalized)

  const parsed = Number(cleaned)
  if (!Number.isFinite(parsed)) return 0
  return round2(parsed)
}

const normalizarChave = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

// #region debug-point V:pix-vendas-helper
const reportPixRefreshDebug = (hypothesisId, location, msg, data = {}) => {
  fetch('http://127.0.0.1:7777/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'pix-fetch-refresh',
      runId: 'pre-fix',
      hypothesisId,
      location,
      msg,
      data,
      ts: Date.now()
    })
  }).catch(() => {})
}
// #endregion

const clonarPixRows = (linhas = []) => {
  return (linhas || []).map(linha => ({
    ...linha,
    _db_ids: Array.isArray(linha?._db_ids) ? [...linha._db_ids] : []
  }))
}

export const usePixVendasManual = (filtroAtivoRef) => {
  const pixData = ref([])
  const loading = ref(false)
  const error = ref(null)
  const successMessage = ref(null)

  const { obterEmpresaSelecionadaCompleta } = useEmpresaHelpers()
  const { filtrosGlobais } = useGlobalFilters()
  const { shouldUseScopedRead, readTablePage } = useScopedTableRead()
  const { resolverEmpresaNome, resolverEmpresaEC, resolverPeriodoTrabalho } = criarResolvers({
    filtroAtivoRef,
    obterEmpresaSelecionadaCompleta,
    filtrosGlobais
  })

  const setLoading = (value) => {
    loading.value = Boolean(value)
  }

  const setError = (value) => {
    error.value = value
  }

  const setSuccess = (value) => {
    successMessage.value = value
  }

  const sincronizarLinhaPersistida = (linha, { createdAtMesIso, targetId } = {}) => {
    linha._nome_db = String(linha.nome || '').trim()
    linha._bruto_db = round2(linha.valor_bruto || 0)
    linha._mdr_db = round2(linha.despesa_mdr || 0)
    linha._liquido_db = round2(linha.valor_liquido || 0)
    linha._observacoes_db = String(linha.observacoes || '').trim()
    linha._db_created_at = createdAtMesIso || linha._db_created_at || null
    if (targetId) {
      linha._db_ids = [targetId]
    }
    recalcularLinha(linha)
  }

  const recalcularLinha = (linha) => {
    linha.pix = round2(linha.pix || 0)
    linha.despesa_mdr = round2(linha.despesa_mdr || 0)
    linha.valor_bruto = round2(
      Number(linha.debito || 0) +
      Number(linha.credito || 0) +
      Number(linha.credito3x || 0) +
      Number(linha.credito4x6x || 0) +
      Number(linha.pix || 0)
    )
    linha.valor_liquido = round2(linha.valor_bruto - Number(linha.despesa_mdr || 0))
    linha._delta_bruto = round2(linha.valor_bruto - Number(linha._bruto_db || 0))
    linha._delta_mdr = round2(Number(linha.despesa_mdr || 0) - Number(linha._mdr_db || 0))

    if (!linha._editing_pix) {
      linha._pix_input = formatBRLNumber(linha.pix)
    }
    if (!linha._editing_mdr) {
      linha._mdr_input = formatBRLNumber(linha.despesa_mdr)
    }
  }

  const adicionarLinha = (index = pixData.value.length - 1) => {
    const novaLinha = criarLinhaPix()
    if (index < 0 || index >= pixData.value.length) {
      pixData.value.push(novaLinha)
    } else {
      pixData.value.splice(index + 1, 0, novaLinha)
    }
    return novaLinha
  }

  const preencherLinhas = (linhas) => {
    pixData.value = linhas.map(linha => {
      const row = criarLinhaPix(linha)
      recalcularLinha(row)
      return row
    })
  }

  const garantirLinhaInicial = () => {
    if (pixData.value.length > 0) return
    preencherLinhas([criarLinhaPix()])
  }

  const fetchPixVendas = async (options = {}) => {
    const silentOnError = Boolean(options?.silentOnError)
    const snapshotAnterior = clonarPixRows(pixData.value)
    const empresaAtual = await resolverEmpresaNome()
    if (!empresaAtual) {
      pixData.value = []
      setError(null)
      setSuccess(null)
      return
    }

    const matrizAtualRaw = await resolverEmpresaEC()
    const matrizAtual = normalizarEcNumerico(matrizAtualRaw)
    if (matrizAtual == null) {
      pixData.value = []
      setError('Matriz inválida para carregar PIX')
      return
    }

    setLoading(true)
    setError(null)
    // #region debug-point V:pix-vendas-fetch-start
    reportPixRefreshDebug('P1', 'usePixVendasManual.js:183', '[DEBUG] Iniciando carga de PIX vendas', {
      empresa: empresaAtual,
      matriz: matrizAtual,
      scopedRead: Boolean(shouldUseScopedRead.value)
    })
    // #endregion

    try {
      const tableName = criarTabelaPix(empresaAtual)
      const { primeiroDia, ultimoDia } = resolverPeriodoTrabalho()
      const startCreatedAtIso = new Date(`${primeiroDia}T00:00:00`).toISOString()
      const endCreatedAtIso = new Date(`${ultimoDia}T23:59:59.999`).toISOString()

      let data = null
      let queryError = null
      let schemaMode = 'separado'

      if (shouldUseScopedRead.value) {
        try {
          data = await readTablePage({
            table: tableName,
            columns: 'id, adquirente, valor_bruto, despesa_mdr, observacoes, created_at',
            filters: {
              ilike: { empresa: String(empresaAtual) },
              eq: {
                matriz: matrizAtual,
                modalidade: 'Pix'
              },
              dateColumn: 'created_at',
              dataInicial: startCreatedAtIso,
              dataFinal: endCreatedAtIso,
              orderBy: [
                { column: 'created_at', ascending: false },
                { column: 'id', ascending: false }
              ]
            }
          })
        } catch (err) {
          queryError = err
        }
      } else {
        ;({ data, error: queryError } = await lerLinhasSeparadas({ tableName, empresaAtual, matrizAtual, startCreatedAtIso, endCreatedAtIso }))
      }

      if (shouldUseScopedRead.value && queryError?.message?.includes('column') && queryError.message.includes('"despesa_mdr"')) {
        schemaMode = 'combinado'
        queryError = null
        data = await readTablePage({
          table: tableName,
          columns: 'id, adquirente, valor_bruto_despesa_mdr, observacoes, created_at',
          filters: {
            ilike: { empresa: String(empresaAtual) },
            eq: {
              matriz: matrizAtual,
              modalidade: 'Pix'
            },
            dateColumn: 'created_at',
            dataInicial: startCreatedAtIso,
            dataFinal: endCreatedAtIso,
            orderBy: [
              { column: 'created_at', ascending: false },
              { column: 'id', ascending: false }
            ]
          }
        })
      }

      if (!shouldUseScopedRead.value && queryError && (isMissingColumnError(queryError, 'despesa_mdr') || isMissingColumnError(queryError, 'valor_bruto'))) {
        schemaMode = 'combinado'
        ;({ data, error: queryError } = await lerLinhasCombinadas({ tableName, empresaAtual, matrizAtual, startCreatedAtIso, endCreatedAtIso }))
      }

      if (queryError && isMissingColumnError(queryError, 'created_at')) {
        throw new Error('Tabela ainda não possui suporte a ajuste por mês (created_at).')
      }

      if (queryError) {
        if (queryError.code === '42P01') {
          throw new Error(`Tabela ${tableName} não existe no banco de dados.`)
        }
        throw queryError
      }

      const linhasMap = new Map()
      for (const item of data || []) {
        const chave = normalizarChave(item.adquirente)
        if (!chave) continue

        if (!linhasMap.has(chave)) {
          const bruto = schemaMode === 'combinado'
            ? round2(item.valor_bruto_despesa_mdr || 0)
            : round2(item.valor_bruto || 0)
          const mdr = schemaMode === 'combinado'
            ? 0
            : round2(item.despesa_mdr || 0)
          const liquido = schemaMode === 'combinado'
            ? bruto
            : round2(bruto - mdr)

          linhasMap.set(chave, {
            nome: item.adquirente || '',
            pix: bruto,
            despesa_mdr: mdr,
            valor_bruto: bruto,
            valor_liquido: liquido,
            observacoes: String(item.observacoes || ''),
            _db_ids: item.id ? [item.id] : [],
            _db_created_at: item.created_at || null,
            _schema_mode: schemaMode,
            _nome_db: item.adquirente || '',
            _bruto_db: bruto,
            _mdr_db: mdr,
            _liquido_db: liquido,
            _observacoes_db: String(item.observacoes || '')
          })
          continue
        }

        if (item.id) {
          linhasMap.get(chave)._db_ids.push(item.id)
        }
      }

      const linhas = Array.from(linhasMap.values())
      if (linhas.length === 0) {
        preencherLinhas([criarLinhaPix()])
      } else {
        preencherLinhas(linhas)
      }
      // #region debug-point V:pix-vendas-fetch-success
      reportPixRefreshDebug('P1', 'usePixVendasManual.js:295', '[DEBUG] Carga de PIX vendas concluida', {
        empresa: empresaAtual,
        matriz: matrizAtual,
        totalLinhas: linhas.length,
        schemaMode
      })
      // #endregion
    } catch (e) {
      if (snapshotAnterior.length > 0) {
        pixData.value = clonarPixRows(snapshotAnterior)
      } else {
        pixData.value = []
      }
      if (!silentOnError) {
        setError(`Erro ao carregar PIX: ${e.message}`)
      }
      // #region debug-point V:pix-vendas-fetch-error
      reportPixRefreshDebug('P1', 'usePixVendasManual.js:302', '[DEBUG] Carga de PIX vendas falhou', {
        empresa: empresaAtual,
        matriz: matrizAtual,
        erro: e?.message || String(e || '')
      })
      // #endregion
    } finally {
      setLoading(false)
    }
  }

  const enviarLinha = async (linha) => {
    const empresaAtual = await resolverEmpresaNome()
    if (!empresaAtual) {
      setError('Selecione uma empresa primeiro')
      return
    }

    const matrizAtualRaw = await resolverEmpresaEC()
    const matrizAtual = normalizarEcNumerico(matrizAtualRaw)
    if (matrizAtual == null) {
      setError('Matriz inválida para envio (verifique a empresa selecionada)')
      return
    }

    linha.nome = String(linha.nome || '').trim()
    recalcularLinha(linha)

    if (!linha.nome) {
      setError('Preencha a adquirente antes de enviar')
      return
    }

    if (round2(linha.valor_bruto || 0) === 0) {
      setError(`Valor inválido para ${linha.nome}`)
      return
    }

    if (Math.abs(Number(linha.despesa_mdr || 0)) > Math.abs(Number(linha.valor_bruto || 0))) {
      setError('Despesas MDR inválida (não pode ser maior que o Valor Bruto em módulo)')
      return
    }

    setLoading(true)
    linha.status = 'sending'
    setError(null)
    setSuccess(null)
    // #region debug-point V:pix-vendas-save-start
    reportPixRefreshDebug('P2', 'usePixVendasManual.js:334', '[DEBUG] Envio de linha PIX vendas iniciado', {
      empresa: empresaAtual,
      matriz: matrizAtual,
      nome: linha.nome,
      bruto: Number(linha.valor_bruto || 0),
      mdr: Number(linha.despesa_mdr || 0),
      ids: Array.isArray(linha._db_ids) ? linha._db_ids : []
    })
    // #endregion

    try {
      const tableName = criarTabelaPix(empresaAtual)
      const { primeiroDia, ultimoDia, chaveMes } = resolverPeriodoTrabalho()
      const startCreatedAtIso = new Date(`${primeiroDia}T00:00:00`).toISOString()
      const endCreatedAtIso = new Date(`${ultimoDia}T23:59:59.999`).toISOString()
      const createdAtMesIso = new Date(`${chaveMes}T12:00:00`).toISOString()
      const payloadBase = {
        adquirente: linha.nome,
        data_venda: chaveMes,
        modalidade: 'Pix',
        matriz: matrizAtual,
        empresa: empresaAtual,
        observacoes: String(linha.observacoes || '').trim()
      }
      const payloadSeparado = {
        ...payloadBase,
        valor_bruto: round2(linha.valor_bruto || 0),
        despesa_mdr: round2(linha.despesa_mdr || 0)
      }
      const payloadCombinado = {
        ...payloadBase,
        valor_bruto_despesa_mdr: round2(Number(linha.valor_bruto || 0) - Number(linha.despesa_mdr || 0))
      }

      const existingIds = Array.isArray(linha._db_ids) ? linha._db_ids.filter(Boolean) : []
      let operation = 'insert'
      let targetId = null
      let duplicateIds = []
      let includeCreatedAtOnUpdate = false

      if (existingIds.length > 0) {
        operation = 'update'
        targetId = existingIds[0]
        duplicateIds = existingIds.slice(1)
      } else {
        let manualRows = null
        let manualError = null

        ;({ data: manualRows, error: manualError } = await supabase
          .from(tableName)
          .select('id, created_at')
          .match({ empresa: empresaAtual, matriz: matrizAtual, modalidade: 'Pix', adquirente: linha.nome })
          .gte('created_at', startCreatedAtIso)
          .lte('created_at', endCreatedAtIso)
          .order('created_at', { ascending: false })
        )

        if (manualError && isMissingColumnError(manualError, 'created_at')) {
          throw new Error('Tabela ainda não possui suporte a ajuste por mês (created_at).')
        }

        if (manualError) {
          if (manualError.code === '42P01') {
            throw new Error(`Tabela ${tableName} não existe no banco de dados.`)
          }
          throw manualError
        }

        if (Array.isArray(manualRows) && manualRows.length > 0) {
          operation = 'update'
          targetId = manualRows[0].id
          duplicateIds = manualRows.slice(1).map(item => item.id).filter(Boolean)
        } else {
          let legacyRow = null
          let legacyError = null

          ;({ data: legacyRow, error: legacyError } = await supabase
            .from(tableName)
            .select('id, created_at')
            .match({ empresa: empresaAtual, matriz: matrizAtual, modalidade: 'Pix', adquirente: linha.nome })
            .is('created_at', null)
            .eq('data_venda', chaveMes)
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle()
          )

          if (legacyError) {
            if (legacyError.code === '42P01') {
              throw new Error(`Tabela ${tableName} não existe no banco de dados.`)
            }
            throw legacyError
          }

          if (legacyRow?.id) {
            operation = 'update'
            targetId = legacyRow.id
            includeCreatedAtOnUpdate = true
          }
        }
      }

      const salvarSeparado = async () => {
        if (operation === 'update') {
          const updatePayload = includeCreatedAtOnUpdate
            ? { ...payloadSeparado, created_at: createdAtMesIso }
            : payloadSeparado
          const { error: updateError } = await supabase
            .from(tableName)
            .update(updatePayload)
            .eq('id', targetId)
          if (updateError) throw updateError
        } else {
          const { error: insertError } = await supabase
            .from(tableName)
            .insert([{ ...payloadSeparado, created_at: createdAtMesIso }])
          if (insertError) throw insertError
        }

        if (Array.isArray(duplicateIds) && duplicateIds.length > 0) {
          const { error: deleteDupError } = await supabase
            .from(tableName)
            .delete()
            .in('id', duplicateIds)
          if (deleteDupError) throw deleteDupError
        }
      }

      const salvarCombinado = async () => {
        if (operation === 'update') {
          const updatePayload = includeCreatedAtOnUpdate
            ? { ...payloadCombinado, created_at: createdAtMesIso }
            : payloadCombinado
          const { error: updateError } = await supabase
            .from(tableName)
            .update(updatePayload)
            .eq('id', targetId)
          if (updateError) throw updateError
        } else {
          const { error: insertError } = await supabase
            .from(tableName)
            .insert([{ ...payloadCombinado, created_at: createdAtMesIso }])
          if (insertError) throw insertError
        }

        if (Array.isArray(duplicateIds) && duplicateIds.length > 0) {
          const { error: deleteDupError } = await supabase
            .from(tableName)
            .delete()
            .in('id', duplicateIds)
          if (deleteDupError) throw deleteDupError
        }
      }

      try {
        await salvarSeparado()
        linha._schema_mode = 'separado'
      } catch (err) {
        if (isMissingColumnError(err, 'observacoes')) {
          delete payloadSeparado.observacoes
          delete payloadCombinado.observacoes
          await salvarSeparado()
          linha._schema_mode = 'separado'
        } else if (isMissingColumnError(err, 'despesa_mdr') || isMissingColumnError(err, 'valor_bruto')) {
          try {
            await salvarCombinado()
            linha._schema_mode = 'combinado'
          } catch (errCombinado) {
            if (isMissingColumnError(errCombinado, 'observacoes')) {
              delete payloadCombinado.observacoes
              await salvarCombinado()
              linha._schema_mode = 'combinado'
            } else {
              throw errCombinado
            }
          }
        } else if (isMissingColumnError(err, 'created_at')) {
          throw new Error('Tabela ainda não possui suporte a ajuste por mês (created_at).')
        } else if (err?.code === '42P01') {
          throw new Error(`Tabela ${tableName} não existe no banco de dados.`)
        } else {
          throw err
        }
      }

      linha.status = 'success'
      sincronizarLinhaPersistida(linha, { createdAtMesIso, targetId })
      setSuccess(`PIX de ${linha.nome} enviado com sucesso!`)
      notifyPixVendasStatsChanged()
      await fetchPixVendas({ silentOnError: true })
      // #region debug-point V:pix-vendas-save-success
      reportPixRefreshDebug('P2', 'usePixVendasManual.js:560', '[DEBUG] Envio de linha PIX vendas concluido', {
        empresa: empresaAtual,
        matriz: matrizAtual,
        nome: linha.nome
      })
      // #endregion
    } catch (e) {
      linha.status = 'error'
      setError(`Erro ao enviar: ${e.message}`)
      // #region debug-point V:pix-vendas-save-error
      reportPixRefreshDebug('P2', 'usePixVendasManual.js:567', '[DEBUG] Envio de linha PIX vendas falhou', {
        empresa: empresaAtual,
        matriz: matrizAtual,
        nome: linha.nome,
        erro: e?.message || String(e || '')
      })
      // #endregion
    } finally {
      setLoading(false)
    }
  }

  const removerLinha = async (linha) => {
    const index = pixData.value.findIndex(item => item._row_key === linha._row_key)
    if (index === -1) return

    const existingIds = Array.isArray(linha._db_ids) ? linha._db_ids.filter(Boolean) : []
    if (existingIds.length === 0) {
      pixData.value.splice(index, 1)
      garantirLinhaInicial()
      return
    }

    const empresaAtual = await resolverEmpresaNome()
    if (!empresaAtual) {
      setError('Selecione uma empresa primeiro')
      return
    }

    setLoading(true)
    linha.status = 'sending'
    setError(null)
    setSuccess(null)
    // #region debug-point V:pix-vendas-delete-start
    reportPixRefreshDebug('P3', 'usePixVendasManual.js:591', '[DEBUG] Remocao de linha PIX vendas iniciada', {
      empresa: empresaAtual,
      nome: linha.nome,
      ids: existingIds
    })
    // #endregion

    try {
      const tableName = criarTabelaPix(empresaAtual)
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .in('id', existingIds)

      if (deleteError) {
        if (deleteError.code === '42P01') {
          throw new Error(`Tabela ${tableName} não existe no banco de dados.`)
        }
        throw deleteError
      }

      pixData.value.splice(index, 1)
      garantirLinhaInicial()
      setSuccess(`Linha ${linha.nome || 'PIX'} removida com sucesso!`)
      notifyPixVendasStatsChanged()
      // #region debug-point V:pix-vendas-delete-success
      reportPixRefreshDebug('P3', 'usePixVendasManual.js:610', '[DEBUG] Remocao de linha PIX vendas concluida', {
        empresa: empresaAtual,
        nome: linha.nome
      })
      // #endregion
    } catch (e) {
      linha.status = 'error'
      setError(`Erro ao remover linha: ${e.message}`)
      // #region debug-point V:pix-vendas-delete-error
      reportPixRefreshDebug('P3', 'usePixVendasManual.js:617', '[DEBUG] Remocao de linha PIX vendas falhou', {
        empresa: empresaAtual,
        nome: linha.nome,
        erro: e?.message || String(e || '')
      })
      // #endregion
    } finally {
      setLoading(false)
    }
  }

  return {
    pixData,
    loading,
    error,
    successMessage,
    parseBRL,
    recalcularLinha,
    adicionarLinha,
    removerLinha,
    fetchPixVendas,
    enviarLinha
  }
}
