import { onMounted, ref, watch } from 'vue'

const normalizarSegmentoStorage = (valor, fallback = 'sem-valor') => {
  const texto = String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return texto || fallback
}

const construirChaveStorageContextual = (prefixo, empresa, ec) => {
  const empresaKey = normalizarSegmentoStorage(empresa, 'sem-empresa')
  const ecKey = normalizarSegmentoStorage(ec, 'sem-ec')
  return `${prefixo}:${empresaKey}:${ecKey}`
}

export const useManualAutorizadaVisibility = ({ storageKey, resolveStorageContext, watchSource }) => {
  const visible = ref(false)
  const storageKeyAtual = ref('')
  let tokenSincronizacaoContexto = 0

  const carregarEstado = () => {
    if (!process.client) return
    visible.value = storageKeyAtual.value
      ? window.localStorage.getItem(storageKeyAtual.value) === 'true'
      : false
  }

  const persistirEstado = () => {
    if (!process.client) return
    if (!storageKeyAtual.value) return
    window.localStorage.setItem(storageKeyAtual.value, String(visible.value))
  }

  const sincronizarContexto = async () => {
    if (!process.client) return

    const tokenAtual = ++tokenSincronizacaoContexto
    const contexto = await resolveStorageContext?.()
    if (tokenAtual !== tokenSincronizacaoContexto) return

    const empresa = contexto?.empresa || ''
    const ec = contexto?.ec || ''
    storageKeyAtual.value = empresa && ec
      ? construirChaveStorageContextual(storageKey, empresa, ec)
      : ''

    carregarEstado()
  }

  const onToggle = () => {
    if (!visible.value) {
      visible.value = true
    }
  }

  const ocultar = () => {
    visible.value = false
  }

  onMounted(() => {
    sincronizarContexto()
  })

  watch(visible, persistirEstado)
  watch(watchSource, () => {
    sincronizarContexto()
  })

  return {
    visible,
    onToggle,
    ocultar
  }
}
