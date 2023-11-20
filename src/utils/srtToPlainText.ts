export function srtToPlaintext(srtString: string): string {
  const recentLines: string[] = [] // Track the last few lines for deduplication
  const MAX_RECENT_LINES = 3 // Number of lines to consider for deduplication

  return srtString
    .split(/\r?\n\s*\r?\n/) // Split into chunks by double line breaks
    .map((chunk) => {
      return chunk
        .split(/\r?\n/) // Split each chunk into lines
        .filter((line) => !line.match(/\d+$/) && !line.match(/\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}$/)) // Remove sequence numbers and timestamp lines
        .filter((line) => {
          // Deduplicate by checking if the line is a repeat of the last few lines
          if (recentLines.includes(line)) {
            return false
          } else {
            // Update the list of recent lines
            recentLines.push(line)
            if (recentLines.length > MAX_RECENT_LINES) {
              recentLines.shift() // Keep only the most recent lines
            }
            return true
          }
        })
        .join(' ') // Join lines with spaces
    })
    .join(' ') // Join chunks with spaces
    .trim() // Trim whitespace at the ends
}
