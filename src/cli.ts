#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { ScreenBuffer, TextBuffer, terminal } from "terminal-kit";
import { drawDivider, gatherInputs, terminateCLI, buildSystemMessage } from "./utils";
import { config } from "dotenv";
import { multilineInputField } from "./utils/multilineInputField";
import { marked } from 'marked';
import { markedTerminal } from 'marked-terminal';
import { Config, getConfig, setConfigOption } from "./config";
import { createAgent } from "./agent/agent";
import wordwrap from 'wordwrap'
config();

const screen_buffer = new ScreenBuffer({
  dst: terminal
});

const text_buffer = new TextBuffer({
  dst: screen_buffer,
});

async function init() {
  // Set up terminal
  terminal.hideCursor(true); // Disable terminal input while we gather content inputs
  terminal.on("key", function (name: string) {
    if (name === "CTRL_C") {
      terminateCLI();
    }
  });

  // Load config
  const { openai_key, wordwrap_width = 80 } = await getConfig();

  const wrap = wordwrap(wordwrap_width);

  marked.use(markedTerminal({
    reflowText: true,
    tab: 2,
    width: wordwrap_width,
    list: (body:any, ordered:any) => body.trim().split('\n').map((s:any, i:any) => wrap(s.trim())).join('\n')
  }));

  // Step 1: Set up terminal and read command line arguments
  const args = hideBin(process.argv); // Remove the first two arguments
  const argv = await yargs(args)
    .usage("Usage: $0 [options]")
    .command('set <option> <value>', 'Set a configuration option', (yargs) => {
      return yargs.positional('option', {
        describe: 'The configuration option to set',
        type: 'string',
      })
      .positional('value', {
        describe: 'The value to set for the option',
        type: 'string',
      });
    }, async (argv) => {
      const [store, key] = argv.option?.split('.') || []
      if (store == 'config' && key) {
        const success = await setConfigOption(key as keyof Config, argv.value || '');
        if (success) {
          terminal.green(`Successfully updated config value for '${key}'.\n`);
        } else {
          terminal.red(`Failed to set config value for '${key}'.\n`);
        }
        process.exit(success ? 0 : 1);
      }
    })
    .option("i", {
      alias: "input",
      nargs: 1,
      type: "array",
      description: "Include a specific URL, file, or directory",
    })
    .option("e", {
      alias: "exclude",
      nargs: 1,
      type: "array",
      description: "Exclude file or directory",
    })
    .help()
    .parseAsync();

  const inputs = (argv.i as string[] | undefined) || [];

  const input_arg = argv._[0];
  if (input_arg) inputs.push(input_arg as string);

  if (inputs.length === 0) {
    yargs.showHelp();
    process.exit(0);
  }

  // Header
  terminal('\n\n')
  terminal.red.bold(`Content QA`).styleReset();
  drawDivider();
  terminal('\n\n')

  // Check for the OpenAI API key, exit if not found
  const api_key = process.env.OPENAI_API_KEY || openai_key;
  if (!api_key) {
    terminal.red('Error: OpenAI API key not found. Please set OPENAI_API_KEY in your environment variables or in the config.json file.\n');
    process.exit(1); // Exit with a non-zero code to indicate an error
  }

  // Step 2: Gather inputs
  terminal(`Gathering inputs...\n\n`);
  const gathered_inputs = await gatherInputs(inputs);

  if (gathered_inputs.files.length) {
    drawDivider();
    terminal(`Included file tree \n\n`);
    terminal(gathered_inputs.file_tree.toString() + '\n\n')
  }


  if (gathered_inputs.URLs.length) {
    drawDivider();
    terminal(`Included URLs \n\n`);
    for (const urlInput of gathered_inputs.URLs) {
      terminal(`  \`${urlInput.url}\` - ${urlInput.title}\n`)
    }
    terminal('\n')
  }

  // Step 3: Build system message and connect to agent
  drawDivider();
  terminal(`\n\nConnecting to agent...`);

  const system_message = buildSystemMessage(gathered_inputs);

  const agent = createAgent({
    system_message,
    api_key
  })

  const conversation = agent.createConversation();

  // Start chat loop
  while (true) {
    drawDivider();
    terminal.hideCursor(false);
    terminal.magenta.bold("\n\nYou\n");


    // terminal('TEST\n')
    // terminal('TEST\n')
    // terminal('TEST')
    // terminal.scrollDown(2);
    // terminal.nextLine(1);
    // terminal('TEST2\n')
    // terminal('TEST2\n')
    // terminal('TEST2')

    // process.exit();

    // Get user input
    // const { promise: inputField } = terminal.inputField();
    const user_message = (await multilineInputField()) ?? "";

    terminal.hideCursor(true); // Hide the cursor while the bot is typing
    terminal.brightBlue.bold("\n\nAssistant\n"); // Print the assistant's name

    // Create a spinner while the bot is thinking
    const spinner = await terminal.spinner();

    // Send the message to the agent
    const response = await conversation.sendMessage(user_message);

    // Remove the spinner
    spinner.animate(false);
    terminal.left(1);

    // Print as the response comes in
    let response_so_far = '';
    let rendered_response_so_far = '';
    text_buffer.setText(rendered_response_so_far);
    for await (const chunk of response.stream) {
      // terminal(chunk);

      response_so_far += chunk.toString(); // Collect the chunks as they come in to build the response so far
      rendered_response_so_far = marked(response_so_far).trim(); // Render the response so far as markdown

      const { height: last_height } = text_buffer.getContentSize()
      text_buffer.setText(rendered_response_so_far);
      const { height } = text_buffer.getContentSize()

      // Sending to the terminal
      if (last_height < terminal.height) {
        terminal.move(0, -last_height);
        terminal.nextLine(1);
        terminal.eraseDisplayBelow();
        terminal(rendered_response_so_far);
      } else {
        if (height > last_height) terminal('\n\n')
        // The content we are writing is too long for the terminal, so we need to clear what is visible and append only 
        terminal.moveTo(0,2);
        terminal.eraseDisplayBelow();
        terminal(rendered_response_so_far.split('\n').slice(-(terminal.height-2)).join('\n'));
      }
    }
  }
}

init().catch((err) => {
  console.error(err);
  terminateCLI();
});
