import { ref } from 'vue'
import { useAPIsupabase } from '~/composables/useAPIsupabase'

export const useCruzamentoVendasSupabase = () => {
  const { supabase } = useAPIsupabase()
  const cruzando = ref(false)

  const construirNomeTabela = (empresa, operadora) => {
    if (!empresa || !operadora) {
      throw new Error('Empresa e operadora são obrigatórias para cruzamento.')
    }
    const empresaNormalizada = String(empresa)
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
    const operadoraNormalizada = String(operadora)
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
    return `vendas_${empresaNormalizada}_${operadoraNormalizada}`
  }

  const normalizarData = (valor) => {
    if (!valor) return ''
    if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
      const y = valor.getFullYear()
      const m = String(valor.getMonth() + 1).padStart(2, '0')
      const d = String(valor.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }
    const str = String(valor).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      const [d, m, y] = str.split('/')
      return `${y}-${m}-${d}`
    }
    return str.slice(0, 10)
  }

  const normalizarNumero = (valor) => {
    if (valor === null || valor === undefined || valor === '') return 0
    if (typeof valor === 'number') return Number(valor.toFixed(2))
    const str = String(valor).trim().replace(/\./g, '').replace(',', '.')
    const n = Number(str)
    if (!Number.isFinite(n)) return 0
    return Number(n.toFixed(2))
  }

  const normalizarNsu = (nsu) => String(nsu || '').trim()

  const normalizarParcela = (valor) => {
    if (valor === null || valor === undefined || valor === '') return ''
    const n = Number(valor)
    if (!Number.isFinite(n)) return ''
    return String(Math.trunc(n))
  }

  const criarChave = (item) => {
    const nsu = normalizarNsu(item.nsu)
    const data = normalizarData(item.data_venda)
    const valor = normalizarNumero(item.valor_bruto)
    const parcelaAtual = normalizarParcela(item.parcela_atual)
    const numeroParcelas = normalizarParcela(item.numero_parcelas)
    if (!nsu || !data) return ''
    if (parcelaAtual && numeroParcelas) {
      return `${nsu}|${data}|${valor.toFixed(2)}|${parcelaAtual}/${numeroParcelas}`
    }
    return `${nsu}|${data}|${valor.toFixed(2)}`
  }

  const criarChaveBase = (item) => {
    const nsu = normalizarNsu(item.nsu)
    const data = normalizarData(item.data_venda)
    const valor = normalizarNumero(item.valor_bruto)
    if (!nsu || !data) return ''
    return `${nsu}|${data}|${valor.toFixed(2)}`
  }

  const chunk = (arr, size) => {
    const out = []
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
    return out
  }

  const buscarExistentesPorNsu = async (nomeTabela, nsus) => {
    const resultado = []
    const blocos = chunk(nsus, 500)
    for (const bloco of blocos) {
      let { data, error } = await supabase
        .from(nomeTabela)
        .select('nsu,data_venda,valor_bruto,parcela_atual,numero_parcelas')
        .in('nsu', bloco)
      if (error && String(error?.code || '') === '42703') {
        const fallback = await supabase
          .from(nomeTabela)
          .select('nsu,data_venda,valor_bruto')
          .in('nsu', bloco)
        data = fallback.data
        error = fallback.error
      }
      if (error) throw error
      if (Array.isArray(data) && data.length) resultado.push(...data)
    }
    return resultado
  }

  const cruzarVendasComSupabase = async (vendas, empresa, operadora) => {
    if (!Array.isArray(vendas) || vendas.length === 0) {
      return { vendasStatus: [], resumo: { total: 0, enviadas: 0, naoEnviadas: 0, pendentes: 0 } }
    }

    cruzando.value = true
    try {
      const nomeTabela = construirNomeTabela(empresa, operadora)
      const nsus = [...new Set(vendas.map(v => normalizarNsu(v.nsu)).filter(Boolean))]

      let existentes = []
      try {
        if (nsus.length > 0) {
          existentes = await buscarExistentesPorNsu(nomeTabela, nsus)
        }
      } catch (error) {
        if (String(error?.code || '') === '42P01') {
          existentes = []
        } else {
          throw error
        }
      }

      const contagemExistentesComParcela = new Map()
      const contagemExistentesBase = new Map()
      for (const registro of existentes) {
        const chave = criarChave(registro)
        const chaveBase = criarChaveBase(registro)
        if (chaveBase) {
          contagemExistentesBase.set(chaveBase, (contagemExistentesBase.get(chaveBase) || 0) + 1)
        }
        if (chave && chave !== chaveBase) {
          contagemExistentesComParcela.set(chave, (contagemExistentesComParcela.get(chave) || 0) + 1)
        }
      }

      const consumidosNoArquivoComParcela = new Map()
      const consumidosNoArquivoBase = new Map()

      const vendasStatus = vendas.map((venda) => {
        const chave = criarChave(venda)
        const chaveBase = criarChaveBase(venda)
        if (!chave) {
          return { ...venda, status_envio: 'pendente_envio', motivo_status: 'Dados incompletos para validar duplicidade' }
        }

        const usaChaveComParcela = chave !== chaveBase
        const jaConsumidosBase = consumidosNoArquivoBase.get(chaveBase) || 0
        const jaExistentesBase = contagemExistentesBase.get(chaveBase) || 0

        if (usaChaveComParcela) {
          const jaConsumidosComParcela = consumidosNoArquivoComParcela.get(chave) || 0
          const jaExistentesComParcela = contagemExistentesComParcela.get(chave) || 0

          if (jaConsumidosComParcela < jaExistentesComParcela) {
            consumidosNoArquivoComParcela.set(chave, jaConsumidosComParcela + 1)
            consumidosNoArquivoBase.set(chaveBase, jaConsumidosBase + 1)
            return { ...venda, status_envio: 'nao_enviada', motivo_status: 'Duplicada no Supabase' }
          }
        }

        if (jaConsumidosBase < jaExistentesBase) {
          consumidosNoArquivoBase.set(chaveBase, jaConsumidosBase + 1)
          if (usaChaveComParcela) {
            const jaConsumidosComParcela = consumidosNoArquivoComParcela.get(chave) || 0
            consumidosNoArquivoComParcela.set(chave, jaConsumidosComParcela + 1)
          }
          return { ...venda, status_envio: 'nao_enviada', motivo_status: 'Duplicada no Supabase' }
        }

        consumidosNoArquivoBase.set(chaveBase, jaConsumidosBase + 1)
        if (usaChaveComParcela) {
          const jaConsumidosComParcela = consumidosNoArquivoComParcela.get(chave) || 0
          consumidosNoArquivoComParcela.set(chave, jaConsumidosComParcela + 1)
        }
        return { ...venda, status_envio: 'pendente_envio', motivo_status: 'Pronta para envio' }
      })

      const pendentes = vendasStatus.filter(v => v.status_envio === 'pendente_envio').length
      const naoEnviadas = vendasStatus.filter(v => v.status_envio === 'nao_enviada').length

      return {
        vendasStatus,
        resumo: {
          total: vendasStatus.length,
          enviadas: 0,
          naoEnviadas,
          pendentes
        }
      }
    } finally {
      cruzando.value = false
    }
  }

  return {
    cruzando,
    cruzarVendasComSupabase
  }
}
