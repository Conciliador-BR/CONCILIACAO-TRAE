import { ref } from 'vue'
import { useAPIsupabase } from '~/composables/useAPIsupabase'

export const useCruzamentoVendasSupabase = () => {
  const { supabase } = useAPIsupabase()
  const cruzando = ref(false)

  const normalizarOperadoraTabela = (operadora) => {
    const valor = String(operadora || '').trim().toUpperCase()
    if (valor === 'SAFRAPAY' || valor === 'SAFRA PAY') return 'SAFRA'
    return operadora
  }

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
    const operadoraNormalizada = String(normalizarOperadoraTabela(operadora))
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
    const texto = normalizarTexto([
      item?.modalidade,
      item?.bandeira,
      item?.tipo_lancamento,
      item?.lancamento,
      item?.descricao,
      item?.observacoes,
      item?.motivo
    ].filter(Boolean).join(' '))
    return (
      (texto.includes('ALUGUEL') && (texto.includes('MAQUIN') || texto.includes('TERMINAL') || texto.includes('POS'))) ||
      (texto.includes('MENSALIDADE') && (texto.includes('PINPAD') || texto.includes('PIN PAD'))) ||
      (texto.includes('AJUSTE') && texto.includes('MENSALIDADE'))
    )
  }
  const obterValorMdr = (item) => normalizarNumero(item?.despesa_mdr ?? item?.valor_mdr ?? item?.despesa)

  const normalizarParcela = (valor) => {
    if (valor === null || valor === undefined || valor === '') return ''
    const n = Number(valor)
    if (!Number.isFinite(n)) return ''
    return String(Math.trunc(n))
  }

  const criarChave = (item) => {
    if (isAluguelMaquina(item)) {
      const competencia = obterCompetencia(item?.data_venda)
      const ec = obterEc(item)
      const adquirente = String(item?.adquirente || '').trim().toLowerCase()
      if (!competencia) return ''
      return `ALUGUEL|${String(item?.empresa || '').trim().toLowerCase()}|${ec || 'SEM_EC'}|${adquirente || 'SEM_ADQUIRENTE'}|${competencia}`
    }
    const nsu = normalizarNsu(item.nsu)
    const data = normalizarData(item.data_venda)
    const valor = normalizarNumero(item.valor_bruto)
    const ec = obterEc(item)
    const parcelaAtual = normalizarParcela(item.parcela_atual)
    const numeroParcelas = normalizarParcela(item.numero_parcelas)
    if (!nsu || !data || !ec) return ''
    if (parcelaAtual && numeroParcelas) {
      return `${nsu}|${data}|${valor.toFixed(2)}|${ec}|${parcelaAtual}/${numeroParcelas}`
    }
    return `${nsu}|${data}|${valor.toFixed(2)}|${ec}`
  }

  const criarChaveBase = (item) => {
    if (isAluguelMaquina(item)) {
      return criarChave(item)
    }
    const nsu = normalizarNsu(item.nsu)
    const data = normalizarData(item.data_venda)
    const valor = normalizarNumero(item.valor_bruto)
    const ec = obterEc(item)
    if (!nsu || !data || !ec) return ''
    return `${nsu}|${data}|${valor.toFixed(2)}|${ec}`
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
        'nsu,data_venda,valor_bruto,parcela_atual,numero_parcelas,matriz,ec',
        'nsu,data_venda,valor_bruto,parcela_atual,numero_parcelas,matriz',
        'nsu,data_venda,valor_bruto,parcela_atual,numero_parcelas,ec',
        'nsu,data_venda,valor_bruto,matriz,ec',
        'nsu,data_venda,valor_bruto,matriz',
        'nsu,data_venda,valor_bruto,ec'
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

  const obterIntervaloCompetencias = (competencias = []) => {
    const lista = [...new Set((competencias || []).filter(Boolean))].sort()
    if (!lista.length) return { dataInicial: '', dataFinal: '' }

    const primeira = lista[0]
    const ultima = lista[lista.length - 1]
    const [anoInicial, mesInicial] = primeira.split('-').map(Number)
    const [anoFinal, mesFinal] = ultima.split('-').map(Number)
    const ultimoDia = new Date(anoFinal, mesFinal, 0).getDate()

    return {
      dataInicial: `${anoInicial}-${String(mesInicial).padStart(2, '0')}-01`,
      dataFinal: `${anoFinal}-${String(mesFinal).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`
    }
  }

  const buscarExistentesAluguel = async (nomeTabela, filtros = {}) => {
    const selecoes = [
      'data_venda,modalidade,bandeira,despesa_mdr,empresa,matriz,ec,adquirente',
      'data_venda,modalidade,bandeira,despesa_mdr,empresa,matriz,adquirente',
      'data_venda,modalidade,bandeira,empresa,matriz,adquirente',
      'data_venda,modalidade,bandeira,despesa_mdr,matriz,adquirente',
      'data_venda,modalidade,bandeira,matriz,adquirente',
      'data_venda,modalidade,bandeira,despesa_mdr',
      'data_venda,modalidade,bandeira'
    ]

    let data = null
    let error = null
    for (const campos of selecoes) {
      let query = supabase
        .from(nomeTabela)
        .select(campos)

      if (filtros.dataInicial) query = query.gte('data_venda', filtros.dataInicial)
      if (filtros.dataFinal) query = query.lte('data_venda', filtros.dataFinal)

      const tentativa = await query
      data = tentativa.data
      error = tentativa.error
      if (!error) break
      if (String(error?.code || '') !== '42703') break
    }

    if (error) throw error
    return Array.isArray(data) ? data : []
  }

  const cruzarVendasComSupabase = async (vendas, empresa, operadora) => {
    if (!Array.isArray(vendas) || vendas.length === 0) {
      return { vendasStatus: [], resumo: { total: 0, enviadas: 0, naoEnviadas: 0, pendentes: 0 } }
    }

    cruzando.value = true
    try {
      const nomeTabela = construirNomeTabela(empresa, operadora)
      const vendasAluguel = vendas.filter(v => isAluguelMaquina(v))
      const nsus = [...new Set(vendas.filter(v => !isAluguelMaquina(v)).map(v => normalizarNsu(v.nsu)).filter(Boolean))]
      const competenciasAluguel = [...new Set(vendasAluguel.map(v => obterCompetencia(v.data_venda)).filter(Boolean))]

      let existentes = []
      let existentesAluguel = []
      try {
        if (nsus.length > 0) {
          existentes = await buscarExistentesPorNsu(nomeTabela, nsus)
        }
        if (competenciasAluguel.length > 0) {
          const { dataInicial, dataFinal } = obterIntervaloCompetencias(competenciasAluguel)
          existentesAluguel = await buscarExistentesAluguel(nomeTabela, { dataInicial, dataFinal })
        }
      } catch (error) {
        if (String(error?.code || '') === '42P01') {
          existentes = []
          existentesAluguel = []
        } else {
          throw error
        }
      }

      const contagemExistentesComParcela = new Map()
      const contagemExistentesBase = new Map()
      const valoresExistentesAluguel = new Map()
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

      for (const registro of existentesAluguel) {
        if (!isAluguelMaquina(registro)) continue
        const chave = criarChave(registro)
        if (!chave) continue
        contagemExistentesBase.set(chave, (contagemExistentesBase.get(chave) || 0) + 1)
        const valores = valoresExistentesAluguel.get(chave) || []
        valores.push(obterValorMdr(registro))
        valoresExistentesAluguel.set(chave, valores)
      }

      const consumidosNoArquivoComParcela = new Map()
      const consumidosNoArquivoBase = new Map()

      const vendasStatus = vendas.map((venda) => {
        const chave = criarChave(venda)
        const chaveBase = criarChaveBase(venda)
        if (!chave) {
          return { ...venda, status_envio: 'pendente_envio', motivo_status: 'Dados incompletos para validar duplicidade' }
        }

        if (isAluguelMaquina(venda)) {
          const jaConsumidos = consumidosNoArquivoBase.get(chaveBase) || 0
          const jaExistentes = contagemExistentesBase.get(chaveBase) || 0
          consumidosNoArquivoBase.set(chaveBase, jaConsumidos + 1)

          if (jaConsumidos < jaExistentes) {
            const valorAtual = obterValorMdr(venda)
            const valoresExistentes = valoresExistentesAluguel.get(chaveBase) || []
            const existeMesmoValor = valoresExistentes.some((valor) => Math.abs(valor - valorAtual) < 0.01)
            return {
              ...venda,
              status_envio: 'nao_enviada',
              motivo_status: existeMesmoValor
                ? 'Aluguel já lançado nesta competência'
                : 'Aluguel já lançado nesta competência com valor diferente'
            }
          }

          return { ...venda, status_envio: 'pendente_envio', motivo_status: 'Pronta para envio' }
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
