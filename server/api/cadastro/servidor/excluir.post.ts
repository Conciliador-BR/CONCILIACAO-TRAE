import { requireAdminAccess } from '../../../utils/adminAccess'
import { listInfraTree, removeInfraNode } from '../../../utils/infraFilesystem'

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event)
  const body = await readBody(event)

  const tipo = String(body?.tipo || 'empresa').trim().toLowerCase()
  const confirmacao = String(body?.confirmacao || '').trim().toUpperCase()

  if (!['adquirente', 'empresa'].includes(tipo)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tipo invalido para exclusao.'
    })
  }

  if (confirmacao !== 'EXCLUIR') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Digite EXCLUIR para confirmar a remocao da pasta.'
    })
  }

  const result = await removeInfraNode({
    tipo: tipo as 'adquirente' | 'empresa',
    adquirente: String(body?.adquirente || '').trim(),
    empresa: String(body?.empresa || '').trim()
  })

  return {
    ok: true,
    message: 'Pasta removida com sucesso do servidor.',
    result,
    estrutura: await listInfraTree()
  }
})
