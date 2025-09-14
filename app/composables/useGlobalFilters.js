import { ref, reactive } from 'vue'

// Estado global dos filtros
const filtrosGlobais = reactive({
  empresaSelecionada: '',
  dataInicial: '',
  dataFinal: ''
})

// Event Bus para comunicação entre componentes
const eventBus = ref(new Map())

export const useGlobalFilters = () => {
  // Função para aplicar filtros
  const aplicarFiltros = (dadosFiltros) => {
    // Atualiza o estado global
    Object.assign(filtrosGlobais, dadosFiltros)
    
    // Emite eventos específicos para cada página
    const rota = useRoute()
    const paginaAtual = rota.name
    
    // Define os eventos específicos para cada página
    const eventosEspecificos = {
      'index': 'filtrar-dashboard',
      'vendas': 'filtrar-vendas',
      'controladoria-vendas': 'filtrar-controladoria-vendas',
      'controladoria-recebimentos': 'filtrar-controladoria-recebimentos',
      'taxas': 'filtrar-taxas',
      'bancos': 'filtrar-bancos',
      'pagamentos': 'filtrar-pagamentos'
    }
    
    const eventoEspecifico = eventosEspecificos[paginaAtual]
    
    if (eventoEspecifico) {
      emitirEvento(eventoEspecifico, dadosFiltros)
    }
    
    // Evento global para todas as páginas
    emitirEvento('filtros-aplicados', dadosFiltros)
  }
  
  // Função para emitir eventos
  const emitirEvento = (nomeEvento, dados) => {
    const callbacks = eventBus.value.get(nomeEvento) || []
    callbacks.forEach(callback => callback(dados))
  }
  
  // Função para escutar eventos
  const escutarEvento = (nomeEvento, callback) => {
    if (!eventBus.value.has(nomeEvento)) {
      eventBus.value.set(nomeEvento, [])
    }
    eventBus.value.get(nomeEvento).push(callback)
    
    // Retorna função para remover o listener
    return () => {
      const callbacks = eventBus.value.get(nomeEvento)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }
  
  // Função para remover listener
  const removerEvento = (nomeEvento, callback) => {
    const callbacks = eventBus.value.get(nomeEvento)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }
  
  // Função para obter filtros atuais
  const obterFiltros = () => {
    return { ...filtrosGlobais }
  }
  
  // Função para limpar filtros
  const limparFiltros = () => {
    Object.assign(filtrosGlobais, {
      empresaSelecionada: null,
      dataInicial: null,
      dataFinal: null
    })
    emitirEvento('filtros-limpos', {})
  }
  
  return {
    filtrosGlobais: readonly(filtrosGlobais),
    aplicarFiltros,
    escutarEvento,
    removerEvento,
    obterFiltros,
    limparFiltros
  }
}