import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import { useTableNameBuilder } from '~/composables/PageVendas/filtrar_tabelas/useTableNameBuilder'
import { useConciliacaoVendasRecebimentos } from './useConciliacaoVendasRecebimentos'
import { useSecureLogger } from '~/composables/useSecureLogger'

export const useEnviarAuditoria = () => {
  const { construirNomeTabela } = useTableNameBuilder()
  const { conciliados, recarregar } = useConciliacaoVendasRecebimentos()
  const { info, warn, error, log } = useSecureLogger()

  const epsilonFor = (valor) => Math.max(0.10, Number(valor || 0) * 0.001)

  const findVendaIdFallback = async (table, row) => {
    const valor = Number(row.vendaBruta || 0)
    const eps = epsilonFor(valor)
    info('auditoria.fallback.start', { table })
    // Buscar por NSU e Data, restringindo por bandeira e intervalo de valor
    let query = supabase
      .from(table)
      .select('id, nsu, data_venda, bandeira, valor_bruto')
      .eq('nsu', row.nsu)

    if (row.dataVenda) query = query.eq('data_venda', row.dataVenda)
    if (row.bandeira) query = query.eq('bandeira', row.bandeira)

    const { data, error: qErr } = await query.limit(50)
    if (qErr) {
      warn('auditoria.fallback.query.error', { code: qErr.code, message: qErr.message })
      return null
    }
    if (!data) return null
    info('auditoria.fallback.results', { count: data.length })
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
    const id = best?.id || null
    info('auditoria.fallback.best', { id })
    return id
  }

  const enviarAuditoria = async () => {
    const dados = conciliados.value || []
    if (dados.length === 0) {
      warn('auditoria.send.noData')
      return { updated: 0, skipped: 0, errors: 0 }
    }
    info('auditoria.send.start', { total: dados.length })

    const groups = new Map()
    for (const r of dados) {
      const key = `${r.empresa}||${r.adquirente}`
      const arr = groups.get(key) || []
      arr.push(r)
      groups.set(key, arr)
    }
    info('auditoria.send.groups', { count: groups.size })

    let updated = 0
    let skipped = 0
    let errors = 0

    for (const [key, rows] of groups) {
      const [empresa, operadora] = key.split('||')
      const table = construirNomeTabela(empresa, operadora)
      info('auditoria.group.start', { table, rows: rows.length })

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
              warn('auditoria.update.skip.noId', { table })
              skipped++
              continue
            }
            const { error: updErr } = await supabase
              .from(table)
              .update({ auditoria: auditoriaStatus })
              .eq('id', targetId)
            if (updErr) {
              error('auditoria.update.error', { code: updErr.code, message: updErr.message })
              errors++
            } else {
              log('auditoria.update.ok', { table })
              updated++
            }
          } catch (e) {
            error('auditoria.update.exception', { message: e?.message })
            errors++
          }
        }
      }
    }

    try { await recarregar() } catch (e) { warn('auditoria.reload.error', { message: e?.message }) }
    const result = { updated, skipped, errors }
    info('auditoria.send.done', result)
    return result
  }

  return { enviarAuditoria }
}
