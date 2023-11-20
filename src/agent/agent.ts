import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources'
import { PassThrough, Readable } from 'stream'

export interface AgentOptions {
  system_message?: string
  api_key?: string
  max_tokens?: number
}

export interface AgentConversation {
  messages: ChatCompletionMessageParam[]
  sendMessage: (message: string) => Promise<AgentResponse>
}

export interface AgentResponse {
  stream: Readable
  text: () => Promise<string>
}

export function createAgent({ system_message = '', api_key, max_tokens }: AgentOptions = {}) {
  const openai = new OpenAI({
    apiKey: api_key
  })

  const conversations: AgentConversation[] = []

  function createConversation() {
    const messages: ChatCompletionMessageParam[] = []

    async function sendMessage(message: string) {
      messages.push({
        content: message,
        role: 'user'
      })

      const openai_stream = await openai.chat.completions.create({
        model: 'gpt-4-1106-preview',
        max_tokens,
        messages: [
          {
            content: system_message,
            role: 'system'
          },
          ...messages
        ],
        stream: true
      })

      const response_stream = new PassThrough()

      const response_text = new Promise<string>(async function processStream(resolve, reject) {
        try {
          let text = ''

          for await (const chunk of openai_stream) {
            const content = chunk.choices[0].delta.content
            if (content) {
              response_stream.write(content)
              text += content
            }
          }

          response_stream.end()

          messages.push({
            content: text,
            role: 'assistant'
          })

          resolve(text)
        } catch (error) {
          reject(error)
        }
      })

      return {
        stream: response_stream,
        text: () => response_text
      }
    }

    const conversation = {
      messages,
      sendMessage
    }

    conversations.push(conversation)
    return conversation
  }

  return {
    system_message,
    createConversation
  }
}
