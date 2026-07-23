import { computed, onMounted, ref, watch } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import {
  AUTORIZADA_MANUAL_MODALIDADES,
  AUTORIZADA_MANUAL_MODALIDADE_MAP,
  AUTORIZADA_MANUAL_STORAGE_MARKER,
  formatarNomeAdquirenteManual,
  normalizarAutorizadaTexto,
  resolverNomeTabelaAdquirenteManual,
  resolverChaveModalidadeManual
} from './constants'
import {
  criarLinhasAutorizadaInicial,
  formatBRLNumberAutorizada,
  linhaAutorizadaTemAlteracao,
  parseBRLAutorizada,
  recalcularLinhaAutorizada,
  round2Autorizada,
  sincronizarInputsLinhaAutorizada,
  sincronizarSnapshotLinhaAutorizada
} from './state'

const criarResolversBase = ({ filtroAtivoRef, obterEmpresaSelecionadaCompleta, filtrosGlobais }) => {
  const resolverEmpresaNome = async () => {
    const nomeViaFiltroAtivo = filtroAtivoRef?.value?.empresa
    if (nomeViaFiltroAtivo) return nomeViaFiltroAtivo
    const empresaCompleta = await obterEmpresaSelecionadaCompleta()
    return empresaCompleta?.nome || ''
  }

  const resolverEmpresaEC = async () => {
    const ecViaFiltroAtivo = filtroAtivoRef?.value?.matriz
    if (ecViaFiltroAtivo) return ecViaFiltroAtivo
    const empresaCompleta = await obterEmpresaSelecionadaCompleta()
    return empresaCompleta?.matriz || ''
  }

  const resolverPeriodoTrabalho = () => {
    const filtro = filtroAtivoRef?.value
    let primeiroDia
    let ultimoDia

    if (filtro?.dataInicial && filtro?.dataFinal) {
      primeiroDia = filtro.dataInicial
      ultimoDia = filtro.dataFinal
    } else if (filtrosGlobais.dataInicial && filtrosGlobais.dataFinal) {
      primeiroDia = filtrosGlobais.dataInicial
      ultimoDia = filtrosGlobais.dataFinal
    } else if (filtrosGlobais.dataInicial) {
      primeiroDia = filtrosGlobais.dataInicial
      ultimoDia = filtrosGlobais.dataInicial
    } else {
      const hoje = new Date()
      primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
      ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]
    }

    return { primeiroDia, ultimoDia, chaveMes: `${primeiroDia}` }
  }

  return { resolverEmpresaNome, resolverEmpresaEC, resolverPeriodoTrabalho }
}

const distribuirMdr = (linha) => {
  const entradas = AUTORIZADA_MANUAL_MODALIDADES
    .map(({ chave }) => ({ chave, valor: round2Autorizada(linha[chave] || 0) }))
    .filter((item) => item.valor > 0)

  const total = entradas.reduce((acc, item) => acc + item.valor, 0)
  const totalMdr = round2Autorizada(linha.despesa_mdr || 0)
  const distribuicao = {}

  if (!entradas.length || total <= 0 || totalMdr === 0) {
    AUTORIZADA_MANUAL_MODALIDADES.forEach(({ chave }) => { distribuicao[chave] = 0 })
    return distribuicao
  }

  let acumulado = 0
  entradas.forEach((item, index) => {
    const share = index === entradas.length - 1
      ? round2Autorizada(totalMdr - acumulado)
      : round2Autorizada((totalMdr * item.valor) / total)
    distribuicao[item.chave] = share
    acumulado = round2Autorizada(acumulado + share)
  })

  AUTORIZADA_MANUAL_MODALIDADES.forEach(({ chave }) => {
    if (!(chave in distribuicao)) distribuicao[chave] = 0
  })

  return distribuicao
}

const preencherLinhaComRegistros = (linha, registros, mdrColumn) => {
  linha.debito = 0
  linha.credito = 0
  linha.credito2x = 0
  linha.credito3x = 0
  linha.voucher = 0
  linha.despesa_mdr = 0
  linha._records_by_modalidade = {}

  ;(registros || []).forEach((registro) => {
    const chaveModalidade = resolverChaveModalidadeManual(registro?.modalidade, registro?.numero_parcelas, registro?.bandeira)
    linha[chaveModalidade] = round2Autorizada(Number(linha[chaveModalidade] || 0) + Number(registro?.valor_bruto || 0))
    linha.despesa_mdr = round2Autorizada(Number(linha.despesa_mdr || 0) + Number(registro?.[mdrColumn] || 0))

    if (!linha._records_by_modalidade[chaveModalidade]) {
      linha._records_by_modalidade[chaveModalidade] = []
    }
    linha._records_by_modalidade[chaveModalidade].push(registro)
  })

  recalcularLinhaAutorizada(linha)
  sincronizarSnapshotLinhaAutorizada(linha)
}

export const useManualAutorizadaBase = ({
  filtroAtivoRef,
  obterEmpresaSelecionadaCompleta,
  filtrosGlobais,
  construirNomeTabela,
  normalizarEcNumerico,
  context,
  storagePrefix
}) => {
  const linhas = ref(criarLinhasAutorizadaInicial())
  const nomeAdquirente = ref('')
  const loading = ref(false)
  const error = ref(null)
  const successMessage = ref(null)

  const { resolverEmpresaNome, resolverEmpresaEC, resolverPeriodoTrabalho } = criarResolversBase({
    filtroAtivoRef,
    obterEmpresaSelecionadaCompleta,
    filtrosGlobais
  })

  const empresaSelecionada = computed(() => Boolean(filtroAtivoRef?.value?.empresa) || Boolean(filtrosGlobais.empresaSelecionada))

  const resetarLinhas = () => {
    linhas.value = criarLinhasAutorizadaInicial()
  }

  const limparMensagens = () => {
    error.value = null
    successMessage.value = null
  }

  const persistirNomeAdquirente = () => {
    if (!process.client) return
    window.localStorage.setItem(`${storagePrefix}:adquirente`, nomeAdquirente.value)
  }

  const carregarNomePersistido = () => {
    if (!process.client) return
    nomeAdquirente.value = formatarNomeAdquirenteManual(window.localStorage.getItem(`${storagePrefix}:adquirente`) || '')
  }

  const atualizarCampo = (linha, campo, rawValue) => {
    linha[campo] = parseBRLAutorizada(rawValue)
    recalcularLinhaAutorizada(linha, { sincronizarInputs: false })
  }

  const atualizarNomeAdquirente = (rawValue) => {
    nomeAdquirente.value = formatarNomeAdquirenteManual(rawValue)
  }

  const formatarTabelaParaCarregamento = async (tableName, empresaAtual, ecAtual, mdrColumn, ecColumn) => {
    const { primeiroDia, ultimoDia } = resolverPeriodoTrabalho()
    const startCreatedAtIso = new Date(`${primeiroDia}T00:00:00`).toISOString()
    const endCreatedAtIso = new Date(`${ultimoDia}T23:59:59.999`).toISOString()

    return await supabase
      .from(tableName)
      .select(`id, created_at, data_venda, adquirente, bandeira, modalidade, numero_parcelas, valor_bruto, valor_liquido, nsu, ${mdrColumn}`)
      .ilike('empresa', String(empresaAtual))
      .eq(ecColumn, ecAtual)
      .eq('adquirente', nomeAdquirente.value)
      .eq('nsu', AUTORIZADA_MANUAL_STORAGE_MARKER)
      .gte('created_at', startCreatedAtIso)
      .lte('created_at', endCreatedAtIso)
      .order('created_at', { ascending: false })
  }

  const carregarDados = async () => {
    limparMensagens()
    resetarLinhas()

    const empresaAtual = await resolverEmpresaNome()
    if (!empresaAtual) return
    if (!nomeAdquirente.value) {
      error.value = 'Digite o nome da adquirente para carregar a autorizada manual.'
      return
    }

    const ecAtual = normalizarEcNumerico(await resolverEmpresaEC())
    if (ecAtual == null) {
      error.value = 'EC invalido para carregar a autorizada manual.'
      return
    }

    loading.value = true
    const tableName = construirNomeTabela(empresaAtual, resolverNomeTabelaAdquirenteManual(nomeAdquirente.value))
    let ecColumn = 'matriz'
    let mdrColumn = 'despesa_mdr'
    let data = null
    let queryError = null

    try {
      ;({ data, error: queryError } = await formatarTabelaParaCarregamento(tableName, empresaAtual, ecAtual, mdrColumn, ecColumn))

      if (queryError?.message && queryError.message.includes('column') && queryError.message.includes('"matriz"')) {
        ecColumn = 'ec'
        ;({ data, error: queryError } = await formatarTabelaParaCarregamento(tableName, empresaAtual, ecAtual, mdrColumn, ecColumn))
      }

      if (queryError?.message && queryError.message.includes('column') && queryError.message.includes('"despesa_mdr"')) {
        mdrColumn = 'despesa'
        ;({ data, error: queryError } = await formatarTabelaParaCarregamento(tableName, empresaAtual, ecAtual, mdrColumn, ecColumn))
      }

      if (queryError) {
        if (queryError.code === '42P01') {
          error.value = `Tabela ${tableName} nao existe no banco de dados.`
          return
        }
        throw queryError
      }

      linhas.value.forEach((linha) => {
        const registrosLinha = (data || []).filter((item) => normalizarAutorizadaTexto(item?.bandeira) === linha.bandeira)
        preencherLinhaComRegistros(linha, registrosLinha, mdrColumn)
      })

      successMessage.value = 'Autorizada manual carregada com sucesso.'
      persistirNomeAdquirente()
    } catch (err) {
      error.value = `Erro ao carregar autorizada manual: ${err.message || err}`
    } finally {
      loading.value = false
    }
  }

  const montarPayloadBase = ({
    linha,
    modalidadeKey,
    valorBruto,
    valorLiquido,
    mdrValor,
    empresaPersistencia,
    ecAtual,
    ecColumn,
    mdrColumn,
    chaveMes,
    createdAtMesIso
  }) => {
    const modalidadeInfo = AUTORIZADA_MANUAL_MODALIDADE_MAP[modalidadeKey]
    const payload = {
      empresa: empresaPersistencia,
      adquirente: nomeAdquirente.value,
      bandeira: linha.bandeira,
      modalidade: modalidadeInfo.modalidade,
      numero_parcelas: modalidadeInfo.numeroParcelas,
      valor_bruto: valorBruto,
      valor_liquido: valorLiquido,
      data_venda: chaveMes,
      created_at: createdAtMesIso,
      nsu: AUTORIZADA_MANUAL_STORAGE_MARKER
    }
    payload[ecColumn] = ecAtual
    payload[mdrColumn] = mdrValor

    if (context === 'recebimentos') {
      payload.valor_previsto = valorLiquido
      payload.valor_depositado = 0
      payload.data_pgto = chaveMes
      payload.data_recebimento = chaveMes
    }

    return payload
  }

  const carregarRegistrosExistentesDaLinha = async ({ tableName, empresaAtual, ecAtual, linha, mdrColumn, ecColumn }) => {
    const { primeiroDia, ultimoDia } = resolverPeriodoTrabalho()
    const startCreatedAtIso = new Date(`${primeiroDia}T00:00:00`).toISOString()
    const endCreatedAtIso = new Date(`${ultimoDia}T23:59:59.999`).toISOString()

    const { data, error: queryError } = await supabase
      .from(tableName)
      .select(`id, created_at, adquirente, bandeira, modalidade, numero_parcelas, valor_bruto, valor_liquido, nsu, ${mdrColumn}`)
      .ilike('empresa', String(empresaAtual))
      .eq(ecColumn, ecAtual)
      .eq('adquirente', nomeAdquirente.value)
      .eq('bandeira', linha.bandeira)
      .eq('nsu', AUTORIZADA_MANUAL_STORAGE_MARKER)
      .gte('created_at', startCreatedAtIso)
      .lte('created_at', endCreatedAtIso)
      .order('created_at', { ascending: false })

    if (queryError) throw queryError
    return data || []
  }

  const enviarLinha = async (linha) => {
    limparMensagens()

    const empresaAtual = await resolverEmpresaNome()
    if (!empresaAtual) {
      error.value = 'Selecione uma empresa primeiro.'
      return
    }
    if (!nomeAdquirente.value) {
      error.value = 'Digite o nome da adquirente antes de enviar.'
      return
    }

    const ecAtual = normalizarEcNumerico(await resolverEmpresaEC())
    if (ecAtual == null) {
      error.value = 'EC invalido para envio.'
      return
    }

    const tableName = construirNomeTabela(empresaAtual, resolverNomeTabelaAdquirenteManual(nomeAdquirente.value))
    const empresaPersistencia = String(empresaAtual || '').trim().toLowerCase()
    const { chaveMes } = resolverPeriodoTrabalho()
    const createdAtMesIso = new Date(`${chaveMes}T12:00:00`).toISOString()
    const mdrDistribuido = distribuirMdr(linha)
    let ecColumn = 'matriz'
    let mdrColumn = 'despesa_mdr'

    loading.value = true
    linha.status = 'sending'

    try {
      let existentes = []

      try {
        existentes = await carregarRegistrosExistentesDaLinha({ tableName, empresaAtual, ecAtual, linha, mdrColumn, ecColumn })
      } catch (err) {
        if (err?.message && err.message.includes('column') && err.message.includes('"matriz"')) {
          ecColumn = 'ec'
          existentes = await carregarRegistrosExistentesDaLinha({ tableName, empresaAtual, ecAtual, linha, mdrColumn, ecColumn })
        } else if (err?.message && err.message.includes('column') && err.message.includes('"despesa_mdr"')) {
          mdrColumn = 'despesa'
          existentes = await carregarRegistrosExistentesDaLinha({ tableName, empresaAtual, ecAtual, linha, mdrColumn, ecColumn })
        } else {
          throw err
        }
      }

      const existentesPorModalidade = existentes.reduce((acc, item) => {
        const chave = resolverChaveModalidadeManual(item?.modalidade, item?.numero_parcelas, item?.bandeira)
        if (!acc[chave]) acc[chave] = []
        acc[chave].push(item)
        return acc
      }, {})

      for (const modalidadeInfo of AUTORIZADA_MANUAL_MODALIDADES) {
        const { chave } = modalidadeInfo
        const valorBruto = round2Autorizada(linha[chave] || 0)
        const mdrValor = round2Autorizada(mdrDistribuido[chave] || 0)
        const valorLiquido = round2Autorizada(valorBruto - mdrValor)
        const registrosExistentes = existentesPorModalidade[chave] || []

        if (valorBruto <= 0) {
          const idsParaExcluir = registrosExistentes.map((item) => item.id).filter(Boolean)
          if (idsParaExcluir.length > 0) {
            const { error: deleteError } = await supabase.from(tableName).delete().in('id', idsParaExcluir)
            if (deleteError) throw deleteError
          }
          continue
        }

        const payload = montarPayloadBase({
          linha,
          modalidadeKey: chave,
          valorBruto,
          valorLiquido,
          mdrValor,
          empresaPersistencia,
          ecAtual,
          ecColumn,
          mdrColumn,
          chaveMes,
          createdAtMesIso
        })

        if (registrosExistentes.length > 0) {
          const [target, ...duplicates] = registrosExistentes
          const { error: updateError } = await supabase.from(tableName).update(payload).eq('id', target.id)
          if (updateError) throw updateError

          const duplicateIds = duplicates.map((item) => item.id).filter(Boolean)
          if (duplicateIds.length > 0) {
            const { error: deleteError } = await supabase.from(tableName).delete().in('id', duplicateIds)
            if (deleteError) throw deleteError
          }
        } else {
          const { error: insertError } = await supabase.from(tableName).insert([payload])
          if (insertError) throw insertError
        }
      }

      linha.status = 'success'
      sincronizarSnapshotLinhaAutorizada(linha)
      successMessage.value = `${linha.bandeira} enviada com sucesso para ${nomeAdquirente.value}.`
      persistirNomeAdquirente()
      await carregarDados()
    } catch (err) {
      linha.status = 'error'
      if (err?.code === '42P01') {
        error.value = `Tabela ${tableName} nao existe no banco de dados.`
      } else {
        error.value = `Erro ao enviar ${linha.bandeira}: ${err.message || err}`
      }
    } finally {
      loading.value = false
    }
  }

  const totais = computed(() => {
    return linhas.value.reduce((acc, linha) => {
      acc.debito += Number(linha.debito || 0)
      acc.credito += Number(linha.credito || 0)
      acc.credito2x += Number(linha.credito2x || 0)
      acc.credito3x += Number(linha.credito3x || 0)
      acc.voucher += Number(linha.voucher || 0)
      acc.despesa_mdr += Number(linha.despesa_mdr || 0)
      acc.valor_bruto += Number(linha.valor_bruto || 0)
      acc.valor_liquido += Number(linha.valor_liquido || 0)
      return acc
    }, {
      debito: 0,
      credito: 0,
      credito2x: 0,
      credito3x: 0,
      voucher: 0,
      despesa_mdr: 0,
      valor_bruto: 0,
      valor_liquido: 0
    })
  })

  const temAlteracao = (linha) => Boolean(nomeAdquirente.value) && linhaAutorizadaTemAlteracao(linha)

  const atualizarInput = (linha, campo, event) => {
    const raw = String(event?.target?.value ?? '')
    linha[`_${campo}_input`] = raw
    atualizarCampo(linha, campo, raw)
  }

  const focarInput = (_linha, event) => {
    event?.target?.select?.()
  }

  const blurInput = (linha, campo) => {
    sincronizarInputsLinhaAutorizada(linha)
    linha[`_${campo}_input`] = formatBRLNumberAutorizada(linha[campo])
    recalcularLinhaAutorizada(linha, { sincronizarInputs: true })
  }

  watch(nomeAdquirente, () => {
    limparMensagens()
    persistirNomeAdquirente()
  })

  onMounted(() => {
    carregarNomePersistido()
  })

  return {
    nomeAdquirente,
    empresaSelecionada,
    linhas,
    loading,
    error,
    successMessage,
    totais,
    carregarDados,
    enviarLinha,
    atualizarNomeAdquirente,
    temAlteracao,
    atualizarInput,
    focarInput,
    blurInput,
    setError: (value) => { error.value = value },
    setSuccessMessage: (value) => { successMessage.value = value },
    limparMensagens
  }
}
