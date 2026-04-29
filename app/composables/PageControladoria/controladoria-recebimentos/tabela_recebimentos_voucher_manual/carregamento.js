import { getOperadorasParaTabela } from './constants'
import { formatBRLNumber, round2 } from './formatters'
import { normalizarEcNumerico } from './supabaseUtils'
import { resetarVoucher } from './voucherState'

export const criarFetchRecebimentosVoucher = ({ vouchersData, construirNomeTabela, buscarDadosTabela, buscarDadosTabelaAlternativo, resolverEmpresaEC, resolverPeriodoTrabalho, resolverOperadorasDisponiveis, setError, calcularValores }) => {
  const fetchRecebimentosVoucher = async (empresa) => {
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
        const parseNumero = (valor) => {
          if (valor === null || valor === undefined || valor === '') return 0
          if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0
          let s = String(valor).trim()
          if (!s) return 0
          s = s.replace(/\s+/g, '').replace(/R\$/gi, '')
          if (s.includes(',') && s.includes('.')) {
            s = s.replace(/\./g, '').replace(',', '.')
          } else if (s.includes(',')) {
            s = s.replace(',', '.')
          }
          s = s.replace(/[^0-9.-]/g, '')
          const n = Number(s)
          return Number.isFinite(n) ? n : 0
        }
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

        if (!voucher._table_exists || !Array.isArray(data) || data.length === 0) {
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
        let liquidoBase = 0
        let antecipacaoBase = 0
        let previstoBase = 0
        let depositadoBase = 0
        let brutoManual = 0
        let mdrManual = 0
        let liquidoManual = 0
        let antecipacaoManual = 0
        let previstoManual = 0
        let depositadoManual = 0
        let observacaoBase = ''
        let observacaoManual = ''
        const obterValorDepositado = (row) => {
          return parseNumero(
            row?.valor_depositado ??
            row?.valor_pago ??
            row?.valor_recebido ??
            row?.valor_liquido_antecipacao ??
            row?.valor_liquido ??
            row?.valor ??
            0
          )
        }

        data.forEach((row) => {
          if (!registroEcCompativel(row)) return
          const bruto = parseNumero(row?.valor_bruto ?? 0)
          const mdr = parseNumero(row?.despesa_mdr ?? row?.despesa ?? 0)
          const liquido = parseNumero(row?.valor_liquido ?? (bruto - mdr))
          const antecipacao = parseNumero(row?.despesa_antecipacao ?? 0)
          const previsto = parseNumero(row?.valor_previsto ?? 0)
          const depositado = obterValorDepositado(row)
          const isManual = row?.created_at != null
            || row?.manual_period != null
            || (row?.nsu == null && String(row?.data_venda || '') === String(chaveMes))

          if (isManual) {
            brutoManual += bruto
            mdrManual += mdr
            liquidoManual += liquido
            antecipacaoManual += antecipacao
            previstoManual += previsto
            depositadoManual += depositado
            if (!observacaoManual && row?.observacoes) {
              observacaoManual = String(row.observacoes)
            }
          } else {
            brutoBase += bruto
            mdrBase += mdr
            liquidoBase += liquido
            antecipacaoBase += antecipacao
            previstoBase += previsto
            depositadoBase += depositado
            if (!observacaoBase && row?.observacoes) {
              observacaoBase = String(row.observacoes)
            }
          }
        })

        const brutoTotal = brutoBase + brutoManual
        const mdrTotal = mdrBase + mdrManual
        const liquidoTotal = liquidoBase + liquidoManual
        const antecipacaoTotal = antecipacaoBase + antecipacaoManual
        const previstoTotal = previstoBase + previstoManual
        const depositadoTotal = depositadoBase + depositadoManual

        voucher._bruto_base_db = round2(brutoBase)
        voucher._mdr_base_db = round2(mdrBase)
        voucher._liquido_base_db = round2(liquidoBase)
        voucher._antecipacao_base_db = round2(antecipacaoBase)
        voucher._previsto_base_db = round2(previstoBase)
        voucher._depositado_base_db = round2(depositadoBase)

        voucher.valor_bruto = round2(brutoTotal)
        voucher._bruto_db = round2(brutoTotal)
        voucher._bruto_input = formatBRLNumber(brutoTotal)

        voucher._has_db_values = true

        voucher.despesa_mdr = round2(mdrTotal)
        voucher._mdr_db = round2(mdrTotal)
        voucher._mdr_input = formatBRLNumber(mdrTotal)

        voucher.valor_liquido = round2(liquidoTotal)
        voucher._liquido_db = round2(liquidoTotal)
        voucher._liquido_input = formatBRLNumber(liquidoTotal)

        voucher.despesa_antecipacao = round2(antecipacaoTotal)
        voucher._antecipacao_db = round2(antecipacaoTotal)
        voucher._antecipacao_input = formatBRLNumber(antecipacaoTotal)

        voucher.valor_previsto = round2(previstoTotal)
        voucher._previsto_db = round2(previstoTotal)
        voucher._previsto_input = formatBRLNumber(previstoTotal)

        voucher.valor_depositado = round2(depositadoTotal)
        voucher._depositado_db = round2(depositadoTotal)
        voucher._depositado_input = formatBRLNumber(depositadoTotal)
        voucher.observacoes = observacaoManual || observacaoBase || ''
        voucher._observacoes_db = voucher.observacoes
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
