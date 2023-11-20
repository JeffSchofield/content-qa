import { terminal } from "terminal-kit";

export function drawDivider() {
    terminal('\n\n')
    terminal.gray('—'.repeat(terminal.width));
    terminal.styleReset().nextLine(1);
}