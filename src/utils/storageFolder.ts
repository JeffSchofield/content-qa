import { ensureDir } from 'fs-extra'
import { join } from 'path'
import { app_data_path } from '../config'

export async function getStorageFolder(storagePath: string) {
  const fullPath = join(app_data_path, storagePath)

  await ensureDir(fullPath)

  return fullPath
}
