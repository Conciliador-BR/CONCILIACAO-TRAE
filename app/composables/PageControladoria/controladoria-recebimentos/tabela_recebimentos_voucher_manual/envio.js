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

    setLoading(true)
    voucher.status = 'sending'
    setError(null)
    setSuccess(null)

    try {
      const tableName = getTableName(empresaAtual, voucher)
      const empresaPersistencia = String(empresaAtual || '').trim().toLowerCase()
      const { primeiroDia, ultimoDia, chaveMes } = resolverPeriodoTrabalho()

      const brutoDesejado = round2(voucher.valor_bruto || 0)
      const mdrDesejado = round2(voucher.despesa_mdr || 0)
      const liquidoDesejado = round2(voucher.valor_liquido || 0)
      const antecipacaoDesejada = round2(voucher.despesa_antecipacao || 0)
      const previstoDesejado = round2(voucher.valor_previsto || 0)
      const pgtoBancoDesejado = round2(voucher.pgto_banco || 0)
      const pgtoBancoDetectado = round2(voucher._pgto_banco_detectado || 0)
      const pgtoBancoEfetivo = pgtoBancoDesejado === 0 ? pgtoBancoDetectado : pgtoBancoDesejado
      const observacoesDesejada = String(voucher.observacoes || '').trim()

      const brutoBase = round2(voucher._bruto_base_db || 0)
      const mdrBase = round2(voucher._mdr_base_db || 0)
      const liquidoBase = round2(voucher._liquido_base_db || 0)
      const antecipacaoBase = round2(voucher._antecipacao_base_db || 0)
      const previstoBase = round2(voucher._previsto_base_db || 0)
      const brutoManualNovo = round2(brutoDesejado - brutoBase)
      const mdrManualNovo = round2(mdrDesejado - mdrBase)
      const liquidoManualNovo = round2(liquidoDesejado - liquidoBase)
      const antecipacaoManualNovo = round2(antecipacaoDesejada - antecipacaoBase)
      const previstoManualNovo = round2(previstoDesejado - previstoBase)

      if (Math.abs(mdrDesejado) > Math.abs(brutoDesejado)) {
        throw new Error('Despesas MDR inválida (não pode ser maior que o Valor Bruto em módulo)')
      }

      const createdAtMesIso = new Date(`${chaveMes}T12:00:00`).toISOString()
      const isLinhaTabelaPrevisao = (row) => {
        return String(row?.bandeira || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim()
          .toLowerCase() === 'tabela_previsao'
      }

      let ecColumn = 'matriz'
      let manualRows = null
      let rawRows = null
      let errManualRows = null
      const aplicarFiltrosLinhaManual = (query, colunaEc) => query
        .ilike('empresa', String(empresaAtual))
        .eq(colunaEc, ecAtual)
        .eq('adquirente', voucher.nome)
        .eq('data_venda', chaveMes)
        .is('nsu', null)

      ;({ data: rawRows, error: errManualRows } = await aplicarFiltrosLinhaManual(
        supabase.from(tableName).select('*'),
        ecColumn
      ))

      if (errManualRows && isMissingColumnError(errManualRows, ecColumn)) {
        ecColumn = 'ec'
        ;({ data: rawRows, error: errManualRows } = await aplicarFiltrosLinhaManual(
          supabase.from(tableName).select('*'),
          ecColumn
        ))
      }

      if (errManualRows) {
        if (errManualRows.code === '42P01') {
          throw new Error(`Tabela ${tableName} não existe no banco de dados.`)
        }
        throw errManualRows
      }
      manualRows = Array.isArray(rawRows)
        ? rawRows.filter((row) => !isLinhaTabelaPrevisao(row))
        : []

      const tentarSalvarComColunaData = async (pgtoColumn, mdrCol, incluirObs) => {
        const payload = {
          data_venda: chaveMes,
          modalidade: 'Voucher',
          valor_bruto: brutoManualNovo,
          valor_liquido: liquidoManualNovo,
          despesa_antecipacao: antecipacaoManualNovo,
          valor_previsto: previstoManualNovo,
          valor_depositado: pgtoBancoEfetivo,
          [pgtoColumn]: chaveMes,
          [mdrCol]: mdrManualNovo
        }
        if (incluirObs) payload.observacoes = observacoesDesejada

        if (Array.isArray(manualRows) && manualRows.length > 0) {
          const target = manualRows[0]
          const duplicateIds = manualRows.slice(1).map(r => r.id).filter(Boolean)

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
          payload.adquirente = voucher.nome
          payload.empresa = empresaPersistencia
          payload.created_at = createdAtMesIso
          payload[ecColumn] = ecAtual

          const { error: errInsert } = await supabase
            .from(tableName)
            .insert([payload])

          if (errInsert) {
            if (errInsert.code === '42P01') {
              throw new Error(`Tabela ${tableName} não existe no banco de dados.`)
            }
            throw errInsert
          }
        }
      }

      let currentPgto = 'data_pgto'
      let currentMdr = 'despesa_mdr'
      let currentObs = true
      let saved = false
      let attempts = 0

      while (!saved && attempts < 10) {
        attempts++
        try {
          await tentarSalvarComColunaData(currentPgto, currentMdr, currentObs)
          saved = true
        } catch (err) {
          if (isMissingColumnError(err, 'data_pgto') && currentPgto === 'data_pgto') {
            currentPgto = 'data_recebimento'
          } else if (isMissingColumnError(err, 'despesa_mdr') && currentMdr === 'despesa_mdr') {
            currentMdr = 'despesa'
          } else if (isMissingColumnError(err, 'observacoes') && currentObs === true) {
            currentObs = false
          } else {
            throw err
          }
        }
      }

      voucher.status = 'success'
      setSuccess(`Recebimentos de ${voucher.nome} enviados com sucesso!`)

      voucher._bruto_db = brutoDesejado
      voucher._mdr_db = mdrDesejado
      voucher._liquido_db = liquidoDesejado
      voucher._antecipacao_db = antecipacaoDesejada
      voucher._previsto_db = previstoDesejado
      voucher.pgto_banco = pgtoBancoEfetivo
      voucher._pgto_banco_db = pgtoBancoEfetivo
      voucher._observacoes_db = observacoesDesejada
      voucher._has_db_values = true
      voucher._bruto_input = formatBRLNumber(voucher.valor_bruto)
      voucher._mdr_input = formatBRLNumber(voucher.despesa_mdr)
      voucher._liquido_input = formatBRLNumber(voucher.valor_liquido)
      voucher._antecipacao_input = formatBRLNumber(voucher.despesa_antecipacao)
      voucher._previsto_input = formatBRLNumber(voucher.valor_previsto)
      voucher._pgto_banco_input = formatBRLNumber(pgtoBancoEfetivo)
      calcularValores(voucher)

    } catch (e) {
      voucher.status = 'error'
      const msg = String(e?.message || '')
      if (msg.includes('column "valor_depositado"') || msg.includes(`column 'valor_depositado'`)) {
        setError('Erro ao enviar: tabela nao possui a coluna valor_depositado')
      } else {
        setError(`Erro ao enviar: ${e.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return { enviarRecebimento }
}
