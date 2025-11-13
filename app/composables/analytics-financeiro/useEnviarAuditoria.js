import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import { useTableNameBuilder } from '~/composables/PageVendas/filtrar_tabelas/useTableNameBuilder'
import { useConciliacaoVendasRecebimentos } from './useConciliacaoVendasRecebimentos'

export const useEnviarAuditoria = () => {
  const { construirNomeTabela } = useTableNameBuilder()
  const { conciliados, recarregar } = useConciliacaoVendasRecebimentos()

  const epsilonFor = (valor) => Math.max(0.10, Number(valor || 0) * 0.001)

  const findVendaIdFallback = async (table, row) => {
    const valor = Number(row.vendaBruta || 0)
    const eps = epsilonFor(valor)
    // Buscar por NSU e Data, restringindo por bandeira e intervalo de valor
    let query = supabase
      .from(table)
      .select('id, nsu, data_venda, bandeira, valor_bruto')
      .eq('nsu', row.nsu)

    if (row.dataVenda) query = query.eq('data_venda', row.dataVenda)
    if (row.bandeira) query = query.eq('bandeira', row.bandeira)

    const { data, error } = await query.limit(50)
    if (error || !data) return null
    // Escolher ID com menor diferença de valor
    let best = null
    let bestDelta = Infinity
    for (const d of data) {
      const delta = Math.abs(Number(d.valor_bruto || 0) - valor)
      if (delta <= eps && delta < bestDelta) {
        best = d
        bestDelta = delta
      }
    }
    return best?.id || null
  }

  const enviarAuditoria = async () => {
    const dados = conciliados.value || []
    if (dados.length === 0) return { updated: 0, skipped: 0, errors: 0 }

    const groups = new Map()
    for (const r of dados) {
      const key = `${r.empresa}||${r.adquirente}`
      const arr = groups.get(key) || []
      arr.push(r)
      groups.set(key, arr)
    }

    let updated = 0
    let skipped = 0
    let errors = 0

    for (const [key, rows] of groups) {
      const [empresa, operadora] = key.split('||')
      const table = construirNomeTabela(empresa, operadora)

      const chunkSize = 1000
      for (let start = 0; start < rows.length; start += chunkSize) {
        const chunk = rows.slice(start, start + chunkSize)
        for (const r of chunk) {
          try {
            const auditoriaStatus = r.auditoria || 'Não conciliado'
            let targetId = r.vendaId || null
            if (!targetId) {
              targetId = await findVendaIdFallback(table, r)
            }
            if (!targetId) {
              skipped++
              continue
            }
            const { error: updErr } = await supabase
              .from(table)
              .update({ auditoria: auditoriaStatus })
              .eq('id', targetId)
            if (updErr) {
              errors++
            } else {
              updated++
            }
          } catch {
            errors++
          }
        }
      }
    }

    try { await recarregar() } catch {}
    return { updated, skipped, errors }
  }

  return { enviarAuditoria }
}

