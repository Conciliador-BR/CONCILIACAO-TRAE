import { requireAdminAccess } from '../../../utils/adminAccess'
import { listInfraTree } from '../../../utils/infraFilesystem'

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event)
  return await listInfraTree()
})
