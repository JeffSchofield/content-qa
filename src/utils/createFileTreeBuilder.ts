import { normalize, sep } from "path";

export type DirectoryTree = {
  [key: string]: DirectoryTree;
};

export interface FileTreeBuilder {
  insertPath: (path: string) => void;
  toString: (indent?: string) => string;
}

export function createFileTreeBuilder(): FileTreeBuilder {
    const tree: DirectoryTree = {};

    // This function normalizes and splits the path considering 
    // operating system-specific conventions.
    function splitPath(filePath: string): string[] {
      const normalizedPath = normalize(filePath);
      // Using path.sep ensures that we split using the correct file separator for the OS
      return normalizedPath.split(sep).filter((p) => p && p !== '.');
    }
  
    function insertPath(filePath: string): void {
      const parts = splitPath(filePath);
      let currentLevel = tree;
  
      for (const part of parts) {
        if (!currentLevel[part]) {
          currentLevel[part] = {};
        }
        currentLevel = currentLevel[part];
      }
    }
  
    function printNode(node: DirectoryTree, prefix: string): string {
      return Object.entries(node)
        .map(([key, value]) => `${prefix}${key}\n` + printNode(value, prefix + '  '))
        .join('');
    }
  
    function toString(indent: string = ''): string {
      return printNode(tree, indent);
    }
  
    return { insertPath, toString };
}
