export const isMissingColumnError = (err, columnName) => {
  const msg = String(err?.message || '')
  return msg.includes(`column "${columnName}"`) || msg.includes(`column '${columnName}'`)
}

export const normalizarEcNumerico = (value) => {
  if (value == null) return null
  const digits = String(value).replace(/\D/g, '')
  if (!digits) return null
  const n = Number(digits)
  return Number.isFinite(n) ? n : null
}

export const isMissingRelationError = (err) => {
  const code = String(err?.code || '')
  const msg = String(err?.message || '')
  return code === '42P01' || msg.toLowerCase().includes('does not exist')
}

export const criarVerificarTabelaExiste = ({ supabase }) => {
  const tabelasEmpresaCache = new Map()
  const normalizarIdentificador = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  const normalizarOperadoraTabela = (value) => {
    const normalizado = normalizarIdentificador(value)
    if (normalizado === 'safrapay' || normalizado === 'safra_pay') return 'safra'
    return normalizado
  }

  const quebrarLista = (valor) => String(valor || '')
    .split(/[,\n;|/]+/g)
    .map(v => normalizarOperadoraTabela(v))
    .filter(Boolean)

  const listarTabelasEmpresa = async (empresa) => {
    const empresaNorm = normalizarIdentificador(empresa)
    if (!empresaNorm) return new Set()
    if (tabelasEmpresaCache.has(empresaNorm)) {
      return tabelasEmpresaCache.get(empresaNorm)
    }

    try {
      const { data, error } = await supabase.rpc('admin_list_tables_for_company', {
        p_empresa: empresaNorm
      })

      if (error || !Array.isArray(data)) {
        const vazio = new Set()
        tabelasEmpresaCache.set(empresaNorm, vazio)
        return vazio
      }

      const tabelas = new Set(
        data
          .map(item => String(item?.table_name || '').trim())
          .filter(Boolean)
      )
      tabelasEmpresaCache.set(empresaNorm, tabelas)
      return tabelas
    } catch {
      const vazio = new Set()
      tabelasEmpresaCache.set(empresaNorm, vazio)
      return vazio
    }
  }

  const listarMapeamentoTabelasVoucher = async (empresa, tipo = 'recebimento') => {
    const empresaNorm = normalizarIdentificador(empresa)
    if (!empresaNorm) return new Map()
    const tipoNorm = String(tipo || 'recebimento').toLowerCase() === 'vendas' ? 'vendas' : 'recebimento'
    const prefixo = `${tipoNorm}_${empresaNorm}_`
    const tabelasEmpresa = await listarTabelasEmpresa(empresaNorm)
    const mapeamento = new Map()

    for (const tableName of tabelasEmpresa) {
      if (!tableName.startsWith(prefixo)) continue
      const voucher = tableName.slice(prefixo.length)
      const voucherNorm = normalizarOperadoraTabela(voucher)
      if (!voucherNorm) continue
      mapeamento.set(voucherNorm, tableName)
    }

    return mapeamento
  }

  const listarOperadorasComTabela = async (empresa, tipo = 'recebimento') => {
    const empresaNorm = normalizarIdentificador(empresa)
    if (!empresaNorm) return []
    const tipoNorm = String(tipo || 'recebimento').toLowerCase() === 'vendas' ? 'vendas' : 'recebimento'

    try {
      const empresaNome = String(empresa || '').trim()
      const { data, error } = await supabase
        .from('empresas')
        .select('nome_empresa, vouchers_cadastrados')
        .eq('nome_empresa', empresaNome)

      if (error || !Array.isArray(data) || data.length === 0) {
        return []
      }

      const vouchers = [...new Set(
        data.flatMap(item => quebrarLista(item?.vouchers_cadastrados))
      )]
      const mapeamentoTabelas = await listarMapeamentoTabelasVoucher(empresaNorm, tipoNorm)

      const operadoras = []
      for (const voucher of vouchers) {
        if (mapeamentoTabelas.has(voucher)) {
          operadoras.push(voucher)
        }
      }

      const unicas = [...new Set(operadoras)]
      return unicas
    } catch {
      return []
    }
  }

  const resolverNomeTabelaOperadora = async (empresa, operadora, tipo = 'recebimento') => {
    const operadoraNorm = normalizarOperadoraTabela(operadora)
    if (!operadoraNorm) return ''
    const mapeamentoTabelas = await listarMapeamentoTabelasVoucher(empresa, tipo)
    return mapeamentoTabelas.get(operadoraNorm) || ''
  }

  return { listarOperadorasComTabela, resolverNomeTabelaOperadora }
}
