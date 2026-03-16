import { formatBRLNumber, round2 } from './formatters'
import { isMissingColumnError, normalizarEcNumerico } from './supabaseUtils'

export const criarGetTableName = ({ construirNomeTabela }) => {
  const getTableName = (empresa, voucher) => {
    if (voucher && typeof voucher === 'object') {
      if (voucher._table_name) return voucher._table_name
      return construirNomeTabela(empresa, voucher.nome)
    }
    return construirNomeTabela(empresa, voucher)
  }
  return { getTableName }
}

export const criarEnviarVenda = ({ supabase, getTableName, resolverEmpresaNome, resolverEmpresaEC, resolverPeriodoTrabalho, setError, setSuccess, setLoading, calcularValores }) => {
  const enviarVenda = async (voucher) => {
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

    if (round2(voucher.valor_bruto || 0) === 0) {
      setError(`Valor inválido para ${voucher.nome}`)
      return
    }

    setLoading(true)
    voucher.status = 'sending'
    setError(null)
    setSuccess(null)

    try {
      const tableName = getTableName(empresaAtual, voucher)
      const { primeiroDia, ultimoDia, chaveMes } = resolverPeriodoTrabalho()

      const brutoDesejado = round2(voucher.valor_bruto || 0)
      const mdrDesejado = round2(voucher.despesa_mdr || 0)

      const brutoBase = round2(voucher._bruto_base_db || 0)
      const mdrBase = round2(voucher._mdr_base_db || 0)

      const brutoManualNovo = round2(brutoDesejado - brutoBase)
      const mdrManualNovo = round2(mdrDesejado - mdrBase)

      if (Math.abs(mdrDesejado) > Math.abs(brutoDesejado)) {
        throw new Error('Despesas MDR inválida (não pode ser maior que o Valor Bruto em módulo)')
      }

      const startCreatedAtIso = new Date(`${primeiroDia}T00:00:00`).toISOString()
      const endCreatedAtIso = new Date(`${ultimoDia}T23:59:59.999`).toISOString()
      const createdAtMesIso = new Date(`${chaveMes}T12:00:00`).toISOString()

      let mdrColumn = 'despesa_mdr'
      let manualRows = null
      let errManualRows = null

      ;({ data: manualRows, error: errManualRows } = await supabase
        .from(tableName)
        .select(`id, created_at, valor_bruto, ${mdrColumn}`)
        .match({ empresa: empresaAtual, ec: ecAtual, adquirente: voucher.nome })
        .gte('created_at', startCreatedAtIso)
        .lte('created_at', endCreatedAtIso)
        .order('created_at', { ascending: false })
      )

      if (errManualRows && isMissingColumnError(errManualRows, 'despesa_mdr')) {
        mdrColumn = 'despesa'
        ;({ data: manualRows, error: errManualRows } = await supabase
          .from(tableName)
          .select(`id, created_at, valor_bruto, ${mdrColumn}`)
          .match({ empresa: empresaAtual, ec: ecAtual, adquirente: voucher.nome })
          .gte('created_at', startCreatedAtIso)
          .lte('created_at', endCreatedAtIso)
          .order('created_at', { ascending: false })
        )
      }

      if (errManualRows && isMissingColumnError(errManualRows, 'created_at')) {
        throw new Error('Tabela ainda não possui suporte a ajuste por mês (created_at).')
      }

      if (errManualRows) {
        if (errManualRows.code === '42P01') {
          throw new Error(`Tabela ${tableName} não existe no banco de dados.`)
        }
        throw errManualRows
      }

      const updatePayload = {
        data_venda: chaveMes,
        modalidade: 'Voucher',
        valor_bruto: brutoManualNovo,
        valor_liquido: round2(brutoManualNovo - mdrManualNovo)
      }
      updatePayload[mdrColumn] = mdrManualNovo

      if (Array.isArray(manualRows) && manualRows.length > 0) {
        const target = manualRows[0]
        const duplicateIds = manualRows.slice(1).map(r => r.id).filter(Boolean)

        const { error: errUpdate } = await supabase
          .from(tableName)
          .update(updatePayload)
          .eq('id', target.id)

        if (errUpdate) throw errUpdate

        if (duplicateIds.length > 0) {
          const { error: errDelete } = await supabase
            .from(tableName)
            .delete()
            .in('id', duplicateIds)

          if (errDelete) throw errDelete
        }
      } else {
        let legacyRow = null
        let errLegacy = null

        ;({ data: legacyRow, error: errLegacy } = await supabase
          .from(tableName)
          .select(`id, created_at, valor_bruto, ${mdrColumn}`)
          .match({ empresa: empresaAtual, ec: ecAtual, adquirente: voucher.nome })
          .is('created_at', null)
          .is('nsu', null)
          .is('previsao_pgto', null)
          .eq('data_venda', chaveMes)
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle()
        )

        if (errLegacy) {
          if (errLegacy.code === '42P01') {
            throw new Error(`Tabela ${tableName} não existe no banco de dados.`)
          }
          throw errLegacy
        }

        if (legacyRow?.id) {
          const legacyUpdatePayload = { ...updatePayload, created_at: createdAtMesIso }
          const { error: errUpdateLegacy } = await supabase
            .from(tableName)
            .update(legacyUpdatePayload)
            .eq('id', legacyRow.id)

          if (errUpdateLegacy) throw errUpdateLegacy

          const { error: errDeleteLegacyDup } = await supabase
            .from(tableName)
            .delete()
            .match({ empresa: empresaAtual, ec: ecAtual, adquirente: voucher.nome })
            .is('created_at', null)
            .is('nsu', null)
            .is('previsao_pgto', null)
            .eq('data_venda', chaveMes)
            .neq('id', legacyRow.id)

          if (errDeleteLegacyDup) throw errDeleteLegacyDup
        } else {
          const insertPayload = {
            adquirente: voucher.nome,
            modalidade: 'Voucher',
            valor_bruto: brutoManualNovo,
            valor_liquido: round2(brutoManualNovo - mdrManualNovo),
            empresa: empresaAtual,
            ec: ecAtual,
            data_venda: chaveMes,
            created_at: createdAtMesIso
          }
          insertPayload[mdrColumn] = mdrManualNovo

          const { error: errInsert } = await supabase
            .from(tableName)
            .insert([insertPayload])

          if (errInsert) {
            if (errInsert.code === '42P01') {
              throw new Error(`Tabela ${tableName} não existe no banco de dados.`)
            }
            throw errInsert
          }
        }
      }

      voucher.status = 'success'
      setSuccess(`Vendas de ${voucher.nome} enviadas com sucesso!`)

      voucher._bruto_db = brutoDesejado
      voucher._mdr_db = mdrDesejado
      voucher._liquido_db = round2(brutoDesejado - mdrDesejado)
      voucher._has_db_values = true
      voucher._voucher_input = formatBRLNumber(voucher.voucher)
      voucher._mdr_input = formatBRLNumber(voucher.despesa_mdr)
      calcularValores(voucher)
    } catch (e) {
      voucher.status = 'error'
      setError(`Erro ao enviar: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return { enviarVenda }
}
