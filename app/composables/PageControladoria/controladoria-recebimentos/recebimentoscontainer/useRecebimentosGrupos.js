import { computed } from 'vue'
import {
  BANDEIRAS_VOUCHER_CARTAO,
  ORDEM_BANDEIRAS,
  detectarBandeiraCabal,
  detectarBandeiraRede,
  detectarBandeiraTribanco,
  detectarBandeiraUnica,
  mapearAdquirenteParaGrupo,
  normalizarBandeiraParaConferencia,
  normalizarChaveAdquirente,
  normalizarGrupoAdquirente,
  parseValorExtrato,
  resolverBandeiraRede,
  resolverLinhaBandeira
} from './recebimentosUtils'

export const useRecebimentosGrupos = ({
  recebimentos,
  transacoes,
  classificarBandeira,
  determinarModalidade,
  normalizeString
}) => {
  const depositosMap = computed(() => {
    const map = {}

    if (!transacoes.value) return map

    transacoes.value.forEach((t) => {
      const valor = parseValorExtrato(t)
      if (!valor || valor <= 0) return

      const bancoStr = String(t.banco || '')
      const descricaoUpper = String(t.descricao || '').toUpperCase()
      const descricaoNorm = normalizarChaveAdquirente(t.descricao || '')
      const bancoNormalizado = normalizarChaveAdquirente(bancoStr)
      const isCieloSicoob = bancoNormalizado.includes('SICOOB') && /\bCIELO\b/.test(descricaoNorm)
      const baseDetectado = t?.adquirente_detectado ? String(t.adquirente_detectado) : ''
      const categoriaDetectada = t?.categoria_detectada ? String(t.categoria_detectada) : ''
      let base = baseDetectado
      let categoria = categoriaDetectada || ''

      const detectarBandeiraCieloSicoob = () => {
        const ehDebito = /\b(DEB|DEBITO|DBTO)\b/.test(descricaoNorm)
        const ehCredito = /\b(CREDITO|CRED|CRTO)\b/.test(descricaoNorm)
        const pat = descricaoNorm.match(/\b(VISA|MASTERCARD|MASTER|ELO|MAESTRO)\s+PAT\b|\bPAT\s+(VISA|MASTERCARD|MASTER|ELO|MAESTRO)\b/)
        if (pat) {
          const b = (pat[1] || pat[2] || '').trim()
          if (b === 'MASTER') return 'MASTERCARD PAT'
          return `${b} PAT`
        }

        if (ehDebito && /\bVISA\b/.test(descricaoNorm)) return 'VISA ELECTRON'
        if (ehDebito && /\b(MAESTRO|MASTER|MASTERCARD)\b/.test(descricaoNorm)) return 'MAESTRO'
        if (ehDebito && /\bELO\b/.test(descricaoNorm)) return 'ELO DÉBITO'

        if (ehCredito && /\bVISA\b/.test(descricaoNorm)) return 'VISA'
        if (ehCredito && /\b(MASTER|MASTERCARD)\b/.test(descricaoNorm)) return 'MASTERCARD'
        if (ehCredito && /\bELO\b/.test(descricaoNorm)) return 'ELO CRÉDITO'

        if (/\bVISA\b/.test(descricaoNorm)) return 'VISA'
        if (/\b(MASTER|MASTERCARD)\b/.test(descricaoNorm)) return 'MASTERCARD'
        if (/\bMAESTRO\b/.test(descricaoNorm)) return 'MAESTRO'
        if (/\bELO\b/.test(descricaoNorm)) return 'ELO CRÉDITO'
        return 'CIELO'
      }

      if (!base) {
        if (descricaoUpper.includes('BANCO VR')) {
          base = 'VR BENEFICIOS'
          categoria = 'Voucher'
        } else if (descricaoUpper.includes('LE CARD ADM')) {
          base = 'LE CARD ADMINISTRADORA'
          categoria = 'Voucher'
        } else if (
          descricaoUpper.includes('CRTO CABAL SICOOB SO') ||
          descricaoUpper.includes('CABAL CABA')
        ) {
          base = 'CABAL PRE'
          categoria = 'Voucher'
        } else if (isCieloSicoob) {
          base = 'CIELO'
          categoria = 'Cartão'
        }
      }
      if (!base) return
      if (/\bBOLETO\s*PAGO\b.*\bREDE\b/.test(descricaoUpper)) return

      const isTribanco = bancoNormalizado.includes('TRIBANCO')
      const isBancoDoBrasil = bancoNormalizado.includes('BANCO DO BRASIL') || bancoNormalizado === 'BRASIL'
      const isTribancoStone = isTribanco && /\bSTONE\b/.test(descricaoUpper)

      const baseNormalizado = normalizarChaveAdquirente(base)
      const isCabalRede = baseNormalizado === 'CABAL CREDITO' || baseNormalizado === 'CABAL DEBITO'
      const hasPagSeguro = /PAGSEG(?:URO)?/.test(descricaoUpper) || /TED\s*290(?:[.,]0+)?\s*PAGSEG(?:URO)?\s*IN\w*/.test(descricaoUpper)
      const isPagSeguroBandeira = hasPagSeguro && ['ELO CREDITO', 'ELO DEBITO', 'MASTERCARD', 'MAESTRO', 'VISA', 'VISA ELECTRON', 'AMEX', 'HIPERCARD', 'PIX'].includes(baseNormalizado)

      const isUnicaBancoDoBrasil = isBancoDoBrasil && (
        baseNormalizado.includes('TRIANGULO') ||
        baseNormalizado.includes('UNICA') ||
        baseNormalizado.includes('TRIPAG')
      )

      const grupoRaw = isCieloSicoob
        ? 'CIELO'
        : (isTribanco
        ? (isTribancoStone ? 'STONE' : 'UNICA')
        : (isUnicaBancoDoBrasil
          ? 'UNICA'
          : (isCabalRede ? 'REDE' : (isPagSeguroBandeira ? 'PAGSEGURO' : (categoria === 'Voucher' ? mapearAdquirenteParaGrupo(base) : String(base))))))
      const grupo = normalizarGrupoAdquirente(grupoRaw)
      const bandeira = isCieloSicoob
        ? detectarBandeiraCieloSicoob()
        : (isTribanco
        ? detectarBandeiraTribanco(t.descricao, String(base))
        : (isCabalRede || isPagSeguroBandeira
          ? String(base)
          : (grupo === 'CABAL'
            ? detectarBandeiraCabal(t.descricao)
            : (grupo === 'REDE'
              ? detectarBandeiraRede(t.descricao)
              : (grupo === 'UNICA' && isBancoDoBrasil ? detectarBandeiraUnica(t.descricao, String(base)) : grupo)))))

      if (!map[grupo]) map[grupo] = { total: 0, bandeiras: {} }
      map[grupo].total += valor

      if (!map[grupo].bandeiras[bandeira]) map[grupo].bandeiras[bandeira] = 0
      map[grupo].bandeiras[bandeira] += valor
    })

    return map
  })

  const gruposPorAdquirente = computed(() => {
    const grupos = {}
    ;(recebimentos.value || []).forEach((r) => {
      const adquirenteKey = normalizarGrupoAdquirente(r.adquirente || 'ALUGUEIS')
      if (!grupos[adquirenteKey]) {
        grupos[adquirenteKey] = {
          adquirente: adquirenteKey,
          linhas: {},
          totais: {
            debito: 0,
            credito: 0,
            voucher: 0,
            credito2x: 0,
            credito3x: 0,
            credito4x5x6x: 0,
            despesaMdr: 0,
            despesaAntecipacao: 0,
            vendaBruta: 0,
            vendaLiquida: 0,
            valorPago: 0,
            valorDepositado: 0
          }
        }
      }

      const grupo = grupos[adquirenteKey]
      const modalidadeTextoNorm = normalizeString(r.modalidade || '')
      const modalidadeOriginal = determinarModalidade(r.modalidade || '', r.numeroParcelas || 1)
      const nomeClassificado = classificarBandeira(r.bandeira || r.adquirente || '', r.modalidade || '')
      const isAluguelModalidade = modalidadeTextoNorm.includes('aluguel') && (
        modalidadeTextoNorm.includes('maquin') ||
        modalidadeTextoNorm.includes('terminal') ||
        modalidadeTextoNorm.includes('pos')
      )
      const isRedeGrupo = adquirenteKey === 'REDE'
      const modalidadePagamento = (
        isRedeGrupo && modalidadeTextoNorm.includes('antecip')
      )
        ? 'antecipacao'
        : (
          (isRedeGrupo && ['credito2x', 'credito3x', 'credito4x5x6x'].includes(modalidadeOriginal))
            ? 'credito'
            : modalidadeOriginal
        )

      const keyBaseOriginal = isAluguelModalidade
        ? 'ALUGUEIS'
        : (nomeClassificado === 'OUTROS' ? 'ALUGUEIS' : (nomeClassificado || 'ALUGUEIS'))
      const keyBase = isRedeGrupo
        ? resolverBandeiraRede(normalizeString, r.bandeira || r.adquirente || '', r.modalidade || '', keyBaseOriginal)
        : keyBaseOriginal
      const key = resolverLinhaBandeira(keyBase, modalidadePagamento)
      if (!grupo.linhas[key]) {
        grupo.linhas[key] = {
          adquirente: key,
          debito: 0,
          credito: 0,
          voucher: 0,
          credito2x: 0,
          credito3x: 0,
          credito4x5x6x: 0,
          despesa_mdr_total: 0,
          despesa_antecipacao_total: 0,
          valor_bruto_total: 0,
          valor_liquido_total: 0,
          valor_pago_total: 0,
          valor_depositado: 0,
          observacoes: '',
          _sourceRows: []
        }
      }

      const liquidoBase = (r.valorLiquido ?? r.valorRecebido)
      const liquido = parseFloat(liquidoBase) || 0
      const bruto = parseFloat(r.valorBruto) || 0
      const modalidadeNorm = modalidadeTextoNorm
      const bandeiraNorm = normalizeString(r.bandeira || '')
      const despesaMdr = parseFloat(r.despesaMdr) || 0
      const despesaExtra = parseFloat(r.despesaExtra) || 0
      const despesaAntRaw = parseFloat(r.despesaAntecipacao) || 0
      const sinalizaAntecipacaoRede = isRedeGrupo && modalidadeNorm.includes('antecip')
      const despesaAntFallbackRede = sinalizaAntecipacaoRede ? Math.abs(despesaMdr + despesaExtra) : 0
      const despesaAnt = Math.abs(despesaAntRaw || despesaAntFallbackRede)
      const valorPago = liquido - despesaAnt
      const textoCategoria = `${modalidadeNorm} ${bandeiraNorm}`.trim()
      const isAluguelMaquina = textoCategoria.includes('aluguel') && (
        textoCategoria.includes('maquin') ||
        textoCategoria.includes('terminal') ||
        textoCategoria.includes('pos')
      )
      const despesa = isAluguelMaquina ? despesaMdr : (despesaMdr + despesaExtra)
      const despesaMdrConsiderada = sinalizaAntecipacaoRede ? 0 : despesa
      const valorPrevisto = isAluguelMaquina
        ? -(Math.abs(despesa) || Math.abs(valorPago))
        : valorPago

      const linha = grupo.linhas[key]
      if (r.observacoes && !linha.observacoes) {
        linha.observacoes = r.observacoes
      }
      if (r.id && r.sourceTable) {
        linha._sourceRows.push({ id: r.id, table: r.sourceTable })
      }

      const bandeiraLinhaNormalizada = normalizarChaveAdquirente(key)
      const ehVoucherBandeiraCartao = BANDEIRAS_VOUCHER_CARTAO.includes(bandeiraLinhaNormalizada)

      if (modalidadePagamento === 'debito' && !isAluguelMaquina) { linha.debito += valorPago; grupo.totais.debito += valorPago }
      else if (modalidadePagamento === 'voucher' && (isRedeGrupo || ehVoucherBandeiraCartao)) { linha.voucher += valorPago; grupo.totais.voucher += valorPago }
      else if (modalidadePagamento === 'credito') { linha.credito += valorPago; grupo.totais.credito += valorPago }
      else if (modalidadePagamento === 'credito2x') { linha.credito2x += valorPago; grupo.totais.credito2x += valorPago }
      else if (modalidadePagamento === 'credito3x') { linha.credito3x += valorPago; grupo.totais.credito3x += valorPago }
      else if (modalidadePagamento === 'credito4x5x6x') { linha.credito4x5x6x += valorPago; grupo.totais.credito4x5x6x += valorPago }

      linha.valor_bruto_total += bruto
      linha.valor_liquido_total += liquido
      linha.despesa_mdr_total += despesaMdrConsiderada
      linha.despesa_antecipacao_total += despesaAnt
      linha.valor_pago_total += valorPrevisto

      grupo.totais.vendaBruta += bruto
      grupo.totais.vendaLiquida += liquido
      grupo.totais.despesaMdr += despesaMdrConsiderada
      grupo.totais.despesaAntecipacao += despesaAnt
      grupo.totais.valorPago += valorPrevisto
    })

    Object.values(grupos).forEach((grupo) => {
      const chaveGrupoDeposito = normalizarGrupoAdquirente(grupo.adquirente)
      const depositosGrupo = depositosMap.value[chaveGrupoDeposito]
      Object.values(grupo.linhas).forEach((linha) => {
        linha.valor_depositado = 0
      })

      if (depositosGrupo) {
        const bandeirasNormalizadas = Object.entries(depositosGrupo.bandeiras || {}).reduce((acc, [nome, valor]) => {
          const chave = normalizarBandeiraParaConferencia(nome, grupo.adquirente)
          acc[chave] = (acc[chave] || 0) + Number(valor || 0)
          return acc
        }, {})

        let houveMatchDeposito = false
        Object.values(grupo.linhas).forEach((linha) => {
          const chaveLinha = normalizarBandeiraParaConferencia(linha.adquirente, grupo.adquirente)
          if (bandeirasNormalizadas[chaveLinha]) {
            linha.valor_depositado = bandeirasNormalizadas[chaveLinha]
            houveMatchDeposito = true
          } else if (chaveLinha === 'CABAL') {
            const totalCabal = Object.entries(bandeirasNormalizadas).reduce((acc, [nomeBandeira, valorBandeira]) => {
              return nomeBandeira.startsWith('CABAL') ? acc + Number(valorBandeira || 0) : acc
            }, 0)
            if (totalCabal > 0) {
              linha.valor_depositado = totalCabal
              houveMatchDeposito = true
            }
          } else if (linha.adquirente === grupo.adquirente) {
            linha.valor_depositado = depositosGrupo.total
            houveMatchDeposito = true
          }
        })

        if (!houveMatchDeposito && chaveGrupoDeposito === 'UNICA' && Number(depositosGrupo.total || 0) > 0) {
          const linhasElegiveis = Object.values(grupo.linhas).filter((linha) => normalizarChaveAdquirente(linha.adquirente) !== 'ALUGUEIS')
          const baseRateio = linhasElegiveis.reduce((acc, linha) => acc + Math.max(0, Number(linha.valor_pago_total || 0)), 0)

          if (linhasElegiveis.length > 0) {
            if (baseRateio > 0) {
              let acumulado = 0
              linhasElegiveis.forEach((linha, index) => {
                const proporcao = Number(linha.valor_pago_total || 0) / baseRateio
                const valorRateado = index === (linhasElegiveis.length - 1)
                  ? Number(depositosGrupo.total || 0) - acumulado
                  : Number((proporcao * Number(depositosGrupo.total || 0)).toFixed(2))
                linha.valor_depositado = valorRateado
                acumulado += valorRateado
              })
            } else {
              linhasElegiveis[0].valor_depositado = Number(depositosGrupo.total || 0)
            }
          }
        }
      }

      grupo.totais.valorDepositado = Object.values(grupo.linhas).reduce((acc, linha) => {
        return acc + Number(linha.valor_depositado || 0)
      }, 0)
    })

    return Object.values(grupos).map((g) => ({
      adquirente: g.adquirente,
      recebimentosData: Object.values(g.linhas).sort((a, b) => {
        const ia = ORDEM_BANDEIRAS.indexOf(a.adquirente)
        const ib = ORDEM_BANDEIRAS.indexOf(b.adquirente)
        if (ia !== -1 && ib !== -1) return ia - ib
        if (ia !== -1 && ib === -1) return -1
        if (ia === -1 && ib !== -1) return 1
        return a.adquirente.localeCompare(b.adquirente)
      }),
      totais: g.totais
    }))
  })

  return {
    gruposPorAdquirente
  }
}
