import { terminal } from 'terminal-kit'

export function multilineInputField() {
  return new Promise<string>((resolve) => {
    let inputBuffer = ''

    function handleKeyPress(key: string) {
      if (key === 'ENTER') {
        submitMessage()
      } else if (key === 'ALT_ENTER' || key === 'LINEFEED') {
        // Enter a new line on 'Shift+Enter' or when pasted text contains a newline
        inputBuffer += '\n'
        terminal('\n')
      } else if (key === 'BACKSPACE') {
        if (inputBuffer.length) {
          const lastChar = inputBuffer[inputBuffer.length - 1]
          if (lastChar === '\n') {
            // Handle new line
            terminal.up(1)
          } else {
            terminal.left(1).delete(1)
          }
          // Remove the last character from the buffer
          inputBuffer = inputBuffer.slice(0, -1)
        }
      } else if (key.length === 1) {
        inputBuffer += key
        terminal(key)
      }
    }

    function submitMessage() {
      resolve(inputBuffer) // Resolve the promise with the input text
      terminal.off('key', handleKeyPress)
      terminal.grabInput(false)
    }

    terminal.grabInput({})
    terminal.on('key', handleKeyPress)
  })
}
