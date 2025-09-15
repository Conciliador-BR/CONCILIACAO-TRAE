import { useTaxasLogic } from './useTaxasLogic'

export const useTaxas = () => {
  // Usar a lógica base das taxas
  const taxasLogic = useTaxasLogic()
  
  return {
    // Re-exportar tudo do useTaxasLogic
    ...taxasLogic
  }
}