import { readdir } from 'fs/promises'
import { GatherContext } from '../gatherInputs'
import { gatherPath } from './gatherPath'

export async function gatherDirectory(directory_path: string, context: GatherContext) {
  const { updateStatus } = context

  updateStatus('Gathering directory...')
  const paths = await readdir(directory_path)
  await Promise.allSettled(paths.map((file) => gatherPath(file, context)))
}
