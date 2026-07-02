import { ref, computed, watch } from 'vue'
import { useVendas } from '~/composables/useVendas'
import { useSecureLogger } from '~/composables/useSecureLogger'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import { useEmpresaHelpers } from '~/composables/PageVendas/filtrar_tabelas/useEmpresaHelpers'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useRecebimentosCRUD } from '~/composables/PagePagamentos/filtrar_tabelas_recebimento/useRecebimentosCRUD'
import { isMissingColumnError, normalizarEcNumerico } from '~/composables/PageControladoria/controladoria-vendas/tabela_voucher_manual/supabaseUtils'
import { pixVendasStatsVersion } from '~/composables/PageControladoria/controladoria-vendas/tabela_pix_vendas/statsSync'
import { useVouchersManual } from '~/composables/PageControladoria/controladoria-vendas/tabela_voucher_manual'

export const useControladoriaVendas = () => {
  const { error: logError } = useSecureLogger()
  const { filtrosGlobais } = useGlobalFilters()
  const { obterEmpresaSelecionadaCompleta } = useEmpresaHelpers()
  const { fetchRecebimentos } = useRecebimentosCRUD()
  
  // Usar dados compartilhados da página vendas
  const { vendas, vendasOriginais, loading: vendasLoading, error: vendasError, filtroAtivo } = useVendas()
  const { vouchersData, fetchTaxas: fetchVouchersTaxas } = useVouchersManual(filtroAtivo)
  
  // Estados reativos locais
  const vendasData = ref([])
  const loading = ref(false)
  const error = ref(null)
  const pixManualTotal = ref(0)
  const pixManualLiquidoTotal = ref(0)
  const pixManualMdrTotal = ref(0)
  const pixManualDetalhado = ref([])
  const vouchersManualBrutoTotal = ref(0)
  const vouchersManualLiquidoTotal = ref(0)
  const vouchersManualMdrTotal = ref(0)
  const alugueisRecebimentosData = ref([])
  
  // Função para normalizar strings (remover acentos, espaços, etc.)
  const normalizeString = (str) => {
    if (!str) return ''
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.\-_\s]/g, '')
  }
  
  // Ordem específica para exibição das bandeiras
  const ordemBandeiras = [
    'VISA',
    'VISA ELECTRON', 
    'MASTERCARD',
    'MAESTRO',
    'ELO CRÉDITO',
    'ELO DÉBITO',
    'CABAL CRÉDITO',
    'CABAL DÉBITO',
    'CABAL',
    'AMEX',
    'HIPERCARD',
    'DINERS',
    'BRADESCO DÉBITO',
    'TRICARD',
    'SORO',
    'PIX',
    'ALUGUEIS'
  ]
  
  // Lista de vouchers conhecidos e utilitário
  const voucherBrands = [
    'alelo','ticket','vr','sodexo','pluxe','pluxee','comprocard','lecard','upbrasil','ecxcard','fncard','benvisa','credshop','rccard','goodcard','bigcard','bkcard','greencard','brasilcard','boltcard','verocard','facecard','valecard','naip'
  ]
  const isVoucherBrand = (name='') => {
    const n = normalizeString(name)
    return voucherBrands.includes(n)
  }

  const normalizarAdquirenteResumo = (adquirente) => {
    const base = String(adquirente || '').trim()
    const chave = String(base || '')
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (!chave) return ''
    if (['TRIPAG', 'TRIANGULO'].includes(chave)) return 'UNICA'
    if (['REDE CARD', 'REDECARD'].includes(chave)) return 'REDE'
    if (['SAFRAPAY', 'SAFRA PAY'].includes(chave)) return 'SAFRA'
    if (chave.includes('SIPAG')) return 'SIPAG'
    return chave
  }
  
  // Função para classificar bandeiras
  const classificarBandeira = (bandeira, modalidade) => {
    const bandeiraNorm = normalizeString(bandeira)
    const modalidadeNorm = normalizeString(modalidade)
    const textoNorm = normalizeString(`${bandeira || ''} ${modalidade || ''}`)
    const textoUpper = String(`${bandeira || ''} ${modalidade || ''}`)
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[._-]/g, ' ')
    const ehDebitoTexto = /\b(DEB|DEBITO|DBTO)\b/.test(textoUpper) || textoNorm.includes('debito') || textoNorm.includes('debitoprepago') || textoNorm.includes('prepagodebito') || textoNorm.includes('prepagodbto') || textoNorm.includes('dbto') || textoNorm.includes('deb')

    if (bandeiraNorm.includes('cabal')) {
      if (
        modalidadeNorm.includes('debito') ||
        modalidadeNorm.includes('debitoprepago') ||
        modalidadeNorm.includes('prepagodebito') ||
        modalidadeNorm.includes('prepagodbto') ||
        modalidadeNorm.includes('dbto') ||
        modalidadeNorm.includes('deb')
      ) {
        return 'CABAL DÉBITO'
      }
      if (
        modalidadeNorm.includes('credito') ||
        modalidadeNorm.includes('creditoavista') ||
        modalidadeNorm.includes('cred')
      ) {
        return 'CABAL CRÉDITO'
      }
      if (modalidadeNorm.includes('voucher') || modalidadeNorm.includes('alimentacao') || modalidadeNorm.includes('refeicao')) {
        return 'CABAL'
      }
      return 'CABAL CRÉDITO'
    }

    // Regra prioritária: aluguel de máquina nunca deve cair em bandeira
    if (
      textoNorm.includes('aluguel') &&
      (textoNorm.includes('maquin') || textoNorm.includes('terminal') || textoNorm.includes('pos'))
    ) {
      return 'ALUGUEIS'
    }
    
    // Detectar vouchers por bandeira
    if (isVoucherBrand(bandeira)) {
      return normalizeString(bandeira).toUpperCase()
    }
    
    // VISA ELECTRON (Débito) - Captura todas as variações de débito
    if (bandeiraNorm.includes('visa') && ehDebitoTexto) {
      return 'VISA ELECTRON'
    }
    
    // VISA (Crédito) - Apenas quando não for débito
    if (bandeiraNorm.includes('visa') && !ehDebitoTexto) {
      return 'VISA'
    }
    
    // MAESTRO (Débito)
    if ((bandeiraNorm.includes('maestro') || bandeiraNorm.includes('mastercard') || bandeiraNorm.includes('master')) &&
        ehDebitoTexto) {
      return 'MAESTRO'
    }
    
    // MASTERCARD (Crédito)
    if ((bandeiraNorm.includes('mastercard') || bandeiraNorm.includes('master')) && !ehDebitoTexto) {
      return 'MASTERCARD'
    }
    
    // ELO DÉBITO
    if (bandeiraNorm.includes('elo') && ehDebitoTexto) {
      return 'ELO DÉBITO'
    }
    
    // ELO CRÉDITO
    if (bandeiraNorm.includes('elo') && !ehDebitoTexto) {
      return 'ELO CRÉDITO'
    }

    // PIX
    if (bandeiraNorm.includes('pix') || modalidadeNorm.includes('pix') || bandeiraNorm.includes('pixqr') || bandeiraNorm.includes('pixqrcode') || bandeiraNorm.includes('qrcode')) {
      return 'PIX'
    }
    
    // BANESCARD DÉBITO
    if (bandeiraNorm.includes('banescard') && 
        (modalidadeNorm.includes('debito') || modalidadeNorm.includes('debitoprepago'))) {
      return 'BANESCARD DÉBITO'
    }
    
    // BRADESCO DÉBITO
    if (bandeiraNorm.includes('bradesco') && 
        (modalidadeNorm.includes('debito') || modalidadeNorm.includes('debitoprepago'))) {
      return 'BRADESCO DÉBITO'
    }
    
    // AMEX (sempre crédito)
    if (bandeiraNorm.includes('amex') || bandeiraNorm.includes('american') || bandeiraNorm.includes('americanexpress') || bandeiraNorm.includes('express')) {
      return 'AMEX'
    }
    
    // HIPERCARD (sempre crédito)
    if (bandeiraNorm.includes('hipercard') || bandeiraNorm.includes('hiper')) {
      return 'HIPERCARD'
    }
    
    // DINERS (sempre crédito)
    if (bandeiraNorm.includes('diners')) {
      return 'DINERS'
    }
    
    // SORO (sempre crédito)
    if (bandeiraNorm.includes('soro')) {
      return 'SORO'
    }
    
    // TRICARD (sempre crédito)
    if (bandeiraNorm.includes('tricard') || bandeiraNorm.includes('tri')) {
      return 'TRICARD'
    }
    
    return 'OUTROS'
  }
  
  // Função para determinar a modalidade de pagamento
  const determinarModalidade = (modalidade, numeroParcelas, bandeira = '') => {
    const modalidadeNorm = normalizeString(modalidade)
    const bandeiraNorm = normalizeString(bandeira)
    const textoNorm = `${modalidadeNorm}${bandeiraNorm}`
    const textoUpper = String(`${modalidade || ''} ${bandeira || ''}`)
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[._-]/g, ' ')
    const parcelas = parseInt(numeroParcelas) || 1
    const isAluguelMaquina = modalidadeNorm.includes('aluguel') && (
      modalidadeNorm.includes('maquin') ||
      modalidadeNorm.includes('terminal') ||
      modalidadeNorm.includes('pos')
    )
    
    if (textoNorm.includes('pix') || textoNorm.includes('pixqr') || textoNorm.includes('pixqrcode') || textoNorm.includes('qrcode')) {
      return 'debito'
    }
    
    if (isAluguelMaquina) {
      return 'debito'
    }

    // Detecta todas as variações de débito
    if (/\b(DEB|DEBITO|DBTO)\b/.test(textoUpper) ||
        textoNorm.includes('debito') || 
        textoNorm.includes('debitoprepago') || 
        textoNorm.includes('prepagodebito') ||
        textoNorm.includes('prepagodbto') ||
        textoNorm.includes('dbto') ||
        textoNorm.includes('deb')) {
      return 'debito'
    }
    
    if (textoNorm.includes('voucher') || textoNorm.includes('alimentacao') || textoNorm.includes('refeicao') || /\bPAT\b/.test(textoUpper)) {
      return 'voucher'
    }
    
    // Crédito baseado no número de parcelas
    if (parcelas === 1) return 'credito'
    if (parcelas === 2) return 'credito2x'
    if (parcelas === 3) return 'credito3x'
    if (parcelas >= 4 && parcelas <= 6) return 'credito4x5x6x'
    
    return 'outros'
  }

  const normalizarSegmentoTabela = (value) => {
    return String(value || '')
      .toLowerCase()
      .replace(/\s+/g, '_')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  const resolverPeriodoAtual = () => {
    if (filtrosGlobais.dataInicial && filtrosGlobais.dataFinal) {
      return {
        primeiroDia: filtrosGlobais.dataInicial,
        ultimoDia: filtrosGlobais.dataFinal
      }
    }

    const hoje = new Date()
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]
    return { primeiroDia, ultimoDia }
  }

  const carregarPixManualTotal = async () => {
    try {
      const empresaCompleta = await obterEmpresaSelecionadaCompleta()
      const empresaAtual = empresaCompleta?.nome || ''
      const matrizAtual = normalizarEcNumerico(empresaCompleta?.matriz)

      if (!empresaAtual || matrizAtual == null) {
        pixManualTotal.value = 0
        return
      }

      const tableName = `vendas_pix_${normalizarSegmentoTabela(empresaAtual)}`
      const { primeiroDia, ultimoDia } = resolverPeriodoAtual()
      const startCreatedAtIso = new Date(`${primeiroDia}T00:00:00`).toISOString()
      const endCreatedAtIso = new Date(`${ultimoDia}T23:59:59.999`).toISOString()

      let data = null
      let queryError = null
      let schemaMode = 'separado'

      ;({ data, error: queryError } = await supabase
        .from(tableName)
        .select('valor_bruto')
        .match({ empresa: empresaAtual, matriz: matrizAtual, modalidade: 'Pix' })
        .gte('created_at', startCreatedAtIso)
        .lte('created_at', endCreatedAtIso)
      )

      if (queryError && isMissingColumnError(queryError, 'valor_bruto')) {
        schemaMode = 'combinado'
        ;({ data, error: queryError } = await supabase
          .from(tableName)
          .select('valor_bruto_despesa_mdr')
          .match({ empresa: empresaAtual, matriz: matrizAtual, modalidade: 'Pix' })
          .gte('created_at', startCreatedAtIso)
          .lte('created_at', endCreatedAtIso)
        )
      }

      if (queryError) {
        if (queryError.code === '42P01') {
          pixManualTotal.value = 0
          pixManualLiquidoTotal.value = 0
          pixManualMdrTotal.value = 0
          return
        }
        throw queryError
      }

      const totaisPix = (data || []).reduce((acc, item) => {
        if (schemaMode === 'combinado') {
          const liquido = parseFloat(item?.valor_bruto_despesa_mdr) || 0
          acc.bruto += liquido
          acc.liquido += liquido
          return acc
        }

        const bruto = parseFloat(item?.valor_bruto) || 0
        const mdr = parseFloat(item?.despesa_mdr) || 0
        acc.bruto += bruto
        acc.mdr += mdr
        acc.liquido += bruto - mdr
        return acc
      }, { bruto: 0, liquido: 0, mdr: 0 })

      pixManualTotal.value = totaisPix.bruto
      pixManualLiquidoTotal.value = totaisPix.liquido
      pixManualMdrTotal.value = totaisPix.mdr
    } catch (err) {
      pixManualTotal.value = 0
      pixManualLiquidoTotal.value = 0
      pixManualMdrTotal.value = 0
      logError('useControladoriaVendas', 'carregarPixManualTotal', err)
    }
  }

  const carregarPixManualDetalhado = async () => {
    try {
      const empresaCompleta = await obterEmpresaSelecionadaCompleta()
      const empresaAtual = empresaCompleta?.nome || ''
      const matrizAtual = normalizarEcNumerico(empresaCompleta?.matriz)

      if (!empresaAtual || matrizAtual == null) {
        pixManualDetalhado.value = []
        return
      }

      const tableName = `vendas_pix_${normalizarSegmentoTabela(empresaAtual)}`
      const { primeiroDia, ultimoDia } = resolverPeriodoAtual()
      const startCreatedAtIso = new Date(`${primeiroDia}T00:00:00`).toISOString()
      const endCreatedAtIso = new Date(`${ultimoDia}T23:59:59.999`).toISOString()

      let data = null
      let queryError = null
      let schemaMode = 'separado'

      ;({ data, error: queryError } = await supabase
        .from(tableName)
        .select('id, adquirente, valor_bruto, despesa_mdr, observacoes, created_at')
        .match({ empresa: empresaAtual, matriz: matrizAtual, modalidade: 'Pix' })
        .gte('created_at', startCreatedAtIso)
        .lte('created_at', endCreatedAtIso)
      )

      if (queryError && isMissingColumnError(queryError, 'valor_bruto')) {
        schemaMode = 'combinado'
        ;({ data, error: queryError } = await supabase
          .from(tableName)
          .select('id, adquirente, valor_bruto_despesa_mdr, observacoes, created_at')
          .match({ empresa: empresaAtual, matriz: matrizAtual, modalidade: 'Pix' })
          .gte('created_at', startCreatedAtIso)
          .lte('created_at', endCreatedAtIso)
        )
      }

      if (queryError) {
        if (queryError.code === '42P01') {
          pixManualDetalhado.value = []
          return
        }
        throw queryError
      }

      const agrupado = new Map()
      for (const item of data || []) {
        const adquirente = String(item?.adquirente || '').trim().toUpperCase()
        if (!adquirente) continue

        const bruto = schemaMode === 'combinado'
          ? round2(item?.valor_bruto_despesa_mdr || 0)
          : round2(item?.valor_bruto || 0)
        const mdr = schemaMode === 'combinado'
          ? 0
          : round2(item?.despesa_mdr || 0)
        const liquido = round2(bruto - mdr)

        if (!agrupado.has(adquirente)) {
          agrupado.set(adquirente, {
            adquirente,
            bandeira: 'PIX',
            modalidade: 'Pix',
            numero_parcelas: 1,
            valor_bruto: bruto,
            valor_liquido: liquido,
            despesa_mdr: mdr,
            despesa_extra: 0,
            despesa_antecipacao: 0,
            observacoes: String(item?.observacoes || '')
          })
          continue
        }

        const atual = agrupado.get(adquirente)
        atual.valor_bruto = round2(Number(atual.valor_bruto || 0) + bruto)
        atual.valor_liquido = round2(Number(atual.valor_liquido || 0) + liquido)
        atual.despesa_mdr = round2(Number(atual.despesa_mdr || 0) + mdr)
      }

      pixManualDetalhado.value = Array.from(agrupado.values())
    } catch (err) {
      pixManualDetalhado.value = []
      logError('useControladoriaVendas', 'carregarPixManualDetalhado', err)
    }
  }

  const carregarAlugueisRecebimentos = async () => {
    try {
      const recebimentos = await fetchRecebimentos()
      const alugueisMapeados = (recebimentos || [])
        .filter(item => {
          const modalidadeNorm = normalizeString(item?.modalidade)
          const texto = modalidadeNorm
          return texto.includes('aluguel') && (
            texto.includes('maquin') ||
            texto.includes('terminal') ||
            texto.includes('pos')
          )
        })
        .map(item => ({
          bandeira: item?.bandeira || 'ALUGUEIS',
          modalidade: item?.modalidade || 'ALUGUEL DE MAQUININHA',
          numero_parcelas: 1,
          valor_bruto: parseFloat(item?.valor_bruto ?? item?.valorBruto ?? 0) || 0,
          valor_liquido: parseFloat(item?.valor_liquido ?? item?.valorLiquido ?? 0) || 0,
          despesa_mdr: Math.abs(parseFloat(item?.despesa_mdr ?? item?.despesaMdr ?? 0) || 0),
          despesa_extra: 0,
          despesa_antecipacao: parseFloat(item?.despesa_antecipacao ?? item?.despesaAntecipacao ?? 0) || 0,
          data_venda: item?.data_venda || item?.dataVenda || item?.data || item?.data_recebimento || '',
          empresa: item?.empresa || '',
          matriz: item?.matriz || '',
          adquirente: item?.adquirente || 'REDE',
          observacoes: item?.observacoes || ''
        }))

      alugueisRecebimentosData.value = alugueisMapeados
      processarDadosVendas()
    } catch (err) {
      alugueisRecebimentosData.value = []
      logError('useControladoriaVendas', 'carregarAlugueisRecebimentos', err)
      processarDadosVendas()
    }
  }

  const carregarVouchersManualTotal = async () => {
    try {
      await fetchVouchersTaxas()
      const totaisVoucher = (vouchersData.value || []).reduce((acc, voucher) => {
        if (!voucher?._table_exists || !voucher?._table_name) return acc
        acc.bruto += parseFloat(voucher?.valor_bruto) || 0
        acc.liquido += parseFloat(voucher?.valor_liquido) || 0
        acc.mdr += (parseFloat(voucher?.despesa_mdr) || 0) + (parseFloat(voucher?.despesa_extra) || 0)
        return acc
      }, { bruto: 0, liquido: 0, mdr: 0 })

      vouchersManualBrutoTotal.value = totaisVoucher.bruto
      vouchersManualLiquidoTotal.value = totaisVoucher.liquido
      vouchersManualMdrTotal.value = totaisVoucher.mdr
    } catch (err) {
      vouchersManualBrutoTotal.value = 0
      vouchersManualLiquidoTotal.value = 0
      vouchersManualMdrTotal.value = 0
      logError('useControladoriaVendas', 'carregarVouchersManualTotal', err)
    }
  }

  const isAluguelMaquina = (modalidade) => {
    const modalidadeNorm = normalizeString(modalidade)
    const texto = modalidadeNorm
    return texto.includes('aluguel') && (
      texto.includes('maquin') ||
      texto.includes('terminal') ||
      texto.includes('pos')
    )
  }

  const sortByAdquirente = (a, b) => {
    const bottomOrder = { PIX: 0, ALUGUEIS: 1 }
    const bottomA = Object.prototype.hasOwnProperty.call(bottomOrder, a.adquirente)
    const bottomB = Object.prototype.hasOwnProperty.call(bottomOrder, b.adquirente)
    if (bottomA && bottomB) return bottomOrder[a.adquirente] - bottomOrder[b.adquirente]
    if (bottomA && !bottomB) return 1
    if (!bottomA && bottomB) return -1

    const indexA = ordemBandeiras.indexOf(a.adquirente)
    const indexB = ordemBandeiras.indexOf(b.adquirente)
    if (indexA !== -1 && indexB !== -1) return indexA - indexB
    if (indexA !== -1 && indexB === -1) return -1
    if (indexA === -1 && indexB !== -1) return 1
    return a.adquirente.localeCompare(b.adquirente)
  }
  
  // Função para processar dados de vendas (substituindo busca do Supabase)
  const processarDadosVendas = () => {
    const dadosVendas = vendas.value || vendasOriginais.value || []
    if (dadosVendas.length === 0 && alugueisRecebimentosData.value.length === 0) {
      vendasData.value = []
      return []
    }
    
    // Mapear dados de vendas para formato esperado pela controladoria
    const dadosMapeados = dadosVendas.map(venda => {
      // Mapear campos da estrutura de vendas para estrutura da controladoria
      return {
        bandeira: venda.bandeira || '',
        modalidade: venda.modalidade || venda.tipoTransacao || '',
        numero_parcelas: venda.numeroParcelas || venda.parcelas || 1,
        valor_bruto: parseFloat(venda.vendaBruta || venda.valor_bruto || 0),
        valor_liquido: parseFloat(venda.vendaLiquida || venda.valor_liquido || 0),
        despesa_mdr: parseFloat(venda.despesa_mdr || venda.despesaMdr || venda.mdr || 0),
        despesa_extra: parseFloat(venda.despesa_extra || venda.despesaExtra || 0),
        despesa_antecipacao: parseFloat(venda.despesa_antecipacao || venda.despesaAntecipacao || venda.despesasAntecipacao || 0),
        data_venda: venda.dataVenda || venda.data_venda || venda.data,
        empresa: venda.empresa || '',
        matriz: venda.matriz || '',
        adquirente: normalizarAdquirenteResumo(venda.adquirente || ''),
        observacoes: venda.observacoes || ''
      }
    })
    
    // Verificar se há registros VISA Débito
    const visaDebito = dadosMapeados.filter(item => 
      item.bandeira?.toLowerCase().includes('visa') && 
      item.modalidade?.toLowerCase().includes('debito')
    )
    
    
    const dadosConsolidados = [...dadosMapeados, ...alugueisRecebimentosData.value]
    vendasData.value = dadosConsolidados
    return dadosConsolidados
  }
  
  // Função para buscar dados (mantendo compatibilidade com código existente)
  const buscarVendasUnica = async (filtros = {}) => {
    loading.value = true
    error.value = null
    
    try {
      // Processar dados de vendas já carregados
      await carregarAlugueisRecebimentos()
      const dados = processarDadosVendas()
      return dados
      
    } catch (err) {
      error.value = `Erro ao processar dados: ${err.message}`
      logError('useControladoriaVendas', 'buscarVendasUnica', err)
      vendasData.value = []
      return []
      
    } finally {
      loading.value = false
    }
  }
  
  // Computed para agrupar dados por bandeira classificada
  const vendasAgrupadas = computed(() => {
    const grupos = {}
    
    vendasData.value.forEach((venda, index) => {
      const bandeiraClassificada = isVoucherBrand(venda.adquirente)
        ? String(venda.adquirente || '').trim().toUpperCase()
        : classificarBandeira(venda.bandeira, venda.modalidade)
      const modalidadePagamento = determinarModalidade(venda.modalidade, venda.numero_parcelas, venda.bandeira)
      
      if (!grupos[bandeiraClassificada]) {
        grupos[bandeiraClassificada] = {
          adquirente: bandeiraClassificada,
          debito: 0,
          credito: 0,
          credito2x: 0,
          credito3x: 0,
          credito4x5x6x: 0,
          voucher: 0,
          outros: 0,
          valor_bruto_total: 0,
          valor_liquido_total: 0,
          despesa_mdr_total: 0,
          despesa_antecipacao_total: 0
        }
      }
      
      const grupo = grupos[bandeiraClassificada]
      const valorBruto = parseFloat(venda.valor_bruto) || 0
      const despesaMdrBase = parseFloat(venda.despesa_mdr) || 0
      const despesaAntecipacao = parseFloat(venda.despesa_antecipacao) || 0
      const isAluguel = isAluguelMaquina(venda.modalidade)
      const despesaMdr = isAluguel
        ? despesaMdrBase
        : (despesaMdrBase + (parseFloat(venda.despesa_extra) || 0))
      const valorBaseModalidade = isAluguel
        ? 0
        : valorBruto
      const considerarDespesaAntecipacao = modalidadePagamento !== 'voucher' && bandeiraClassificada !== 'PIX'
      const despesaAntecipacaoConsiderada = considerarDespesaAntecipacao ? despesaAntecipacao : 0
      
      // Somar valores por modalidade - USAR VALOR_BRUTO para as modalidades
      grupo[modalidadePagamento] += valorBaseModalidade
      grupo.valor_bruto_total += valorBruto
      grupo.valor_liquido_total += valorBruto - despesaMdr - despesaAntecipacaoConsiderada
      grupo.despesa_mdr_total += despesaMdr
      grupo.despesa_antecipacao_total += despesaAntecipacaoConsiderada
    })
    
    const resultado = Object.values(grupos)
    
    // Ordenar resultado conforme a sequência especificada
    const resultadoOrdenado = resultado.sort(sortByAdquirente)
    
    return resultadoOrdenado
  })

  const gruposPorAdquirente = computed(() => {
    const grupos = {}
    const acumularGrupo = (venda) => {
      const bandeiraClassificada = isVoucherBrand(venda.adquirente)
        ? String(venda.adquirente || '').trim().toUpperCase()
        : classificarBandeira(venda.bandeira, venda.modalidade)
      const modalidadePagamento = determinarModalidade(venda.modalidade, venda.numero_parcelas, venda.bandeira)
      const adquirenteKey = isVoucherBrand(venda.adquirente) ? 'Vouchers' : normalizarAdquirenteResumo(venda.adquirente || '')
      if (!grupos[adquirenteKey]) {
        grupos[adquirenteKey] = {
          adquirente: adquirenteKey,
          linhas: {},
          totais: {
            vendaLiquida: 0,
            vendaBruta: 0,
            despesaMdr: 0,
            debito: 0,
            credito: 0,
            credito2x: 0,
            credito3x: 0,
            credito4x5x6x: 0,
            voucher: 0,
            outros: 0,
            despesaAntecipacao: 0
          }
        }
      }
      const grupo = grupos[adquirenteKey]
      if (!grupo.linhas[bandeiraClassificada]) {
        grupo.linhas[bandeiraClassificada] = {
          adquirente: bandeiraClassificada,
          debito: 0,
          credito: 0,
          credito2x: 0,
          credito3x: 0,
          credito4x5x6x: 0,
          voucher: 0,
          outros: 0,
          valor_bruto_total: 0,
          valor_liquido_total: 0,
          despesa_mdr_total: 0,
          despesa_antecipacao_total: 0
        }
      }
      const linha = grupo.linhas[bandeiraClassificada]
      const valorBruto = parseFloat(venda.valor_bruto) || 0
      const despesaMdrBase = parseFloat(venda.despesa_mdr) || 0
      const despesaAntecipacao = parseFloat(venda.despesa_antecipacao) || 0
      const isAluguel = isAluguelMaquina(venda.modalidade)
      const despesaMdr = isAluguel
        ? despesaMdrBase
        : (despesaMdrBase + (parseFloat(venda.despesa_extra) || 0))
      const valorBaseModalidade = isAluguel
        ? 0
        : valorBruto
      const considerarDespesaAntecipacao = modalidadePagamento !== 'voucher' && bandeiraClassificada !== 'PIX'
      const despesaAntecipacaoConsiderada = considerarDespesaAntecipacao ? despesaAntecipacao : 0
      linha[modalidadePagamento] += valorBaseModalidade
      linha.valor_bruto_total += valorBruto
      linha.valor_liquido_total += valorBruto - despesaMdr - despesaAntecipacaoConsiderada
      linha.despesa_mdr_total += despesaMdr
      linha.despesa_antecipacao_total += despesaAntecipacaoConsiderada
      grupo.totais.vendaBruta += valorBruto
      grupo.totais.vendaLiquida += valorBruto - despesaMdr - despesaAntecipacaoConsiderada
      grupo.totais.despesaMdr += despesaMdr
      grupo.totais.despesaAntecipacao += despesaAntecipacaoConsiderada
      grupo.totais[modalidadePagamento] += valorBaseModalidade
    }

    vendasData.value.forEach(acumularGrupo)
    pixManualDetalhado.value.forEach(acumularGrupo)

    const resultado = Object.values(grupos).map(g => ({
      adquirente: g.adquirente,
      vendasData: Object.values(g.linhas).sort(sortByAdquirente),
      totais: g.totais
    }))
    return resultado
  })
  
  // Computed para totais gerais
  const totaisGerais = computed(() => {
    const totalPix = vendasData.value.reduce((acc, venda) => {
      const modalidadeNorm = normalizeString(venda.modalidade)
      if (modalidadeNorm.includes('pix') || modalidadeNorm.includes('pixqr') || modalidadeNorm.includes('pixqrcode') || modalidadeNorm.includes('qrcode')) {
        return acc + (parseFloat(venda.valor_bruto) || 0)
      }
      return acc
    }, 0)

    const totais = vendasAgrupadas.value.reduce((acc, grupo) => {
      acc.vendaLiquida += grupo.valor_liquido_total
      acc.vendaBruta += grupo.valor_bruto_total
      acc.despesaMdr += grupo.despesa_mdr_total
      acc.despesaAntecipacao += grupo.despesa_antecipacao_total
      acc.debito += grupo.debito
      acc.credito += grupo.credito
      acc.credito2x += grupo.credito2x
      acc.credito3x += grupo.credito3x
      acc.credito4x5x6x += grupo.credito4x5x6x
      acc.voucher += grupo.voucher
      acc.outros += grupo.outros
      return acc
    }, {
      vendaLiquida: 0,
      vendaBruta: 0,
      despesaMdr: 0,
      despesaAntecipacao: 0,
      pix: totalPix + pixManualTotal.value,
      debito: 0,
      credito: 0,
      credito2x: 0,
      credito3x: 0,
      credito4x5x6x: 0,
      voucher: 0,
      outros: 0
    })

    totais.vendaBruta += pixManualTotal.value + vouchersManualBrutoTotal.value
    totais.vendaLiquida += pixManualLiquidoTotal.value + vouchersManualLiquidoTotal.value
    totais.despesaMdr += pixManualMdrTotal.value + vouchersManualMdrTotal.value
    totais.voucher += vouchersManualBrutoTotal.value

    totais.taxaMedia = totais.vendaBruta > 0
      ? Number(((totais.despesaMdr / totais.vendaBruta) * 100).toFixed(2))
      : 0

    return totais
  })
  
  // Watchers para sincronização automática
  watch([vendas, vendasOriginais], () => {
    processarDadosVendas()
  }, { immediate: true })
  
  // Sincronizar loading e error states
  watch(vendasLoading, (newLoading) => {
    loading.value = newLoading
  })
  
  watch(vendasError, (newError) => {
    error.value = newError
  })

  watch(
    () => [
      filtrosGlobais.empresaSelecionada,
      filtrosGlobais.dataInicial,
      filtrosGlobais.dataFinal,
      pixVendasStatsVersion.value
    ],
    () => {
      carregarPixManualTotal()
      carregarPixManualDetalhado()
      carregarAlugueisRecebimentos()
      carregarVouchersManualTotal()
    },
    { immediate: true }
  )
  
  return {
    // Estados
    vendasData,
    loading,
    error,
    
    // Computed
    vendasAgrupadas,
    totaisGerais,
    gruposPorAdquirente,
    
    // Métodos
    buscarVendasUnica,
    processarDadosVendas,
    classificarBandeira,
    determinarModalidade,
    normalizeString
  }
}
