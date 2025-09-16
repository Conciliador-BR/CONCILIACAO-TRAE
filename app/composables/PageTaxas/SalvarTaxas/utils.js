/**
 * Utilitários para manipulação de dados das taxas
 */

// Util: normaliza strings
export const toStr = (v) => String(v ?? '').trim()

// Util: converte string numérica pt-BR para número JS
export const toNumber = (valor) => {
  if (valor === null || valor === undefined || valor === '') return null
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null
  if (typeof valor !== 'string') return null
  const limpo = valor.replace(/[^\d,.-]/g, '')
  if (!limpo) return null
  // Se tem vírgula, assume vírgula como decimal
  if (limpo.includes(',')) {
    const s = limpo.replace(/\./g, '').replace(',', '.')
    const n = parseFloat(s)
    return Number.isFinite(n) ? n : null
  }
  const n = parseFloat(limpo)
  return Number.isFinite(n) ? n : null
}

// Util: inteiro (parcelas normalmente é inteiro)
export const toInt = (valor) => {
  const n = toNumber(valor)
  if (n === null) return null
  const i = parseInt(String(n), 10)
  return Number.isFinite(i) ? i : null
}

// Gera/normaliza id_linhas. Se não vier, usa chave composta
export const resolveIdLinhas = (t) => {
  // Se já tem um ID numérico válido, usa ele
  if (t?.id_linhas && typeof t.id_linhas === 'number') {
    return t.id_linhas
  }
  
  // Se tem um ID que pode ser convertido para número
  if (t?.id_linhas && !isNaN(Number(t.id_linhas))) {
    return Number(t.id_linhas)
  }
  
  // Se tem um ID do frontend
  if (t?.id && !isNaN(Number(t.id))) {
    return Number(t.id)
  }
  
  // Gerar um ID numérico único baseado em timestamp + hash simples
  const timestamp = Date.now()
  const hashString = `${toStr(t?.empresa)}${toStr(t?.adquirente)}${toStr(t?.bandeira)}${toStr(t?.modalidade)}${toStr(t?.parcelas)}`
  
  // Criar um hash numérico simples da string
  let hash = 0
  for (let i = 0; i < hashString.length; i++) {
    const char = hashString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Converter para 32bit integer
  }
  
  // Combinar timestamp com hash para garantir unicidade
  return Math.abs(timestamp + Math.abs(hash))
}