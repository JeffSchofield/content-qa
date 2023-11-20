import { terminal } from 'terminal-kit'

export function multilineInputField() {
    return new Promise<string>((resolve, reject) => {
      let inputBuffer = '';
      let cursorX = 0; // Not used in this simplified version but useful for future enhancements
      let cursorY = 0;


      function handleKeyPress(key: string, keys: unknown, data: any) {
        if (key === 'ENTER') {
          submitMessage();
        } else if (key === 'ALT_ENTER' || key === 'LINEFEED') {
          // Enter a new line on 'Shift+Enter' or when pasted text contains a newline
          inputBuffer += '\n';
          cursorY++;
          terminal('\n');
        } else if (key === 'BACKSPACE') {
          if (inputBuffer.length) {
            let lastChar = inputBuffer[inputBuffer.length - 1];
            if (lastChar === '\n') {
              // Handle new line
              terminal.up(1);
              cursorY--;
            } else {
              terminal.left(1).delete(1);
            }
            // Remove the last character from the buffer
            inputBuffer = inputBuffer.slice(0, -1);
          }
        } else if (key.length === 1) {
          inputBuffer += key;
          terminal(key);
        }
      }
  
      function submitMessage() {
        resolve(inputBuffer); // Resolve the promise with the input text
        terminal.off('key', handleKeyPress);
        terminal.grabInput(false);
      }

      terminal.grabInput({});
      terminal.on('key', handleKeyPress);
    });
  }