import { getOperadorasParaTabela } from './constants'
import { formatBRLNumber, round2 } from './formatters'
import { normalizarEcNumerico } from './supabaseUtils'
import { resetarVoucher } from './voucherState'

export const criarFetchVendasVoucher = ({ vouchersData, construirNomeTabela, verificarTabelaExiste, buscarDadosTabela, buscarDadosTabelaAlternativo, resolverEmpresaEC, resolverPeriodoTrabalho, setError, calcularValores }) => {
  const fetchVendasVoucher = async (empresa) => {
    const { primeiroDia, ultimoDia, chaveMes } = resolverPeriodoTrabalho()
    const ecAtualRaw = await resolverEmpresaEC()
    const ecAtual = normalizarEcNumerico(ecAtualRaw)
    const filtrosBusca = {
      empresa,
      matriz: ecAtual ?? ecAtualRaw,
      dataInicial: primeiroDia,
      dataFinal: ultimoDia
    }

    const promises = vouchersData.value.map(async (voucher) => {
      try {
        resetarVoucher(voucher)
        const operadoras = getOperadorasParaTabela(voucher.nome)
        let tableName = ''
        let data = []

        for (const operadora of operadoras) {
          const candidato = construirNomeTabela(empresa, operadora)
          const tabelaExiste = await verificarTabelaExiste(candidato)
          if (!tabelaExiste) {
            continue
          }
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
        let brutoManual = 0
        let mdrManual = 0

        data.forEach(venda => {
          const bruto = Number(venda.valor_bruto || 0)
          const mdr = Number((venda?.despesa_mdr ?? venda?.despesa ?? 0) || 0)
          const isManual = venda?.manual_period != null || (venda?.nsu == null && venda?.previsao_pgto == null && String(venda?.data_venda || '') === String(chaveMes))
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
