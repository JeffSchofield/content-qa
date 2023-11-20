import { terminal, ScreenBuffer } from "terminal-kit";
import { gatherInput } from "./gatherInput";
import { FileTreeBuilder, createFileTreeBuilder } from "./createFileTreeBuilder";

export interface GatherContext {
  updateStatus: (
    status: string,
    options?: { level?: "success" | "info" | "alert" }
  ) => void;
  file_tree: FileTreeBuilder;
  files: GatheredFile[];
  URLs: GatheredURL[];
}

export interface GatheredFile {
  path: string;
  content: string;
}

export interface GatheredURL {
  url: string;
  type: 'article' | 'video'
  content: string;
  title?: string;
}

export interface GatherResult {
  cwd: string;
  file_tree: FileTreeBuilder;
  files: GatheredFile[];
  URLs: GatheredURL[];
}

export async function gatherInputs(
  inputs: string[],
  cwd = process.cwd()
): Promise<GatherResult> {
  // Create new blank rows to make room for the status screen
  terminal(inputs.map((_) => "\n").join(""));

  // Create a new screen buffer for the status screen
  const statusScreenBuffer = new ScreenBuffer({
    dst: terminal,
    width: terminal.width,
    height: inputs.length, // Adjust the height as needed
    y: terminal.height - inputs.length, // Start from the bottom of the terminal
  });

  statusScreenBuffer.fill({ attr: { color: 0, bgColor: 0 }, char: " " }); // Fill with spaces
  statusScreenBuffer.draw(); // Draw the initial status buffer

  const file_tree = createFileTreeBuilder();
  const gathered_files: GatheredFile[] = [];
  const gathered_urls: GatheredURL[] = [];

  // Store all input gathering processes
  const input_processes = [];

  for (const i in inputs) {
    const input = inputs[i];
    const putOptions: ScreenBuffer.PutOptions = {
      attr: {},
      wrap: true,
      dx: 1,
      dy: 0,
      x: 2,
      y: parseInt(i),
    };

    function updateStatus(
      status: string,
      { level = "info" }: Parameters<GatherContext["updateStatus"]>[1] = {}
    ) {
      let color: number | undefined;
      if (level === "success") {
        color = 2;
      } else if (level === "alert") {
        color = 1;
      }

      statusScreenBuffer.put(putOptions, " ".repeat(terminal.width)); // Clear the line
      statusScreenBuffer.put(
        { ...putOptions, attr: { color } },
        `\`${input}\` - ${status}`
      ); // Update status
      statusScreenBuffer.draw();
    }

    const context = { updateStatus, file_tree, files: gathered_files, URLs: gathered_urls };
    updateStatus("In progress...");

    input_processes.push(gatherInput(input, context));
  }

  await Promise.all(input_processes);

  terminal("\n\n");
  return {
    cwd,
    file_tree,
    files: gathered_files,
    URLs: gathered_urls,
  };
}
