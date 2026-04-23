<template>
  <div>
    <ControladoriaRecebimentosTableComplete 
      v-for="grupo in gruposPorAdquirente"
      :key="grupo.adquirente"
      :recebimentos-data="grupo.recebimentosData"
      :totais="grupo.totais"
      :adquirente="grupo.adquirente"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useResponsiveColumns } from '~/composables/useResponsiveColumns'
import { useRecebimentos } from '~/composables/PageControladoria/controladoria-recebimentos/useRecebimentos'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import ControladoriaRecebimentosTableComplete from './ControladoriaRecebimentosTableComplete.vue'
import { useControladoriaVendas } from '~/composables/PageControladoria/useControladoriaVendas'
import { useExtratoDetalhado } from '~/composables/PageBancos/useExtratoDetalhado'

const { screenSize, windowWidth, initializeResponsive, getResponsiveColumnWidths } = useResponsiveColumns()

const { recebimentos, fetchRecebimentos } = useRecebimentos()
const { filtrosGlobais, escutarEvento } = useGlobalFilters()
const { classificarBandeira, determinarModalidade, normalizeString } = useControladoriaVendas()
const { transacoes, buscarTransacoesBancarias } = useExtratoDetalhado()

const normalizarChaveAdquirente = (texto) => {
  if (!texto) return ''
  return String(texto)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const normalizarBandeiraParaConferencia = (nomeBandeira, grupoAdquirente) => {
  const base = normalizarChaveAdquirente(nomeBandeira)
  const grupo = normalizarChaveAdquirente(grupoAdquirente)

  // No extrato da STONE as bandeiras chegam como "VISA STONE", "MAESTRO STONE", etc.
  // Na controladoria as linhas são "VISA", "MAESTRO"... então removemos o sufixo.
  if (grupo === 'STONE') {
    return base.replace(/\s+STONE$/, '').trim()
  }
  return base
}

const mapearAdquirenteParaGrupo = (base) => {
  const chave = normalizarChaveAdquirente(base)
  const mapa = {
    'ALELO INSTITUICAO DE PAGAMENTO': 'ALELO',
    'RECEBIMENTO ALELO': 'ALELO',
    'TICKET SERVICOS SA': 'TICKET',
    'TICKET SERVICOS': 'TICKET',
    'PLUXEE': 'PLUXE',
    'PLUXEE BENEFICIOS BR': 'PLUXE',
    'PLUXE BENEFICIOS BR': 'PLUXE',
    'VR BENEFICIOS': 'VR',
    'VR BENEF': 'VR',
    'PIX BANCO VR': 'VR',
    'VR BENEFICIOS SER PROC': 'VR',
    'VR BENEFCIOS SERV PROC': 'VR',
    'LE CARD ADMINISTRADORA': 'LE CARD',
    'LECARD': 'LE CARD',
    'UP BRASIL ADMINISTRACAO': 'UP BRASIL',
    'GREEN CARD': 'GREEN CARD',
    'BRASILCARD': 'BRASILCARD',
    'BRASIL CARD': 'BRASILCARD',
    'BRASIL CARD INSTITUIC': 'BRASILCARD',
    'BOLT CARD': 'BRASILCARD',
    'BOLTCARD': 'BRASILCARD',
    'BOLT CARD CREDENCIADORA': 'BRASILCARD',
    'VALE CARD': 'VALE CARD',
    'VALECARD': 'VALE CARD',
    'AGL ADQUIRENCIA': 'VALE CARD',
    'AGL ADQUIRENCIA LTDA': 'VALE CARD',
    'CABAL PRE': 'CABAL',
    'TRIPAG': 'UNICA',
    'REDE': 'REDE',
    'REDE CARD': 'REDE',
    'REDECARD': 'REDE'
  }
  return mapa[chave] || base
}

const detectarBandeiraRede = (descricao) => {
  const texto = normalizarChaveAdquirente(descricao)
  if (!texto) return 'REDE'

  // Regras específicas REDE no Banco do Brasil
  if (/REDE[\s.-]*VENDAS[\s.-]*MASTER[\s.-]*DEBITO/.test(texto)) return 'MAESTRO'
  if (/REDE[\s.-]*VENDAS[\s.-]*VISA[\s.-]*DEBITO/.test(texto)) return 'VISA ELECTRON'
  if (/REDECARD/.test(texto) && /FUNCAO[\s.-]*DEBITO/.test(texto)) return 'ELO DÉBITO'
  if (/REDE[\s.-]*VENDAS[\s.-]*MASTER[\s.-]*CREDITO?/.test(texto)) return 'MASTERCARD'
  if (/REDE[\s.-]*VENDAS[\s.-]*VISA[\s.-]*CREDITO?/.test(texto)) return 'VISA'
  if (/REDE[\s.-]*CREDITO/.test(texto)) return 'ELO CRÉDITO'

  if (/CABA(?:L)?[\s.-]*(DB|DEB|DEBITO)|DBTO[\s.-]*CABA(?:L)?/.test(texto)) return 'CABAL DÉBITO'
  if (/CABA(?:L)?[\s.-]*(CD|AT|CREDITO|CRED)|CR[\s.-]*CABA(?:L)?/.test(texto)) return 'CABAL CRÉDITO'
  if (/\bCABAL\b|\bCABA\b/.test(texto)) return 'CABAL'

  if (/VISA[\s.-]*DB|DBTO[\s.-]*VISA|VISA[\s.-]*ELECTRON/.test(texto)) return 'VISA ELECTRON'
  if (/ELO[\s.-]*DB|DBTO[\s.-]*ELO/.test(texto)) return 'ELO DÉBITO'
  if (/MAST[\s.-]*DB|DBTO[\s.-]*MAESTRO|MAESTRO/.test(texto)) return 'MAESTRO'

  if (/VISA[\s.-]*(CD|AT)|CREDITO[\s.-]*VISA|CR[\s.-]*VISA/.test(texto)) return 'VISA'
  if (/ELO[\s.-]*(CD|AT)|CREDITO[\s.-]*ELO|CRTO[\s.-]*ELO/.test(texto)) return 'ELO CRÉDITO'
  if (/MAST[\s.-]*(CD|AT)|CR[\s.-]*MASTERCARD|CREDITO[\s.-]*MASTERCARD/.test(texto)) return 'MASTERCARD'
  if (/AMEX[\s.-]*(CD|AT)|\bAMEX\b/.test(texto)) return 'AMEX'

  return 'REDE'
}

const detectarBandeiraTribanco = (descricao, baseDetectado) => {
  const upper = String(descricao || '').toUpperCase()

  if (/MASTER\s+DEBITO\s+STONE/.test(upper)) return 'MAESTRO'
  if (/VISA\s+DEBITO\s+STONE/.test(upper)) return 'VISA ELECTRON'
  if (/ELO\s+DEBITO\s+STONE/.test(upper)) return 'ELO DÉBITO'

  if (/VISA\s+CREDITO\s+STONE/.test(upper)) return 'VISA'
  if (/MASTER\s+CREDITO\s+STONE/.test(upper)) return 'MASTERCARD'
  if (/ELO\s+CREDITO\s+STONE/.test(upper)) return 'ELO CRÉDITO'

  return String(baseDetectado || '')
    .replace(/\s+STONE$/i, '')
    .trim()
}

const parseValorExtrato = (transacao) => {
  const raw = transacao?.valorNumerico ?? transacao?.valor ?? 0
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0
  const input = String(raw).trim()
  if (!input) return 0

  const normalized = input
    .replace(/\s/g, '')
    .replace(/[^0-9,.-]/g, '')

  if (!normalized) return 0

  const hasComma = normalized.includes(',')
  const dotCount = (normalized.match(/\./g) || []).length
  const cleaned = hasComma
    ? normalized.replace(/\./g, '').replace(',', '.')
    : (dotCount > 1 ? normalized.replace(/\./g, '') : normalized)

  const value = Number(cleaned)
  return Number.isFinite(value) ? value : 0
}

const depositosMap = computed(() => {
  const map = {}
  
  if (!transacoes.value) return map

  transacoes.value.forEach(t => {
    const valor = parseValorExtrato(t)
    if (!valor || valor <= 0) return

    const bancoStr = String(t.banco || '')
    const descricaoUpper = String(t.descricao || '').toUpperCase()
    const baseDetectado = t?.adquirente_detectado ? String(t.adquirente_detectado) : ''
    const categoriaDetectada = t?.categoria_detectada ? String(t.categoria_detectada) : ''
    // Para valor depositado, usa apenas a classificação já produzida pelo extrato/resumo do banco.
    // Isso mantém a controladoria alinhada com o total visto na page Bancos.
    const base = baseDetectado
    const categoria = categoriaDetectada
    if (!base || !categoria) return
    if (/\bBOLETO\s*PAGO\b.*\bREDE\b/.test(descricaoUpper)) return

    const isTribanco = bancoStr.toLowerCase().includes('tribanco')
    const isTribancoStone = isTribanco && /\bSTONE\b/.test(descricaoUpper)

    const baseNormalizado = normalizarChaveAdquirente(base)
    const isCabalRede = baseNormalizado === 'CABAL CREDITO' || baseNormalizado === 'CABAL DEBITO'
    const hasPagSeguro = /PAGSEG(?:URO)?/.test(descricaoUpper) || /TED\s*290(?:[.,]0+)?\s*PAGSEG(?:URO)?\s*IN\w*/.test(descricaoUpper)
    const isPagSeguroBandeira = hasPagSeguro && ['ELO CREDITO', 'ELO DEBITO', 'MASTERCARD', 'MAESTRO', 'VISA', 'VISA ELECTRON', 'AMEX', 'HIPERCARD', 'PIX'].includes(baseNormalizado)

    const grupo = isTribanco
      ? (isTribancoStone ? 'STONE' : 'UNICA')
      : (isCabalRede ? 'REDE' : (isPagSeguroBandeira ? 'PAGSEGURO' : (categoria === 'Voucher' ? mapearAdquirenteParaGrupo(base) : String(base))))
    const bandeira = isTribanco
      ? detectarBandeiraTribanco(t.descricao, String(base))
      : (isCabalRede || isPagSeguroBandeira ? String(base) : (grupo === 'REDE' ? detectarBandeiraRede(t.descricao) : grupo))

    if (!map[grupo]) map[grupo] = { total: 0, bandeiras: {} }
    
    map[grupo].total += valor
    
    if (!map[grupo].bandeiras[bandeira]) map[grupo].bandeiras[bandeira] = 0
    map[grupo].bandeiras[bandeira] += valor
  })
  
  return map
})

const ordemBandeiras = [
  'VISA',
  'VISA ELECTRON',
  'MASTERCARD',
  'MAESTRO',
  'ELO CRÉDITO',
  'ELO DÉBITO',
  'CABAL CRÉDITO',
  'CABAL DÉBITO',
  'PIX',
  'CABAL',
  'AMEX',
  'HIPERCARD',
  'DINERS',
  'BRADESCO DÉBITO',
  'TRICARD',
  'SORO',
  'ALUGUEIS'
]

const resolverLinhaBandeira = (nomeClassificado, modalidadePagamento) => {
  if (nomeClassificado !== 'CABAL') return nomeClassificado
  if (modalidadePagamento === 'debito') return 'CABAL DÉBITO'
  if (['credito', 'credito2x', 'credito3x', 'credito4x5x6x'].includes(modalidadePagamento)) return 'CABAL CRÉDITO'
  return 'CABAL'
}

const gruposPorAdquirente = computed(() => {
  const grupos = {}
  ;(recebimentos.value || []).forEach(r => {
    const adquirenteKey = r.adquirente || 'ALUGUEIS'
    if (!grupos[adquirenteKey]) {
      grupos[adquirenteKey] = {
        adquirente: adquirenteKey,
        linhas: {},
        totais: {
          debito: 0,
          credito: 0,
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
    const modalidadePagamento = determinarModalidade(r.modalidade || '', r.numeroParcelas || 1)
    const nomeClassificado = classificarBandeira(r.bandeira || r.adquirente || '', r.modalidade || '')
    const keyBase = nomeClassificado === 'OUTROS' ? 'ALUGUEIS' : (nomeClassificado || 'ALUGUEIS')
    const key = resolverLinhaBandeira(keyBase, modalidadePagamento)
    if (!grupo.linhas[key]) {
      grupo.linhas[key] = {
        adquirente: key,
        debito: 0,
        credito: 0,
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

    const liquido = parseFloat(r.valorLiquido || r.valorRecebido) || 0
    const bruto = parseFloat(r.valorBruto) || 0
    const despesa = parseFloat(r.despesaMdr) || 0
    const despesaAntRaw = parseFloat(r.despesaAntecipacao) || 0
    const despesaAnt = Math.abs(despesaAntRaw)
    const valorPago = liquido - despesaAnt
    const modalidadeNorm = normalizeString(r.modalidade || '')
    const bandeiraNorm = normalizeString(r.bandeira || '')
    const textoCategoria = `${modalidadeNorm} ${bandeiraNorm}`.trim()
    const isAluguelMaquina = textoCategoria.includes('aluguel') && (
      textoCategoria.includes('maquin') ||
      textoCategoria.includes('terminal') ||
      textoCategoria.includes('pos')
    )
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
    if (modalidadePagamento === 'debito' && !isAluguelMaquina) { linha.debito += valorPago; grupo.totais.debito += valorPago }
    else if (modalidadePagamento === 'credito') { linha.credito += valorPago; grupo.totais.credito += valorPago }
    else if (modalidadePagamento === 'credito2x') { linha.credito2x += valorPago; grupo.totais.credito2x += valorPago }
    else if (modalidadePagamento === 'credito3x') { linha.credito3x += valorPago; grupo.totais.credito3x += valorPago }
    else if (modalidadePagamento === 'credito4x5x6x') { linha.credito4x5x6x += valorPago; grupo.totais.credito4x5x6x += valorPago }

    linha.valor_bruto_total += bruto
    linha.valor_liquido_total += liquido
    linha.despesa_mdr_total += despesa
    linha.despesa_antecipacao_total += despesaAnt
    linha.valor_pago_total += valorPrevisto

    grupo.totais.vendaBruta += bruto
    grupo.totais.vendaLiquida += liquido
    grupo.totais.despesaMdr += despesa
    grupo.totais.despesaAntecipacao += despesaAnt
    grupo.totais.valorPago += valorPrevisto
  })

  // Injetar valores depositados
  Object.values(grupos).forEach(grupo => {
    const depositosGrupo = depositosMap.value[grupo.adquirente]
    // Sempre recalcula por linha para garantir que o total exibido seja a soma visível em tela.
    Object.values(grupo.linhas).forEach(linha => {
      linha.valor_depositado = 0
    })

    if (depositosGrupo) {
      const bandeirasNormalizadas = Object.entries(depositosGrupo.bandeiras || {}).reduce((acc, [nome, valor]) => {
        const chave = normalizarBandeiraParaConferencia(nome, grupo.adquirente)
        acc[chave] = (acc[chave] || 0) + Number(valor || 0)
        return acc
      }, {})
      
      Object.values(grupo.linhas).forEach(linha => {
        const chaveLinha = normalizarBandeiraParaConferencia(linha.adquirente, grupo.adquirente)
        if (bandeirasNormalizadas[chaveLinha]) {
          linha.valor_depositado = bandeirasNormalizadas[chaveLinha]
        } else if (chaveLinha === 'CABAL') {
          const totalCabal = Object.entries(bandeirasNormalizadas).reduce((acc, [nomeBandeira, valorBandeira]) => {
            return nomeBandeira.startsWith('CABAL') ? acc + Number(valorBandeira || 0) : acc
          }, 0)
          if (totalCabal > 0) linha.valor_depositado = totalCabal
        } else if (linha.adquirente === grupo.adquirente) {
          linha.valor_depositado = depositosGrupo.total
        }
      })
    }

    grupo.totais.valorDepositado = Object.values(grupo.linhas).reduce((acc, linha) => {
      return acc + Number(linha.valor_depositado || 0)
    }, 0)
  })

  return Object.values(grupos).map(g => ({
    adquirente: g.adquirente,
    recebimentosData: Object.values(g.linhas).sort((a, b) => {
      const ia = ordemBandeiras.indexOf(a.adquirente)
      const ib = ordemBandeiras.indexOf(b.adquirente)
      if (ia !== -1 && ib !== -1) return ia - ib
      if (ia !== -1 && ib === -1) return -1
      if (ia === -1 && ib !== -1) return 1
      return a.adquirente.localeCompare(b.adquirente)
    }),
    totais: g.totais
  }))
})

const totaisGerais = computed(() => {
  return (gruposPorAdquirente.value || []).reduce((acc, grupo) => {
    acc.debito += grupo.totais.debito
    acc.credito += grupo.totais.credito
    acc.credito2x += grupo.totais.credito2x
    acc.credito3x += grupo.totais.credito3x
    acc.credito4x5x6x += grupo.totais.credito4x5x6x
    acc.despesaMdr += grupo.totais.despesaMdr
    acc.despesaAntecipacao += grupo.totais.despesaAntecipacao
    acc.vendaBruta += grupo.totais.vendaBruta
    acc.vendaLiquida += grupo.totais.vendaLiquida
    acc.valorPago += grupo.totais.valorPago
    acc.valorDepositado += (grupo.totais.valorDepositado || 0)
    return acc
  }, {
    debito: 0,
    credito: 0,
    credito2x: 0,
    credito3x: 0,
    credito4x5x6x: 0,
    despesaMdr: 0,
    despesaAntecipacao: 0,
    vendaBruta: 0,
    vendaLiquida: 0,
    valorPago: 0,
    valorDepositado: 0
  })
})

const atualizarDados = async () => {
  await buscarTransacoesBancarias({
    bancoSelecionado: 'TODOS',
    dataInicial: filtrosGlobais.dataInicial || '',
    dataFinal: filtrosGlobais.dataFinal || ''
  }, true)
}

onMounted(async () => {
  initializeResponsive()
  await Promise.all([
    fetchRecebimentos(),
    atualizarDados()
  ])
  
  escutarEvento('filtrar-controladoria-recebimentos', atualizarDados)
})
</script>
