import { ref } from 'vue'
import { useAPIsupabase } from '~/composables/useAPIsupabase'

export const useCruzamentoRecebimentosSupabase = () => {
  const { supabase } = useAPIsupabase()
  const cruzando = ref(false)

  const normalizeIdentifier = (value) => {
    return String(value || '')
      .replace(/[çÇ]/g, 'c')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/-/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  const construirNomeTabela = (empresa, operadora) => {
    if (!empresa || !operadora) {
      throw new Error('Empresa e operadora são obrigatórias para cruzamento.')
    }
    return `recebimento_${normalizeIdentifier(empresa)}_${normalizeIdentifier(operadora)}`
  }

  const normalizarData = (valor) => {
    if (!valor) return ''
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

  const normalizarTexto = (valor) => {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim()
  }

  const normalizarEc = (valor) => String(valor ?? '').replace(/[^\d]/g, '')

  const obterEc = (item) => normalizarEc(item?.matriz ?? item?.ec ?? '')

  const obterCompetencia = (valor) => {
    const data = normalizarData(valor)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return ''
    return data.slice(0, 7)
  }

  const isAluguelMaquina = (item) => {
    const mod = normalizarTexto(item?.modalidade)
    return (
      (mod.includes('ALUGUEL') && (mod.includes('MAQUIN') || mod.includes('TERMINAL') || mod.includes('POS'))) ||
      (mod.includes('MENSALIDADE') && (mod.includes('PINPAD') || mod.includes('PIN PAD'))) ||
      (mod.includes('AJUSTE') && mod.includes('MENSALIDADE'))
    )
  }

  const obterValorMdr = (item) => {
    return normalizarNumero(item?.despesa_mdr ?? item?.valor_mdr ?? item?.despesa)
  }

  const criarChavePadrao = (item) => {
    const nsu = String(item.nsu || '').trim()
    const dataVenda = normalizarData(item.data_venda)
    const dataRecebimento = normalizarData(item.data_recebimento) || 'SEM_DATA_RECEBIMENTO'
    const valorBruto = normalizarNumero(item.valor_bruto)
    if (!nsu || !dataVenda) return ''
    return `${nsu}|${dataVenda}|${dataRecebimento}|${valorBruto.toFixed(2)}`
  }

  const criarChaveAluguel = (item) => {
    const dataVenda = normalizarData(item?.data_venda)
    const modalidade = normalizarTexto(item?.modalidade)
    const valorMdr = obterValorMdr(item)
    const ec = obterEc(item)
    if (!dataVenda || !modalidade) return ''
    return `ALUGUEL|${modalidade}|${dataVenda}|${valorMdr.toFixed(2)}|${ec || 'SEM_EC'}`
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
      const selecoes = [
        'nsu,data_venda,data_recebimento,valor_bruto,modalidade,despesa_mdr',
        'nsu,data_venda,data_recebimento,valor_bruto,modalidade',
        'nsu,data_venda,valor_bruto,modalidade,despesa_mdr',
        'nsu,data_venda,valor_bruto,modalidade'
      ]

      let data = null
      let error = null
      for (const campos of selecoes) {
        const tentativa = await supabase
          .from(nomeTabela)
          .select(campos)
          .in('nsu', bloco)
        data = tentativa.data
        error = tentativa.error
        if (!error) break
        if (String(error?.code || '') !== '42703') break
      }
      if (error) throw error
      if (Array.isArray(data) && data.length) resultado.push(...data)
    }
    return resultado
  }

  const buscarExistentesAluguelPorData = async (nomeTabela, datasVenda) => {
    const resultado = []
    const blocos = chunk(datasVenda, 500)
    for (const bloco of blocos) {
      const selecoes = [
        'data_venda,modalidade,despesa_mdr,matriz,ec',
        'data_venda,modalidade,despesa_mdr,matriz',
        'data_venda,modalidade,despesa_mdr,ec',
        'data_venda,modalidade,matriz,ec',
        'data_venda,modalidade,matriz',
        'data_venda,modalidade,ec',
        'data_venda,modalidade,despesa_mdr',
        'data_venda,modalidade'
      ]

      let data = null
      let error = null
      for (const campos of selecoes) {
        const tentativa = await supabase
          .from(nomeTabela)
          .select(campos)
          .in('data_venda', bloco)
        data = tentativa.data
        error = tentativa.error
        if (!error) break
        if (String(error?.code || '') !== '42703') break
      }

      if (error) throw error
      if (Array.isArray(data) && data.length) resultado.push(...data)
    }
    return resultado
  }

  const cruzarRecebimentosComSupabase = async (recebimentos, empresa, operadora) => {
    if (!Array.isArray(recebimentos) || recebimentos.length === 0) {
      return { recebimentosStatus: [], resumo: { total: 0, enviadas: 0, naoEnviadas: 0, pendentes: 0 } }
    }

    cruzando.value = true
    try {
      const nomeTabela = construirNomeTabela(empresa, operadora)
      const nsus = [...new Set(recebimentos
        .filter(r => !isAluguelMaquina(r))
        .map(r => String(r.nsu || '').trim())
        .filter(Boolean))]
      const datasAluguel = [...new Set(recebimentos
        .filter(r => isAluguelMaquina(r))
        .map(r => normalizarData(r.data_venda))
        .filter(Boolean))]

      let existentesPadrao = []
      let existentesAluguel = []
      try {
        if (nsus.length > 0) {
          existentesPadrao = await buscarExistentesPorNsu(nomeTabela, nsus)
        }
        if (datasAluguel.length > 0) {
          existentesAluguel = await buscarExistentesAluguelPorData(nomeTabela, datasAluguel)
        }
      } catch (error) {
        if (String(error?.code || '') === '42P01') {
          existentesPadrao = []
          existentesAluguel = []
        } else {
          throw error
        }
      }

      const contagemExistentesPadrao = new Map()
      for (const registro of existentesPadrao) {
        const chave = criarChavePadrao(registro)
        if (!chave) continue
        contagemExistentesPadrao.set(chave, (contagemExistentesPadrao.get(chave) || 0) + 1)
      }

      const contagemExistentesAluguel = new Map()
      for (const registro of existentesAluguel) {
        if (!isAluguelMaquina(registro)) continue
        const chave = criarChaveAluguel(registro)
        if (!chave) continue
        contagemExistentesAluguel.set(chave, (contagemExistentesAluguel.get(chave) || 0) + 1)
      }

      const consumidosNoArquivoPadrao = new Map()
      const consumidosNoArquivoAluguel = new Map()
      const recebimentosStatus = recebimentos.map((item) => {
        const aluguel = isAluguelMaquina(item)
        const chave = aluguel ? criarChaveAluguel(item) : criarChavePadrao(item)
        if (!chave) {
          return { ...item, status_envio: 'pendente_envio', motivo_status: 'Dados incompletos para validar duplicidade' }
        }

        const mapaConsumidos = aluguel ? consumidosNoArquivoAluguel : consumidosNoArquivoPadrao
        const mapaExistentes = aluguel ? contagemExistentesAluguel : contagemExistentesPadrao
        const consumidos = mapaConsumidos.get(chave) || 0
        const existentesCount = mapaExistentes.get(chave) || 0
        mapaConsumidos.set(chave, consumidos + 1)

        if (consumidos < existentesCount) {
          if (aluguel) {
            return {
              ...item,
              status_envio: 'nao_enviada',
              motivo_status: 'Aluguel já lançado com mesma modalidade, data, MDR e EC'
            }
          }
          return { ...item, status_envio: 'nao_enviada', motivo_status: 'Duplicado no Supabase' }
        }
        return { ...item, status_envio: 'pendente_envio', motivo_status: 'Pronto para envio' }
      })

      const pendentes = recebimentosStatus.filter(v => v.status_envio === 'pendente_envio').length
      const naoEnviadas = recebimentosStatus.filter(v => v.status_envio === 'nao_enviada').length

      return {
        recebimentosStatus,
        resumo: {
          total: recebimentosStatus.length,
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
    cruzarRecebimentosComSupabase
  }
}
