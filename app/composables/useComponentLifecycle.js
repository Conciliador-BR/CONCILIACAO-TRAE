import { onUnmounted, ref } from 'vue'

export const useComponentLifecycle = () => {
  // Array para armazenar funções de cleanup
  const cleanupFunctions = ref([])
  
  // Função para registrar uma função de cleanup
  const registerCleanup = (cleanupFn) => {
    if (typeof cleanupFn === 'function') {
      cleanupFunctions.value.push(cleanupFn)
    }
  }
  
  // Função para registrar um watcher com cleanup automático
  const registerWatcher = (watcherStopFn) => {
    if (typeof watcherStopFn === 'function') {
      registerCleanup(watcherStopFn)
      return watcherStopFn
    }
  }
  
  // Função para registrar um event listener com cleanup automático
  const registerEventListener = (removeListenerFn) => {
    if (typeof removeListenerFn === 'function') {
      registerCleanup(removeListenerFn)
      return removeListenerFn
    }
  }
  
  // Função para executar cleanup manual
  const cleanup = () => {
    console.log(`🧹 Executando cleanup de ${cleanupFunctions.value.length} funções...`)
    
    cleanupFunctions.value.forEach((cleanupFn, index) => {
      try {
        cleanupFn()
      } catch (error) {
        console.error(`Erro ao executar cleanup ${index}:`, error)
      }
    })
    
    // Limpar o array
    cleanupFunctions.value = []
  }
  
  // Registrar cleanup automático no onUnmounted
  onUnmounted(() => {
    cleanup()
  })
  
  return {
    registerCleanup,
    registerWatcher,
    registerEventListener,
    cleanup
  }
}