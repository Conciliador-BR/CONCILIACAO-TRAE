import { mapSenha, validateSenha } from './mappers.js'

export const createUpsertOperations = (supabase, state) => {
  const { loading, error, success, resumo } = state

  const upsertSenha = async (senha, options = {}) => {
    try {
      loading.value = true
      error.value = null
      success.value = false
      const validation = validateSenha(senha)
      if (!validation.isValid) throw new Error(`Validação falhou: ${validation.errors.join(', ')}`)
      const senhaData = mapSenha(senha)
      if (!senhaData) throw new Error('Falha ao mapear senha')
      const idNum = Number.isFinite(Number(senhaData.id)) ? Number(senhaData.id) : null
      let result
      if (idNum !== null) {
        result = await supabase.from('cadastro_senhas').update(senhaData).eq('id', idNum).select()
      } else {
        senhaData.id = Number.isFinite(Number(senhaData.id)) ? Number(senhaData.id) : Date.now()
        result = await supabase.from('cadastro_senhas').insert(senhaData).select()
      }
      if (result.error) throw result.error
      success.value = true
      return { ok: true, data: result.data?.[0] || null, message: 'Senha salva com sucesso' }
    } catch (err) {
      error.value = err.message || 'Erro ao salvar senha'
      return { ok: false, error: error.value, data: null }
    } finally {
      loading.value = false
    }
  }

  const upsertSenhas = async (senhas, options = {}) => {
    try {
      loading.value = true
      error.value = null
      success.value = false
      if (!Array.isArray(senhas) || senhas.length === 0) throw new Error('Array de senhas inválido ou vazio')
      const senhasValidas = []
      const errosValidacao = []
      senhas.forEach((senha, index) => {
        const validation = validateSenha(senha)
        if (validation.isValid) {
          const s = mapSenha(senha)
          if (s) senhasValidas.push(s)
          else errosValidacao.push(`Senha ${index + 1}: falha no mapeamento`)
        } else {
          errosValidacao.push(`Senha ${index + 1}: ${validation.errors.join(', ')}`)
        }
      })
      if (senhasValidas.length === 0) throw new Error(`Nenhuma senha válida encontrada. Erros: ${errosValidacao.join('; ')}`)
      const empresasParaLimpar = [...new Set(senhasValidas.map(item => item.empresa))]
      const errosFinal = [...errosValidacao]
      for (const empresa of empresasParaLimpar) {
        const del = await supabase.from('cadastro_senhas').delete().eq('empresa', empresa)
        if (del.error) errosFinal.push(`Falha ao limpar empresa ${empresa}: ${del.error.message}`)
      }
      const base = Date.now()
      const payload = senhasValidas.map((s, i) => ({ ...s, id: Number.isFinite(Number(s.id)) ? Number(s.id) : base + i }))
      const ins = await supabase.from('cadastro_senhas').insert(payload)
      if (ins.error) errosFinal.push(ins.error.message || 'Falha no insert em lote')
      const sucesso = ins.error ? 0 : senhasValidas.length
      resumo.value = { processadas: senhas.length, sucesso, falha: senhas.length - sucesso, erros: errosFinal }
      success.value = true
      return { ok: true, data: null, processadas: senhas.length, sucesso, falha: senhas.length - sucesso, erros: errosFinal, message: `${sucesso} senhas salvas com sucesso` }
    } catch (err) {
      error.value = err.message || 'Erro ao salvar senhas'
      resumo.value = { processadas: senhas?.length || 0, sucesso: 0, falha: senhas?.length || 0, erros: [error.value] }
      return { ok: false, error: error.value, data: null, processadas: senhas?.length || 0, sucesso: 0, falha: senhas?.length || 0, erros: [error.value] }
    } finally {
      loading.value = false
    }
  }

  const removerSenha = async (senha, options = {}) => {
    try {
      loading.value = true
      error.value = null
      if (!senha) throw new Error('Dados insuficientes para remover senha')
      const idNum = Number.isFinite(Number(senha.id)) ? Number(senha.id) : null
      let del
      if (idNum !== null) {
        del = await supabase.from('cadastro_senhas').delete().eq('id', idNum)
      } else {
        const ecRaw = senha.ec
        const ec = Number.isFinite(Number(ecRaw)) ? Number(ecRaw) : String(ecRaw ?? '')
        del = await supabase.from('cadastro_senhas').delete().match({ empresa: String(senha.empresa ?? ''), ec, adquirente: String(senha.adquirente ?? ''), login: String(senha.login ?? ''), portal: String(senha.portal ?? '') })
      }
      if (del.error) throw del.error
      return { ok: true, message: 'Senha removida com sucesso' }
    } catch (err) {
      error.value = err.message || 'Erro ao remover senha'
      return { ok: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  return { upsertSenha, upsertSenhas, removerSenha }
}