import { join } from "path";
import { getAppDataPath } from "./utils/getAppDataPath";
import { ensureDir } from "fs-extra";
import { readFile, writeFile } from "fs/promises";

export const app_name = 'content-qa';
export const app_data_path = getAppDataPath(app_name);

export interface Config {
  openai_key?: string;
  wordwrap_width?: number;
}

const DEFAULT_CONFIG:Config = {
  openai_key: '',
  wordwrap_width: 80
}

let loaded_config:Config;
const app_config_path = join(app_data_path, 'config.json');
export async function getConfig() {
  if (!loaded_config) {
    await ensureDir(app_data_path); // Ensure the app data path exists

    try {
      loaded_config = JSON.parse(await readFile(app_config_path, 'utf-8'));
    } catch(e) {
      loaded_config = DEFAULT_CONFIG

      try {
        await writeFile(app_config_path, JSON.stringify(loaded_config, null, 2), 'utf-8');
      } catch(e) {
        console.error('Could not write config file!')
      }
    }
  }

  return loaded_config
}

export async function setConfigOption(key: keyof Config, value: any) {
  const currentConfig = await getConfig();
  currentConfig[key] = value; // Update the type of value

  try {
    await writeFile(app_config_path, JSON.stringify(currentConfig, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Could not save the configuration file:', error);
    return false;
  }
}