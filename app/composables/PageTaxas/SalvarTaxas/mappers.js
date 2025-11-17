import { toStr, toNumber, toInt, resolveIdLinhas } from './utils.js'

/**
 * Funções de mapeamento e validação de dados
 */

// Mapeia a taxa do front para as colunas de cadastro_taxas
export const mapTaxa = (taxa) => {
  const parcelas = toInt(taxa?.parcelas)
  const taxaNumero = toNumber(taxa?.percentualTaxa ?? taxa?.taxa)
  // Corrigido: buscar data_corte de várias fontes possíveis
  const dataCorte = toInt(taxa?.data_corte ?? taxa?.dataCorte ?? taxa?.diasCorte ?? taxa?.data_de_corte)

  const payload = {
    id_linhas: resolveIdLinhas(taxa),
    empresa: toStr(taxa?.empresa),
    EC: toInt(taxa?.EC ?? taxa?.ec),
    adquirente: normalizeListToString(taxa?.adquirente),
    bandeira: normalizeListToString(taxa?.bandeira),
    modalidade: normalizeListToString(taxa?.modalidade),
    vouchers: normalizeListToString(taxa?.vouchers),
    parcelas: parcelas,
    taxa: taxaNumero,
    data_corte: dataCorte  // Este campo vai para a coluna data_corte no Supabase
  }

  console.log('📋 Mapeando taxa:', {
    original: {
      data_corte: taxa?.data_corte,
      dataCorte: taxa?.dataCorte,
      diasCorte: taxa?.diasCorte,
      data_de_corte: taxa?.data_de_corte
    },
    mapeado: {
      data_corte: dataCorte
    }
  })

  return payload
}

// Validação mínima antes do envio
export const validateBeforeSend = (item) => {
  const problemas = []
  
  // Validar campos obrigatórios
  ;['empresa', 'adquirente', 'bandeira', 'modalidade'].forEach((c) => {
    if (!item?.[c]) problemas.push(`${c} ausente`)
  })
  
  // Validar campos numéricos
  if (item?.parcelas !== null && item?.parcelas !== undefined && !Number.isFinite(item.parcelas)) {
    problemas.push('parcelas inválido (não numérico)')
  }
  if (item?.taxa !== null && item?.taxa !== undefined && !Number.isFinite(item.taxa)) {
    problemas.push('taxa inválida (não numérico)')
  }
  if (item?.data_corte !== null && item?.data_corte !== undefined && !Number.isFinite(item.data_corte)) {
    problemas.push('data_corte inválido (não numérico)')
  }
  return problemas
}
const normalizeListToString = (v) => {
  if (v === null || v === undefined) return ''
  if (Array.isArray(v)) return v.filter(Boolean).join(',')
  return String(v ?? '').trim()
}