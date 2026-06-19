import { computed, reactive, ref } from 'vue'
import { buildServidorPathPreview, normalizeServidorSlug } from './useServidorValidacao'

export const useServidorForm = ({ empresas, basePath }) => {
  const createForm = reactive({
    adquirente: 'cielo',
    empresaId: '',
    empresaManual: ''
  })

  const renameForm = reactive({
    novoNome: ''
  })

  const selectedNode = ref(null)

  const empresaSelecionada = computed(() => {
    return empresas.value.find((item) => item.id === createForm.empresaId || item.id == createForm.empresaId) || null
  })

  const empresaEfetivaNome = computed(() => {
    return String(createForm.empresaManual || '').trim() || String(empresaSelecionada.value?.nome || '').trim()
  })

  const adquirenteSlugPreview = computed(() => normalizeServidorSlug(createForm.adquirente))
  const empresaSlugPreview = computed(() => normalizeServidorSlug(empresaEfetivaNome.value))

  const previewPath = computed(() => {
    return buildServidorPathPreview({
      basePath: basePath.value,
      adquirente: adquirenteSlugPreview.value,
      empresa: empresaSlugPreview.value,
      status: 'inbox'
    })
  })

  const resetCreateForm = () => {
    createForm.adquirente = 'cielo'
    createForm.empresaId = ''
    createForm.empresaManual = ''
  }

  const limparSelecao = () => {
    selectedNode.value = null
    renameForm.novoNome = ''
  }

  const selecionarNode = (node) => {
    selectedNode.value = node
  }

  const prepararRenomeacao = (node) => {
    selectedNode.value = node
    renameForm.novoNome = String(node?.label || '')
  }

  return {
    createForm,
    renameForm,
    selectedNode,
    empresaSelecionada,
    empresaEfetivaNome,
    adquirenteSlugPreview,
    empresaSlugPreview,
    previewPath,
    resetCreateForm,
    limparSelecao,
    selecionarNode,
    prepararRenomeacao
  }
}
