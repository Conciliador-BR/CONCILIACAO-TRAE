import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import * as Vue from 'vue'
import { ref } from 'vue'
import { parse, compileScript } from '@vue/compiler-sfc'
import { renderToString } from '@vue/server-renderer'
import { createSingleFlight } from '../app/utils/singleFlight.js'
import { useTableAdvancedFilters } from '../app/composables/useTableAdvancedFilters.js'

test('consultas simultaneas com a mesma chave compartilham a execucao', async () => {
  const run = createSingleFlight()
  let calls = 0
  const load = async () => { calls += 1; return [100, 200] }
  const pending = run('user:a:empresa:1', load)
  assert.equal(run.has('user:a:empresa:1'), true)
  const [first, second] = await Promise.all([pending, run('user:a:empresa:1', load)])
  assert.equal(run.has('user:a:empresa:1'), false)
  assert.equal(calls, 1)
  assert.equal(first, second)
  await run('user:a:empresa:1', load)
  assert.equal(calls, 2, 'novo envio nao pode reutilizar resposta concluida')
})

test('usuarios e filtros distintos nao compartilham consultas', async () => {
  const run = createSingleFlight()
  let calls = 0
  const load = async () => ++calls
  await Promise.all(['a:1:2026-09', 'b:1:2026-09', 'a:2:2026-09', 'a:1:2026-08'].map(key => run(key, load)))
  assert.equal(calls, 4)
})

test('falha libera a chave para uma nova tentativa', async () => {
  const run = createSingleFlight()
  await assert.rejects(run('key', () => { throw new Error('falha') }), /falha/)
  assert.equal(await run('key', async () => 42), 42)
})

test('opcoes sao calculadas somente para a coluna solicitada', () => {
  const rows = ref([
    { adquirente: 'REDE', valor_bruto: 100 },
    { adquirente: 'REDE', valor_bruto: 200 },
    { adquirente: 'CIELO', valor_bruto: 300 }
  ])
  const filters = useTableAdvancedFilters(rows, ref(['adquirente', 'valor_bruto']))
  filters.syncFilters()
  const options = filters.filterOptionsByColumn(() => true, ['adquirente'])
  assert.deepEqual(Object.keys(options), ['adquirente'])
  assert.equal(options.adquirente.find(item => item.value === 'rede').count, 2)
  filters.columnFilters.adquirente.selectedValues = ['rede']
  const values = filters.filterOptionsByColumn(() => true, ['valor_bruto'])
  assert.deepEqual(values.valor_bruto.map(item => item.value), ['100', '200'])
  assert.deepEqual(filters.filterOptionsByColumn(() => true, []), {})
})

for (const path of [
  '../app/components/vendas-operadoras/VendasTableHeader.vue',
  '../app/components/pagamentos-operadoras/PagamentosTableHeader.vue'
]) {
  test(`menu fechado nao calcula opcoes: ${path}`, async () => {
    const { descriptor } = parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
    const script = compileScript(descriptor, { id: 'test-header' }).content
      .replace(/import \{([^}]+)\} from ['"]vue['"]/g, (_, bindings) => `const {${bindings.replace(/ as /g, ': ')}} = Vue`)
      .replace('export default', 'return')
    const component = new Function('Vue', script)(Vue)
    const columnsRead = []
    const props = Vue.reactive({
      visibleColumns: ['nsu', 'valor_bruto'],
      columnTitles: {},
      columnFilters: {},
      filterOptions: column => {
        columnsRead.push(column)
        return [{ value: '100', label: '100', count: 1 }]
      }
    })
    let state
    await renderToString(Vue.createSSRApp({
      setup() {
        state = component.setup(props, { expose() {} })
        return () => Vue.h('div', state.getVisibleOptions('nsu').length)
      }
    }))
    assert.deepEqual(columnsRead, [])
    state.openColumn.value = 'valor_bruto'
    assert.equal(state.getVisibleOptions('valor_bruto').length, 1)
    assert.deepEqual(columnsRead, ['valor_bruto'])
    state.closeDropdown()
    assert.deepEqual(state.getVisibleOptions('valor_bruto'), [])
  })
}
