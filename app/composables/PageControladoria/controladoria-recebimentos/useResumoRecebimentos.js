import { computed } from 'vue'

export const useResumoRecebimentos = (recebimentos) => {
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

    const modalidadesDebito = ['mensalidade', 'ajustes', 'aluguel de maquina', 'aluguel', 'descontos']
    const bandeirasDebito = ['mensalidade', 'ajustes', 'aluguel de maquina', 'aluguel', 'descontos']
    const recebimentosDebito = recebimentos.value.filter(r => {
      const modalidade = (r.modalidade || '').toLowerCase()
      const bandeira = (r.bandeira || '').toLowerCase()
      return modalidadesDebito.some(mod => modalidade.includes(mod)) || bandeirasDebito.some(b => bandeira.includes(b))
    })
    const debitos = recebimentosDebito.reduce((sum, r) => sum + Math.abs(parseFloat(r.valorBruto) || 0), 0)

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