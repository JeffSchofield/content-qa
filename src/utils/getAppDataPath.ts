import { homedir } from 'os'
import { join } from 'path'

export function getAppDataPath(appName: string) {
  switch (process.platform) {
    case 'win32':
      return join(process.env.APPDATA || '', appName)
    default:
      return join(homedir(), `.${appName}`)
  }
}
