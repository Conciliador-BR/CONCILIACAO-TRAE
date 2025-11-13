import { ref, computed } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import { useTableNameBuilder } from '~/composables/PageVendas/filtrar_tabelas/useTableNameBuilder'
import { useConciliacaoVendasRecebimentos } from './useConciliacaoVendasRecebimentos'

export const useEnviarAuditoriaComProgresso = () => {
  const { construirNomeTabela } = useTableNameBuilder()
  const { conciliados } = useConciliacaoVendasRecebimentos()

  const visible = ref(false)
  const total = ref(0)
  const processed = ref(0)
  const sent = ref(0)
  const skipped = ref(0)
  const errors = ref(0)
  const message = ref('')

  const percent = computed(() => (total.value ? Math.round((processed.value / total.value) * 100) : 0))

  const epsilonFor = (valor) => Math.max(0.10, Number(valor || 0) * 0.001)

  const resolveIdsByNSU = async (table, rows) => {
    const nsus = Array.from(new Set(rows.map(r => String(r.nsu))))
    if (nsus.length === 0) return new Map()
    const chunk = 1000
    const map = new Map()
    for (let i = 0; i < nsus.length; i += chunk) {
      const slice = nsus.slice(i, i + chunk)
      const { data } = await supabase
        .from(table)
        .select('id, nsu, data_venda, bandeira, valor_bruto')
        .in('nsu', slice)
      const byNSU = new Map()
      for (const d of data || []) {
        const key = String(d.nsu)
        const arr = byNSU.get(key) || []
        arr.push(d)
        byNSU.set(key, arr)
      }
      for (const r of rows) {
        const candid = byNSU.get(String(r.nsu)) || []
        const valor = Number(r.vendaBruta || 0)
        const eps = epsilonFor(valor)
        let best = null
        let bestDelta = Infinity
        for (const d of candid) {
          if (r.bandeira && d.bandeira && String(r.bandeira).toUpperCase() !== String(d.bandeira).toUpperCase()) continue
          const delta = Math.abs(Number(d.valor_bruto || 0) - valor)
          if (delta <= eps && delta < bestDelta) {
            best = d
            bestDelta = delta
          }
        }
        if (best?.id) map.set(r.nsu, best.id)
      }
    }
    return map
  }

  const enviarAuditoriaComProgresso = async () => {
    const dados = conciliados.value || []
    if (dados.length === 0) return { updated: 0, skipped: 0, errors: 0 }

    visible.value = true
    total.value = dados.length
    processed.value = 0
    sent.value = 0
    skipped.value = 0
    errors.value = 0
    message.value = 'Agrupando dados...'

    const groups = new Map()
    for (const r of dados) {
      const key = `${r.empresa}||${r.adquirente}`
      const arr = groups.get(key) || []
      arr.push(r)
      groups.set(key, arr)
    }

    let updated = 0
    let skippedLocal = 0
    let errorsLocal = 0

    for (const [key, rows] of groups) {
      const [empresa, operadora] = key.split('||')
      const table = construirNomeTabela(empresa, operadora)
      message.value = `Processando ${empresa} / ${operadora}...`

      const withId = rows.filter(r => !!r.vendaId)
      const withoutId = rows.filter(r => !r.vendaId)

      const byStatus = new Map()
      for (const r of withId) {
        const s = r.auditoria || 'Não conciliado'
        const arr = byStatus.get(s) || []
        arr.push(r.vendaId)
        byStatus.set(s, arr)
      }

      for (const [status, ids] of byStatus) {
        const chunkSize = 1000
        for (let i = 0; i < ids.length; i += chunkSize) {
          const part = ids.slice(i, i + chunkSize)
          const { error: updErr } = await supabase
            .from(table)
            .update({ auditoria: status })
            .in('id', part)
          if (updErr) {
            errorsLocal += part.length
            errors.value += part.length
          } else {
            updated += part.length
            sent.value += part.length
          }
          processed.value += part.length
        }
      }

      if (withoutId.length > 0) {
        const idMap = await resolveIdsByNSU(table, withoutId)
        const byStatus2 = new Map()
        for (const r of withoutId) {
          const id = idMap.get(r.nsu)
          if (!id) {
            skippedLocal++
            skipped.value++
            processed.value++
            continue
          }
          const s = r.auditoria || 'Não conciliado'
          const arr = byStatus2.get(s) || []
          arr.push(id)
          byStatus2.set(s, arr)
        }
        for (const [status, ids] of byStatus2) {
          const chunkSize = 1000
          for (let i = 0; i < ids.length; i += chunkSize) {
            const part = ids.slice(i, i + chunkSize)
            const { error: updErr } = await supabase
              .from(table)
              .update({ auditoria: status })
              .in('id', part)
            if (updErr) {
              errorsLocal += part.length
              errors.value += part.length
            } else {
              updated += part.length
              sent.value += part.length
            }
            processed.value += part.length
          }
        }
      }
    }

    visible.value = false
    return { updated, skipped: skippedLocal, errors: errorsLocal }
  }

  return {
    visible,
    percent,
    sent: computed(() => sent.value),
    skipped: computed(() => skipped.value),
    errors: computed(() => errors.value),
    message: computed(() => message.value),
    enviarAuditoriaComProgresso
  }
}
