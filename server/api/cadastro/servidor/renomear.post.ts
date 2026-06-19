import { requireAdminAccess } from '../../../utils/adminAccess'
import { listInfraTree, renameInfraNode } from '../../../utils/infraFilesystem'

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event)
  const body = await readBody(event)

  const tipo = String(body?.tipo || 'empresa').trim().toLowerCase()
  const novoNome = String(body?.novoNome || '').trim()

  if (!['adquirente', 'empresa'].includes(tipo)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tipo invalido para renomeacao.'
    })
  }

  if (!novoNome) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe o novo nome da pasta.'
    })
  }

  const result = await renameInfraNode({
    tipo: tipo as 'adquirente' | 'empresa',
    adquirenteAtual: String(body?.adquirenteAtual || '').trim(),
    empresaAtual: String(body?.empresaAtual || '').trim(),
    novoNome
  })

  return {
    ok: true,
    message: `Pasta renomeada com sucesso para ${result.newSlug}.`,
    result,
    estrutura: await listInfraTree()
  }
})
