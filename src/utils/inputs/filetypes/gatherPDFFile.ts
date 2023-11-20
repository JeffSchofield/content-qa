export function gatherPDFFile(file_path:string) {
    return new Promise<string>(async (resolve, reject) => {
        let data = "";

        const { PdfReader } = await import('pdfreader');
        const reader = new PdfReader({});
        reader.parseFileItems(file_path, (err, item) => {
          if (err) {
            reject(err);
          } else if (!item) {
            // End of file, resolve with the gathered data
            resolve(data);
          } else if (item.text) {
            // Accumulate text items
            data += item.text;
          }
        });
    });
}