import { lstat } from "fs/promises";
import { GatherContext } from "../gatherInputs";
import { gatherDirectory } from "./gatherDirectory";
import { gatherFile } from "./gatherFile";

export async function gatherPath(path: string, context: GatherContext) {
  const { updateStatus } = context;

  try {
    const stat = await lstat(path);
    if (stat.isDirectory()) {
      await gatherDirectory(path, context);
      updateStatus("Complete!", { level: 'success' });
    } else if (stat.isFile()) {
      await gatherFile(path, context);
      updateStatus("Complete!", { level: 'success' });
    } else {
      updateStatus("Not sure what this is!", { level: 'alert' });
    }
  } catch (e) {
    updateStatus("Not found!", { level: 'alert' });
  }
}
