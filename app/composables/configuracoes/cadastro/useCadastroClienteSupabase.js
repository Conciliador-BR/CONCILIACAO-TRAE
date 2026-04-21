import { ref } from 'vue'
import { useAPIsupabase } from '~/composables/useAPIsupabase'

export const useCadastroClienteSupabase = () => {
  const { insertData, error } = useAPIsupabase()
  const salvando = ref(false)

  const quebrarLista = (valor) => {
    return String(valor || '')
      .split(/[,\n;|/]+/g)
      .map(v => v.trim())
      .filter(Boolean)
  }

  const normalizarListaTexto = (valor, separador = ', ') => {
    return Array.from(new Set(quebrarLista(valor))).join(separador)
  }

  const normalizarListaNumerica = (valor) => {
    return Array.from(new Set(
      quebrarLista(valor)
        .map(v => v.replace(/\D/g, ''))
        .filter(Boolean)
    ))
  }

  const resolverTipoMatriz = (tiposInformados, idx) => {
    if (idx === 0) return 'MATRIZ'
    if (tiposInformados[idx]) return tiposInformados[idx]
    return `FILIAL ${String(idx + 1).padStart(2, '0')}`
  }

  const salvarCadastroCliente = async (form) => {
    const cnpjs = normalizarListaNumerica(form.cnpj_empresa)
    const ecs = normalizarListaNumerica(form.matriz_ec)
    const tiposMatriz = quebrarLista(form.nome_matriz).map(v => v.toUpperCase())

    if (cnpjs.length === 0) {
      throw new Error('Informe ao menos um CNPJ válido.')
    }

    const payloadBase = {
      nome_empresa: form.nome_empresa?.trim(),
      autorizadoras: normalizarListaTexto(form.autorizadoras, ';'),
      bancos: normalizarListaTexto(form.bancos),
      email: form.email?.trim() || null,
      nome_cliente: form.nome_cliente?.trim() || null,
      contato_cliente: form.contato_cliente?.trim() || null,
      cpf: form.cpf?.trim() || null
    }

    const payload = cnpjs.map((cnpj, idx) => {
      const ec = ecs[idx] || ecs[0] || null
      return {
        ...payloadBase,
        cnpj_empresa: Number(cnpj),
        matriz_ec: ec ? Number(ec) : null,
        nome_matriz: resolverTipoMatriz(tiposMatriz, idx)
      }
    })

    salvando.value = true
    try {
      const data = await insertData('empresas', payload)
      if (!data) {
        throw new Error(error.value || 'Falha ao cadastrar cliente na tabela empresas.')
      }
      return data
    } finally {
      salvando.value = false
    }
  }

  return {
    salvando,
    salvarCadastroCliente
  }
}
