import { computed } from 'vue'

const isMissingColumnError = (error, column) => {
  const message = String(error?.message || '')
  return message.includes('column') && message.includes(`"${column}"`)
}

const construirIntervaloIso = (resolverPeriodoTrabalho) => {
  const { primeiroDia, ultimoDia } = resolverPeriodoTrabalho()
  return {
    inicio: new Date(`${primeiroDia}T00:00:00`).toISOString(),
    fim: new Date(`${ultimoDia}T23:59:59.999`).toISOString()
  }
}

const criarListaCandidatos = async ({ empresaAtual, resolverOperadorasDisponiveis, formatarNomeAdquirenteManual, resolverNomeTabelaAdquirenteManual }) => {
  const operadorasRaw = await resolverOperadorasDisponiveis?.(empresaAtual)
  const operadoras = Array.isArray(operadorasRaw) ? operadorasRaw : []

  const adicionais = ['Pag Seguro', 'PagSeguro', 'PagBank']
  const candidatos = [...operadoras, ...adicionais]
    .map((item) => formatarNomeAdquirenteManual(item))
    .filter(Boolean)

  const vistos = new Set()
  return candidatos.filter((item) => {
    const chave = String(resolverNomeTabelaAdquirenteManual(item) || '')
      .trim()
      .toLowerCase()
    if (!chave || vistos.has(chave)) return false
    vistos.add(chave)
    return true
  })
}

const buscarPrimeiroRegistroManual = async ({
  supabase,
  readTablePage,
  shouldUseScopedRead,
  tableName,
  empresaAtual,
  ecAtual,
  storageMarker,
  inicio,
  fim,
  ecColumn
}) => {
  if (shouldUseScopedRead?.value) {
    const data = await readTablePage({
      table: tableName,
      columns: 'id, adquirente, created_at',
      from: 0,
      to: 0,
      filters: {
        ilike: { empresa: String(empresaAtual) },
        eq: {
          [ecColumn]: ecAtual,
          nsu: storageMarker
        },
        dateColumn: 'created_at',
        dataInicial: inicio,
        dataFinal: fim,
        orderBy: [{ column: 'created_at', ascending: false }]
      }
    })
    return Array.isArray(data) ? data : []
  }

  const { data, error } = await supabase
    .from(tableName)
    .select('id, adquirente, created_at')
    .ilike('empresa', String(empresaAtual))
    .eq(ecColumn, ecAtual)
    .eq('nsu', storageMarker)
    .gte('created_at', inicio)
    .lte('created_at', fim)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw error
  return Array.isArray(data) ? data : []
}

export const createRemoteManualAutorizadaResolver = ({
  supabase,
  readTablePage,
  shouldUseScopedRead = computed(() => false),
  construirNomeTabela,
  formatarNomeAdquirenteManual,
  resolverNomeTabelaAdquirenteManual,
  resolverEmpresaNome,
  resolverEmpresaEC,
  resolverPeriodoTrabalho,
  resolverOperadorasDisponiveis,
  normalizarEcNumerico,
  storageMarker
}) => {
  const discoverRemoteManualAdquirente = async () => {
    const empresaAtual = await resolverEmpresaNome()
    const ecAtual = normalizarEcNumerico(await resolverEmpresaEC())

    if (!empresaAtual || ecAtual == null) return ''

    const { inicio, fim } = construirIntervaloIso(resolverPeriodoTrabalho)
    const candidatos = await criarListaCandidatos({
      empresaAtual,
      resolverOperadorasDisponiveis,
      formatarNomeAdquirenteManual,
      resolverNomeTabelaAdquirenteManual
    })

    for (const candidato of candidatos) {
      const tableName = construirNomeTabela(empresaAtual, resolverNomeTabelaAdquirenteManual(candidato))
      let ecColumn = 'matriz'

      try {
        let rows = await buscarPrimeiroRegistroManual({
          supabase,
          readTablePage,
          shouldUseScopedRead,
          tableName,
          empresaAtual,
          ecAtual,
          storageMarker,
          inicio,
          fim,
          ecColumn
        })

        if (!rows.length) continue
        return formatarNomeAdquirenteManual(rows[0]?.adquirente || candidato)
      } catch (error) {
        if (isMissingColumnError(error, ecColumn)) {
          ecColumn = 'ec'
          try {
            const rows = await buscarPrimeiroRegistroManual({
              supabase,
              readTablePage,
              shouldUseScopedRead,
              tableName,
              empresaAtual,
              ecAtual,
              storageMarker,
              inicio,
              fim,
              ecColumn
            })

            if (!rows.length) continue
            return formatarNomeAdquirenteManual(rows[0]?.adquirente || candidato)
          } catch (fallbackError) {
            if (fallbackError?.code === '42P01') continue
            console.error(`Erro ao descobrir autorizada manual na tabela ${tableName}:`, fallbackError)
          }
          continue
        }

        if (error?.code === '42P01') continue
        console.error(`Erro ao descobrir autorizada manual na tabela ${tableName}:`, error)
      }
    }

    return ''
  }

  return {
    discoverRemoteManualAdquirente
  }
}
