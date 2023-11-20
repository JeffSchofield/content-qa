import { glob } from "fast-glob";
import { GatherContext } from "../gatherInputs";
import { gatherPath } from "./gatherPath";

export async function gatherGlob(pattern:string, context: GatherContext) {
    const { updateStatus } = context;

    updateStatus('Gathering glob pattern...');
    try {
      const result = await glob(pattern);
      if (result.length === 0) {
        updateStatus('No files found!', { level: 'alert' });
      } else {
        updateStatus('Processing files...');
        await Promise.allSettled(result.map((path) => gatherPath(path, context)));
        updateStatus("Complete!", { level: 'success' });
      }
    } catch (e) {
      updateStatus('Error!', { level: 'alert' });
    }
}