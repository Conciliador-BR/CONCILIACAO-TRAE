import { computed, ref } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import { useEmpresas } from '~/composables/useEmpresas'

const normalizeDigits = (value) => String(value || '').replace(/\D/g, '')

export const useCadastroClienteAcesso = () => {
  const { empresas, fetchEmpresas } = useEmpresas()

  const salvando = ref(false)
  const erro = ref('')
  const sucesso = ref('')

  const empresasComCnpj = computed(() => {
    return (empresas.value || [])
      .filter(empresa => normalizeDigits(empresa?.cnpj))
      .map(empresa => ({
        ...empresa,
        cnpjNormalizado: normalizeDigits(empresa.cnpj)
      }))
  })

  const carregarEmpresas = async () => {
    await fetchEmpresas({ force: true })
  }

  const salvarAcesso = async ({ email, password, cnpjs }) => {
    erro.value = ''
    sucesso.value = ''
    salvando.value = true

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      if (!accessToken) {
        throw new Error('Sessao expirada. Faca login novamente.')
      }

      const resposta = await $fetch('/api/configuracoes/clientes/acessos', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: {
          email,
          password,
          cnpjs
        }
      })

      sucesso.value = `Acesso salvo com sucesso para ${email}.`
      return resposta
    } catch (error) {
      erro.value = String(error?.data?.statusMessage || error?.message || 'Erro ao salvar acesso do cliente.')
      throw error
    } finally {
      salvando.value = false
    }
  }

  return {
    empresasComCnpj,
    salvando,
    erro,
    sucesso,
    carregarEmpresas,
    salvarAcesso
  }
}
