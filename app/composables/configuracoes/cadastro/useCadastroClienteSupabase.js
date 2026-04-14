import { ref } from 'vue'
import { useAPIsupabase } from '~/composables/useAPIsupabase'

export const useCadastroClienteSupabase = () => {
  const { insertData, error } = useAPIsupabase()
  const salvando = ref(false)

  const salvarCadastroCliente = async (form) => {
    const payload = {
      nome_empresa: form.nome_empresa?.trim(),
      cnpj_empresa: form.cnpj_empresa?.trim(),
      matriz_ec: form.matriz_ec?.trim(),
      nome_matriz: form.nome_matriz?.trim(),
      autorizadoras: form.autorizadoras?.trim(),
      bancos: form.bancos?.trim(),
      email: form.email?.trim() || null,
      nome_cliente: form.nome_cliente?.trim() || null,
      contato_cliente: form.contato_cliente?.trim() || null,
      cpf: form.cpf?.trim() || null
    }

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
