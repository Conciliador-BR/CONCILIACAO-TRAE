// ARQUIVO MIGRADO PARA ESTRUTURA COMPONENTIZADA
// Nova localização: app/composables/importacao/Envio_Extratos/
// Este arquivo mantém compatibilidade mas redireciona para a nova estrutura

import { useBancosSupabase as useBancosSupabaseNovo } from '../Envio_Extratos/useBancosSupabase.js'

export const useBancosSupabase = () => {
  // Redirecionar para a nova implementação componentizada
  return useBancosSupabaseNovo()
}