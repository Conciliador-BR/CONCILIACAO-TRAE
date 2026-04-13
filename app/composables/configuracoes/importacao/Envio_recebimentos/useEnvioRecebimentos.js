import { ref } from 'vue'
import { useAPIsupabase } from '~/composables/useAPIsupabase'

export const useEnvioRecebimentos = () => {
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
        'data_venda',
        'data_recebimento',
        'modalidade',
        'nsu',
        'valor_bruto',
        'valor_liquido',
        'taxa_mdr',
        'despesa_mdr',
        'numero_parcelas',
        'bandeira',
        'valor_antecipacao',
        'despesa_antecipacao',
        'valor_liquido_antecipacao',
        'empresa',
        'matriz',
        'adquirente'
      ]

      const payload = recebimentos.map((r) => {
        // Sanitização e fallbacks
        // Sentinel para casos sem data de venda (Postgres não aceita 0000-00-00)
        const dataVenda = r.data_venda || '0001-01-01'
        const numeroParcelas = typeof r.numero_parcelas === 'number' ? r.numero_parcelas : parseInt(r.numero_parcelas || 0)
        const valorBruto = typeof r.valor_bruto === 'number' ? r.valor_bruto : parseFloat(r.valor_bruto || 0)
        const valorLiquido = typeof r.valor_liquido === 'number' ? r.valor_liquido : parseFloat(r.valor_liquido || 0)
        const despesaMdr = typeof r.despesa_mdr === 'number' ? r.despesa_mdr : parseFloat(r.despesa_mdr || 0)
        const taxaMdr = typeof r.taxa_mdr === 'number' ? r.taxa_mdr : parseFloat(r.taxa_mdr || 0)
        const valorAntecipacao = typeof r.valor_antecipacao === 'number' ? r.valor_antecipacao : parseFloat(r.valor_antecipacao || 0)
        const despesaAntecipacao = typeof r.despesa_antecipacao === 'number' ? r.despesa_antecipacao : parseFloat(r.despesa_antecipacao || 0)
        const valorLiquidoAntecipacao = typeof r.valor_liquido_antecipacao === 'number' ? r.valor_liquido_antecipacao : parseFloat(r.valor_liquido_antecipacao || 0)
        const bandeira = (r.bandeira || '').toString().trim().toUpperCase()
        const modalidade = (r.modalidade || '').toString().trim().toUpperCase()
        const nsu = (r.nsu || '').toString().trim()
        const empresaField = r.empresa || empresa || ''
        const adquirenteField = r.adquirente || operadora || ''

        const out = {}
        const base = {
          data_venda: dataVenda,
          data_recebimento: r.data_recebimento || null,
          modalidade,
          nsu,
          valor_bruto: valorBruto,
          valor_liquido: valorLiquido,
          taxa_mdr: taxaMdr,
          despesa_mdr: despesaMdr,
          numero_parcelas: numeroParcelas,
          bandeira,
          valor_antecipacao: valorAntecipacao,
          despesa_antecipacao: despesaAntecipacao,
          valor_liquido_antecipacao: valorLiquidoAntecipacao,
          empresa: empresaField,
          matriz: r.matriz || null,
          adquirente: adquirenteField
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