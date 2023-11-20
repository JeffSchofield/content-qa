import { terminal } from "terminal-kit";

export function terminateCLI() {
  terminal.grabInput(false);

  setTimeout(function () {
    process.exit();
  }, 100);
}
