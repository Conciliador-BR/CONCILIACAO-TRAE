import { useTaxasSupabaseModular } from './SalvarTaxas/index.js'

/**
 * Composable principal mantido para compatibilidade
 * Agora usa a versão modular internamente
 */
export const useTaxasSupabase = () => {
  return useTaxasSupabaseModular()
}