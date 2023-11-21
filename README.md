# Content QA CLI Tool

Content QA is a command-line interface (CLI) tool designed to gather content from various sources such as files, directories, URLs, and glob patterns. It builds a comprehensive system message containing a file tree and contents which can then be used to interact with a chatbot agent like GPT-4 for content quality analysis or other tasks.

## Features

- Gathers content from files, directories, and URLs.
- Supports glob patterns to select multiple files.
- Extracts content from various file types such as plain text and PDF.
- Processes video URLs to extract subtitles as text.
- Communicates with a chatbot agent to perform content-related tasks.
- Utilizes OpenAI's GPT-4 (preview) for conversational intelligence.

## Installation

Before installation, ensure that you have Node.js (version 18 or above) installed on your system.

To quickly get started with the CLI, you can install it globally:

```bash
npm i -g content-qa
```

## Configuration

Content QA uses Open AI and requires you to provide your own API key. You can provide it via the CLI using this command:

```bash
cqa set config.openai_key <your-openai-api-key>
```

Alternatively, ensure `OPENAI_API_KEY` is in your environment or create a `.env` file in the project root with the following variable:

```dotenv
OPENAI_API_KEY=<your-openai-api-key>
```

## Usage

To use the Content QA CLI tool, run the following command in your terminal with the desired options:

```bash
content-qa [options]

cqa [options]
```

You can also just pass in a file path or URL with no flags:

```bash
cqa https://example.com
```

**Warning:** Be mindful of what you are putting in to the system, as the content will be sent to OpenAI.

### Options

- `-i, --input [path...]`: Specify a URL, file, or directory to include as input.
- `-e, --exclude [path...]`: Exclude a particular file or directory from being processed.

### Examples

Gathering content from a specific URL:

```bash
content-qa --input https://example.com/article
```

Including files and directories using glob patterns:

```bash
content-qa --input "content/**/*.txt"
```

### Interacting with the Chatbot Agent

Once the inputs are gathered, the system message is built, which is then used to establish a connection with the chatbot agent. You can interact with the agent through the CLI and use it to perform quality analysis or receive information based on the provided content.

## Development

The tool can be run during development through npm:

```bash
npm run start -i your_input
```

Run the tool in development mode by executing:

```bash
npm run dev
```

## License

Content QA is released under the MIT License. See the `LICENSE` file for details.

## Contact

For any queries or support, please open an issue on the project's GitHub repository.
