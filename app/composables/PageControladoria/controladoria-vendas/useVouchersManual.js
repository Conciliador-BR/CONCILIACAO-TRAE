import { ref } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import { useTableNameBuilder } from '~/composables/PageVendas/filtrar_tabelas/useTableNameBuilder'
import { useEmpresaHelpers } from '~/composables/PageVendas/filtrar_tabelas/useEmpresaHelpers'
import { useGlobalFilters } from '~/composables/useGlobalFilters'

export const useVouchersManual = (filtroAtivoRef) => {
  const vouchersData = ref([])
  const loading = ref(false)
  const error = ref(null)
  const successMessage = ref(null)
  const { construirNomeTabela } = useTableNameBuilder()
  const { obterEmpresaSelecionadaCompleta } = useEmpresaHelpers()
  const { filtrosGlobais } = useGlobalFilters()

  const resolverEmpresaNome = async () => {
    const nomeViaFiltroAtivo = filtroAtivoRef?.value?.empresa
    if (nomeViaFiltroAtivo) return nomeViaFiltroAtivo

    const empresaCompleta = await obterEmpresaSelecionadaCompleta()
    return empresaCompleta?.nome || ''
  }

  const resolverEmpresaEC = async () => {
    const ecViaFiltroAtivo = filtroAtivoRef?.value?.matriz
    if (ecViaFiltroAtivo) return ecViaFiltroAtivo

    const empresaCompleta = await obterEmpresaSelecionadaCompleta()
    return empresaCompleta?.matriz || ''
  }

  const resolverPeriodoTrabalho = () => {
    const filtro = filtroAtivoRef?.value
    let primeiroDia, ultimoDia

    if (filtro && filtro.dataInicial && filtro.dataFinal) {
      primeiroDia = filtro.dataInicial
      ultimoDia = filtro.dataFinal
    } else if (filtrosGlobais.dataInicial && filtrosGlobais.dataFinal) {
      primeiroDia = filtrosGlobais.dataInicial
      ultimoDia = filtrosGlobais.dataFinal
    } else {
      const hoje = new Date()
      primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
      ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]
    }

    const chaveMes = `${primeiroDia}`
    return { primeiroDia, ultimoDia, chaveMes }
  }

  const isMissingColumnError = (err, columnName) => {
    const msg = String(err?.message || '')
    return msg.includes(`column "${columnName}"`) || msg.includes(`column '${columnName}'`)
  }

  const normalizarEcNumerico = (value) => {
    if (value == null) return null
    const digits = String(value).replace(/\D/g, '')
    if (!digits) return null
    const n = Number(digits)
    return Number.isFinite(n) ? n : null
  }

  // Lista fixa de vouchers
  const VOUCHERS_FIXOS = [
    'ALELO', 
    'TICKET', 
    'VR', 
    'SODEXO', 
    'PLUXE', 
    'COMPROCARD', 
    'LE CARD', 
    'UP BRASIL', 
    'ECX CARD', 
    'FN CARD', 
    'BEN VISA', 
    'CREDSHOP', 
    'RC CARD', 
    'GOOD CARD', 
    'BIG CARD', 
    'BK CARD', 
    'GREEN CARD', 
    'BRASILCARD', 
    'BOLT CARD', 
    'CABAL', 
    'VEROCARD', 
    'FACECARD', 
    'VALE CARD', 
    'NAIP'
  ]

  // Estado dos vouchers na tabela
  vouchersData.value = VOUCHERS_FIXOS.map(nome => ({
    nome,
    debito: 0,
    credito: 0,
    credito2x: 0,
    credito3x: 0,
    credito4x6x: 0,
    voucher: 0,
    _voucher_input: '0,00',
    _editing_voucher: false,
    taxa: 0,
    despesa_mdr: 0,
    valor_bruto: 0,
    valor_liquido: 0,
    _bruto_base_db: 0,
    _mdr_base_db: 0,
    _bruto_db: 0,
    _has_db_values: false,
    _mdr_db: 0,
    _liquido_db: 0,
    _delta_bruto: 0,
    _delta_mdr: 0,
    _mdr_input: '0,00',
    _editing_mdr: false,
    _mdr_manual: false,
    status: 'pending' 
  }))

  const round2 = (value) => {
    const n = Number(value || 0)
    if (!Number.isFinite(n)) return 0
    return Math.round((n + Number.EPSILON) * 100) / 100
  }

  const formatBRLNumber = (value) => {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(round2(value))
  }

  // Buscar taxas cadastradas para a empresa atual
  const fetchTaxas = async () => {
    // Acessa o valor da ref passada
    const empresaAtual = await resolverEmpresaNome()
    if (!empresaAtual) return

    try {
      const { data, error: err } = await supabase
        .from('cadastro_taxas')
        .select('*')
        .eq('empresa', empresaAtual)

      if (err) throw err

      // Carregar vendas existentes
      await fetchVendasVoucher(empresaAtual)

      vouchersData.value.forEach(voucher => {
        // Encontrar taxa baseada no nome do voucher (simplificado para taxa única por enquanto)
        // Idealmente, precisaríamos de taxas diferentes por modalidade se houver
        const taxaEncontrada = data.find(t => {
            const vUpper = voucher.nome.toUpperCase()
            const vouchersDb = (t.vouchers || '').toUpperCase()
            const bandeiraDb = (t.bandeira || '').toUpperCase()
            const adquirenteDb = (t.adquirente || '').toUpperCase()
            
            return vouchersDb.includes(vUpper) || 
                   bandeiraDb.includes(vUpper) || 
                   adquirenteDb.includes(vUpper)
        })

        if (taxaEncontrada) {
            voucher.taxa = Number(taxaEncontrada.taxa || taxaEncontrada.percentualTaxa || 0)
        } else {
            voucher.taxa = 0
        }
        
        calcularValores(voucher)
      })

    } catch (e) {
      console.error('Erro ao buscar taxas:', e)
      error.value = 'Erro ao carregar taxas'
    }
  }

  const fetchVendasVoucher = async (empresa) => {
    const { primeiroDia, ultimoDia, chaveMes } = resolverPeriodoTrabalho()
    
    // Iterar sobre cada voucher para buscar suas tabelas
    const promises = vouchersData.value.map(async (voucher) => {
        const tableName = getTableName(empresa, voucher.nome)
        try {
            let data
            let error
            let mdrField = 'despesa_mdr'

            ;({ data, error } = await supabase
              .from(tableName)
              .select('id, data_venda, valor_bruto, valor_liquido, despesa_mdr, nsu, previsao_pgto, manual_period, created_at')
              .gte('data_venda', primeiroDia)
              .lte('data_venda', ultimoDia)
            )

            if (error && isMissingColumnError(error, 'despesa_mdr')) {
              mdrField = 'despesa'
              ;({ data, error } = await supabase
                .from(tableName)
                .select('id, data_venda, valor_bruto, valor_liquido, despesa, nsu, previsao_pgto, manual_period, created_at')
                .gte('data_venda', primeiroDia)
                .lte('data_venda', ultimoDia)
              )
            }

            if (error && isMissingColumnError(error, 'manual_period')) {
              ;({ data, error } = await supabase
                .from(tableName)
                .select(`id, valor_bruto, valor_liquido, ${mdrField}, nsu, previsao_pgto`)
                .gte('data_venda', primeiroDia)
                .lte('data_venda', ultimoDia)
              )
            }
            
            if (error) {
                if (error.code === '42P01') return
                throw error
            }

            voucher.debito = 0
            voucher.credito = 0
            voucher.credito2x = 0
            voucher.credito3x = 0
            voucher.credito4x6x = 0
            voucher.voucher = 0
            voucher._voucher_input = '0,00'
            voucher._bruto_base_db = 0
            voucher._mdr_base_db = 0
            voucher._bruto_db = 0
            voucher._has_db_values = false
            voucher._mdr_db = 0
            voucher._liquido_db = 0
            voucher._delta_mdr = 0
            voucher._mdr_input = '0,00'
            voucher._mdr_manual = false

            if (data && data.length > 0) {
              let brutoBase = 0
              let mdrBase = 0
              let brutoManual = 0
              let mdrManual = 0

              data.forEach(venda => {
                const bruto = Number(venda.valor_bruto || 0)
                const mdr = Number((venda?.despesa_mdr ?? venda?.despesa) || 0)
                const isManual = venda?.created_at != null || venda?.manual_period != null || (venda?.created_at == null && venda?.manual_period == null && venda?.nsu == null && venda?.previsao_pgto == null && String(venda?.data_venda || '') === String(chaveMes))
                if (isManual) {
                  brutoManual += bruto
                  mdrManual += mdr
                } else {
                  brutoBase += bruto
                  mdrBase += mdr
                }
              })

              const brutoTotal = brutoBase + brutoManual
              const mdrTotal = mdrBase + mdrManual

              voucher._bruto_base_db = round2(brutoBase)
              voucher._mdr_base_db = round2(mdrBase)
              voucher.voucher = round2(brutoTotal)
              voucher._bruto_db = round2(brutoTotal)
              voucher._voucher_input = formatBRLNumber(brutoTotal)
              voucher._has_db_values = true
              voucher._mdr_db = round2(mdrTotal)
              voucher._liquido_db = round2(brutoTotal - mdrTotal)
              voucher.despesa_mdr = round2(mdrTotal)
              voucher._mdr_input = formatBRLNumber(mdrTotal)
              voucher._mdr_manual = true
            }
            
            calcularValores(voucher)
            
        } catch (e) {
        }
    })

    await Promise.all(promises)
  }

  const calcularValores = (voucher) => {
    const debito = Number(voucher.debito || 0)
    const credito = Number(voucher.credito || 0)
    const credito2x = Number(voucher.credito2x || 0)
    const credito3x = Number(voucher.credito3x || 0)
    const credito4x6x = Number(voucher.credito4x6x || 0)
    const valorVoucher = Number(voucher.voucher || 0)

    const bruto = round2(debito + credito + credito2x + credito3x + credito4x6x + valorVoucher)
    voucher.valor_bruto = bruto
    voucher._delta_bruto = round2(bruto - Number(voucher._bruto_db || 0))

    if (!voucher._mdr_manual) {
      const taxa = Number(voucher.taxa || 0)
      voucher.despesa_mdr = round2(bruto * (taxa / 100))
    } else {
      voucher.despesa_mdr = round2(voucher.despesa_mdr || 0)
    }

    voucher.valor_liquido = round2(bruto - Number(voucher.despesa_mdr || 0))
    voucher._delta_mdr = round2(Number(voucher.despesa_mdr || 0) - Number(voucher._mdr_db || 0))

    if (!voucher._editing_voucher) {
      voucher._voucher_input = formatBRLNumber(voucher.voucher)
    }
    if (!voucher._editing_mdr) {
      voucher._mdr_input = formatBRLNumber(voucher.despesa_mdr)
    }
  }

  const getTableName = (empresa, voucher) => {
    return construirNomeTabela(empresa, voucher)
  }

  const enviarVenda = async (voucher) => {
    const empresaAtual = await resolverEmpresaNome()
    if (!empresaAtual) {
        error.value = 'Selecione uma empresa primeiro'
        return
    }

    const ecAtualRaw = await resolverEmpresaEC()
    const ecAtual = normalizarEcNumerico(ecAtualRaw)
    if (ecAtual == null) {
      error.value = 'EC inválido para envio (verifique a empresa selecionada)'
      return
    }

    if (voucher.valor_bruto <= 0) {
        error.value = `Valor inválido para ${voucher.nome}`
        return
    }

    loading.value = true
    voucher.status = 'sending'
    error.value = null
    successMessage.value = null

    try {
        const tableName = getTableName(empresaAtual, voucher.nome)
        const { primeiroDia, ultimoDia, chaveMes } = resolverPeriodoTrabalho()

        const brutoDesejado = round2(voucher.valor_bruto || 0)
        const mdrDesejado = round2(voucher.despesa_mdr || 0)

        const brutoBase = round2(voucher._bruto_base_db || 0)
        const mdrBase = round2(voucher._mdr_base_db || 0)

        const brutoManualNovo = round2(brutoDesejado - brutoBase)
        const mdrManualNovo = round2(mdrDesejado - mdrBase)

        if (brutoManualNovo < 0 || mdrManualNovo < 0) {
          throw new Error('O total não pode ser menor que o valor base do mês')
        }
        if (mdrManualNovo > brutoManualNovo) {
          throw new Error('O ajuste de Despesas MDR não pode ser maior que o ajuste do Valor Bruto')
        }

        if (mdrDesejado < 0 || mdrDesejado > brutoDesejado) {
          throw new Error('Despesas MDR inválida (deve ser entre 0 e o Valor Bruto)')
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
        successMessage.value = `Vendas de ${voucher.nome} enviadas com sucesso!`

        voucher._bruto_db = brutoDesejado
        voucher._mdr_db = mdrDesejado
        voucher._liquido_db = round2(brutoDesejado - mdrDesejado)
        voucher._has_db_values = true
        voucher._voucher_input = formatBRLNumber(voucher.voucher)
        voucher._mdr_input = formatBRLNumber(voucher.despesa_mdr)
        calcularValores(voucher)

    } catch (e) {
        console.error(`Erro ao enviar ${voucher.nome}:`, e)
        voucher.status = 'error'
        error.value = `Erro ao enviar: ${e.message}`
    } finally {
        loading.value = false
    }
  }

  return {
    vouchersData,
    loading,
    error,
    successMessage,
    fetchTaxas,
    calcularValores,
    enviarVenda
  }
}
