import { onMounted, ref, watch } from 'vue'

export const useManualAutorizadaVisibility = (storageKey) => {
  const visible = ref(false)
  const confirmandoOcultar = ref(false)

  const carregarEstado = () => {
    if (!process.client) return
    visible.value = window.localStorage.getItem(storageKey) === 'true'
  }

  const persistirEstado = () => {
    if (!process.client) return
    window.localStorage.setItem(storageKey, String(visible.value))
  }

  const onToggle = () => {
    if (!visible.value) {
      visible.value = true
      confirmandoOcultar.value = false
      return
    }
    confirmandoOcultar.value = true
  }

  const cancelarOcultar = () => {
    confirmandoOcultar.value = false
  }

  const confirmarOcultar = () => {
    visible.value = false
    confirmandoOcultar.value = false
  }

  onMounted(() => {
    carregarEstado()
  })

  watch(visible, persistirEstado)

  return {
    visible,
    confirmandoOcultar,
    onToggle,
    cancelarOcultar,
    confirmarOcultar
  }
}
