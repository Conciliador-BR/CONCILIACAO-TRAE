import { getOperadorasParaTabela } from './constants'
import { formatBRLNumber, round2 } from './formatters'
import { normalizarEcNumerico } from './supabaseUtils'
import { resetarVoucher } from './voucherState'

export const criarFetchVendasVoucher = ({ vouchersData, construirNomeTabela, buscarDadosTabela, buscarDadosTabelaAlternativo, resolverEmpresaEC, resolverPeriodoTrabalho, resolverOperadorasDisponiveis, verificarTabelaExiste, setError, calcularValores }) => {
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
        const candidatosFallback = [...new Set(
          operadoras
            .map(op => construirNomeTabela(empresa, op))
            .filter(Boolean)
        )]
        const listaCandidatos = [...new Set([...candidatosPreferidos, ...candidatosFallback])]

        for (const candidato of listaCandidatos) {
          const existeNaLista = candidatosPreferidos.includes(candidato)
          const tabelaExiste = existeNaLista || await verificarTabelaExiste?.(candidato)
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
        if (!voucher._table_exists) {
          calcularValores(voucher)
          return
        }

        if (!Array.isArray(data) || data.length === 0) {
          calcularValores(voucher)
          return
        }
        const ecAlvo = ecAtual == null ? '' : String(ecAtual)
        const registroEcCompativel = (row) => {
          if (!ecAlvo) return true
          const ecRegistro = normalizarEcNumerico(
            row?.matriz ??
            row?.ec ??
            row?.estabelecimento ??
            row?.numero_estabelecimento ??
            row?.cod_estabelecimento ??
            null
          )
          if (ecRegistro == null) return true
          return String(ecRegistro) === ecAlvo
        }

        let brutoBase = 0
        let mdrBase = 0
        let extraBase = 0
        let brutoManual = 0
        let mdrManual = 0
        let extraManual = 0
        let pgtoBancoBase = 0
        let pgtoBancoManual = 0
        let observacaoBase = ''
        let observacaoManual = ''

        data.forEach(venda => {
          if (!registroEcCompativel(venda)) return
          const bruto = Number(venda.valor_bruto || 0)
          const mdr = Number((venda?.despesa_mdr ?? venda?.despesa ?? 0) || 0)
          const extra = Number(venda?.despesa_extra || 0)
          const pgtoBanco = Number(venda?.pgto_banco || 0)
          const isManual = venda?.created_at != null || venda?.manual_period != null || (venda?.nsu == null && venda?.previsao_pgto == null && String(venda?.data_venda || '') === String(chaveMes))
          if (isManual) {
            brutoManual += bruto
            mdrManual += mdr
            extraManual += extra
            pgtoBancoManual += pgtoBanco
            if (!observacaoManual && venda?.observacoes) {
              observacaoManual = String(venda.observacoes)
            }
          } else {
            brutoBase += bruto
            mdrBase += mdr
            extraBase += extra
            pgtoBancoBase += pgtoBanco
            if (!observacaoBase && venda?.observacoes) {
              observacaoBase = String(venda.observacoes)
            }
          }
        })

        const brutoTotal = brutoBase + brutoManual
        const mdrTotal = mdrBase + mdrManual
        const extraTotal = extraBase + extraManual
        const pgtoBancoTotal = pgtoBancoBase + pgtoBancoManual

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
        voucher.pgto_banco = round2(pgtoBancoTotal)
        voucher._pgto_banco_db = round2(pgtoBancoTotal)
        voucher._pgto_banco_input = formatBRLNumber(pgtoBancoTotal)
        voucher.observacoes = observacaoManual || observacaoBase || ''
        voucher._observacoes_db = voucher.observacoes
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
