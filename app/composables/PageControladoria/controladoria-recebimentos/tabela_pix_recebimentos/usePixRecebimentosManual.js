import { ref } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import { useEmpresaHelpers } from '~/composables/PagePagamentos/filtrar_tabelas_recebimento/useEmpresaHelpers'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useScopedTableRead } from '~/composables/useScopedTableRead'
import { formatBRLNumber, round2 } from '../tabela_recebimentos_voucher_manual/formatters'
import { criarResolvers } from '../tabela_recebimentos_voucher_manual/resolvers'
import { isMissingColumnError, normalizarEcNumerico } from '../tabela_recebimentos_voucher_manual/supabaseUtils'

let nextRowId = 0

const criarRowKey = () => `pix-recebimentos-${Date.now()}-${nextRowId++}`

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

const criarTabelaPix = (empresa) => `recebimento_pix_${normalizarSegmentoTabela(empresa)}`

const criarLinhaPix = (data = {}) => ({
  _row_key: criarRowKey(),
  nome: data.nome || '',
  debito: round2(data.debito || 0),
  credito: round2(data.credito || 0),
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

const lerLinhasSeparadasSemObservacoes = async ({ tableName, empresaAtual, matrizAtual, startCreatedAtIso, endCreatedAtIso }) => {
  return await supabase
    .from(tableName)
    .select('id, adquirente, valor_bruto, despesa_mdr, created_at')
    .match({ empresa: empresaAtual, matriz: matrizAtual, modalidade: 'Pix' })
    .gte('created_at', startCreatedAtIso)
    .lte('created_at', endCreatedAtIso)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
}

const lerLinhasCombinadasSemObservacoes = async ({ tableName, empresaAtual, matrizAtual, startCreatedAtIso, endCreatedAtIso }) => {
  return await supabase
    .from(tableName)
    .select('id, adquirente, valor_bruto_despesa_mdr, created_at')
    .match({ empresa: empresaAtual, matriz: matrizAtual, modalidade: 'Pix' })
    .gte('created_at', startCreatedAtIso)
    .lte('created_at', endCreatedAtIso)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
}

// #region debug-point P:pix-recebimentos-helper
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

export const usePixRecebimentosManual = (filtroAtivoRef) => {
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

  const preencherLinhas = (linhas) => {
    pixData.value = linhas.map((linha) => {
      const row = criarLinhaPix(linha)
      recalcularLinha(row)
      return row
    })
  }

  const garantirLinhaInicial = () => {
    if (pixData.value.length > 0) return
    preencherLinhas([criarLinhaPix()])
  }

  const adicionarLinha = (index = pixData.value.length - 1) => {
    const novaLinha = criarLinhaPix()
    if (index < 0 || index >= pixData.value.length) {
      pixData.value.push(novaLinha)
    } else {
      pixData.value.splice(index + 1, 0, novaLinha)
    }
    recalcularLinha(novaLinha)
    return novaLinha
  }

  const fetchPixRecebimentos = async (options = {}) => {
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
    // #region debug-point P:pix-recebimentos-fetch-start
    reportPixRefreshDebug('P1', 'usePixRecebimentosManual.js:212', '[DEBUG] Iniciando carga de PIX recebimentos', {
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
      let possuiObservacoes = true

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

      if (shouldUseScopedRead.value && queryError?.message?.includes('column') && queryError.message.includes('"observacoes"')) {
        possuiObservacoes = false
        queryError = null
        try {
          data = await readTablePage({
            table: tableName,
            columns: 'id, adquirente, valor_bruto, despesa_mdr, created_at',
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
      }

      if (shouldUseScopedRead.value && queryError?.message?.includes('column') && queryError.message.includes('"despesa_mdr"')) {
        schemaMode = 'combinado'
        queryError = null
        data = await readTablePage({
          table: tableName,
          columns: possuiObservacoes
            ? 'id, adquirente, valor_bruto_despesa_mdr, observacoes, created_at'
            : 'id, adquirente, valor_bruto_despesa_mdr, created_at',
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

      if (!shouldUseScopedRead.value && queryError && isMissingColumnError(queryError, 'observacoes')) {
        possuiObservacoes = false
        ;({ data, error: queryError } = await lerLinhasSeparadasSemObservacoes({ tableName, empresaAtual, matrizAtual, startCreatedAtIso, endCreatedAtIso }))
      }

      if (!shouldUseScopedRead.value && queryError && isMissingColumnError(queryError, 'despesa_mdr')) {
        schemaMode = 'combinado'
        ;({ data, error: queryError } = await (
          possuiObservacoes
            ? lerLinhasCombinadas({ tableName, empresaAtual, matrizAtual, startCreatedAtIso, endCreatedAtIso })
            : lerLinhasCombinadasSemObservacoes({ tableName, empresaAtual, matrizAtual, startCreatedAtIso, endCreatedAtIso })
        ))
      }

      if (!shouldUseScopedRead.value && queryError && isMissingColumnError(queryError, 'observacoes')) {
        possuiObservacoes = false
        ;({ data, error: queryError } = await lerLinhasCombinadasSemObservacoes({ tableName, empresaAtual, matrizAtual, startCreatedAtIso, endCreatedAtIso }))
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
            ? round2(item.valor_bruto_despesa_mdr || 0)
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
      // #region debug-point P:pix-recebimentos-fetch-success
      reportPixRefreshDebug('P1', 'usePixRecebimentosManual.js:387', '[DEBUG] Carga de PIX recebimentos concluida', {
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
      // #region debug-point P:pix-recebimentos-fetch-error
      reportPixRefreshDebug('P1', 'usePixRecebimentosManual.js:394', '[DEBUG] Carga de PIX recebimentos falhou', {
        empresa: empresaAtual,
        matriz: matrizAtual,
        erro: e?.message || String(e || '')
      })
      // #endregion
    } finally {
      setLoading(false)
    }
  }

  const salvarSeparado = async ({ tableName, linha, targetId, duplicateIds, payload, createdAtMesIso }) => {
    if (targetId) {
      const { error: updateError } = await supabase
        .from(tableName)
        .update(payload)
        .eq('id', targetId)

      if (updateError) throw updateError
    } else {
      const { error: insertError } = await supabase
        .from(tableName)
        .insert([{ ...payload, created_at: createdAtMesIso }])

      if (insertError) throw insertError
    }

    if (Array.isArray(duplicateIds) && duplicateIds.length > 0) {
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .in('id', duplicateIds)

      if (deleteError) throw deleteError
    }
  }

  const salvarCombinado = async ({ tableName, linha, targetId, duplicateIds, payload, createdAtMesIso, ecColumn }) => {
    const payloadCombinado = {
      adquirente: payload.adquirente,
      data_venda: payload.data_venda,
      modalidade: payload.modalidade,
      valor_bruto_despesa_mdr: round2(payload.valor_bruto - payload.despesa_mdr),
      empresa: payload.empresa
    }
    payloadCombinado[ecColumn] = payload.matriz

    if (targetId) {
      const { error: updateError } = await supabase
        .from(tableName)
        .update(payloadCombinado)
        .eq('id', targetId)

      if (updateError) throw updateError
    } else {
      const { error: insertError } = await supabase
        .from(tableName)
        .insert([{ ...payloadCombinado, created_at: createdAtMesIso }])

      if (insertError) throw insertError
    }

    if (Array.isArray(duplicateIds) && duplicateIds.length > 0) {
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .in('id', duplicateIds)

      if (deleteError) throw deleteError
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
    // #region debug-point P:pix-recebimentos-save-start
    reportPixRefreshDebug('P2', 'usePixRecebimentosManual.js:465', '[DEBUG] Envio de linha PIX recebimentos iniciado', {
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
      const payload = {
        adquirente: linha.nome,
        data_venda: chaveMes,
        modalidade: 'Pix',
        valor_bruto: round2(linha.valor_bruto || 0),
        despesa_mdr: round2(linha.despesa_mdr || 0),
        matriz: matrizAtual,
        empresa: empresaAtual,
        observacoes: String(linha.observacoes || '').trim()
      }

      let targetId = null
      let duplicateIds = []
      const existingIds = Array.isArray(linha._db_ids) ? linha._db_ids.filter(Boolean) : []
      let ecColumn = 'matriz'

      if (existingIds.length > 0) {
        targetId = existingIds[0]
        duplicateIds = existingIds.slice(1)
      } else {
        let manualRows = null
        let manualError = null

        const aplicarFiltrosRows = (query, colunaEc) => query
          .from(tableName)
          .select('id, created_at')
          .match({ empresa: empresaAtual, modalidade: 'Pix', adquirente: linha.nome })
          .eq(colunaEc, matrizAtual)
          .gte('created_at', startCreatedAtIso)
          .lte('created_at', endCreatedAtIso)
          .order('created_at', { ascending: false })
        ;({ data: manualRows, error: manualError } = await aplicarFiltrosRows(supabase, ecColumn))

        if (manualError && isMissingColumnError(manualError, ecColumn)) {
          ecColumn = 'ec'
          ;({ data: manualRows, error: manualError } = await aplicarFiltrosRows(supabase, ecColumn))
        }

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
          targetId = manualRows[0].id
          duplicateIds = manualRows.slice(1).map(item => item.id).filter(Boolean)
        } else {
          let legacyRow = null
          let legacyError = null

          const aplicarFiltrosLegacy = (query, colunaEc) => query
            .from(tableName)
            .select('id, created_at')
            .match({ empresa: empresaAtual, modalidade: 'Pix', adquirente: linha.nome })
            .eq(colunaEc, matrizAtual)
            .is('created_at', null)
            .eq('data_venda', chaveMes)
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle()
          ;({ data: legacyRow, error: legacyError } = await aplicarFiltrosLegacy(supabase, ecColumn))

          if (legacyError && isMissingColumnError(legacyError, ecColumn) && ecColumn === 'matriz') {
            ecColumn = 'ec'
            ;({ data: legacyRow, error: legacyError } = await aplicarFiltrosLegacy(supabase, ecColumn))
          }

          if (legacyError) {
            if (legacyError.code === '42P01') {
              throw new Error(`Tabela ${tableName} não existe no banco de dados.`)
            }
            throw legacyError
          }

          if (legacyRow?.id) {
            targetId = legacyRow.id
          }
        }
      }

      try {
        await salvarSeparado({ tableName, linha, targetId, duplicateIds, payload, createdAtMesIso })
        linha._schema_mode = 'separado'
      } catch (err) {
        if (isMissingColumnError(err, 'observacoes')) {
          delete payload.observacoes
          await salvarSeparado({ tableName, linha, targetId, duplicateIds, payload, createdAtMesIso })
          linha._schema_mode = 'separado'
        } else if (isMissingColumnError(err, 'despesa_mdr') || isMissingColumnError(err, 'valor_bruto')) {
          await salvarCombinado({ tableName, linha, targetId, duplicateIds, payload, createdAtMesIso, ecColumn })
          linha._schema_mode = 'combinado'
        } else {
          throw err
        }
      }

      linha.status = 'success'
      sincronizarLinhaPersistida(linha, { createdAtMesIso, targetId })
      setSuccess(`PIX de ${linha.nome} enviado com sucesso!`)
      await fetchPixRecebimentos({ silentOnError: true })
      // #region debug-point P:pix-recebimentos-save-success
      reportPixRefreshDebug('P2', 'usePixRecebimentosManual.js:598', '[DEBUG] Envio de linha PIX recebimentos concluido', {
        empresa: empresaAtual,
        matriz: matrizAtual,
        nome: linha.nome
      })
      // #endregion
    } catch (e) {
      linha.status = 'error'
      setError(`Erro ao enviar: ${e.message}`)
      // #region debug-point P:pix-recebimentos-save-error
      reportPixRefreshDebug('P2', 'usePixRecebimentosManual.js:605', '[DEBUG] Envio de linha PIX recebimentos falhou', {
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
    // #region debug-point P:pix-recebimentos-delete-start
    reportPixRefreshDebug('P3', 'usePixRecebimentosManual.js:629', '[DEBUG] Remocao de linha PIX recebimentos iniciada', {
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
      // #region debug-point P:pix-recebimentos-delete-success
      reportPixRefreshDebug('P3', 'usePixRecebimentosManual.js:648', '[DEBUG] Remocao de linha PIX recebimentos concluida', {
        empresa: empresaAtual,
        nome: linha.nome
      })
      // #endregion
    } catch (e) {
      linha.status = 'error'
      setError(`Erro ao remover linha: ${e.message}`)
      // #region debug-point P:pix-recebimentos-delete-error
      reportPixRefreshDebug('P3', 'usePixRecebimentosManual.js:655', '[DEBUG] Remocao de linha PIX recebimentos falhou', {
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
    fetchPixRecebimentos,
    enviarLinha
  }
}
