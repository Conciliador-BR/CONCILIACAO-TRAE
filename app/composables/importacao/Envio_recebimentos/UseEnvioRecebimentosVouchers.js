import { ref } from 'vue'
import { useAPIsupabase } from '~/composables/useAPIsupabase'

export const useEnvioRecebimentosVouchers = () => {
  const { insertData, error: supabaseError } = useAPIsupabase()
  const enviando = ref(false)

  const construirNomeTabela = (empresa, operadora) => {
    if (!empresa || !operadora) {
      throw new Error('Empresa e operadora são obrigatórias para determinar a tabela')
    }
    const normalizar = (s) =>
      String(s).toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
    const nomeTabela = `recebimento_${normalizar(empresa)}_${normalizar(operadora)}`
    return nomeTabela
  }

  const enviarRecebimentosParaSupabase = async (recebimentos, empresa = null, operadora = null) => {
    if (!recebimentos || recebimentos.length === 0) {
      throw new Error('Nenhum recebimento para enviar')
    }
    if (!empresa && recebimentos[0]?.empresa) empresa = recebimentos[0].empresa
    if (!operadora && recebimentos[0]?.adquirente) operadora = recebimentos[0].adquirente

    const nomeTabela = construirNomeTabela(empresa, operadora)
    enviando.value = true

    try {
      const allowedFields = [
        'adquirente',
        'modalidade',
        'nsu',
        'data_venda',
        'data_pgto',
        'valor_bruto',
        'despesa_mdr',
        'valor_liquido',
        'ec',
        'empresa',
        'created_at',
        'despesa_extra'
      ]

      const payload = recebimentos.map((r) => {
        const valorBruto = typeof r.valor_bruto === 'number' ? r.valor_bruto : parseFloat(r.valor_bruto || 0)
        const valorLiquido = typeof r.valor_liquido === 'number' ? r.valor_liquido : parseFloat(r.valor_liquido || 0)
        const despesaMdrRaw = r.despesa_mdr ?? r.despesa ?? 0
        const despesaMdr = typeof despesaMdrRaw === 'number' ? despesaMdrRaw : parseFloat(despesaMdrRaw || 0)
        const despesaExtraRaw = r.despesa_extra ?? 0
        const despesaExtra = typeof despesaExtraRaw === 'number' ? despesaExtraRaw : parseFloat(despesaExtraRaw || 0)

        const modalidade = (r.modalidade || '').toString().trim().toUpperCase()
        const nsu = (r.nsu || '').toString().trim()
        const ecField = (r.ec || '').toString().trim()
        const empresaField = r.empresa || empresa || ''
        const adquirenteField = (r.adquirente || operadora || '').toString().trim().toUpperCase()

        const out = {}
        const base = {
          adquirente: adquirenteField,
          modalidade,
          nsu,
          data_venda: r.data_venda || '0001-01-01',
          data_pgto: r.data_pgto || r.data_recebimento || null,
          valor_bruto: valorBruto,
          despesa_mdr: despesaMdr,
          valor_liquido: valorLiquido,
          ec: ecField || null,
          empresa: empresaField,
          created_at: r.created_at || undefined,
          despesa_extra: despesaExtra || undefined
        }
        for (const k of allowedFields) { if (base[k] !== undefined) out[k] = base[k] }
        return out
      })

      const resultado = await insertData(nomeTabela, payload)
      if (!resultado) throw new Error(supabaseError?.value || 'Falha ao inserir recebimentos no Supabase')
      return resultado
    } finally {
      enviando.value = false
    }
  }

  return { enviando, enviarRecebimentosParaSupabase, construirNomeTabela }
}

