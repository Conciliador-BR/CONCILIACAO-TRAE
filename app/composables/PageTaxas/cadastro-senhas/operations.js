/**
 * Operações de upsert (inserir/atualizar) para senhas no Supabase
 */

import { mapSenha, validateSenha } from './mappers.js'

/**
 * Cria operações de upsert para senhas
 */
export const createUpsertOperations = (supabase, state) => {
  const { loading, error, success, resumo } = state

  /**
   * Insere ou atualiza uma única senha
   */
  const upsertSenha = async (senha, options = {}) => {
    try {
      loading.value = true
      error.value = null
      success.value = false

      // Validar senha
      const validation = validateSenha(senha)
      if (!validation.isValid) {
        throw new Error(`Validação falhou: ${validation.errors.join(', ')}`)
      }

      // Mapear para formato do Supabase
      const senhaData = mapSenha(senha)
      if (!senhaData) {
        throw new Error('Falha ao mapear senha')
      }

      console.log('📤 Enviando senha para Supabase:', senhaData)

      const idNum = Number.isFinite(Number(senhaData.id)) ? Number(senhaData.id) : null
      let data, updateError, insertError
      if (idNum !== null) {
        const result = await supabase
          .from('cadastro_senhas')
          .update(senhaData)
          .eq('id', idNum)
          .select()
        data = result.data
        updateError = result.error
        if (updateError) {
          console.error('❌ Erro ao atualizar senha:', updateError)
          throw updateError
        }
      } else {
        // Gerar id numérico quando a tabela exige NOT NULL e não há default
        senhaData.id = Number.isFinite(Number(senhaData.id)) ? Number(senhaData.id) : Date.now()
        const result = await supabase
          .from('cadastro_senhas')
          .insert(senhaData)
          .select()
        data = result.data
        insertError = result.error
        if (insertError) {
          console.error('❌ Erro ao inserir senha:', insertError)
          throw insertError
        }
      }

      console.log('✅ Senha salva com sucesso:', data)
      success.value = true
      
      return {
        ok: true,
        data: data?.[0] || null,
        message: 'Senha salva com sucesso'
      }

    } catch (err) {
      console.error('❌ Erro ao salvar senha:', err)
      error.value = err.message || 'Erro ao salvar senha'
      
      return {
        ok: false,
        error: err.message || 'Erro ao salvar senha',
        data: null
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Insere ou atualiza múltiplas senhas em lote
   */
  const upsertSenhas = async (senhas, options = {}) => {
    try {
      loading.value = true
      error.value = null
      success.value = false
      
      if (!Array.isArray(senhas) || senhas.length === 0) {
        throw new Error('Array de senhas inválido ou vazio')
      }

      console.log(`📤 Enviando ${senhas.length} senhas para Supabase...`)

      // Validar e mapear todas as senhas
      const senhasValidas = []
      const errosValidacao = []
      
      senhas.forEach((senha, index) => {
        const validation = validateSenha(senha)
        if (validation.isValid) {
          const senhaData = mapSenha(senha)
          if (senhaData) {
            senhasValidas.push(senhaData)
          } else {
            errosValidacao.push(`Senha ${index + 1}: falha no mapeamento`)
          }
        } else {
          errosValidacao.push(`Senha ${index + 1}: ${validation.errors.join(', ')}`)
        }
      })

      if (senhasValidas.length === 0) {
        throw new Error(`Nenhuma senha válida encontrada. Erros: ${errosValidacao.join('; ')}`)
      }

      console.log(`✅ ${senhasValidas.length} senhas válidas, ❌ ${errosValidacao.length} erros`)

      // Limpar todas as senhas das empresas envolvidas (mesma estratégia das taxas)
      const empresasParaLimpar = [...new Set(senhasValidas.map(item => item.empresa))]
      const errosValidacaoFinal = [...errosValidacao]
      for (const empresa of empresasParaLimpar) {
        const { error: deleteError } = await supabase
          .from('cadastro_senhas')
          .delete()
          .eq('empresa', empresa)
        if (deleteError) {
          errosValidacaoFinal.push(`Falha ao limpar empresa ${empresa}: ${deleteError.message}`)
        }
      }

      // Inserir todos os registros atuais
      let sucesso = 0
      // Garantir ids numéricos para registros sem id
      const base = Date.now()
      const payload = senhasValidas.map((s, i) => ({
        ...s,
        id: Number.isFinite(Number(s.id)) ? Number(s.id) : base + i
      }))
      const { error: insertError } = await supabase
        .from('cadastro_senhas')
        .insert(payload)
      if (insertError) {
        errosValidacaoFinal.push(insertError.message || 'Falha no insert em lote')
      } else {
        sucesso = senhasValidas.length
      }

      console.log(`✅ ${sucesso} senhas salvas com sucesso`)
      
      // Atualizar resumo
      resumo.value = {
        processadas: senhas.length,
        sucesso,
        falha: senhas.length - sucesso,
        erros: errosValidacaoFinal
      }

      success.value = true
      
      return {
        ok: true,
        data: null,
        processadas: senhas.length,
        sucesso,
        falha: senhas.length - sucesso,
        erros: errosValidacaoFinal,
        message: `${sucesso} senhas salvas com sucesso`
      }

    } catch (err) {
      console.error('❌ Erro ao salvar senhas em lote:', err)
      error.value = err.message || 'Erro ao salvar senhas'
      
      resumo.value = {
        processadas: senhas?.length || 0,
        sucesso: 0,
        falha: senhas?.length || 0,
        erros: [err.message || 'Erro ao salvar senhas']
      }
      
      return {
        ok: false,
        error: err.message || 'Erro ao salvar senhas',
        data: null,
        processadas: senhas?.length || 0,
        sucesso: 0,
        falha: senhas?.length || 0,
        erros: [err.message || 'Erro ao salvar senhas']
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Remove uma senha do Supabase
   */
  const removerSenha = async (senha, options = {}) => {
    try {
      loading.value = true
      error.value = null

      if (!senha) {
        throw new Error('Dados insuficientes para remover senha')
      }

      // Criar chave composta para exclusão
      const chaveComposta = [
        String(senha.empresa ?? ''),
        String(senha.ec ?? ''),
        String(senha.adquirente ?? ''),
        String(senha.login ?? '')
      ].join('|')

      console.log('🗑️ Removendo senha com chave:', chaveComposta)

      const idNum = Number.isFinite(Number(senha.id)) ? Number(senha.id) : null
      let deleteError
      if (idNum !== null) {
        const result = await supabase
          .from('cadastro_senhas')
          .delete()
          .eq('id', idNum)
        deleteError = result.error
      } else {
        const ecRaw = senha.ec
        const ec = Number.isFinite(Number(ecRaw)) ? Number(ecRaw) : String(ecRaw ?? '')
        const result = await supabase
          .from('cadastro_senhas')
          .delete()
          .match({
            empresa: String(senha.empresa ?? ''),
            ec,
            adquirente: String(senha.adquirente ?? ''),
            login: String(senha.login ?? ''),
            portal: String(senha.portal ?? '')
          })
        deleteError = result.error
      }

      if (deleteError) {
        console.error('❌ Erro ao remover senha:', deleteError)
        throw deleteError
      }

      console.log('✅ Senha removida com sucesso')
      
      return {
        ok: true,
        message: 'Senha removida com sucesso'
      }

    } catch (err) {
      console.error('❌ Erro ao remover senha:', err)
      error.value = err.message || 'Erro ao remover senha'
      
      return {
        ok: false,
        error: err.message || 'Erro ao remover senha'
      }
    } finally {
      loading.value = false
    }
  }

  return {
    upsertSenha,
    upsertSenhas,
    removerSenha
  }
}