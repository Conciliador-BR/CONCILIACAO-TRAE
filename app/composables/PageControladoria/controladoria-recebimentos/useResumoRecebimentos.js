import { computed } from 'vue'

export const useResumoRecebimentos = (recebimentos) => {
  const normalizeText = (text) => String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  const resumoCalculado = computed(() => {
    if (!recebimentos.value || !Array.isArray(recebimentos.value) || recebimentos.value.length === 0) {
      return {
        recebimentosBrutos: 0,
        recebimentosLiquidos: 0,
        taxa: 0,
        taxaMedia: 0,
        debitos: 0,
        totalLiquido: 0
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

    return {
      recebimentosBrutos,
      recebimentosLiquidos,
      taxa,
      taxaMedia,
      debitos,
      totalLiquido
    }
  })

  return { resumoCalculado }
}
