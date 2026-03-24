import { ref } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import { useEmpresaHelpers } from '~/composables/PagePagamentos/filtrar_tabelas_recebimento/useEmpresaHelpers'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { formatBRLNumber, round2 } from '../tabela_recebimentos_voucher_manual/formatters'
import { criarResolvers } from '../tabela_recebimentos_voucher_manual/resolvers'
import { isMissingColumnError, normalizarEcNumerico } from '../tabela_recebimentos_voucher_manual/supabaseUtils'

let nextRowId = 0

const criarRowKey = () => `pix-recebimentos-${Date.now()}-${nextRowId++}`

const normalizarSegmentoTabela = (value) => {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '_')
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

const criarTabelaPix = (empresa) => `vendas_recebimentos_pix_${normalizarSegmentoTabela(empresa)}`

const criarLinhaPix = (data = {}) => ({
  _row_key: criarRowKey(),
  nome: data.nome || '',
  debito: round2(data.debito || 0),
  credito: round2(data.credito || 0),
  pix: round2(data.pix || 0),
  despesa_mdr: round2(data.despesa_mdr || 0),
  valor_bruto: round2(data.valor_bruto || data.pix || 0),
  valor_liquido: round2(data.valor_liquido || 0),
  valor_depositado: round2(data.valor_depositado || 0),
  _pix_input: data._pix_input || formatBRLNumber(data.pix || 0),
  _mdr_input: data._mdr_input || formatBRLNumber(data.despesa_mdr || 0),
  _depositado_input: data._depositado_input || formatBRLNumber(data.valor_depositado || 0),
  _editing_pix: false,
  _editing_mdr: false,
  _editing_depositado: false,
  _db_ids: Array.isArray(data._db_ids) ? data._db_ids.filter(Boolean) : [],
  _db_created_at: data._db_created_at || null,
  _schema_mode: data._schema_mode || 'separado',
  _nome_db: data._nome_db || data.nome || '',
  _bruto_db: round2(data._bruto_db || data.valor_bruto || data.pix || 0),
  _mdr_db: round2(data._mdr_db || data.despesa_mdr || 0),
  _liquido_db: round2(data._liquido_db || data.valor_liquido || 0),
  _depositado_db: round2(data._depositado_db || data.valor_depositado || 0),
  _delta_bruto: 0,
  _delta_mdr: 0,
  _delta_depositado: 0,
  status: data.status || 'pending'
})

const lerLinhasSeparadas = async ({ tableName, empresaAtual, ecAtual, startCreatedAtIso, endCreatedAtIso }) => {
  return await supabase
    .from(tableName)
    .select('id, adquirente, valor_bruto, despesa_mdr, valor_depositado, created_at')
    .match({ empresa: empresaAtual, ec: ecAtual, modalidade: 'Pix' })
    .gte('created_at', startCreatedAtIso)
    .lte('created_at', endCreatedAtIso)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
}

const lerLinhasCombinadas = async ({ tableName, empresaAtual, ecAtual, startCreatedAtIso, endCreatedAtIso }) => {
  return await supabase
    .from(tableName)
    .select('id, adquirente, valor_bruto_despesa_mdr, valor_depositado, created_at')
    .match({ empresa: empresaAtual, ec: ecAtual, modalidade: 'Pix' })
    .gte('created_at', startCreatedAtIso)
    .lte('created_at', endCreatedAtIso)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
}

export const usePixRecebimentosManual = (filtroAtivoRef) => {
  const pixData = ref([])
  const loading = ref(false)
  const error = ref(null)
  const successMessage = ref(null)

  const { obterEmpresaSelecionadaCompleta } = useEmpresaHelpers()
  const { filtrosGlobais } = useGlobalFilters()
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

  const recalcularLinha = (linha) => {
    linha.pix = round2(linha.pix || 0)
    linha.despesa_mdr = round2(linha.despesa_mdr || 0)
    linha.valor_bruto = round2(
      Number(linha.debito || 0) +
      Number(linha.credito || 0) +
      Number(linha.pix || 0)
    )
    linha.valor_liquido = round2(linha.valor_bruto - Number(linha.despesa_mdr || 0))
    if (!linha._editing_depositado && Number(linha._depositado_db || 0) === 0 && Number(linha.valor_depositado || 0) === 0) {
      linha.valor_depositado = linha.valor_liquido
    } else {
      linha.valor_depositado = round2(linha.valor_depositado || 0)
    }

    linha._delta_bruto = round2(linha.valor_bruto - Number(linha._bruto_db || 0))
    linha._delta_mdr = round2(Number(linha.despesa_mdr || 0) - Number(linha._mdr_db || 0))
    linha._delta_depositado = round2(Number(linha.valor_depositado || 0) - Number(linha._depositado_db || 0))

    if (!linha._editing_pix) {
      linha._pix_input = formatBRLNumber(linha.pix)
    }
    if (!linha._editing_mdr) {
      linha._mdr_input = formatBRLNumber(linha.despesa_mdr)
    }
    if (!linha._editing_depositado) {
      linha._depositado_input = formatBRLNumber(linha.valor_depositado)
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

  const fetchPixRecebimentos = async () => {
    const empresaAtual = await resolverEmpresaNome()
    if (!empresaAtual) {
      pixData.value = []
      setError(null)
      setSuccess(null)
      return
    }

    const ecAtualRaw = await resolverEmpresaEC()
    const ecAtual = normalizarEcNumerico(ecAtualRaw)
    if (ecAtual == null) {
      pixData.value = []
      setError('EC inválido para carregar PIX')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const tableName = criarTabelaPix(empresaAtual)
      const { primeiroDia, ultimoDia } = resolverPeriodoTrabalho()
      const startCreatedAtIso = new Date(`${primeiroDia}T00:00:00`).toISOString()
      const endCreatedAtIso = new Date(`${ultimoDia}T23:59:59.999`).toISOString()

      let data = null
      let queryError = null
      let schemaMode = 'separado'

      ;({ data, error: queryError } = await lerLinhasSeparadas({ tableName, empresaAtual, ecAtual, startCreatedAtIso, endCreatedAtIso }))

      if (queryError && isMissingColumnError(queryError, 'despesa_mdr')) {
        schemaMode = 'combinado'
        ;({ data, error: queryError } = await lerLinhasCombinadas({ tableName, empresaAtual, ecAtual, startCreatedAtIso, endCreatedAtIso }))
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
            valor_depositado: round2(item.valor_depositado || 0),
            _db_ids: item.id ? [item.id] : [],
            _db_created_at: item.created_at || null,
            _schema_mode: schemaMode,
            _nome_db: item.adquirente || '',
            _bruto_db: bruto,
            _mdr_db: mdr,
            _liquido_db: liquido,
            _depositado_db: round2(item.valor_depositado || 0)
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
    } catch (e) {
      pixData.value = []
      setError(`Erro ao carregar PIX: ${e.message}`)
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

  const salvarCombinado = async ({ tableName, linha, targetId, duplicateIds, payload, createdAtMesIso }) => {
    const payloadCombinado = {
      adquirente: payload.adquirente,
      data_venda: payload.data_venda,
      modalidade: payload.modalidade,
      valor_bruto_despesa_mdr: round2(payload.valor_bruto - payload.despesa_mdr),
      valor_depositado: payload.valor_depositado,
      ec: payload.ec,
      empresa: payload.empresa
    }

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

    const ecAtualRaw = await resolverEmpresaEC()
    const ecAtual = normalizarEcNumerico(ecAtualRaw)
    if (ecAtual == null) {
      setError('EC inválido para envio (verifique a empresa selecionada)')
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
        valor_depositado: round2(linha.valor_depositado || 0),
        ec: ecAtual,
        empresa: empresaAtual
      }

      let targetId = null
      let duplicateIds = []
      const existingIds = Array.isArray(linha._db_ids) ? linha._db_ids.filter(Boolean) : []

      if (existingIds.length > 0) {
        targetId = existingIds[0]
        duplicateIds = existingIds.slice(1)
      } else {
        let manualRows = null
        let manualError = null

        ;({ data: manualRows, error: manualError } = await supabase
          .from(tableName)
          .select('id, created_at')
          .match({ empresa: empresaAtual, ec: ecAtual, modalidade: 'Pix', adquirente: linha.nome })
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
          targetId = manualRows[0].id
          duplicateIds = manualRows.slice(1).map(item => item.id).filter(Boolean)
        } else {
          let legacyRow = null
          let legacyError = null

          ;({ data: legacyRow, error: legacyError } = await supabase
            .from(tableName)
            .select('id, created_at')
            .match({ empresa: empresaAtual, ec: ecAtual, modalidade: 'Pix', adquirente: linha.nome })
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
            targetId = legacyRow.id
          }
        }
      }

      try {
        await salvarSeparado({ tableName, linha, targetId, duplicateIds, payload, createdAtMesIso })
        linha._schema_mode = 'separado'
      } catch (err) {
        if (isMissingColumnError(err, 'despesa_mdr') || isMissingColumnError(err, 'valor_bruto')) {
          await salvarCombinado({ tableName, linha, targetId, duplicateIds, payload, createdAtMesIso })
          linha._schema_mode = 'combinado'
        } else {
          throw err
        }
      }

      linha.status = 'success'
      setSuccess(`PIX de ${linha.nome} enviado com sucesso!`)
      await fetchPixRecebimentos()
    } catch (e) {
      linha.status = 'error'
      setError(`Erro ao enviar: ${e.message}`)
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
    } catch (e) {
      linha.status = 'error'
      setError(`Erro ao remover linha: ${e.message}`)
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
