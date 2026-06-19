import { requireAdminAccess } from '../../../utils/adminAccess'
import { createEmpresaStructure, listInfraTree } from '../../../utils/infraFilesystem'

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event)
  const body = await readBody(event)

  const adquirente = String(body?.adquirente || '').trim()
  const empresa = String(body?.empresa || '').trim()

  if (!adquirente || !empresa) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Adquirente e empresa sao obrigatorios para criar a estrutura.'
    })
  }

  const result = await createEmpresaStructure({ adquirente, empresa })

  return {
    ok: true,
    message: `Estrutura criada com sucesso para ${result.empresaSlug} em ${result.adquirenteSlug}.`,
    result,
    estrutura: await listInfraTree()
  }
})
