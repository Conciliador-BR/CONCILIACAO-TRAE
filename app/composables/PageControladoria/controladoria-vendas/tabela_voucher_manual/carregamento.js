import { getOperadorasParaTabela } from './constants'
import { formatBRLNumber, round2 } from './formatters'
import { normalizarEcNumerico } from './supabaseUtils'
import { resetarVoucher } from './voucherState'

export const criarFetchVendasVoucher = ({ vouchersData, construirNomeTabela, buscarDadosTabela, buscarDadosTabelaAlternativo, resolverEmpresaEC, resolverPeriodoTrabalho, resolverOperadorasDisponiveis, setError, calcularValores }) => {
  const fetchVendasVoucher = async (empresa) => {
    const { primeiroDia, ultimoDia, chaveMes } = resolverPeriodoTrabalho()
    const ecAtualRaw = await resolverEmpresaEC()
    const ecAtual = normalizarEcNumerico(ecAtualRaw)
    const operadorasDisponiveisRaw = await resolverOperadorasDisponiveis?.(empresa)
    const operadorasDisponiveis = Array.isArray(operadorasDisponiveisRaw)
      ? operadorasDisponiveisRaw
      : []
    const normalizarOperadora = (valor) => String(valor || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
    const filtrosBusca = {
      empresa,
      matriz: ecAtual ?? ecAtualRaw,
      dataInicial: primeiroDia,
      dataFinal: ultimoDia
    }

    const tabelasExistentesPorOperadora = new Map()
    const operadorasUnicas = [...new Set((operadorasDisponiveis || []).map(op => String(op || '').trim()).filter(Boolean))]
    for (const operadora of operadorasUnicas) {
      const candidato = construirNomeTabela(empresa, operadora)
      tabelasExistentesPorOperadora.set(normalizarOperadora(operadora), candidato)
    }

    const promises = vouchersData.value.map(async (voucher) => {
      try {
        resetarVoucher(voucher)
        const operadoras = getOperadorasParaTabela(voucher.nome)
        let tableName = ''
        let data = []

        const candidatosPreferidos = [...new Set(
          operadoras
            .map(op => tabelasExistentesPorOperadora.get(normalizarOperadora(op)))
            .filter(Boolean)
        )]
        const listaCandidatos = candidatosPreferidos

        for (const candidato of listaCandidatos) {
          const dadosTabela = await buscarDadosTabela(candidato, filtrosBusca)
          const dadosAlternativos = dadosTabela.length === 0
            ? await buscarDadosTabelaAlternativo(candidato, filtrosBusca)
            : []
          tableName = candidato
          data = dadosTabela.length > 0 ? dadosTabela : dadosAlternativos
          break
        }

        voucher._table_name = tableName
        voucher._table_exists = Boolean(tableName)
        if (!voucher._table_exists) {
          calcularValores(voucher)
          return
        }

        if (!Array.isArray(data) || data.length === 0) {
          calcularValores(voucher)
          return
        }

        let brutoBase = 0
        let mdrBase = 0
        let extraBase = 0
        let brutoManual = 0
        let mdrManual = 0
        let extraManual = 0

        data.forEach(venda => {
          const bruto = Number(venda.valor_bruto || 0)
          const mdr = Number((venda?.despesa_mdr ?? venda?.despesa ?? 0) || 0)
          const extra = Number(venda?.despesa_extra || 0)
          const isManual = venda?.created_at != null || venda?.manual_period != null || (venda?.nsu == null && venda?.previsao_pgto == null && String(venda?.data_venda || '') === String(chaveMes))
          if (isManual) {
            brutoManual += bruto
            mdrManual += mdr
            extraManual += extra
          } else {
            brutoBase += bruto
            mdrBase += mdr
            extraBase += extra
          }
        })

        const brutoTotal = brutoBase + brutoManual
        const mdrTotal = mdrBase + mdrManual
        const extraTotal = extraBase + extraManual

        voucher._bruto_base_db = round2(brutoBase)
        voucher._mdr_base_db = round2(mdrBase)
        voucher._extra_base_db = round2(extraBase)
        voucher.voucher = round2(brutoTotal)
        voucher._bruto_db = round2(brutoTotal)
        voucher._voucher_input = formatBRLNumber(brutoTotal)
        voucher._has_db_values = true
        voucher._mdr_db = round2(mdrTotal)
        voucher._extra_db = round2(extraTotal)
        voucher._liquido_db = round2(brutoTotal - mdrTotal)
        voucher.despesa_mdr = round2(mdrTotal)
        voucher._mdr_input = formatBRLNumber(mdrTotal)
        voucher._mdr_manual = true
        voucher.despesa_extra = round2(extraTotal)
        voucher._extra_input = formatBRLNumber(extraTotal)
        voucher._extra_manual = true
        calcularValores(voucher)
      } catch (e) {
        setError('Erro ao carregar vendas de vouchers')
        calcularValores(voucher)
      }
    })

    await Promise.all(promises)
  }

  return { fetchVendasVoucher }
}
