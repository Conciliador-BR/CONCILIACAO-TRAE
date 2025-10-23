import { ref, computed } from 'vue'

export const useControladoriaFiltros = () => {
  // Estados dos filtros
  const filtroDataInicio = ref('')
  const filtroDataFim = ref('')
  const filtroEmpresa = ref('')
  const filtroBandeira = ref('')
  const filtroModalidade = ref('')
  
  // Computed para objeto de filtros
  const filtrosAtivos = computed(() => {
    const filtros = {}
    
    if (filtroDataInicio.value) {
      filtros.data_inicio = filtroDataInicio.value
    }
    
    if (filtroDataFim.value) {
      filtros.data_fim = filtroDataFim.value
    }
    
    if (filtroEmpresa.value) {
      filtros.empresa = filtroEmpresa.value
    }
    
    if (filtroBandeira.value) {
      filtros.bandeira = filtroBandeira.value
    }
    
    if (filtroModalidade.value) {
      filtros.modalidade = filtroModalidade.value
    }
    
    return filtros
  })
  
  // Função para limpar filtros
  const limparFiltros = () => {
    filtroDataInicio.value = ''
    filtroDataFim.value = ''
    filtroEmpresa.value = ''
    filtroBandeira.value = ''
    filtroModalidade.value = ''
  }
  
  // Função para aplicar filtros com validação
  const validarFiltros = () => {
    const erros = []
    
    if (filtroDataInicio.value && filtroDataFim.value) {
      const dataInicio = new Date(filtroDataInicio.value)
      const dataFim = new Date(filtroDataFim.value)
      
      if (dataInicio > dataFim) {
        erros.push('Data de início não pode ser maior que data de fim')
      }
    }
    
    return erros
  }
  
  return {
    // Estados
    filtroDataInicio,
    filtroDataFim,
    filtroEmpresa,
    filtroBandeira,
    filtroModalidade,
    
    // Computed
    filtrosAtivos,
    
    // Métodos
    limparFiltros,
    validarFiltros
  }
}