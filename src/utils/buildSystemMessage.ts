import { writeFile } from "fs/promises";
import { GatherResult } from "./gatherInputs";

export function buildSystemMessage({ file_tree, files, URLs }: GatherResult) {
    let system_message = '';

    const file_tree_string = file_tree.toString();
    if (file_tree_string) {
        system_message += `## File Tree\n\n\`\`\`\n${file_tree_string}\n\`\`\`\n\n`;
    }

    if (files.length) {
        const file_contents = files.map(({ path, content }) => `### ${path}\n\`\`\`\n${content}\n\`\`\``).join('\n\n');
        system_message += `## File Contents\n\n${file_contents}\n\n`;
    }

    if (URLs.length) {
        const URL_contents = URLs.map(({ url, type, content }) => {
            const type_string = type === 'article' ? 'This URL is an article, here is the content:\n\n' : 'This URL is a video, here is the transcript:\n\n';
            return `### ${url}\n${type_string}\`\`\`\n${content}\n\`\`\``
        }).join('\n\n');
        system_message += `## URL Contents\n\n${URL_contents}\n\n`;
    }

    // writeFile('system_message.md', system_message, 'utf-8')
    return system_message;
}