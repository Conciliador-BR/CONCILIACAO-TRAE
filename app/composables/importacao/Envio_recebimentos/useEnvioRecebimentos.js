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
        const out = {}
        for (const k of allowedFields) {
          if (r[k] !== undefined) out[k] = r[k]
        }
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