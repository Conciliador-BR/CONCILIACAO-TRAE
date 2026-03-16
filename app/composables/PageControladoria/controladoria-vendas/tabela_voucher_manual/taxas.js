export const criarFetchTaxas = ({ supabase, vouchersData, resolverEmpresaNome, setLoading, setError, setSuccess, fetchVendasVoucher, calcularValores }) => {
  const fetchTaxas = async () => {
    const empresaAtual = await resolverEmpresaNome()
    if (!empresaAtual) return

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      await fetchVendasVoucher(empresaAtual)

      let taxasDb = []
      try {
        const { data, error: err } = await supabase
          .from('cadastro_taxas')
          .select('*')
          .eq('empresa', empresaAtual)

        if (err) throw err
        taxasDb = Array.isArray(data) ? data : []
      } catch {
        setError('Taxas não carregadas (as vendas foram carregadas normalmente).')
        taxasDb = []
      }

      vouchersData.value.forEach(voucher => {
        const taxaEncontrada = taxasDb.find(t => {
          const vUpper = voucher.nome.toUpperCase()
          const vouchersDb = (t.vouchers || '').toUpperCase()
          const bandeiraDb = (t.bandeira || '').toUpperCase()
          const adquirenteDb = (t.adquirente || '').toUpperCase()

          return vouchersDb.includes(vUpper) ||
            bandeiraDb.includes(vUpper) ||
            adquirenteDb.includes(vUpper)
        })

        voucher.taxa = taxaEncontrada ? Number(taxaEncontrada.taxa || taxaEncontrada.percentualTaxa || 0) : 0
        calcularValores(voucher)
      })
    } catch {
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  return { fetchTaxas }
}
