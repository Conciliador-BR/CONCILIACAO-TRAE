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

export const criarEnviarRecebimento = ({ supabase, getTableName, resolverEmpresaNome, resolverEmpresaEC, resolverPeriodoTrabalho, setError, setSuccess, setLoading, calcularValores }) => {
  const enviarRecebimento = async (voucher) => {
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
      const liquidoDesejado = round2(voucher.valor_liquido || 0)
      const antecipacaoDesejada = round2(voucher.despesa_antecipacao || 0)
      const previstoDesejado = round2(voucher.valor_previsto || 0)
      const depositadoDesejado = round2(voucher.valor_depositado || 0)
      const observacoesDesejada = String(voucher.observacoes || '').trim()

      const brutoBase = round2(voucher._bruto_base_db || 0)
      const mdrBase = round2(voucher._mdr_base_db || 0)
      const liquidoBase = round2(voucher._liquido_base_db || 0)
      const antecipacaoBase = round2(voucher._antecipacao_base_db || 0)
      const previstoBase = round2(voucher._previsto_base_db || 0)
      const depositadoBase = round2(voucher._depositado_base_db || 0)

      const brutoManualNovo = round2(brutoDesejado - brutoBase)
      const mdrManualNovo = round2(mdrDesejado - mdrBase)
      const liquidoManualNovo = round2(liquidoDesejado - liquidoBase)
      const antecipacaoManualNovo = round2(antecipacaoDesejada - antecipacaoBase)
      const previstoManualNovo = round2(previstoDesejado - previstoBase)
      const depositadoManualNovo = round2(depositadoDesejado - depositadoBase)

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

      let incluirObservacoes = true
      const updatePayload = {
        data_venda: chaveMes,
        modalidade: 'Voucher',
        valor_bruto: brutoManualNovo,
        valor_liquido: liquidoManualNovo,
        despesa_antecipacao: antecipacaoManualNovo,
        valor_previsto: previstoManualNovo,
        valor_depositado: depositadoManualNovo
      }
      updatePayload[mdrColumn] = mdrManualNovo

      const tentarSalvarComColunaData = async (pgtoColumn) => {
        if (Array.isArray(manualRows) && manualRows.length > 0) {
          const target = manualRows[0]
          const duplicateIds = manualRows.slice(1).map(r => r.id).filter(Boolean)

          const payload = { ...updatePayload, [pgtoColumn]: chaveMes }
          if (incluirObservacoes) payload.observacoes = observacoesDesejada
          const { error: errUpdate } = await supabase
            .from(tableName)
            .update(payload)
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
          const insertPayload = {
            adquirente: voucher.nome,
            modalidade: 'Voucher',
            valor_bruto: brutoManualNovo,
            valor_liquido: liquidoManualNovo,
            despesa_antecipacao: antecipacaoManualNovo,
            valor_previsto: previstoManualNovo,
            valor_depositado: depositadoManualNovo,
            empresa: empresaAtual,
            ec: ecAtual,
            data_venda: chaveMes,
            created_at: createdAtMesIso
          }
          if (incluirObservacoes) insertPayload.observacoes = observacoesDesejada
          insertPayload[mdrColumn] = mdrManualNovo
          insertPayload[pgtoColumn] = chaveMes

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

      try {
        await tentarSalvarComColunaData('data_pgto')
      } catch (err) {
        if (isMissingColumnError(err, 'data_pgto')) {
          try {
            await tentarSalvarComColunaData('data_recebimento')
          } catch (errDataRecebimento) {
            if (isMissingColumnError(errDataRecebimento, 'observacoes')) {
              incluirObservacoes = false
              await tentarSalvarComColunaData('data_recebimento')
            } else {
              throw errDataRecebimento
            }
          }
        } else if (isMissingColumnError(err, 'observacoes')) {
          incluirObservacoes = false
          await tentarSalvarComColunaData('data_pgto')
        } else {
          throw err
        }
      }

      voucher.status = 'success'
      setSuccess(`Recebimentos de ${voucher.nome} enviados com sucesso!`)

      voucher._bruto_db = brutoDesejado
      voucher._mdr_db = mdrDesejado
      voucher._liquido_db = liquidoDesejado
      voucher._antecipacao_db = antecipacaoDesejada
      voucher._previsto_db = previstoDesejado
      voucher._depositado_db = depositadoDesejado
      voucher._observacoes_db = observacoesDesejada
      voucher._has_db_values = true
      voucher._bruto_input = formatBRLNumber(voucher.valor_bruto)
      voucher._mdr_input = formatBRLNumber(voucher.despesa_mdr)
      voucher._liquido_input = formatBRLNumber(voucher.valor_liquido)
      voucher._antecipacao_input = formatBRLNumber(voucher.despesa_antecipacao)
      voucher._previsto_input = formatBRLNumber(voucher.valor_previsto)
      voucher._depositado_input = formatBRLNumber(voucher.valor_depositado)
      calcularValores(voucher)
    } catch (e) {
      voucher.status = 'error'
      setError(`Erro ao enviar: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return { enviarRecebimento }
}
