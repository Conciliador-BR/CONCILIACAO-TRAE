import { useScopedTableRead } from '~/composables/useScopedTableRead'
import { useEmpresas } from '~/composables/useEmpresas'

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
  const tabelaExisteCache = new Map()
  const { checkTableExists } = useScopedTableRead()
  const { getEmpresaCompletaPorNome } = useEmpresas()
  const normalizarIdentificador = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')

  const quebrarLista = (valor) => String(valor || '')
    .split(/[,\n;|/]+/g)
    .map(v => normalizarIdentificador(v))
    .filter(Boolean)

  const verificarTabelaExiste = async (tableName) => {
    if (!tableName) return false
    if (tabelaExisteCache.has(tableName)) {
      return tabelaExisteCache.get(tableName)
    }

    try {
      const exists = await checkTableExists(tableName)
      tabelaExisteCache.set(tableName, exists)
      return exists
    } catch {
      tabelaExisteCache.set(tableName, false)
      return false
    }
  }

  const listarOperadorasComTabela = async (empresa, tipo = 'vendas') => {
    const empresaNorm = normalizarIdentificador(empresa)
    if (!empresaNorm) return []
    const tipoNorm = String(tipo || 'vendas').toLowerCase() === 'recebimento' ? 'recebimento' : 'vendas'

    try {
      const empresaAtual = getEmpresaCompletaPorNome(String(empresa || '').trim())
      const vouchersTexto = empresaAtual?.vouchersCadastrados || empresaAtual?.vouchers_cadastrados || ''
      const vouchers = [...new Set(quebarListaSeguro(vouchersTexto, quebrarLista))]

      if (vouchers.length === 0) {
        return []
      }

      const operadoras = []
      for (const voucher of vouchers) {
        const tableName = `${tipoNorm}_${empresaNorm}_${voucher}`
        const exists = await verificarTabelaExiste(tableName)

        if (exists) {
          operadoras.push(voucher)
        }
      }

      const unicas = [...new Set(operadoras)]
      return unicas
    } catch {
      return []
    }
  }

  return { verificarTabelaExiste, listarOperadorasComTabela }
}

const quebarListaSeguro = (valor, quebrarLista) => {
  if (Array.isArray(valor)) {
    return valor.map((item) => String(item || '')).flatMap((item) => quebrarLista(item))
  }

  return quebrarLista(valor)
}
