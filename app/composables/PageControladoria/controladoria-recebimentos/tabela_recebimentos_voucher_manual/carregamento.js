import { getOperadorasParaTabela } from './constants'
import { formatBRLNumber, round2 } from './formatters'
import { normalizarEcNumerico } from './supabaseUtils'
import { resetarVoucher } from './voucherState'

export const criarFetchRecebimentosVoucher = ({ vouchersData, construirNomeTabela, verificarTabelaExiste, buscarDadosTabela, buscarDadosTabelaAlternativo, resolverEmpresaEC, resolverPeriodoTrabalho, setError, calcularValores }) => {
  const fetchRecebimentosVoucher = async (empresa) => {
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
          if (!tabelaExiste) continue

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

        if (!voucher._table_exists || !Array.isArray(data) || data.length === 0) {
          calcularValores(voucher)
          return
        }

        let brutoBase = 0
        let mdrBase = 0
        let extraBase = 0
        let brutoManual = 0
        let mdrManual = 0
        let extraManual = 0

        data.forEach((row) => {
          const bruto = Number(row.valor_bruto || 0)
          const mdr = Number((row?.despesa_mdr ?? row?.despesa ?? 0) || 0)
          const extra = Number(row?.despesa_extra || 0)
          const isManual = row?.created_at != null
            || row?.manual_period != null
            || (row?.nsu == null && String(row?.data_venda || '') === String(chaveMes))

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

        voucher.valor_bruto = round2(brutoTotal)
        voucher._bruto_db = round2(brutoTotal)
        voucher._bruto_input = formatBRLNumber(brutoTotal)

        voucher._has_db_values = true

        voucher.despesa_mdr = round2(mdrTotal)
        voucher._mdr_db = round2(mdrTotal)
        voucher._mdr_input = formatBRLNumber(mdrTotal)

        voucher.despesa_extra = round2(extraTotal)
        voucher._extra_db = round2(extraTotal)
        voucher._extra_input = formatBRLNumber(extraTotal)

        voucher._liquido_db = round2(brutoTotal - mdrTotal - extraTotal)
        calcularValores(voucher)
      } catch {
        setError('Erro ao carregar recebimentos de vouchers')
        calcularValores(voucher)
      }
    })

    await Promise.all(promises)
  }

  return { fetchRecebimentosVoucher }
}

