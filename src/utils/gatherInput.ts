import { isDynamicPattern } from "fast-glob";
import { GatherContext } from "./gatherInputs";
import { gatherGlob, gatherPath, gatherURL } from "./inputs";

export async function gatherInput(input: string, context: GatherContext) {
  if (/^https?:\/\//.test(input)) {
    // Handle URLs
    return await gatherURL(input, context);
  } else if (isDynamicPattern(input)) {
    // Handle globs
    return await gatherGlob(input, context);
  } else {
    // Handle path
    return await gatherPath(input, context);
  }
}
