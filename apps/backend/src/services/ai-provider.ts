import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'

interface AIEnv {
  AI_PROVIDER: string
  GOOGLE_GENERATIVE_AI_API_KEY: string
  OPENAI_API_KEY: string
}

export function getModel(env: AIEnv) {
  switch (env.AI_PROVIDER) {
    case 'openai': {
      const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY })
      return openai('gpt-4o-mini')
    }
    case 'gemini':
    default: {
      const google = createGoogleGenerativeAI({ apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY })
      return google('gemini-2.0-flash')
    }
  }
}
