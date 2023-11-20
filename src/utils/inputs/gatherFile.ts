import { readFile } from "fs/promises";
import { GatherContext } from "../gatherInputs";
import { parse } from "path";
import { gatherPDFFile } from "./filetypes/gatherPDFFile";

export async function gatherFile(file_path:string, { updateStatus, file_tree, files }: GatherContext) {
    updateStatus(`Gathering file...`)
    let content = '';

    // Check file extension
    let { ext } = parse(file_path);
    ext = ext.toLowerCase();

    if (ext == '.pdf') {
        updateStatus(`PDF file found! Gathering PDF file...`);
        content = await gatherPDFFile(file_path);
    } else {
        content = await readFile(file_path, 'utf-8');
    }
    files.push({ path: file_path, content });
    file_tree.insertPath(file_path);
}