import { computed } from 'vue'

export const useResumoRecebimentos = (recebimentos) => {
  const normalizeText = (text) => String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  const normalizeKey = (text) => String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()

  const isVoucherLikeText = (text) => {
    const modalidade = normalizeText(text)
    return (
      modalidade.includes('voucher') ||
      modalidade.includes('alimentacao') ||
      modalidade.includes('refeicao') ||
      modalidade.includes('multibenef') ||
      modalidade.includes('beneficio') ||
      /\bpat\b/.test(modalidade)
    )
  }

  const voucherBrands = new Set([
    'alelo', 'ticket', 'vr', 'sodexo', 'pluxe', 'pluxee', 'comprocard', 'lecard', 'upbrasil',
    'ecxcard', 'fncard', 'benvisa', 'credshop', 'rccard', 'goodcard', 'bigcard', 'bkcard',
    'greencard', 'brasilcard', 'boltcard', 'verocard', 'facecard', 'valecard', 'naip',
    'nutricash', 'libercard'
  ])

  const getValorLiquido = (registro) => (
    parseFloat(
      registro?.valorLiquido ??
      registro?.valor_liquido ??
      registro?.valorRecebido ??
      registro?.valor_recebido ??
      0
    ) || 0
  )

  const isPix = (registro) => {
    const modalidade = normalizeText(registro?.modalidade ?? registro?.tipoTransacao ?? registro?.tipo_transacao)
    const bandeira = normalizeText(registro?.bandeira)
    const adquirente = normalizeText(registro?.adquirente)
    const texto = `${modalidade} ${bandeira} ${adquirente}`.trim()
    return texto.includes('pix') || texto.includes('qrcode')
  }

  const isVoucher = (registro) => {
    const modalidade = normalizeText(registro?.modalidade ?? registro?.tipoTransacao ?? registro?.tipo_transacao)
    const bandeira = normalizeKey(registro?.bandeira)
    const adquirente = normalizeKey(registro?.adquirente)
    if (isVoucherLikeText(`${registro?.bandeira || ''} ${registro?.modalidade || registro?.tipoTransacao || registro?.tipo_transacao || ''}`)) return true
    return voucherBrands.has(bandeira) || voucherBrands.has(adquirente)
  }

  const resumoCalculado = computed(() => {
    if (!recebimentos.value || !Array.isArray(recebimentos.value) || recebimentos.value.length === 0) {
      return {
        recebimentosBrutos: 0,
        recebimentosLiquidos: 0,
        taxa: 0,
        taxaMedia: 0,
        debitos: 0,
        totalLiquido: 0,
        pix: 0,
        voucher: 0
      }
    }

    const recebimentosBrutos = recebimentos.value.reduce((sum, r) => sum + (parseFloat(r.valorBruto) || 0), 0)
    const taxa = recebimentos.value.reduce((sum, r) => sum + (parseFloat(r.despesaMdr) || 0), 0)
    const recebimentosLiquidos = recebimentos.value.reduce((sum, r) => sum + (parseFloat(r.valorLiquido || r.valorRecebido) || 0), 0)

    const recebimentosDebito = recebimentos.value.filter(r => {
      const modalidade = normalizeText(r.modalidade)
      const bandeira = normalizeText(r.bandeira)
      const texto = `${modalidade} ${bandeira}`.trim()
      const isAluguelMaquina = texto.includes('aluguel') && (texto.includes('maquin') || texto.includes('terminal') || texto.includes('pos'))
      const isDebitoFixo = texto.includes('mensalidade') || texto.includes('ajuste') || texto.includes('desconto')
      return isAluguelMaquina || isDebitoFixo
    })
    const debitos = recebimentosDebito.reduce((sum, r) => {
      const valorBruto = Math.abs(parseFloat(r.valorBruto) || 0)
      const despesaMdr = Math.abs(parseFloat(r.despesaMdr) || 0)
      return sum + (valorBruto > 0 ? valorBruto : despesaMdr)
    }, 0)

    const totalLiquido = recebimentosLiquidos - debitos
    const taxaMedia = recebimentosBrutos > 0 ? parseFloat(((taxa / recebimentosBrutos) * 100).toFixed(2)) : 0
    const pix = recebimentos.value.reduce((sum, r) => {
      if (!isPix(r)) return sum
      return sum + getValorLiquido(r)
    }, 0)
    const voucher = recebimentos.value.reduce((sum, r) => {
      if (!isVoucher(r)) return sum
      return sum + getValorLiquido(r)
    }, 0)

    return {
      recebimentosBrutos,
      recebimentosLiquidos,
      taxa,
      taxaMedia,
      debitos,
      totalLiquido,
      pix,
      voucher
    }
  })

  return { resumoCalculado }
}
