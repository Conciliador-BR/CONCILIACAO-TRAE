import { computed, ref } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig.js'

export const useCriarTabelasSupabase = () => {
  const loading = ref(false)
  const erro = ref('')
  const resultado = ref(null)

  const buildFriendlyErrorMessage = (error) => {
    const message = error?.message || 'Erro ao criar tabelas'

    if (
      message.includes('admin_create_tables_from_form')
      && message.includes('schema cache')
    ) {
      return 'A função RPC admin_create_tables_from_form ainda não existe no projeto Supabase conectado. Falta executar a migration supabase/migrations/admin_create_tables_from_form.sql no banco atual e atualizar o schema cache do Supabase.'
    }

    return message
  }

  const normalizeIdentifier = (value) => {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/-/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  const uniq = (arr) => {
    const out = []
    const seen = new Set()
    for (const x of arr || []) {
      const k = String(x || '').trim().toLowerCase()
      if (!k || seen.has(k)) continue
      seen.add(k)
      out.push(String(x || '').trim())
    }
    return out
  }

  const buildTableNames = ({ empresa, adquirentes, vouchers, bancos, pix }) => {
    const emp = normalizeIdentifier(empresa)
    if (!emp) return []

    const adquirentesUniq = uniq(adquirentes)
    const vouchersUniq = uniq(vouchers)
    const bancosUniq = uniq(bancos)

    const providers = [...adquirentesUniq, ...vouchersUniq]
    const tables = []

    for (const p of providers) {
      const prov = normalizeIdentifier(p)
      if (!prov) continue
      tables.push(`vendas_${emp}_${prov}`)
      tables.push(`recebimento_${emp}_${prov}`)
    }

    for (const b of bancosUniq) {
      const bank = normalizeIdentifier(b)
      if (!bank) continue
      tables.push(`banco_${bank}_${emp}`)
    }

    if (pix) {
      tables.push(`vendas_pix_${emp}`)
      tables.push(`recebimento_pix_${emp}`)
    }

    return tables
  }

  const getTableColumnPreviews = () => ({
    vendas: {
      titulo: 'Vendas',
      descricao: 'Estrutura das tabelas `vendas_empresa_operadora`',
      colunas: [
        'id',
        'data_venda',
        'previsao_pgto',
        'modalidade',
        'nsu',
        'valor_bruto',
        'valor_liquido',
        'taxa_mdr',
        'despesa_mdr',
        'despesa_extra',
        'numero_parcelas',
        'bandeira',
        'valor_antecipacao',
        'despesa_antecipacao',
        'valor_liquido_antecipacao',
        'empresa',
        'matriz',
        'adquirente',
        'auditoria',
        'observacoes',
        'created_at'
      ]
    },
    recebimentos: {
      titulo: 'Recebimentos',
      descricao: 'Estrutura das tabelas `recebimento_empresa_operadora`',
      colunas: [
        'id',
        'data_venda',
        'data_recebimento',
        'data_pgto',
        'modalidade',
        'nsu',
        'valor_bruto',
        'valor_liquido',
        'valor_previsto',
        'valor_depositado',
        'taxa_mdr',
        'despesa_mdr',
        'numero_parcelas',
        'bandeira',
        'valor_antecipacao',
        'despesa_antecipacao',
        'valor_liquido_antecipacao',
        'empresa',
        'matriz',
        'adquirente',
        'auditoria',
        'despesa_extra',
        'observacoes',
        'created_at'
      ]
    },
    banco: {
      titulo: 'Banco',
      descricao: 'Estrutura das tabelas `banco_nome_empresa`',
      colunas: [
        'id',
        'data',
        'descricao',
        'documento',
        'valor',
        'empresa',
        'matriz',
        'created_at'
      ]
    },
    pix: {
      titulo: 'PIX',
      descricao: 'Estrutura das tabelas `vendas_pix_empresa` e `recebimento_pix_empresa`',
      grupos: [
        {
          titulo: 'Vendas PIX',
          colunas: [
            'id',
            'data_venda',
            'previsao_pgto',
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
            'valor_depositado',
            'empresa',
            'matriz',
            'adquirente',
            'auditoria',
            'observacoes',
            'created_at'
          ]
        },
        {
          titulo: 'Recebimento PIX',
          colunas: [
            'id',
            'data_venda',
            'data_recebimento',
            'data_pgto',
            'modalidade',
            'nsu',
            'valor_bruto',
            'valor_liquido',
            'valor_previsto',
            'taxa_mdr',
            'despesa_mdr',
            'numero_parcelas',
            'bandeira',
            'valor_antecipacao',
            'despesa_antecipacao',
            'valor_liquido_antecipacao',
            'valor_depositado',
            'empresa',
            'matriz',
            'adquirente',
            'auditoria',
            'despesa_extra',
            'observacoes',
            'created_at'
          ]
        }
      ]
    }
  })

  const resetResultado = () => {
    erro.value = ''
    resultado.value = null
  }

  const criarTabelas = async ({ empresa, adquirentes, vouchers, bancos, pix }) => {
    loading.value = true
    erro.value = ''
    resultado.value = null

    try {
      const empresaNorm = normalizeIdentifier(empresa)
      if (!empresaNorm) throw new Error('Informe a empresa')

      const adquirentesNorm = uniq(adquirentes)
        .map((item) => normalizeIdentifier(item))
        .filter(Boolean)

      const vouchersNorm = uniq(vouchers)
        .map((item) => normalizeIdentifier(item))
        .filter(Boolean)

      const bancosNorm = uniq(bancos)
        .map((item) => normalizeIdentifier(item))
        .filter(Boolean)

      const params = {
        p_empresa: empresaNorm,
        p_adquirentes: adquirentesNorm,
        p_vouchers: vouchersNorm,
        p_bancos: bancosNorm,
        p_pix: Boolean(pix)
      }

      const { data, error } = await supabase.rpc('admin_create_tables_from_form', params)
      if (error) throw error
      resultado.value = data
      return data
    } catch (e) {
      erro.value = buildFriendlyErrorMessage(e)
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading: computed(() => loading.value),
    erro: computed(() => erro.value),
    resultado: computed(() => resultado.value),
    normalizeIdentifier,
    buildTableNames,
    getTableColumnPreviews,
    criarTabelas,
    resetResultado
  }
}
