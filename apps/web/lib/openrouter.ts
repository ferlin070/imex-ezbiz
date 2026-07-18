const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'

export function getApiKey(): string {
  return process.env.AI_API_KEY || process.env.GEMINI_API_KEY || ''
}

export function getModel(): string {
  return (process.env.AI_MODEL || process.env.GEMINI_MODEL || 'openai/gpt-4o-mini').trim()
}

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenRouterOptions {
  model?: string
  system?: string
  responseFormat?: { type: 'json_object' }
  maxRetries?: number
}

export async function callOpenRouter(
  prompt: string,
  options: OpenRouterOptions = {}
): Promise<string> {
  const apiKey = getApiKey()
  const model = options.model || getModel()
  const maxRetries = options.maxRetries ?? 2

  const messages: OpenRouterMessage[] = []
  if (options.system) {
    messages.push({ role: 'system', content: options.system })
  }
  messages.push({ role: 'user', content: prompt })

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (!apiKey || apiKey.includes('your-') || apiKey.includes('placeholder')) {
        throw new Error('AI API key is missing or placeholder')
      }

      const body: Record<string, unknown> = {
        model,
        messages,
        max_tokens: 4096,
      }

      if (options.responseFormat) {
        body.response_format = options.responseFormat
      }

      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://imex-ezbiz.vercel.app',
          'X-Title': 'IMEX Ezbiz MARA',
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errBody = await res.text().catch(() => '')
        throw new Error(`OpenRouter API ${res.status}: ${errBody.substring(0, 200)}`)
      }

      const json = await res.json()
      const msg = json?.choices?.[0]?.message
      let content = msg?.content
      if (!content || content === 'null' || content === '') {
        content = msg?.reasoning
      }
      if (!content) {
        throw new Error('Empty response from OpenRouter')
      }

      return content
    } catch (err: any) {
      lastError = err
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * attempt))
      }
    }
  }

  throw lastError || new Error('OpenRouter call failed after retries')
}

export async function callOpenRouterJSON<T>(
  prompt: string,
  options: OpenRouterOptions = {}
): Promise<T> {
  // Don't force response_format by default — many OpenRouter providers
  // switch to different output formats when it's set, causing JSON.parse failure.
  // Instead, rely on system prompt instructions for JSON output.
  const text = await callOpenRouter(prompt, {
    ...options,
    responseFormat: options.responseFormat,
  })

  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '')

  return JSON.parse(cleaned) as T
}
